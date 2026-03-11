import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all"; // all, address_reminder, welcome, admin_notification

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from("email_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`to.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    if (type !== "all") {
      query = query.eq("type", type);
    }

    const { data: logs, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error: any) {
    console.error("[Email Logs] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { to, subject, type, status, details } = body;

    if (!to || !type || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Log email sent
    const { data: log, error } = await supabaseAdmin
      .from("email_logs")
      .insert({
        to,
        subject,
        type, // address_reminder, welcome, admin_notification, package_sent, renewal_reminder
        status, // sent, failed, pending
        details,
        sent_by: session.user.email,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      log,
    });

  } catch (error: any) {
    console.error("[Email Logs] Error logging email:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
