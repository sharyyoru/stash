import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

async function sendRecapInterestEmail(data: {
  recapId: string;
  recapTitle: string;
  recapMonth: string;
  recapPrice: number;
  recapCurrency: string;
  name: string;
  email: string;
  message?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey || ADMIN_EMAILS.length === 0) {
    console.log("[Email] RESEND_API_KEY or ADMIN_EMAILS not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ADMIN_EMAILS,
        subject: `🎁 Recap Interest: ${data.recapTitle}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #9d7cd8;">New Recap Interest!</h1>
            
            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #333;">Recap Details</h2>
              <p><strong>Title:</strong> ${data.recapTitle}</p>
              <p><strong>Month:</strong> ${data.recapMonth}</p>
              <p><strong>Price:</strong> ${data.recapCurrency} ${data.recapPrice.toFixed(2)}</p>
            </div>

            <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #333;">Customer Information</h2>
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ""}
            </div>

            <p style="color: #666; font-size: 14px;">
              Reply to this customer at <a href="mailto:${data.email}">${data.email}</a> to follow up on their interest.
            </p>
          </div>
        `,
        reply_to: data.email,
      }),
    });

    if (!response.ok) {
      console.error("[Email] Failed to send recap interest email:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error sending recap interest email:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.recapId || !body.recapTitle || !body.name || !body.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const {
    recapId,
    recapTitle,
    recapMonth,
    recapPrice,
    recapCurrency,
    name,
    email,
    message,
  } = body;

  try {
    // Send email to admin
    const emailSent = await sendRecapInterestEmail({
      recapId,
      recapTitle,
      recapMonth: recapMonth || "Unknown",
      recapPrice: recapPrice || 0,
      recapCurrency: recapCurrency || "AED",
      name,
      email,
      message,
    });

    if (!emailSent) {
      console.warn("[Recap Interest] Email not sent, but request logged");
    }

    // Log to console for backup
    console.log("[Recap Interest] New interest received:", {
      recapId,
      recapTitle,
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Interest submitted successfully",
    });
  } catch (error: any) {
    console.error("Recap interest submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit interest" },
      { status: 500 }
    );
  }
}
