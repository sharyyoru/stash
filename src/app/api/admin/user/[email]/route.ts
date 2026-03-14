import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Helper to detect schema cache / missing table errors
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || "";
  return msg.includes("schema cache") || 
         (msg.includes("relation") && msg.includes("does not exist")) ||
         (msg.includes("table") && msg.includes("does not exist"));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", decodedEmail)
      .single();

    // Handle missing table gracefully
    if (profileError && isTableMissingError(profileError)) {
      console.warn("[User Profile] Profiles table not found");
      return NextResponse.json({
        user: null,
        warning: "Profiles table not set up",
      });
    }

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError;
    }

    return NextResponse.json({
      user: profile || null,
    });

  } catch (error: any) {
    console.error("[User Profile] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
