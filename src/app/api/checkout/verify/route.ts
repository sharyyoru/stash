import { NextRequest, NextResponse } from "next/server";
import { getOrder, updatePaymentStatus } from "../../../../lib/orders-store";
import { getPaymentIntent } from "../../../../lib/ziina";

/**
 * Verify payment status for an order
 * Called when user returns from Ziina payment page
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentIntentId } = body;

    if (!orderId || !paymentIntentId) {
      return NextResponse.json(
        { error: "Missing orderId or paymentIntentId" },
        { status: 400 }
      );
    }

    // Get the order
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify the payment intent ID matches
    if (order.paymentIntentId !== paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent mismatch" },
        { status: 400 }
      );
    }

    // Check payment status with Ziina
    const paymentIntent = await getPaymentIntent(paymentIntentId);

    // Update order status based on payment status
    let orderStatus: "paid" | "payment-pending" | "cancelled" | undefined;
    
    switch (paymentIntent.status) {
      case "completed":
        orderStatus = "paid";
        break;
      case "failed":
      case "canceled":
        orderStatus = "cancelled";
        break;
      default:
        orderStatus = "payment-pending";
    }

    const updatedOrder = await updatePaymentStatus(
      orderId,
      paymentIntent.status,
      orderStatus
    );

    return NextResponse.json({
      order: updatedOrder,
      paymentStatus: paymentIntent.status,
      success: paymentIntent.status === "completed",
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment", details: error.message },
      { status: 500 }
    );
  }
}
