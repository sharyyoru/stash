import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  createSubscriptionDelivery,
  updateSubscriptionDelivery,
  getSubscriptionDeliveries,
  getAllSubscriptionDeliveries,
} from "../../../../lib/subscriptions-store";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

// GET - Get deliveries for a subscription or all deliveries
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subscriptionId = searchParams.get("subscriptionId");

  try {
    const deliveries = subscriptionId
      ? await getSubscriptionDeliveries(subscriptionId)
      : await getAllSubscriptionDeliveries();
    return NextResponse.json({ deliveries });
  } catch (error: any) {
    console.error("Failed to get deliveries:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new delivery record
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.subscriptionId || !body?.billingMonth) {
    return NextResponse.json({ error: "subscriptionId and billingMonth required" }, { status: 400 });
  }

  try {
    const delivery = await createSubscriptionDelivery(body.subscriptionId, body.billingMonth);
    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create delivery:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update a delivery record
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    const updates: any = {};
    if (body.deliveryStatus) updates.deliveryStatus = body.deliveryStatus;
    if (body.deliveredAt) updates.deliveredAt = body.deliveredAt;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.awbNumber !== undefined) updates.awbNumber = body.awbNumber;

    const delivery = await updateSubscriptionDelivery(body.id, updates);
    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }
    return NextResponse.json({ delivery });
  } catch (error: any) {
    console.error("Failed to update delivery:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
