import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  listAllSubscriptions,
  getSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  getSubscriptionPayments,
  getSubscriptionDeliveries,
} from "../../../../lib/subscriptions-store";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

// GET - Get all subscriptions with optional filters
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subscriptionId = searchParams.get("id");

  try {
    if (subscriptionId) {
      // Get single subscription with payments and deliveries
      const subscription = await getSubscription(subscriptionId);
      if (!subscription) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }
      const payments = await getSubscriptionPayments(subscriptionId);
      const deliveries = await getSubscriptionDeliveries(subscriptionId);
      return NextResponse.json({ subscription, payments, deliveries });
    }

    const subscriptions = await listAllSubscriptions();
    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error("Failed to get subscriptions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update a subscription
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
    let subscription;
    
    if (body.status) {
      subscription = await updateSubscriptionStatus(body.id, body.status);
    } else {
      const updates: any = {};
      if (body.nextBillingDate) updates.nextBillingDate = body.nextBillingDate;
      if (body.amount !== undefined) updates.amount = body.amount;
      subscription = await updateSubscription(body.id, updates);
    }

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
