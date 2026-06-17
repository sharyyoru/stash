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
            <p>You'll receive your first curated stationery package shipped on the 20th of this month.</p>
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

async function notifyAdmins(subscriptionDetails: any): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const adminEmails = ["statshcreative@gmail.com", "sharyyoru@gmail.com"];

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping admin notification");
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
        to: adminEmails,
        subject: `🎉 New Secret Stash Subscription: ${subscriptionDetails.tierName}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4eb8d5;">New Secret Stash Subscription!</h1>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">Subscription Details:</h2>
              <p><strong>Customer:</strong> ${subscriptionDetails.userName || "N/A"} (${subscriptionDetails.userEmail})</p>
              <p><strong>Plan:</strong> ${subscriptionDetails.tierName}</p>
              <p><strong>Amount:</strong> AED ${subscriptionDetails.amount}/${subscriptionDetails.billingInterval}</p>
              <p><strong>Subscription ID:</strong> ${subscriptionDetails.id}</p>
              <p><strong>Customer ID:</strong> ${subscriptionDetails.stripeCustomerId}</p>
              <p><strong>Started:</strong> ${new Date(subscriptionDetails.createdAt).toLocaleString()}</p>
              <p><strong>Current Period:</strong> ${new Date(subscriptionDetails.currentPeriodStart).toLocaleDateString()} - ${new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString()}</p>
            </div>
            <p>Please prepare their package for shipment on the 20th of this month.</p>
            <p>— Stash Admin System</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("[Email] Failed to send admin notification:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error sending admin notification:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  console.log("[Stripe Webhook] Received webhook request");
  
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  console.log("[Stripe Webhook] Signature present:", !!signature);
  console.log("[Stripe Webhook] Payload length:", payload.length);

  if (!signature) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(payload, signature);
    console.log("[Stripe Webhook] Event verified:", event.type, event.id);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("[Stripe Webhook] Processing checkout.session.completed");
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        console.log("[Stripe Webhook] Processing customer.subscription.created");
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        console.log("[Stripe Webhook] Processing customer.subscription.updated");
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        console.log("[Stripe Webhook] Processing customer.subscription.deleted");
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        console.log("[Stripe Webhook] Processing invoice.payment_succeeded");
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        console.log("[Stripe Webhook] Processing invoice.payment_failed");
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    console.log("[Stripe Webhook] Successfully processed event:", event.type);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  
  if (metadata.productType !== "secret-stash-mail-club") {
    console.log("[Stripe Webhook] Skipping non-secret-stash checkout:", session.id);
    return;
  }

  console.log("[Stripe Webhook] Processing Secret Stash checkout:", session.id);

  const stripe = getStripe();
  
  // Get subscription details from Stripe
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  }) as any;
  const customerId = session.customer as string;
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

  // Extract billing interval from Stripe subscription to determine tier
  const priceItem = subscription.items?.data?.[0];
  const interval = priceItem?.price?.recurring?.interval || "month";
  const intervalCount = priceItem?.price?.recurring?.interval_count || 1;
  const amount = (priceItem?.price?.unit_amount || 0) / 100;
  
  // Determine tier name from billing interval
  let tierName = metadata.tierName || "Monthly Subscription";
  if (!metadata.tierName || metadata.tierName === "") {
    if (interval === "year" || (interval === "month" && intervalCount === 12)) {
      tierName = "Yearly Subscription";
    } else if (interval === "month" && intervalCount === 6) {
      tierName = "6 months Subscription";
    } else if (interval === "month" && intervalCount === 3) {
      tierName = "3 months Subscription";
    } else if (interval === "month" && intervalCount === 1) {
      tierName = "1 month Subscription";
    }
  }

  const userEmail = metadata.userEmail || customer.email;
  const userName = metadata.userName || customer.name;

  console.log("[Stripe Webhook] Subscription details:", {
    subscriptionId,
    userEmail,
    interval,
    intervalCount,
    amount,
    tierName,
  });

  // Cancel any existing OLD subscriptions in the legacy system for this user
  if (userEmail) {
    try {
      const { data: oldSubs } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_email", userEmail)
        .in("status", ["active", "pending"]);

      if (oldSubs && oldSubs.length > 0) {
        console.log("[Stripe Webhook] Cancelling old legacy subscriptions:", oldSubs.map(s => s.id));
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("user_email", userEmail)
          .in("status", ["active", "pending"]);
      }
    } catch (err) {
      console.error("[Stripe Webhook] Error cancelling old subscriptions:", err);
    }
  }

  // Cancel any existing Stripe subscriptions for this user (except the new one)
  if (userEmail) {
    try {
      await supabaseAdmin
        .from("secret_stash_subscriptions")
        .update({ 
          status: "superseded",
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", userEmail)
        .neq("id", subscriptionId)
        .in("status", ["active", "trialing"]);
    } catch (err) {
      console.error("[Stripe Webhook] Error superseding old Stripe subscriptions:", err);
    }
  }

  // Store/update subscription in our database using upsert
  const subscriptionData: Record<string, any> = {
    id: subscriptionId,
    stripe_customer_id: customerId,
    user_email: userEmail,
    user_name: userName,
    tier_id: metadata.tierId || null,
    tier_name: tierName,
    status: subscription.status,
    amount: amount,
    billing_interval: interval,
    billing_interval_count: intervalCount,
    current_period_start: (subscription as any).current_period_start 
      ? new Date((subscription as any).current_period_start * 1000).toISOString() 
      : new Date().toISOString(),
    current_period_end: (subscription as any).current_period_end 
      ? new Date((subscription as any).current_period_end * 1000).toISOString() 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Only write volume fields when present, so we never overwrite a captured
  // selection with null (e.g. if another webhook event races this one).
  if (metadata.startingVolumeId) {
    subscriptionData.starting_volume_id = metadata.startingVolumeId;
  }
  if (metadata.startingVolumeTitle) {
    subscriptionData.starting_volume_title = metadata.startingVolumeTitle;
  }

  const { error } = await supabaseAdmin
    .from("secret_stash_subscriptions")
    .upsert(subscriptionData, { onConflict: "id" });

  if (error) {
    console.error("[Stripe Webhook] Failed to store subscription:", error);
    // Try insert as fallback
    const { error: insertError } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .insert(subscriptionData);
    if (insertError) {
      console.error("[Stripe Webhook] Insert fallback also failed:", insertError);
    }
  } else {
    console.log("[Stripe Webhook] Successfully stored subscription:", subscriptionId);
  }

  // Send welcome email
  if (userEmail) {
    try {
      await sendWelcomeEmail(
        userEmail,
        userName || "friend",
        tierName
      );
      console.log("[Stripe Webhook] Welcome email sent to:", userEmail);
    } catch (emailError) {
      console.error("[Stripe Webhook] Failed to send welcome email:", emailError);
    }
  }

  // Notify admins
  try {
    await notifyAdmins({
      id: subscriptionId,
      stripeCustomerId: customerId,
      userEmail,
      userName,
      tierName,
      amount,
      billingInterval: interval,
      createdAt: new Date().toISOString(),
      currentPeriodStart: subscription.current_period_start 
        ? new Date(subscription.current_period_start * 1000).toISOString() 
        : new Date().toISOString(),
      currentPeriodEnd: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString() 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    console.log("[Stripe Webhook] Admin notification sent for new subscription");
  } catch (emailError) {
    console.error("[Stripe Webhook] Failed to send admin notification:", emailError);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("[Stripe Webhook] Processing customer.subscription.created");
  const sub = subscription as any;
  
  // Get customer details
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
  
  // Extract billing info
  const priceItem = sub.items?.data?.[0];
  const interval = priceItem?.price?.recurring?.interval || "month";
  const intervalCount = priceItem?.price?.recurring?.interval_count || 1;
  const amount = (priceItem?.price?.unit_amount || 0) / 100;
  
  // Determine tier name from billing interval
  let tierName = "Monthly Subscription";
  if (interval === "year" || (interval === "month" && intervalCount === 12)) {
    tierName = "Yearly Subscription";
  } else if (interval === "month" && intervalCount === 6) {
    tierName = "6 months Subscription";
  } else if (interval === "month" && intervalCount === 3) {
    tierName = "3 months Subscription";
  } else if (interval === "month" && intervalCount === 1) {
    tierName = "1 month Subscription";
  }

  // Get metadata from subscription (passed through from checkout)
  const metadata = sub.metadata || {};

  const subscriptionData: Record<string, any> = {
    id: sub.id,
    stripe_customer_id: sub.customer,
    user_email: customer.email,
    user_name: customer.name,
    tier_id: metadata.tierId || null,
    tier_name: metadata.tierName || tierName,
    status: sub.status,
    amount: amount,
    billing_interval: interval,
    billing_interval_count: intervalCount,
    current_period_start: sub.current_period_start 
      ? new Date(sub.current_period_start * 1000).toISOString() 
      : new Date().toISOString(),
    current_period_end: sub.current_period_end 
      ? new Date(sub.current_period_end * 1000).toISOString() 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Only write volume fields when present, so we never overwrite a captured
  // selection with null (e.g. if another webhook event races this one).
  if (metadata.startingVolumeId) {
    subscriptionData.starting_volume_id = metadata.startingVolumeId;
  }
  if (metadata.startingVolumeTitle) {
    subscriptionData.starting_volume_title = metadata.startingVolumeTitle;
  }

  console.log("[Stripe Webhook] Storing subscription from created event:", {
    subscriptionId: sub.id,
    userEmail: customer.email,
    tierName: subscriptionData.tier_name,
    interval,
    amount,
    startingVolume: subscriptionData.starting_volume_title,
  });

  const { error } = await supabaseAdmin
    .from("secret_stash_subscriptions")
    .upsert(subscriptionData, { onConflict: "id" });

  if (error) {
    console.error("[Stripe Webhook] Failed to store subscription from created event:", error);
  } else {
    console.log("[Stripe Webhook] Successfully stored subscription from created event:", sub.id);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = subscription as any;
  
  // Extract billing info
  const priceItem = sub.items?.data?.[0];
  const interval = priceItem?.price?.recurring?.interval || "month";
  const intervalCount = priceItem?.price?.recurring?.interval_count || 1;
  const amount = (priceItem?.price?.unit_amount || 0) / 100;

  // Determine tier name from billing interval
  let tierName = "Monthly Subscription";
  if (interval === "year" || (interval === "month" && intervalCount === 12)) {
    tierName = "Yearly Subscription";
  } else if (interval === "month" && intervalCount === 6) {
    tierName = "6 months Subscription";
  } else if (interval === "month" && intervalCount === 3) {
    tierName = "3 months Subscription";
  } else if (interval === "month" && intervalCount === 1) {
    tierName = "1 month Subscription";
  }

  const updateData: any = {
    status: sub.status,
    current_period_start: sub.current_period_start 
      ? new Date(sub.current_period_start * 1000).toISOString() 
      : undefined,
    current_period_end: sub.current_period_end 
      ? new Date(sub.current_period_end * 1000).toISOString() 
      : undefined,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined values to avoid overwriting good data with null
  if (!updateData.current_period_start) delete updateData.current_period_start;
  if (!updateData.current_period_end) delete updateData.current_period_end;

  // Only update tier info if we have valid data
  if (amount > 0) {
    updateData.amount = amount;
    updateData.billing_interval = interval;
    updateData.billing_interval_count = intervalCount;
    updateData.tier_name = tierName;
  }

  const { error } = await supabaseAdmin
    .from("secret_stash_subscriptions")
    .update(updateData)
    .eq("id", sub.id);

  if (error) {
    console.error("[Stripe Webhook] Failed to update subscription:", error);
  } else {
    console.log("[Stripe Webhook] Updated subscription:", sub.id, "Status:", sub.status);
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

  // Also update subscription dates from Stripe (for renewals)
  // This ensures dates are synced even if subscription.updated webhook arrives late
  try {
    const stripe = getStripe();
    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId) as any;
    
    if (stripeSub.current_period_start && stripeSub.current_period_end) {
      await supabaseAdmin
        .from("secret_stash_subscriptions")
        .update({
          status: stripeSub.status,
          current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);
      
      console.log("[Stripe Webhook] Updated subscription dates after payment:", subscriptionId);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Failed to update subscription dates after payment:", err);
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
