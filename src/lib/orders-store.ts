import { supabaseAdmin } from "./supabase-admin";

export type OrderStatus = "payment-pending" | "paid" | "in-transit" | "delivered";

export type OrderItem = {
  id: string;
  title: string;
  slug?: string;
  priceText?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer?: {
    name?: string | null;
    email?: string | null;
  };
  profile?: any;
  items: OrderItem[];
  totalCount: number;
  totalAmount: number;
  currency: string;
  proofUrl?: string;
};

function generateOrderId(): string {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `ORD-${now}-${rand}`.toUpperCase();
}

function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    customer: row.customer_email || row.customer_name
      ? { name: row.customer_name, email: row.customer_email }
      : undefined,
    profile: row.profile ?? undefined,
    items: (row.items || []) as OrderItem[],
    totalCount: row.total_count,
    totalAmount: Number(row.total_amount ?? 0),
    currency: row.currency || "AED",
    proofUrl: row.proof_url ?? undefined,
  };
}

export async function createOrder(
  input: Omit<Order, "id" | "createdAt" | "status">,
): Promise<Order> {
  const id = generateOrderId();
  const createdAt = new Date().toISOString();

  const { items, totalAmount, totalCount, currency, customer, profile, proofUrl } = input;

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      id,
      created_at: createdAt,
      status: "payment-pending",
      customer_name: customer?.name ?? null,
      customer_email: customer?.email ?? null,
      total_amount: totalAmount,
      total_count: totalCount,
      currency,
      items,
      profile: profile ?? null,
      proof_url: proofUrl ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Failed to create order");
  }

  return mapRowToOrder(data);
}

export async function listOrders(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapRowToOrder);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapRowToOrder(data);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToOrder(data);
}

export async function setOrderProof(
  id: string,
  proofUrl: string,
): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ proof_url: proofUrl })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToOrder(data);
}

export async function deleteOrder(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("orders")
    .delete()
    .eq("id", id);

  if (error) return false;
  return true;
}
