import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      throw profilesError;
    }

    // Get all orders to find additional customers
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("customer_email, customer_name, shipping_address, created_at")
      .order("created_at", { ascending: false });

    // Combine all users
    const allUsers = new Map();

    // Add profiles first
    (profiles || []).forEach(profile => {
      const address = profile.address || {};
      allUsers.set(profile.email, {
        email: profile.email,
        name: profile.name || "",
        mobile: profile.mobile || address.mobile || "",
        whatsapp: address.whatsapp || "",
        address_line1: address.line1 || "",
        address_line2: address.line2 || "",
        city: address.city || "",
        state: address.state || "",
        postal_code: address.postalCode || "",
        country: address.country || "",
        created_at: profile.created_at,
      });
    });

    // Add orders for users without profiles
    (orders || []).forEach(order => {
      if (!allUsers.has(order.customer_email)) {
        const shipping = order.shipping_address || {};
        allUsers.set(order.customer_email, {
          email: order.customer_email,
          name: order.customer_name || "",
          mobile: shipping.mobile || shipping.phone || "",
          whatsapp: "",
          address_line1: shipping.line1 || shipping.address || "",
          address_line2: shipping.line2 || "",
          city: shipping.city || "",
          state: shipping.state || shipping.emirate || "",
          postal_code: shipping.postalCode || shipping.postal_code || "",
          country: shipping.country || "UAE",
          created_at: order.created_at,
        });
      }
    });

    // Convert to array
    const users = Array.from(allUsers.values());

    // Create CSV
    const headers = [
      "Email",
      "Name",
      "Mobile",
      "WhatsApp",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State/Emirate",
      "Postal Code",
      "Country",
      "Created At"
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [
      headers.join(","),
      ...users.map(user => [
        escapeCSV(user.email),
        escapeCSV(user.name),
        escapeCSV(user.mobile),
        escapeCSV(user.whatsapp),
        escapeCSV(user.address_line1),
        escapeCSV(user.address_line2),
        escapeCSV(user.city),
        escapeCSV(user.state),
        escapeCSV(user.postal_code),
        escapeCSV(user.country),
        escapeCSV(user.created_at),
      ].join(","))
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="stash-contacts-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error("[Export Contacts] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
