import { NextResponse } from "next/server";
import { getDeliveryCharge } from "../../../lib/delivery-charge";

/**
 * GET /api/delivery-charge
 * Returns the current delivery charge from Sanity settings
 */
export async function GET() {
  try {
    const deliveryCharge = await getDeliveryCharge();
    return NextResponse.json({ deliveryCharge });
  } catch (error: any) {
    console.error("Failed to fetch delivery charge:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery charge", deliveryCharge: 25 },
      { status: 500 }
    );
  }
}
