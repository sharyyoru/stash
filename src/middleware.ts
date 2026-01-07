import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * List of tracking query parameters to strip from URLs.
 * These are commonly added by social media platforms and advertising networks.
 */
const TRACKING_PARAMS = [
  // Facebook
  "fbclid",
  "fb_action_ids",
  "fb_action_types",
  "fb_source",
  "fb_ref",
  // Google
  "gclid",
  "gclsrc",
  "dclid",
  // UTM parameters (used by various platforms)
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_source_platform",
  "utm_creative_format",
  "utm_marketing_tactic",
  // Microsoft/Bing
  "msclkid",
  // Twitter/X
  "twclid",
  // TikTok
  "ttclid",
  // Mailchimp
  "mc_cid",
  "mc_eid",
  // HubSpot
  "hsa_acc",
  "hsa_cam",
  "hsa_grp",
  "hsa_ad",
  "hsa_src",
  "hsa_tgt",
  "hsa_kw",
  "hsa_mt",
  "hsa_net",
  "hsa_ver",
  // Instagram
  "igshid",
  "ig_rid",
  // Snapchat
  "sclid",
  // Pinterest
  "epik",
  // LinkedIn
  "li_fat_id",
  // Other common tracking params
  "_ga",
  "_gl",
  "_hsenc",
  "_hsmi",
  "ref",
  "ref_src",
  "ref_url",
  "source",
  "s",
];

/**
 * Middleware that strips tracking parameters from URLs.
 * This prevents issues with:
 * - Script confusion from unknown parameters
 * - Redirect loops
 * - Cache pollution (unique cache for each tracking ID)
 * - Safari crashes from malformed URLs
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/studio") ||
    pathname.includes(".") // Static files like .js, .css, .ico, etc.
  ) {
    return NextResponse.next();
  }

  // If there are no query parameters, skip processing
  if (!search) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  const params = new URLSearchParams(url.search);
  let hasTrackingParams = false;

  // Remove tracking parameters
  for (const param of TRACKING_PARAMS) {
    if (params.has(param)) {
      params.delete(param);
      hasTrackingParams = true;
    }
  }

  // Also remove any parameter starting with underscore (common for analytics)
  const allParams = Array.from(params.keys());
  for (const param of allParams) {
    if (param.startsWith("_") && !["_rsc", "_vercel_share"].includes(param)) {
      params.delete(param);
      hasTrackingParams = true;
    }
  }

  // If tracking parameters were found, redirect to clean URL
  if (hasTrackingParams) {
    url.search = params.toString();
    
    // Use 301 redirect for permanent, cacheable redirect
    // This helps with SEO and prevents duplicate content issues
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on.
 * We exclude static assets and API routes for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
