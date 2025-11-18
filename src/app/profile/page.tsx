import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import ProfileClient from "./profile-client";
import { listOrders, type Order } from "../../lib/orders-store";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const email = session.user.email;
  let orders: Order[] = [];
  if (email) {
    const all = await listOrders();
    orders = all.filter((order) => order.customer?.email === email);
  }

  return (
    <ProfileClient
      name={session.user.name}
      email={session.user.email}
      image={session.user.image}
      orders={orders}
    />
  );
}
