import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

// Generate a simple session ID
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// POST - Track a product view
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productSlug, productTitle } = body;

    if (!productSlug) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 }
      );
    }

    // Get user info
    const userAgent = req.headers.get("user-agent") || undefined;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;
    const referrer = req.headers.get("referer") || undefined;

    // Get or create session ID from cookie
    const sessionCookie = req.cookies.get("stash_session_id");
    const sessionId = sessionCookie?.value || generateSessionId();

    // Insert view record
    const { error } = await supabaseAdmin
      .from("product_views")
      .insert({
        product_slug: productSlug,
        product_title: productTitle,
        session_id: sessionId,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer,
      });

    if (error) {
      console.error("[Analytics] Error tracking view:", error);
      // Don't fail the request, just log the error
    }

    // Return response with session cookie
    const response = NextResponse.json({ success: true, sessionId });
    
    // Set session cookie if it doesn't exist
    if (!sessionCookie) {
      response.cookies.set("stash_session_id", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json({ success: false }, { status: 200 }); // Don't fail client request
  }
}

// GET - Get view counts for a product
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Product slug is required" },
        { status: 400 }
      );
    }

    // Calculate time ranges
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent views (last 24 hours) - count unique sessions
    const { data: recentViews, error: recentError } = await supabaseAdmin
      .from("product_views")
      .select("session_id")
      .eq("product_slug", slug)
      .gte("viewed_at", last24h.toISOString());

    // Get total views (last 7 days) - count unique sessions
    const { data: totalViews, error: totalError } = await supabaseAdmin
      .from("product_views")
      .select("session_id")
      .eq("product_slug", slug)
      .gte("viewed_at", last7d.toISOString());

    if (recentError || totalError) {
      console.error("[Analytics] Error fetching views:", recentError || totalError);
    }

    // Count unique sessions
    const uniqueRecent = new Set(recentViews?.map((v) => v.session_id) || []).size;
    const uniqueTotal = new Set(totalViews?.map((v) => v.session_id) || []).size;

    return NextResponse.json({
      recentViews: uniqueRecent,
      totalViews: uniqueTotal,
      slug,
    });
  } catch (error: any) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json(
      { recentViews: 0, totalViews: 0 },
      { status: 200 }
    );
  }
}
