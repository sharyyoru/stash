import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { groq } from "next-sanity";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getOrder, setAwbNumber, updateOrderStatus } from "../../../../lib/orders-store";
import { createShipment, getNextBusinessDay } from "../../../../lib/jeebly";
import { sanityClient } from "../../../../sanity/client";
import { notifyShipmentCreated } from "../../../../lib/email";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

async function calculateOrderWeightKg(order: any): Promise<number> {
  try {
    const items = Array.isArray(order.items) ? order.items : [];
    const baseIds = Array.from(
      new Set(
        items
          .map((item: any) =>
            typeof item.id === "string" ? item.id.split("::")[0] : item.id,
          )
          .filter(Boolean),
      ),
    ) as string[];

    if (baseIds.length === 0) {
      return 0.5;
    }

    const products: any[] = await sanityClient.fetch(
      groq`*[_type == "product" && _id in $ids]{
        _id,
        shippingWeight,
        category->{ defaultShippingWeight }
      }`,
      { ids: baseIds },
    );

    const weightById = new Map<string, number>();
    for (const p of products) {
      const productWeight =
        typeof p.shippingWeight === "number" && p.shippingWeight > 0
          ? p.shippingWeight
          : undefined;
      const categoryWeight =
        typeof p.category?.defaultShippingWeight === "number" &&
        p.category.defaultShippingWeight > 0
          ? p.category.defaultShippingWeight
          : undefined;
      const effective = productWeight ?? categoryWeight;
      if (effective && effective > 0) {
        weightById.set(p._id, effective);
      }
    }

    let total = 0;
    let fallbackPieces = 0;
    for (const item of items) {
      const baseId =
        typeof item.id === "string" ? item.id.split("::")[0] : item.id;
      const qty = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
      const perUnit = weightById.get(baseId) ?? 0;
      if (perUnit > 0) {
        total += perUnit * qty;
      } else {
        fallbackPieces += qty;
      }
    }

    // Fallback: assume 0.2kg per piece where no weight is defined
    if (fallbackPieces > 0) {
      total += fallbackPieces * 0.2;
    }

    // Ensure within sensible bounds for Jeebly (min 0.5kg, max 50kg)
    if (!Number.isFinite(total) || total <= 0) {
      total = 0.5;
    }

    // Jeebly requires minimum 0.5kg
    return Math.max(0.5, Math.min(total, 50));
  } catch {
    const items = Array.isArray(order.items) ? order.items : [];
    const numPieces = items.reduce(
      (sum: number, item: any) => sum + (typeof item.quantity === "number" ? item.quantity : 1),
      0,
    );
    return Math.max(0.5, numPieces * 0.2);
  }
}

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
    // Mobile should have at least 9 digits (UAE format: 5XXXXXXXX)
    const mobileDigits = String(profile.mobile || "").replace(/\D/g, "");
    const hasMobile = mobileDigits.length >= 9;
    const hasCity = typeof profile.city === "string" && profile.city.trim().length > 0;
    const hasArea = typeof profile.state === "string" && profile.state.trim().length > 0;

    const missingFields: string[] = [];
    if (!hasLine1) missingFields.push("address line 1");
    if (!hasMobile) missingFields.push("mobile number (must be at least 9 digits)");
    if (!hasCity) missingFields.push("city");
    if (!hasArea) missingFields.push("state/emirate");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Customer address is incomplete. Missing: ${missingFields.join(", ")}. Please ensure the customer has a complete delivery address saved.`,
        },
        { status: 400 },
      );
    }

    // Create description from items
    const description = order.items
      .map((item) => `${item.title} x${item.quantity}`)
      .join(", ")
      .substring(0, 200);

    // Calculate total pieces - ensure each item has valid quantity (min 1)
    const numPieces = order.items.reduce((sum, item) => {
      const qty = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
      return sum + qty;
    }, 0);
    // Jeebly requires at least 1 piece
    const validNumPieces = Math.max(1, Math.floor(numPieces));

    // Calculate total shipment weight (kg) from product/category settings
    const totalWeightKg = await calculateOrderWeightKg(order);

    // Create shipment with Jeebly
    const shipmentResult = await createShipment({
      deliveryType: deliveryType as "Same Day" | "Next Day",
      description,
      weight: totalWeightKg,
      paymentType: "prepaid", // Already paid via Ziina
      numPieces: validNumPieces,
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

    // Send email notifications (non-blocking)
    notifyShipmentCreated({
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
      awbNumber,
    }).catch((err) => console.error("Shipment notification email error:", err));

    return NextResponse.json({
      success: true,
      awbNumber,
      message: shipmentResult.message,
    });
  } catch (error: any) {
    console.error("Create shipment error:", error);
    // Return the actual Jeebly error message to the frontend
    const errorMessage = error.message || "Failed to create shipment";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
