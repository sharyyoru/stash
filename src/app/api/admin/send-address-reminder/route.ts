import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

async function sendAddressReminderEmail(userEmail: string, userName: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping address reminder email");
    return false;
  }

  try {
    const profileUrl = `${process.env.NEXTAUTH_URL || "https://s-tash.store"}/profile`;
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [userEmail],
        subject: "📦 Action Required: Update Your Delivery Address for Secret Stash",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4eb8d5;">Delivery Address Update Required</h1>
            
            <p>Dear ${userName || "Secret Stash Member"},</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">🚨 Action Needed</h2>
              <p>We noticed that your delivery address is missing or incomplete in our system. To ensure you receive your Secret Stash packages without delays, please update your delivery information as soon as possible.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${profileUrl}" 
                 style="background: #4eb8d5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Update My Address Now
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">📋 Required Information:</h3>
              <ul style="color: #856404; margin: 10px 0;">
                <li>Street address</li>
                <li>City and state/province</li>
                <li>Postal code</li>
                <li>Country</li>
                <li>Mobile number</li>
                <li>Date of birth</li>
              </ul>
            </div>
            
            <p><strong>Why this is important:</strong></p>
            <ul>
              <li>Your Secret Stash packages are shipped on the 20th of each month</li>
              <li>Incomplete addresses may cause delivery delays</li>
              <li>We need your contact information for shipping updates</li>
            </ul>
            
            <p>If you have any questions or need help updating your address, simply reply to this email.</p>
            
            <p>Thank you for your cooperation!</p>
            
            <p>— The Stash Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message. Your Secret Stash subscription requires a valid delivery address for successful package delivery.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("[Email] Failed to send address reminder:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error sending address reminder:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userEmail, userName } = body;

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    console.log("[Admin] Sending address reminder to:", userEmail);

    const success = await sendAddressReminderEmail(userEmail, userName || "friend");

    // Log the email
    try {
      await fetch("/api/admin/email-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          subject: "📦 Action Required: Update Your Delivery Address for Secret Stash",
          type: "address_reminder",
          status: success ? "sent" : "failed",
          details: {
            userName: userName || "friend",
            triggeredBy: session.user.email,
          },
        }),
      });
    } catch (logError) {
      console.error("Failed to log email:", logError);
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Address reminder email sent successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to send address reminder email",
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[Admin] Error sending address reminder:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
