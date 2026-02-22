import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import ProfileClient from "./profile-client";
import { listOrders, type Order } from "../../lib/orders-store";
import { getUserSubscriptions, type Subscription } from "../../lib/subscriptions-store";
import { supabaseAdmin } from "../../lib/supabase-admin";

export type SecretStashSubscription = {
  id: string;
  stripe_customer_id: string;
  user_email: string;
  user_name: string;
  tier_id: string;
  tier_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at?: string;
  cancelled_at?: string;
};

async function getSecretStashSubscriptions(email: string): Promise<SecretStashSubscription[]> {
  try {
    // Only fetch active/trialing subscriptions, not superseded or cancelled ones
    const { data, error } = await supabaseAdmin
      .from("secret_stash_subscriptions")
      .select("*")
      .eq("user_email", email)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching secret stash subscriptions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching secret stash subscriptions:", error);
    return [];
  }
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const email = session.user.email;
  let orders: Order[] = [];
  let subscriptions: Subscription[] = [];
  let secretStashSubscriptions: SecretStashSubscription[] = [];
  
  if (email) {
    const [all, subs, secretStashSubs] = await Promise.all([
      listOrders(),
      getUserSubscriptions(email),
      getSecretStashSubscriptions(email),
    ]);
    orders = all.filter((order) => order.customer?.email === email);
    // Filter out cancelled subscriptions from legacy system
    subscriptions = subs.filter((s) => s.status !== "cancelled");
    secretStashSubscriptions = secretStashSubs;
  }

  return (
    <ProfileClient
      name={session.user.name}
      email={session.user.email}
      image={session.user.image}
      orders={orders}
      subscriptions={subscriptions}
      secretStashSubscriptions={secretStashSubscriptions}
    />
  );
}
