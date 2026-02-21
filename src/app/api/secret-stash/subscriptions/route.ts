import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export type SecretStashSubscription = {
  id: string;
  stripe_customer_id: string;
  user_email: string;
  user_name: string;
  tier_id: string;
  tier_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at?: string;
  cancelled_at?: string;
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { data: subscriptions, error } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .eq("user_email", session.user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    return NextResponse.json({
      subscriptions: subscriptions || [],
    });
  } catch (error: any) {
    console.error("Subscriptions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
