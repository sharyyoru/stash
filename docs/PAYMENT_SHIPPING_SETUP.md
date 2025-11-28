# Ziina Payment & Jeebly Shipping Integration Guide

This document explains how to set up and use the Ziina payment gateway and Jeebly delivery tracking integrations.

## Overview

- **Ziina**: Payment gateway for accepting card payments in UAE (AED)
- **Jeebly**: Delivery and fulfillment service for UAE

## Setup Steps

### 1. Database Migration

Run the SQL migration to add required columns to your orders table:

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the migration from `migrations/001_add_payment_shipping_fields.sql`

### 2. Environment Variables

Update your `.env.local` file with the following:

```env
# Ziina Payment Gateway
ZIINA_API_TOKEN=your_ziina_api_token_here
ZIINA_TEST_MODE=true  # Set to false for production

# Jeebly Delivery API
JEEBLY_API_KEY=your_jeebly_api_key
JEEBLY_CLIENT_KEY=your_jeebly_client_key
JEEBLY_API_URL=https://demo.jeebly.com  # Use production URL when ready

# Store Origin Address (for Jeebly shipments)
STORE_NAME=Your Store Name
STORE_MOBILE=971XXXXXXXXX
STORE_ADDRESS_LINE1=Your Address
STORE_BUILDING=Building Name
STORE_AREA=Area Name
STORE_CITY=Dubai
```

### 3. Getting API Credentials

#### Ziina
1. Go to [ziina.com/business/connect](https://ziina.com/business/connect)
2. Create a business account or log in
3. Generate an API token with `write_payment_intents` scope
4. Copy the token to `ZIINA_API_TOKEN`

#### Jeebly
1. Contact Jeebly to get your API credentials
2. They will provide:
   - `X-API-KEY` → `JEEBLY_API_KEY`
   - `client_key` → `JEEBLY_CLIENT_KEY`
3. For testing, use the demo credentials provided in the Postman collection

### 4. Webhook Setup (Ziina)

Set up a webhook to receive payment status updates:

1. In your Ziina dashboard, configure a webhook URL:
   ```
   https://your-domain.com/api/webhooks/ziina
   ```
2. This will automatically update order status when payments complete

## How It Works

### Payment Flow

1. Customer adds items to cart and clicks "Checkout"
2. Order is created with status `payment-pending`
3. Ziina Payment Intent is created
4. Customer is redirected to Ziina's hosted payment page
5. After payment:
   - Success: Redirected to `/checkout/success` → Order marked as `paid`
   - Cancel: Redirected to `/checkout/cancel` → Order stays `payment-pending`
   - Failed: Redirected to `/checkout/failed` → Order stays `payment-pending`

### Shipping Flow

1. Admin views order in `/admin/orders`
2. For `paid` orders, click "Create Jeebly Shipment"
3. Shipment is created with Jeebly, AWB number is stored
4. Order status changes to `processing`
5. Customers can track their order using the "Track Order" button
6. Shipping status updates are fetched from Jeebly in real-time

## API Endpoints

### Checkout
- `POST /api/checkout` - Create order and payment intent, returns redirect URL

### Payment Verification
- `POST /api/checkout/verify` - Verify payment status after redirect

### Webhooks
- `POST /api/webhooks/ziina` - Receive Ziina payment notifications

### Shipping
- `POST /api/shipping/create` - Create Jeebly shipment (admin only)
- `POST /api/shipping/track` - Track shipment by order ID or AWB

## Order Statuses

| Status | Description |
|--------|-------------|
| `payment-pending` | Order created, awaiting payment |
| `paid` | Payment completed successfully |
| `processing` | Shipment created, preparing for dispatch |
| `in-transit` | Package picked up and in delivery |
| `delivered` | Package delivered to customer |
| `cancelled` | Order cancelled |

## Testing

### Ziina Test Mode
- Set `ZIINA_TEST_MODE=true` in environment
- Use [Ziina test cards](https://docs.ziina.com/test-cards) for testing

### Jeebly Demo
- Use the demo API URL: `https://demo.jeebly.com`
- Demo credentials are provided in the Postman collection

## Troubleshooting

### "Payment gateway not configured"
- Check that `ZIINA_API_TOKEN` is set correctly
- Ensure it's not the placeholder value

### "Failed to create shipment"
- Verify customer has complete address in their profile
- Check Jeebly API credentials are correct
- Ensure order status is `paid` or `processing`

### Webhook not updating order
- Verify webhook URL is accessible from internet
- Check Ziina dashboard for webhook delivery status
- Look at server logs for webhook errors
