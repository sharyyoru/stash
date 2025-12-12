import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { listOrders } from "../../../lib/orders-store";
import { trackShipment, formatTrackingStatus, getAccountBalance } from "../../../lib/jeebly";
import DeliveryTrackingDashboard from "../../../components/delivery-tracking-dashboard";
import Link from "next/link";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

async function getDeliveryData() {
  const orders = await listOrders();
  
  // Filter orders with AWB numbers (shipments created)
  const ordersWithShipments = orders.filter(order => order.awbNumber);
  
  const deliveries = [];
  
  for (const order of ordersWithShipments) {
    try {
      const trackingResult = await trackShipment(order.awbNumber!);
      
      if (trackingResult.success === "true" && trackingResult.Tracking) {
        const tracking = trackingResult.Tracking;
        
        deliveries.push({
          orderId: order.id,
          awbNumber: order.awbNumber!,
          status: tracking.last_status,
          statusText: formatTrackingStatus(tracking.last_status as any),
          pickupDate: tracking.pickup_date,
          bookingDate: tracking.booking_date,
          events: tracking.events.map(event => ({
            status: event.status,
            description: event.desc,
            hubName: event.hub_name,
            timestamp: event.event_date_time,
            riderName: event.rider_name || undefined,
            podImage: event.pod_image || undefined,
            failureReason: event.failure_reason || undefined,
          })),
          customerName: order.customer?.name,
          totalAmount: order.totalAmount,
          currency: order.currency,
        });
      }
    } catch (error) {
      console.error(`Failed to track shipment ${order.awbNumber}:`, error);
      // Still add the order with basic info if tracking fails
      deliveries.push({
        orderId: order.id,
        awbNumber: order.awbNumber!,
        status: order.shippingStatus || "unknown",
        statusText: order.shippingStatus ? formatTrackingStatus(order.shippingStatus as any) : "Unknown",
        events: [],
        customerName: order.customer?.name,
        totalAmount: order.totalAmount,
        currency: order.currency,
      });
    }
  }
  
  return deliveries;
}

async function getBalance() {
  try {
    const balanceResult = await getAccountBalance();
    if (balanceResult.success === "true") {
      return {
        balance: balanceResult.balance || 0,
        currency: balanceResult.currency || "AED",
        creditLimit: balanceResult.credit_limit || 0,
        availableBalance: balanceResult.available_balance || 0,
      };
    }
  } catch (error) {
    console.error("Failed to get account balance:", error);
  }
  return null;
}

export default async function AdminDeliveriesPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!isAdminEmail(email)) {
    redirect("/");
  }

  const [deliveries, accountBalance] = await Promise.all([
    getDeliveryData(),
    getBalance(),
  ]);

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Admin
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
              Delivery Management
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {accountBalance && (
              <div className="text-right">
                <p className="text-xs text-neutral-500">Jeebly Account Balance</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {accountBalance.currency} {accountBalance.balance.toFixed(2)}
                </p>
                {accountBalance.creditLimit > 0 && (
                  <p className="text-xs text-neutral-600">
                    Credit: {accountBalance.currency} {accountBalance.creditLimit.toFixed(2)}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Link
                href="/admin/orders"
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
              >
                Orders
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center rounded-full bg-neutral-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-neutral-800"
              >
                <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <DeliveryTrackingDashboard 
          deliveries={deliveries}
          onRefresh={() => {
            // Client-side refresh will be handled by the component
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}
