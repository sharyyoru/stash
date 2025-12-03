import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { createOrder, setPaymentIntent, type OrderItem } from "../../../lib/orders-store";
import { createPaymentIntent, toBaseUnits } from "../../../lib/ziina";
import { notifyNewOrder } from "../../../lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || typeof body.totalAmount !== "number") {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  const items: OrderItem[] = body.items;
  const totalAmount: number = body.totalAmount;
  const totalCount: number = body.totalCount ?? items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const currency: string = body.currency || "AED";
  const profile = body.profile ?? null;

  try {
    // 1. Create the order in our database
    const order = await createOrder({
      items,
      totalAmount,
      totalCount,
      currency,
      customer: {
        name: session.user.name,
        email: session.user.email,
      },
      profile,
    });

    // 2. Build redirect URLs
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/checkout/success?order_id=${order.id}&payment_intent_id={PAYMENT_INTENT_ID}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?order_id=${order.id}`;
    const failureUrl = `${baseUrl}/checkout/failed?order_id=${order.id}`;

    // 3. Create Ziina payment intent
    const message = `Stash order ${order.id} - ${currency} ${totalAmount.toFixed(2)}`.slice(0, 80);

    const paymentIntent = await createPaymentIntent({
      amount: toBaseUnits(totalAmount),
      currencyCode: currency,
      message,
      successUrl,
      cancelUrl,
      failureUrl,
    });

    // 4. Store the payment intent ID on the order
    await setPaymentIntent(order.id, paymentIntent.id);

    // 5. Send email notification to admins (non-blocking)
    notifyNewOrder({
      orderId: order.id,
      customerName: session.user.name || undefined,
      customerEmail: session.user.email || undefined,
      totalAmount,
      currency,
      items: items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      mobile: profile?.mobile,
    }).catch((err) => console.error("Email notification error:", err));

    // 6. Return the redirect URL for the client
    return NextResponse.json({
      order,
      paymentIntentId: paymentIntent.id,
      redirectUrl: paymentIntent.redirect_url,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Checkout error:", error);
    
    // Check if it's a Ziina configuration error
    if (error.message?.includes("ZIINA_API_TOKEN")) {
      return NextResponse.json({
        error: "Payment gateway not configured. Please contact support.",
        details: error.message,
      }, { status: 503 });
    }
    
    return NextResponse.json({
      error: "Failed to create checkout session",
      details: error.message,
    }, { status: 500 });
  }
}
