import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

type LeadSource = "exit_popup_shop" | "exit_popup_subscription" | "newsletter" | "other";

const DISCOUNT_CODES: Record<string, string> = {
  exit_popup_shop: "STASH10",
  exit_popup_subscription: "FIRSTMONTH15",
  newsletter: "STASH10",
  other: "STASH10",
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// POST - Capture email lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source, pageUrl } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Validate source
    const validSources: LeadSource[] = ["exit_popup_shop", "exit_popup_subscription", "newsletter", "other"];
    const leadSource: LeadSource = validSources.includes(source) ? source : "other";

    // Get user agent and IP
    const userAgent = req.headers.get("user-agent") || undefined;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

    // Get the appropriate discount code
    const discountCode = DISCOUNT_CODES[leadSource];

    // Check if email already exists
    const { data: existingLead } = await supabaseAdmin
      .from("email_leads")
      .select("id, discount_code")
      .eq("email", email.toLowerCase())
      .single();

    if (existingLead) {
      // Return existing discount code
      return NextResponse.json({
        success: true,
        message: "Welcome back! Here's your discount code.",
        discountCode: existingLead.discount_code || discountCode,
        isExisting: true,
      });
    }

    // Insert new lead
    const { data, error } = await supabaseAdmin
      .from("email_leads")
      .insert({
        email: email.toLowerCase(),
        source: leadSource,
        discount_code: discountCode,
        page_url: pageUrl,
        user_agent: userAgent,
        ip_address: ipAddress,
        metadata: {
          captured_at: new Date().toISOString(),
          referrer: req.headers.get("referer"),
        },
      })
      .select()
      .single();

    if (error) {
      console.error("[Leads] Error inserting lead:", error);
      return NextResponse.json(
        { error: "Failed to save your email. Please try again." },
        { status: 500 }
      );
    }

    // TODO: Trigger welcome email sequence here
    // For now, we'll mark this for later implementation
    // await sendWelcomeEmail(email, leadSource, discountCode);

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!",
      discountCode,
      isExisting: false,
    });
  } catch (error: any) {
    console.error("[Leads] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// GET - Get lead statistics (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "7d";

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get lead counts by source
    const { data: leads, error } = await supabaseAdmin
      .from("email_leads")
      .select("id, source, created_at, converted")
      .gte("created_at", startDate.toISOString());

    if (error) {
      console.error("[Leads] Error fetching stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = {
      total: leads?.length || 0,
      bySource: {
        exit_popup_shop: leads?.filter((l) => l.source === "exit_popup_shop").length || 0,
        exit_popup_subscription: leads?.filter((l) => l.source === "exit_popup_subscription").length || 0,
        newsletter: leads?.filter((l) => l.source === "newsletter").length || 0,
        other: leads?.filter((l) => l.source === "other").length || 0,
      },
      converted: leads?.filter((l) => l.converted).length || 0,
      conversionRate: leads?.length
        ? ((leads.filter((l) => l.converted).length / leads.length) * 100).toFixed(1)
        : "0",
      period,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("[Leads] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
