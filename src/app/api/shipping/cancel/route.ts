import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getOrder, updateShippingStatus, updateOrderStatus } from "../../../../lib/orders-store";
import { cancelShipment } from "../../../../lib/jeebly";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

/**
 * Cancel a Jeebly shipment
 * Admin only - cancels shipment and updates order status
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check admin access
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { orderId, awbNumber, reason } = body;

    if (!orderId && !awbNumber) {
      return NextResponse.json({ error: "Missing orderId or awbNumber" }, { status: 400 });
    }

    let awb = awbNumber;
    let order = null;

    // If orderId provided, look up the AWB number and order
    if (orderId) {
      order = await getOrder(orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (!order.awbNumber) {
        return NextResponse.json(
          { error: "No shipment found for this order" },
          { status: 404 }
        );
      }
      awb = order.awbNumber;
    }

    if (!awb) {
      return NextResponse.json(
        { error: "No AWB number available" },
        { status: 400 }
      );
    }

    // Check if shipment can be cancelled (not delivered or already cancelled)
    if (order && (order.shippingStatus === "delivered" || order.shippingStatus === "cancelled")) {
      return NextResponse.json(
        { error: `Cannot cancel shipment with status: ${order.shippingStatus}` },
        { status: 400 }
      );
    }

    // Cancel with Jeebly
    const cancelResult = await cancelShipment(awb, reason);

    if (cancelResult.success !== "true") {
      return NextResponse.json(
        { error: cancelResult.message || "Failed to cancel shipment" },
        { status: 400 }
      );
    }

    // Update order status if we have the order
    if (order) {
      await updateShippingStatus(order.id, "cancelled");
      await updateOrderStatus(order.id, "cancelled");
    }

    return NextResponse.json({
      success: true,
      message: cancelResult.message || "Shipment cancelled successfully",
      awbNumber: awb,
    });
  } catch (error: any) {
    console.error("Cancel shipment error:", error);
    return NextResponse.json(
      { error: "Failed to cancel shipment", details: error.message },
      { status: 500 }
    );
  }
}
