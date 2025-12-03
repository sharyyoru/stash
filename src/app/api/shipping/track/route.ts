import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateShippingStatus } from "../../../../lib/orders-store";
import { trackShipment, formatTrackingStatus } from "../../../../lib/jeebly";
import { notifyShipmentInTransit, notifyShipmentDelivered } from "../../../../lib/email";

/**
 * Track a shipment by order ID or AWB number
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, awbNumber } = body;

    let awb = awbNumber;

    // If orderId provided, look up the AWB number
    if (orderId && !awb) {
      const order = await getOrder(orderId);
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
        { error: "Missing orderId or awbNumber" },
        { status: 400 }
      );
    }

    // Track with Jeebly
    const trackingResult = await trackShipment(awb);

    if (trackingResult.success !== "true" || !trackingResult.Tracking) {
      return NextResponse.json(
        { error: trackingResult.message || "Tracking not found" },
        { status: 404 }
      );
    }

    const tracking = trackingResult.Tracking;
    
    // If we have an orderId, update the shipping status
    if (orderId) {
      const order = await getOrder(orderId);
      if (order && order.shippingStatus !== tracking.last_status) {
        const previousStatus = order.shippingStatus;
        
        // Map Jeebly status to our order status
        let orderStatus: "in-transit" | "delivered" | undefined;
        
        if (tracking.last_status === "delivered") {
          orderStatus = "delivered";
        } else if (
          tracking.last_status === "out_for_delivery" ||
          tracking.last_status === "inscan_at_hub" ||
          tracking.last_status === "pickup_completed"
        ) {
          orderStatus = "in-transit";
        }

        await updateShippingStatus(orderId, tracking.last_status, orderStatus);

        // Send email notifications on status change
        const emailData = {
          orderId: order.id,
          customerName: order.customer?.name || undefined,
          customerEmail: order.customer?.email || undefined,
          totalAmount: order.totalAmount,
          currency: order.currency,
          items: order.items.map((item: any) => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          mobile: (order.profile as any)?.mobile,
          awbNumber: order.awbNumber || awb,
        };

        // Notify on in-transit (only if previous status wasn't already in-transit)
        if (orderStatus === "in-transit" && previousStatus !== "in_transit" && previousStatus !== "out_for_delivery") {
          notifyShipmentInTransit(emailData).catch((err) => 
            console.error("In-transit notification error:", err)
          );
        }

        // Notify on delivered
        if (orderStatus === "delivered" && previousStatus !== "delivered") {
          notifyShipmentDelivered(emailData).catch((err) => 
            console.error("Delivered notification error:", err)
          );
        }
      }
    }

    // Format the response
    return NextResponse.json({
      success: true,
      awbNumber: tracking.reference_no,
      status: tracking.last_status,
      statusText: formatTrackingStatus(tracking.last_status as any),
      pickupDate: tracking.pickup_date,
      bookingDate: tracking.booking_date,
      events: tracking.events.map((event) => ({
        status: event.status,
        description: event.desc,
        hubName: event.hub_name,
        timestamp: event.event_date_time,
        riderName: event.rider_name || undefined,
        podImage: event.pod_image || undefined,
        failureReason: event.failure_reason || undefined,
      })),
    });
  } catch (error: any) {
    console.error("Track shipment error:", error);
    return NextResponse.json(
      { error: "Failed to track shipment", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET handler for tracking by query params
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const awbNumber = searchParams.get("awb");

  if (!orderId && !awbNumber) {
    return NextResponse.json(
      { error: "Provide orderId or awb query parameter" },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const fakeReq = {
    json: async () => ({ orderId, awbNumber }),
  } as NextRequest;

  return POST(fakeReq);
}
