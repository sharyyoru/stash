import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { createOrder, listOrders, type OrderItem } from "../../../lib/orders-store";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || typeof body.totalAmount !== "number") {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  const items: OrderItem[] = body.items;
  const totalAmount: number = body.totalAmount;
  const totalCount: number = body.totalCount ?? items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const currency: string = body.currency || "AED";
  const profile = body.profile ?? null;

  const order = await createOrder({
    items,
    totalAmount,
    totalCount,
    currency,
    customer: {
      name: session.user.name,
      email: session.user.email,
    },
    profile,
  });

  return NextResponse.json({ order }, { status: 201 });
}

export async function GET() {
  // Admin listing is handled via the admin UI which performs its own auth check.
  const orders = await listOrders();
  return NextResponse.json({ orders });
}
