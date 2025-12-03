import { NextRequest, NextResponse } from "next/server";
import { getOrderByPaymentIntent, updatePaymentStatus } from "../../../../lib/orders-store";
import { notifyOrderPaid } from "../../../../lib/email";

/**
 * Ziina Webhook Handler
 * 
 * This endpoint receives payment status updates from Ziina.
 * You need to configure this webhook URL in your Ziina dashboard.
 * 
 * Webhook URL: https://your-domain.com/api/webhooks/ziina
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log("Ziina webhook received:", JSON.stringify(body, null, 2));
    
    const { payment_intent_id, status } = body;
    
    if (!payment_intent_id) {
      return NextResponse.json({ error: "Missing payment_intent_id" }, { status: 400 });
    }

    // Find the order by payment intent ID
    const order = await getOrderByPaymentIntent(payment_intent_id);
    
    if (!order) {
      console.log(`No order found for payment intent: ${payment_intent_id}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order based on payment status
    let orderStatus: "paid" | "payment-pending" | "cancelled" | undefined;
    
    switch (status) {
      case "completed":
        orderStatus = "paid";
        break;
      case "failed":
      case "canceled":
        orderStatus = "cancelled";
        break;
      case "pending":
      case "requires_payment_instrument":
      case "requires_user_action":
        orderStatus = "payment-pending";
        break;
    }

    await updatePaymentStatus(order.id, status, orderStatus);
    
    console.log(`Updated order ${order.id} payment status to: ${status}`);

    // Send email notification when order is paid
    if (orderStatus === "paid") {
      notifyOrderPaid({
        orderId: order.id,
        customerName: order.customer?.name || undefined,
        customerEmail: order.customer?.email || undefined,
        totalAmount: order.totalAmount,
        currency: order.currency,
        items: order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
        mobile: (order.profile as any)?.mobile,
      }).catch((err) => console.error("Payment notification email error:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Ziina webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Also support GET for webhook verification if needed
export async function GET() {
  return NextResponse.json({ message: "Ziina webhook endpoint active" });
}
