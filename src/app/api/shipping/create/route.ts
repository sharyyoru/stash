import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getOrder, setAwbNumber, updateOrderStatus } from "../../../../lib/orders-store";
import { createShipment, getNextBusinessDay } from "../../../../lib/jeebly";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

/**
 * Create a Jeebly shipment for an order
 * Admin only - creates shipment after payment is confirmed
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
    const { orderId, deliveryType = "Next Day" } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Get the order
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order is paid
    if (order.status !== "paid" && order.status !== "processing") {
      return NextResponse.json(
        { error: "Order must be paid before creating shipment" },
        { status: 400 }
      );
    }

    // Check if shipment already exists
    if (order.awbNumber) {
      return NextResponse.json(
        { error: "Shipment already exists", awbNumber: order.awbNumber },
        { status: 400 }
      );
    }

    // Get customer profile/address from order
    const profile = (order.profile || {}) as any;
    const hasLine1 = typeof profile.line1 === "string" && profile.line1.trim().length > 0;
    const hasMobile = typeof profile.mobile === "string" && profile.mobile.trim().length >= 7;

    if (!hasLine1 || !hasMobile) {
      return NextResponse.json(
        {
          error:
            "Customer address is incomplete. Please ensure address line 1 and mobile number are saved before checkout.",
        },
        { status: 400 },
      );
    }

    // Create description from items
    const description = order.items
      .map((item) => `${item.title} x${item.quantity}`)
      .join(", ")
      .substring(0, 200);

    // Calculate total pieces
    const numPieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

    // Create shipment with Jeebly
    const shipmentResult = await createShipment({
      deliveryType: deliveryType as "Same Day" | "Next Day",
      description,
      weight: Math.max(0.5, numPieces * 0.2), // Estimate weight
      paymentType: "prepaid", // Already paid via Ziina
      numPieces,
      customerReferenceNumber: order.id,
      pickupDate: getNextBusinessDay(),
      
      // Customer destination address
      destinationName: order.customer?.name || profile.line1 || "Customer",
      destinationMobile: String(profile.mobile || "").replace(/\D/g, ""),
      destinationHouseNo: profile.line1 || "",
      destinationBuildingName: profile.line2 || profile.line1 || "",
      destinationArea: profile.state || profile.city || "Dubai",
      destinationLandmark: "",
      destinationCity: profile.city || profile.state || "Dubai",
    });

    const awbNumber = shipmentResult["AWB No"];
    
    if (!awbNumber) {
      throw new Error("No AWB number returned from Jeebly");
    }

    // Update order with AWB number and status
    await setAwbNumber(order.id, awbNumber, "pickup_scheduled");
    await updateOrderStatus(order.id, "processing");

    return NextResponse.json({
      success: true,
      awbNumber,
      message: shipmentResult.message,
    });
  } catch (error: any) {
    console.error("Create shipment error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment", details: error.message },
      { status: 500 }
    );
  }
}
