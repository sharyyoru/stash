import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import {
  listOrders,
  type Order,
  type OrderStatus,
  updateOrderStatus,
  deleteOrder,
} from "../../../lib/orders-store";
import CopyableText from "../../../components/copyable-text";
import OrderProofUpload from "../../../components/order-proof-upload";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "payment-pending", label: "Payment pending" },
  { value: "paid", label: "Paid" },
  { value: "in-transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
];

const filterTabs: { value: "all" | OrderStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "payment-pending", label: "Payment pending" },
  { value: "paid", label: "Paid" },
  { value: "in-transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
];

function formatOrderDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Dubai",
  });
}

async function updateStatus(formData: FormData) {
  "use server";
  const id = formData.get("id");
  const status = formData.get("status") as OrderStatus | null;
  if (!id || !status) return;
  updateOrderStatus(String(id), status);
  redirect("/admin/orders");
}

async function deleteOrderAction(formData: FormData) {
  "use server";
  const id = formData.get("id");
  if (!id) return;
  await deleteOrder(String(id));
  redirect("/admin/orders");
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!isAdminEmail(email)) {
    redirect("/");
  }

  const orders: Order[] = await listOrders();

  const rawStatus = (searchParams?.status || "all") as string;
  let activeStatus: "all" | OrderStatus = "all";
  if (
    rawStatus === "payment-pending" ||
    rawStatus === "paid" ||
    rawStatus === "in-transit" ||
    rawStatus === "delivered"
  ) {
    activeStatus = rawStatus;
  }

  const filteredOrders =
    activeStatus === "all" ? orders : orders.filter((o) => o.status === activeStatus);

  const baseCurrency =
    orders.find((o) => o.currency)?.currency || "AED";

  const totalPaid = orders
    .filter(
      (o) =>
        o.status === "paid" ||
        o.status === "in-transit" ||
        o.status === "delivered",
    )
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalUnpaid = orders
    .filter((o) => o.status === "payment-pending")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Admin
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
              Orders
            </h1>
          </div>
          <p className="text-xs text-neutral-600">Signed in as {email}</p>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-neutral-600">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {filterTabs.map((tab) => {
                const isActive = tab.value === activeStatus;
                const href =
                  tab.value === "all" ? "/admin/orders" : `/admin/orders?status=${tab.value}`;
                return (
                  <Link
                    key={tab.value}
                    href={href}
                    className={
                      "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-sm transition " +
                      (isActive
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50")
                    }
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold text-emerald-700">
                  Paid: {baseCurrency} {totalPaid.toFixed(2)}
                </p>
                <p className="text-xs font-semibold text-red-600">
                  Unpaid: {baseCurrency} {totalUnpaid.toFixed(2)}
                </p>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-sm text-neutral-600">No orders with this status yet.</p>
            ) : (
              filteredOrders.map((order) => {
                const profile = (order as any).profile || {};
                const mobile: string | undefined = profile.mobile;
                const whatsapp: string | undefined = profile.whatsapp;

                const whatsappLink = whatsapp
                  ? `https://wa.me/${whatsapp.replace(/\D/g, "")}`
                  : "#";

                return (
                <div
                  key={order.id}
                  className="space-y-2 rounded-3xl bg-white p-4 text-sm shadow-sm ring-1 ring-neutral-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                        {order.id}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <form action={updateStatus} className="flex items-center gap-2 text-xs">
                        <label className="text-neutral-600" htmlFor={`status-${order.id}`}>
                          Status
                        </label>
                        <input type="hidden" name="id" value={order.id} />
                        <select
                          id={`status-${order.id}`}
                          name="status"
                          defaultValue={order.status}
                          className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-full bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-neutral-800"
                        >
                          Update
                        </button>
                      </form>
                      <form action={deleteOrderAction} className="flex items-center">
                        <input type="hidden" name="id" value={order.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-medium text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
                    <p>
                      {order.customer?.name} ({order.customer?.email})
                    </p>
                    <p>
                      {order.currency} {order.totalAmount.toFixed(2)} · {order.totalCount} item
                      {order.totalCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-neutral-600">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-neutral-900">{item.title}</span>
                        <span>
                          {item.priceText || `${order.currency} ${item.price ?? ""}`} × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {(mobile || whatsapp) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                      {mobile && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-neutral-900">Mobile:</span>
                          <CopyableText text={mobile} />
                        </div>
                      )}
                      {whatsapp && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-neutral-900">WhatsApp:</span>
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
                          >
                            Open chat
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <OrderProofUpload orderId={order.id} proofUrl={order.proofUrl} />
                </div>
              );
            })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
