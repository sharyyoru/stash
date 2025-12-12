import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getAccountBalance } from "../../../../lib/jeebly";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

/**
 * Get Jeebly account balance and credit information
 * Admin only
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check admin access
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // Get balance from Jeebly
    const balanceResult = await getAccountBalance();

    if (balanceResult.success !== "true") {
      return NextResponse.json(
        { error: balanceResult.message || "Failed to get account balance" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: balanceResult.balance || 0,
      currency: balanceResult.currency || "AED",
      creditLimit: balanceResult.credit_limit || 0,
      availableBalance: balanceResult.available_balance || 0,
    });
  } catch (error: any) {
    console.error("Get account balance error:", error);
    return NextResponse.json(
      { error: "Failed to get account balance", details: error.message },
      { status: 500 }
    );
  }
}
