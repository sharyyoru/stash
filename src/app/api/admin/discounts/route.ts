import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  listDiscountCodes,
  createDiscountCode,
  getDiscountCodeStats,
  getDiscountCodeUsage,
  type DiscountCode,
} from "../../../../lib/discount-codes";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "list";

  try {
    if (action === "list") {
      const codes = await listDiscountCodes();
      return NextResponse.json({ codes });
    }

    if (action === "stats") {
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;
      const stats = await getDiscountCodeStats({ startDate, endDate });
      return NextResponse.json({ stats });
    }

    if (action === "usage") {
      const codeId = searchParams.get("codeId") || undefined;
      const startDate = searchParams.get("startDate") || undefined;
      const endDate = searchParams.get("endDate") || undefined;
      const userEmail = searchParams.get("userEmail") || undefined;
      const search = searchParams.get("search") || undefined;

      const usage = await getDiscountCodeUsage({
        codeId,
        startDate,
        endDate,
        userEmail,
        search,
      });
      return NextResponse.json({ usage });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Discount codes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount codes", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.code || !body.discountType || typeof body.discountValue !== "number") {
    return NextResponse.json(
      { error: "Invalid payload. Required: code, discountType, discountValue" },
      { status: 400 }
    );
  }

  try {
    const discountCode = await createDiscountCode({
      code: body.code,
      description: body.description || null,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderAmount: body.minOrderAmount || 0,
      maxDiscountAmount: body.maxDiscountAmount || null,
      usageLimit: body.usageLimit || null,
      startsAt: body.startsAt || null,
      expiresAt: body.expiresAt || null,
      isActive: body.isActive !== false,
      appliesTo: body.appliesTo || "all",
    });

    if (!discountCode) {
      return NextResponse.json(
        { error: "Failed to create discount code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ discountCode }, { status: 201 });
  } catch (error: any) {
    console.error("Create discount code error:", error);
    return NextResponse.json(
      { error: "Failed to create discount code", details: error.message },
      { status: 500 }
    );
  }
}
