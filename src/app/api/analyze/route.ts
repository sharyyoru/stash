import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // This endpoint will help us understand what's happening
    const analysis = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_URL: process.env.VERCEL_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      },
      routes: {
        admin: "/admin",
        admin_subscribers: "/admin/subscribers", 
        admin_stripe_sync: "/admin/stripe-sync",
        emergency_sync: "/api/emergency-sync",
        debug_subscriptions: "/api/debug/subscriptions",
      },
      issue: "Subscriptions showing 0 in admin dashboard despite existing in Stripe",
      causes: [
        "1. Webhooks only capture NEW subscriptions, not existing ones",
        "2. Existing Stripe subscriptions need manual sync to database",
        "3. Deployment delays may be preventing new endpoints from being available",
        "4. Database table might be empty or have connection issues",
      ],
      solutions: [
        "1. Use /admin/stripe-sync page to manually sync",
        "2. Wait for deployment to complete, then call emergency sync",
        "3. Check webhook processing for new subscriptions",
        "4. Verify database connectivity and table structure",
      ],
      next_steps: [
        "1. Check if /admin/stripe-sync is accessible",
        "2. Try manual sync through admin interface",
        "3. Monitor deployment status",
        "4. Test webhook processing with new subscription",
      ]
    };

    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
