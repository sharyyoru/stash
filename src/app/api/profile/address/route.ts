import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get user's address from database
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", session.user.email)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
      throw error;
    }

    return NextResponse.json({
      address: profile?.address || null,
      hasAddress: !!profile?.address,
    });
  } catch (error: any) {
    console.error("[Address GET] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const address = await req.json();

    console.log("[Address POST] Received address for:", session.user.email);
    console.log("[Address POST] Address data:", JSON.stringify(address));

    // Validate required fields (dateOfBirth is optional)
    const requiredFields = ["line1", "city", "state", "postalCode", "country", "mobile"];
    const missingFields = requiredFields.filter(field => !address[field] || address[field].toString().trim() === "");
    
    if (missingFields.length > 0) {
      console.log("[Address POST] Missing fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", session.user.email)
      .single();

    console.log("[Address POST] Existing profile check:", existingProfile ? "Found" : "Not found", checkError?.code || "");

    if (existingProfile) {
      // Update existing profile
      console.log("[Address POST] Updating existing profile...");
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          address,
          updated_at: new Date().toISOString(),
        })
        .eq("email", session.user.email)
        .select();

      if (updateError) {
        console.error("[Address POST] Update error:", updateError);
        throw updateError;
      }
      console.log("[Address POST] Update successful:", updateData);
    } else {
      // Create new profile
      console.log("[Address POST] Creating new profile...");
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          email: session.user.email,
          name: session.user.name || "",
          address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (insertError) {
        console.error("[Address POST] Insert error:", insertError);
        throw insertError;
      }
      console.log("[Address POST] Insert successful:", insertData);
    }

    console.log("[Address POST] Address saved successfully for:", session.user.email);
    return NextResponse.json({
      success: true,
      message: "Address saved successfully",
    });
  } catch (error: any) {
    console.error("[Address POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save address. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Remove address from profile
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        address: null,
        updated_at: new Date().toISOString(),
      })
      .eq("email", session.user.email);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Address removed successfully",
    });
  } catch (error: any) {
    console.error("[Address DELETE] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
