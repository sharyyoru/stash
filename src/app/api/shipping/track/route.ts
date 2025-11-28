import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateShippingStatus } from "../../../../lib/orders-store";
import { trackShipment, formatTrackingStatus } from "../../../../lib/jeebly";

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
