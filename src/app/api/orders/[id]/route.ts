import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  updateOrderStatus,
  type OrderStatus,
  setOrderProof,
  listOrders,
} from "../../../../lib/orders-store";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const all = await listOrders();
  const target = id.toUpperCase();
  const order = all.find((o) => o.id.toUpperCase() === target);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status as OrderStatus | undefined;
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const updated = await updateOrderStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: updated });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const fileEntry = form.get("file");
  if (!fileEntry || typeof (fileEntry as any).arrayBuffer !== "function") {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const file = fileEntry as any;
  const originalName = (file.name as string) || "proof";
  const extMatch = originalName.match(/\.[^\.]+$/);
  const ext = extMatch ? extMatch[0] : "";
  const base = originalName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "proof";
  const fileName = `${id}-${Date.now()}-${base}${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("order-proofs")
    .upload(fileName, buffer, {
      contentType: (file.type as string) || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Failed to upload proof" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("order-proofs").getPublicUrl(fileName);

  const updated = (await setOrderProof(id, publicUrl)) || undefined;

  return NextResponse.json({ order: updated, proofUrl: publicUrl });
}
