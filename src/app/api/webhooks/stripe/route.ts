import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, getStripe } from "../../../../lib/stripe";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import Stripe from "stripe";

async function sendWelcomeEmail(to: string, name: string, tierName: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping welcome email");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: "Welcome to Secret Stash Mail Club! 🎉",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4eb8d5;">Welcome to the Secret Stash Mail Club!</h1>
            <p>Thank you for subscribing to our exclusive mail club, ${name || "friend"}!</p>
            <p>You'll receive your first curated stationery package at the end of this month.</p>
            <p>Each month, you'll get a surprise envelope filled with exclusive stationery goodies delivered straight to your door.</p>
            <p style="color: #9d7cd8; font-weight: bold;">Your subscription: ${tierName}</p>
            <p>If you have any questions, just reply to this email.</p>
            <p>Happy stashing! ✨</p>
            <p>— The Stash Team</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("[Email] Failed to send:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error sending welcome email:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(payload, signature);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  
  if (metadata.productType !== "secret-stash-mail-club") {
    return;
  }

  const stripe = getStripe();
  
  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
  const customerId = session.customer as string;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

  // Store subscription in our database
  const { error } = await supabaseAdmin.from("secret_stash_subscriptions").insert({
    id: subscriptionId,
    stripe_customer_id: customerId,
    user_email: metadata.userEmail || customer.email,
    user_name: metadata.userName || customer.name,
    tier_id: metadata.tierId,
    tier_name: metadata.tierName,
    status: subscription.status,
    current_period_start: new Date((subscription.current_period_start || 0) * 1000).toISOString(),
    current_period_end: new Date((subscription.current_period_end || 0) * 1000).toISOString(),
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to store subscription:", error);
  }

  // Send welcome email
  const userEmail = metadata.userEmail || customer.email;
  if (userEmail) {
    try {
      await sendWelcomeEmail(
        userEmail,
        metadata.userName || "friend",
        metadata.tierName || "Secret Stash Mail Club"
      );
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Subscription created:", subscription.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = subscription as any;
  const { error } = await supabaseAdmin
    .from("secret_stash_subscriptions")
    .update({
      status: sub.status,
      current_period_start: new Date((sub.current_period_start || 0) * 1000).toISOString(),
      current_period_end: new Date((sub.current_period_end || 0) * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  if (error) {
    console.error("Failed to update subscription:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabaseAdmin
    .from("secret_stash_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  if (error) {
    console.error("Failed to mark subscription as cancelled:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  if (!inv.subscription) return;

  const subscriptionId = inv.subscription as string;
  
  // Log successful payment
  const { error } = await supabaseAdmin.from("secret_stash_payments").insert({
    id: invoice.id,
    subscription_id: subscriptionId,
    amount: (invoice.amount_paid || 0) / 100,
    currency: invoice.currency?.toUpperCase() || "AED",
    status: "paid",
    invoice_url: invoice.hosted_invoice_url,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to log payment:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as any;
  if (!inv.subscription) return;

  const subscriptionId = inv.subscription as string;

  // Log failed payment
  const { error } = await supabaseAdmin.from("secret_stash_payments").insert({
    id: invoice.id,
    subscription_id: subscriptionId,
    amount: (invoice.amount_due || 0) / 100,
    currency: invoice.currency?.toUpperCase() || "AED",
    status: "failed",
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to log failed payment:", error);
  }

  // Update subscription status
  await supabaseAdmin
    .from("secret_stash_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);
}
