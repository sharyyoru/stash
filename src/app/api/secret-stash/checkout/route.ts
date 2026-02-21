import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createCheckoutSession, getOrCreateCustomer } from "../../../../lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }

  const { priceId, tierId, tierName } = body;

  try {
    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(
      session.user.email,
      session.user.name || undefined
    );

    // Build URLs
    const baseUrl = process.env.NEXTAUTH_URL || "https://s-tash.store";
    const successUrl = `${baseUrl}/secret-stash/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/secret-stash`;

    // Create Stripe Checkout Session
    const checkoutSession = await createCheckoutSession({
      priceId,
      customerEmail: session.user.email,
      customerId: customer.id,
      successUrl,
      cancelUrl,
      metadata: {
        userEmail: session.user.email,
        userName: session.user.name || "",
        tierId: tierId || "",
        tierName: tierName || "",
        productType: "secret-stash-mail-club",
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error("Secret Stash checkout error:", error);

    // Log full error for debugging
    console.error("Full error details:", JSON.stringify({
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      raw: error.raw,
    }, null, 2));

    if (error.message?.includes("STRIPE_SECRET_KEY")) {
      return NextResponse.json(
        {
          error: "Payment system not configured. Please contact support.",
          details: error.message,
        },
        { status: 503 }
      );
    }

    // Handle Stripe-specific errors
    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        {
          error: `Stripe configuration error: ${error.message}`,
          code: error.code,
          param: error.param,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error.message || "Unknown error",
        type: error.type || "unknown",
      },
      { status: 500 }
    );
  }
}
