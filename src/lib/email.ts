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
        
        <p><a href="${process.env.NEXTAUTH_URL || ''}/admin/orders" style="color: #b08968;">View in Admin Dashboard →</a></p>
        
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
        
        <p><a href="${process.env.NEXTAUTH_URL || ''}/admin/orders" style="color: #155724; font-weight: bold;">Create Shipment in Admin Dashboard →</a></p>
        
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
 * Send notification when shipment is created (to admin and customer)
 */
export async function notifyShipmentCreated(order: OrderEmailData & { awbNumber: string }): Promise<boolean> {
  const adminSubject = `📦 Shipment Created: ${order.orderId} (AWB: ${order.awbNumber})`;
  const customerSubject = `Your Stash order is being prepared! 📦`;
  
  const baseUrl = process.env.NEXTAUTH_URL || "";
  
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">${order.orderId}</p>
          <p style="font-size: 18px; font-weight: bold; color: #1565c0;">Shipment Created</p>
          <p style="font-size: 14px;"><strong>AWB:</strong> ${order.awbNumber}</p>
        </div>
        <p><strong>Customer:</strong> ${order.customerName || 'N/A'} (${order.customerEmail || 'N/A'})</p>
        <p><a href="${baseUrl}/admin/orders" style="color: #1565c0;">View in Admin →</a></p>
      </div>
    </body>
    </html>
  `;
  
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <p style="font-size: 24px; margin: 0;">📦</p>
          <h2 style="color: #1565c0; margin: 10px 0;">Your order is being prepared!</h2>
          <p style="color: #666;">Order ${order.orderId}</p>
        </div>
        <p>Hi ${order.customerName || 'there'},</p>
        <p>Great news! We've created a shipment for your order and it will be picked up soon.</p>
        <p><strong>Tracking Number:</strong> ${order.awbNumber}</p>
        <p>You can track your order using the Jeebly tracking system.</p>
        <p style="margin-top: 30px;">Thank you for shopping with Stash Creative! 💚</p>
        <div style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Stash Creative - Thoughtful stationery for creative souls</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to admins
  const adminSent = ADMIN_EMAILS.length > 0 ? await sendEmail(ADMIN_EMAILS, adminSubject, adminHtml) : false;
  
  // Send to customer if email provided
  const customerSent = order.customerEmail ? await sendEmail([order.customerEmail], customerSubject, customerHtml) : false;
  
  return adminSent || customerSent;
}

/**
 * Send notification when shipment is in transit (to customer)
 */
export async function notifyShipmentInTransit(order: OrderEmailData & { awbNumber: string }): Promise<boolean> {
  const subject = `Your Stash order is on the way! 🚚`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <p style="font-size: 24px; margin: 0;">🚚</p>
          <h2 style="color: #e65100; margin: 10px 0;">Your order is on the way!</h2>
          <p style="color: #666;">Order ${order.orderId}</p>
        </div>
        <p>Hi ${order.customerName || 'there'},</p>
        <p>Your order has been picked up and is now on its way to you!</p>
        <p><strong>Tracking Number:</strong> ${order.awbNumber}</p>
        <p>Expected delivery: <strong>Today or Next Business Day</strong></p>
        <p style="margin-top: 30px;">Thank you for shopping with Stash Creative! 💚</p>
        <div style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Stash Creative - Thoughtful stationery for creative souls</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (order.customerEmail) {
    return sendEmail([order.customerEmail], subject, html);
  }
  return false;
}

/**
 * Send notification when shipment is delivered (to admin and customer)
 */
export async function notifyShipmentDelivered(order: OrderEmailData & { awbNumber: string }): Promise<boolean> {
  const adminSubject = `✅ Delivered: ${order.orderId}`;
  const customerSubject = `Your Stash order has been delivered! 🎉`;
  
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px;">
          <p style="font-size: 12px; color: #666; text-transform: uppercase;">${order.orderId}</p>
          <p style="font-size: 18px; font-weight: bold; color: #2e7d32;">✅ Order Delivered</p>
          <p><strong>Customer:</strong> ${order.customerName || 'N/A'}</p>
          <p><strong>Amount:</strong> ${order.currency} ${order.totalAmount.toFixed(2)}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <p style="font-size: 24px; margin: 0;">🎉</p>
          <h2 style="color: #2e7d32; margin: 10px 0;">Your order has been delivered!</h2>
          <p style="color: #666;">Order ${order.orderId}</p>
        </div>
        <p>Hi ${order.customerName || 'there'},</p>
        <p>Your Stash order has been successfully delivered. We hope you love your new items!</p>
        <p>If you have any questions or feedback, feel free to reach out to us.</p>
        <p style="margin-top: 30px;">Thank you for shopping with Stash Creative! 💚</p>
        <div style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Stash Creative - Thoughtful stationery for creative souls</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const adminSent = ADMIN_EMAILS.length > 0 ? await sendEmail(ADMIN_EMAILS, adminSubject, adminHtml) : false;
  const customerSent = order.customerEmail ? await sendEmail([order.customerEmail], customerSubject, customerHtml) : false;
  
  return adminSent || customerSent;
}

type SubscriptionEmailData = {
  subscriptionId: string;
  customerName?: string;
  customerEmail?: string;
  productTitle: string;
  amount: number;
  currency: string;
  nextBillingDate: string;
  billingDay: number;
};

/**
 * Send notification when a subscription is activated (to admin and customer)
 */
export async function notifySubscriptionActivated(subscription: SubscriptionEmailData): Promise<boolean> {
  const adminSubject = `🔄 New Subscription: ${subscription.subscriptionId}`;
  const customerSubject = `Welcome to your ${subscription.productTitle} subscription! 🎉`;
  
  const baseUrl = process.env.NEXTAUTH_URL || "";
  const nextBillingFormatted = new Date(subscription.nextBillingDate).toLocaleDateString("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">${subscription.subscriptionId}</p>
          <p style="font-size: 18px; font-weight: bold; color: #e65100;">New Subscription Activated</p>
          <p style="font-size: 14px;"><strong>Product:</strong> ${subscription.productTitle}</p>
          <p style="font-size: 14px;"><strong>Amount:</strong> ${subscription.currency} ${subscription.amount.toFixed(2)}/month</p>
        </div>
        <p><strong>Customer:</strong> ${subscription.customerName || 'N/A'} (${subscription.customerEmail || 'N/A'})</p>
        <p><strong>Billing Day:</strong> ${subscription.billingDay}${getOrdinalSuffix(subscription.billingDay)} of each month</p>
        <p><strong>Next Billing:</strong> ${nextBillingFormatted}</p>
        <p><a href="${baseUrl}/admin/subscriptions" style="color: #e65100;">View in Admin →</a></p>
      </div>
    </body>
    </html>
  `;
  
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <p style="font-size: 24px; margin: 0;">🔄</p>
          <h2 style="color: #e65100; margin: 10px 0;">Subscription Active!</h2>
          <p style="color: #666;">${subscription.productTitle}</p>
        </div>
        <p>Hi ${subscription.customerName || 'there'},</p>
        <p>Thank you for subscribing to <strong>${subscription.productTitle}</strong>!</p>
        <p>Your subscription details:</p>
        <ul>
          <li><strong>Monthly Amount:</strong> ${subscription.currency} ${subscription.amount.toFixed(2)}</li>
          <li><strong>Billing Day:</strong> ${subscription.billingDay}${getOrdinalSuffix(subscription.billingDay)} of each month</li>
          <li><strong>Next Billing Date:</strong> ${nextBillingFormatted}</li>
        </ul>
        <p>You'll receive a payment link via email on your billing day each month.</p>
        <p style="margin-top: 30px;">Thank you for being part of The Secret Stash! 💚</p>
        <div style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Stash Creative - Thoughtful stationery for creative souls</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const adminSent = ADMIN_EMAILS.length > 0 ? await sendEmail(ADMIN_EMAILS, adminSubject, adminHtml) : false;
  const customerSent = subscription.customerEmail ? await sendEmail([subscription.customerEmail], customerSubject, customerHtml) : false;
  
  return adminSent || customerSent;
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

type SubscriptionRenewalEmailData = {
  subscriptionId: string;
  customerName?: string;
  customerEmail: string;
  productTitle: string;
  amount: number;
  currency: string;
  renewalDate: string;
  paymentLink: string;
  daysUntilExpiry: number;
};

/**
 * Send renewal reminder email to subscriber with payment link
 */
export async function notifySubscriptionRenewal(data: SubscriptionRenewalEmailData): Promise<boolean> {
  const subject = `🔄 Your ${data.productTitle} subscription renewal is due`;
  
  const renewalDateFormatted = new Date(data.renewalDate).toLocaleDateString("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const urgencyText = data.daysUntilExpiry <= 1 
    ? "Your subscription expires today!" 
    : data.daysUntilExpiry <= 3 
      ? `Your subscription expires in ${data.daysUntilExpiry} days` 
      : `Your subscription renews on ${renewalDateFormatted}`;
  
  const urgencyColor = data.daysUntilExpiry <= 1 ? "#dc2626" : data.daysUntilExpiry <= 3 ? "#ea580c" : "#059669";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 16px; margin-bottom: 20px; text-align: center;">
          <p style="font-size: 40px; margin: 0;">🔄</p>
          <h2 style="color: #92400e; margin: 15px 0 10px 0; font-size: 22px;">Time to Renew!</h2>
          <p style="color: #78350f; margin: 0; font-size: 14px;">${data.productTitle}</p>
        </div>
        
        <p style="font-size: 15px;">Hi ${data.customerName || 'there'},</p>
        
        <div style="background: #f8fafc; border-left: 4px solid ${urgencyColor}; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-weight: 600; color: ${urgencyColor};">${urgencyText}</p>
        </div>
        
        <p style="font-size: 15px;">To continue enjoying your subscription benefits, please renew now:</p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Subscription</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.productTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.currency} ${data.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Renewal Date</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${renewalDateFormatted}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #1e293b; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(251, 191, 36, 0.4);">
            Renew Now - ${data.currency} ${data.amount.toFixed(2)}
          </a>
        </div>
        
        <p style="font-size: 13px; color: #64748b; text-align: center;">
          This payment link is valid for 24 hours. If you have any questions, please contact us.
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Thank you for being part of The Secret Stash! 💚</p>
          <p style="font-size: 11px; color: #cbd5e1; margin: 10px 0 0 0;">Stash Creative - Thoughtful stationery for creative souls</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail([data.customerEmail], subject, html);
}

/**
 * Send notification to admins about subscription renewal
 */
export async function notifyAdminSubscriptionRenewal(data: SubscriptionRenewalEmailData & { renewalStatus: string }): Promise<boolean> {
  if (ADMIN_EMAILS.length === 0) return false;
  
  const subject = `🔄 Subscription Renewal: ${data.subscriptionId}`;
  const baseUrl = process.env.NEXTAUTH_URL || "";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">${data.subscriptionId}</p>
          <p style="font-size: 18px; font-weight: bold; color: #92400e;">Subscription Renewal Due</p>
          <p style="font-size: 14px;"><strong>Product:</strong> ${data.productTitle}</p>
          <p style="font-size: 14px;"><strong>Amount:</strong> ${data.currency} ${data.amount.toFixed(2)}</p>
        </div>
        <p><strong>Customer:</strong> ${data.customerName || 'N/A'} (${data.customerEmail})</p>
        <p><strong>Renewal Date:</strong> ${data.renewalDate}</p>
        <p><strong>Status:</strong> ${data.renewalStatus}</p>
        <p><a href="${baseUrl}/admin/subscriptions" style="color: #92400e;">Manage in Admin →</a></p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(ADMIN_EMAILS, subject, html);
}
