/**
 * Email notification system for order events
 * Uses Resend API for sending emails
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

type OrderItem = {
  title: string;
  quantity: number;
  price?: number;
};

type OrderEmailData = {
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  mobile?: string;
};

async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  
  console.log("[Email] Attempting to send email");
  console.log("[Email] RESEND_API_KEY configured:", !!apiKey);
  console.log("[Email] FROM:", fromEmail);
  console.log("[Email] TO:", to.join(", "));
  console.log("[Email] Subject:", subject);
  
  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY not configured, skipping email notification");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email:", error);
      return false;
    }

    console.log("Email sent successfully to:", to.join(", "));
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

function formatOrderItemsHtml(items: OrderItem[], currency: string): string {
  return items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price ? `${currency} ${item.price.toFixed(2)}` : '-'}</td>
        </tr>`
    )
    .join("");
}

/**
 * Send notification to admins when a new order is created
 */
export async function notifyNewOrder(order: OrderEmailData): Promise<boolean> {
  if (ADMIN_EMAILS.length === 0) {
    console.log("No admin emails configured for notifications");
    return false;
  }

  const subject = `🛒 New Order: ${order.orderId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .order-id { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .amount { font-size: 24px; font-weight: bold; color: #b08968; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { text-align: left; padding: 8px; background: #f8f8f8; }
        .footer { font-size: 12px; color: #999; margin-top: 30px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .badge-pending { background: #fef3cd; color: #856404; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p class="order-id">${order.orderId}</p>
          <p class="amount">${order.currency} ${order.totalAmount.toFixed(2)}</p>
          <span class="badge badge-pending">Payment Pending</span>
        </div>
        
        <h3>Customer Details</h3>
        <p>
          <strong>Name:</strong> ${order.customerName || 'N/A'}<br>
          <strong>Email:</strong> ${order.customerEmail || 'N/A'}<br>
          <strong>Mobile:</strong> ${order.mobile || 'N/A'}
        </p>
        
        <h3>Order Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${formatOrderItemsHtml(order.items, order.currency)}
          </tbody>
        </table>
        
        <p><a href="${process.env.NEXTAUTH_URL || 'https://stashcreative.ae'}/admin/orders" style="color: #b08968;">View in Admin Dashboard →</a></p>
        
        <div class="footer">
          <p>This is an automated notification from Stash Creative.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(ADMIN_EMAILS, subject, html);
}

/**
 * Send notification to admins when an order is paid
 */
export async function notifyOrderPaid(order: OrderEmailData): Promise<boolean> {
  if (ADMIN_EMAILS.length === 0) {
    console.log("No admin emails configured for notifications");
    return false;
  }

  const subject = `✅ Payment Received: ${order.orderId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .order-id { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .amount { font-size: 24px; font-weight: bold; color: #155724; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { text-align: left; padding: 8px; background: #f8f8f8; }
        .footer { font-size: 12px; color: #999; margin-top: 30px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .badge-paid { background: #d4edda; color: #155724; }
        .action-needed { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p class="order-id">${order.orderId}</p>
          <p class="amount">${order.currency} ${order.totalAmount.toFixed(2)}</p>
          <span class="badge badge-paid">Paid</span>
        </div>
        
        <div class="action-needed">
          <strong>⚡ Action Needed:</strong> Create Jeebly shipment for this order.
        </div>
        
        <h3>Customer Details</h3>
        <p>
          <strong>Name:</strong> ${order.customerName || 'N/A'}<br>
          <strong>Email:</strong> ${order.customerEmail || 'N/A'}<br>
          <strong>Mobile:</strong> ${order.mobile || 'N/A'}
        </p>
        
        <h3>Order Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${formatOrderItemsHtml(order.items, order.currency)}
          </tbody>
        </table>
        
        <p><a href="${process.env.NEXTAUTH_URL || 'https://stashcreative.ae'}/admin/orders" style="color: #155724; font-weight: bold;">Create Shipment in Admin Dashboard →</a></p>
        
        <div class="footer">
          <p>This is an automated notification from Stash Creative.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(ADMIN_EMAILS, subject, html);
}
