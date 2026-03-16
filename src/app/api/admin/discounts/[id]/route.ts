import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import {
  getDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "../../../../../lib/discount-codes";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const discountCode = await getDiscountCode(id);

    if (!discountCode) {
      return NextResponse.json({ error: "Discount code not found" }, { status: 404 });
    }

    return NextResponse.json({ discountCode });
  } catch (error: any) {
    console.error("Get discount code error:", error);
    return NextResponse.json(
      { error: "Failed to get discount code", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const discountCode = await updateDiscountCode(id, {
      code: body.code,
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderAmount: body.minOrderAmount,
      maxDiscountAmount: body.maxDiscountAmount,
      usageLimit: body.usageLimit,
      usageCount: body.usageCount,
      startsAt: body.startsAt,
      expiresAt: body.expiresAt,
      isActive: body.isActive,
      appliesTo: body.appliesTo,
    });

    if (!discountCode) {
      return NextResponse.json({ error: "Failed to update discount code" }, { status: 500 });
    }

    return NextResponse.json({ discountCode });
  } catch (error: any) {
    console.error("Update discount code error:", error);
    return NextResponse.json(
      { error: "Failed to update discount code", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const success = await deleteDiscountCode(id);

    if (!success) {
      return NextResponse.json({ error: "Failed to delete discount code" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete discount code error:", error);
    return NextResponse.json(
      { error: "Failed to delete discount code", details: error.message },
      { status: 500 }
    );
  }
}
