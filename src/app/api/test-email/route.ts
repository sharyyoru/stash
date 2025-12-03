import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

/**
 * Test email endpoint - only accessible by admins
 * Use: POST /api/test-email with { "to": "email@example.com" } or leave empty to send to admin
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email?.toLowerCase();
    
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const toEmail = body.to || userEmail;
    
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

    console.log("[Test Email] Starting...");
    console.log("[Test Email] API Key configured:", !!apiKey);
    console.log("[Test Email] From:", fromEmail);
    console.log("[Test Email] To:", toEmail);

    if (!apiKey) {
      return NextResponse.json({ 
        error: "RESEND_API_KEY not configured",
        configured: {
          apiKey: false,
          fromEmail,
          adminEmails: ADMIN_EMAILS,
        }
      }, { status: 500 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: "🧪 Test Email from Stash Creative",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, sans-serif; padding: 20px;">
            <h2>✅ Email Test Successful!</h2>
            <p>If you're seeing this, your email configuration is working correctly.</p>
            <p><strong>Sent from:</strong> ${fromEmail}</p>
            <p><strong>Sent to:</strong> ${toEmail}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Stash Creative - Email Notification System</p>
          </body>
          </html>
        `,
      }),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      console.error("[Test Email] Failed:", responseText);
      return NextResponse.json({ 
        error: "Failed to send email",
        details: responseData,
        status: response.status,
      }, { status: 500 });
    }

    console.log("[Test Email] Success:", responseData);
    return NextResponse.json({ 
      success: true, 
      message: `Test email sent to ${toEmail}`,
      response: responseData,
    });

  } catch (error: any) {
    console.error("[Test Email] Error:", error);
    return NextResponse.json({ 
      error: "Failed to send test email",
      details: error.message,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Use POST to send a test email",
    usage: "POST /api/test-email with optional { to: 'email@example.com' }",
    configured: {
      apiKey: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.EMAIL_FROM || "not set",
      adminEmails: ADMIN_EMAILS,
    }
  });
}
