import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    // Get user orders
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("customer_email", decodedEmail)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      orders: orders || [],
    });

  } catch (error: any) {
    console.error("[User Orders] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
