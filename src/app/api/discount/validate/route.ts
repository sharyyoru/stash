import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { validateDiscountCode } from "../../../../lib/discount-codes";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.code !== "string" || typeof body.amount !== "number") {
    return NextResponse.json(
      { error: "Invalid payload. Required: code (string), amount (number)" },
      { status: 400 }
    );
  }

  const { code, amount, appliesTo = "all" } = body;

  try {
    const result = await validateDiscountCode(code, amount, appliesTo);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      discount: result.discount,
    });
  } catch (error: any) {
    console.error("Discount validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate discount code", details: error.message },
      { status: 500 }
    );
  }
}
