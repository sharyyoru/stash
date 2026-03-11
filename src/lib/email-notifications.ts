async function sendPackageSentEmail(to: string, name: string, trackingNumber?: string, month?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping package sent email");
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
        to: [to],
        subject: "🎉 Your Secret Stash Package is on its way!",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4eb8d5;">Good news, ${name || "friend"}!</h1>
            <p>Your Secret Stash package for ${month || "this month"} has been shipped and is on its way to you!</p>
            <p>Each package is carefully curated with exclusive stationery goodies that we think you'll love.</p>
            ${trackingNumber ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">You can use this to track your package's journey.</p>
              </div>
            ` : ''}
            <p>Remember, all packages are shipped around the 20th of each month, so you should receive it soon!</p>
            <p>If you have any questions about your package, just reply to this email.</p>
            <p>Happy stashing! ✨</p>
            <p>— The Stash Team</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("[Email] Failed to send package sent email:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error sending package sent email:", error);
    return false;
  }
}

async function sendRenewalReminderEmail(to: string, name: string, renewalDate: string, tierName: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping renewal reminder email");
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
        to: [to],
        subject: "🔄 Your Secret Stash Subscription is Renewing Soon",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4eb8d5;">Subscription Renewal Reminder</h1>
            <p>Hi ${name || "friend"},</p>
            <p>Your Secret Stash subscription is set to renew on <strong>${renewalDate}</strong>.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Current Plan:</strong> ${tierName}</p>
              <p style="margin: 5px 0 0 0;"><strong>Renewal Date:</strong> ${renewalDate}</p>
            </div>
            <p>Your next curated stationery package will be prepared and shipped around the 20th of the month following your renewal.</p>
            <p>If you need to make any changes to your subscription or have questions, please reply to this email at least 7 days before your renewal date.</p>
            <p>We're excited to continue sending you amazing stationery surprises!</p>
            <p>Happy stashing! ✨</p>
            <p>— The Stash Team</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("[Email] Failed to send renewal reminder email:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Error sending renewal reminder email:", error);
    return false;
  }
}

export { sendPackageSentEmail, sendRenewalReminderEmail };
