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

    // Validate required fields
    const requiredFields = ["line1", "city", "state", "postalCode", "country", "mobile", "dateOfBirth"];
    const missingFields = requiredFields.filter(field => !address[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          address,
          updated_at: new Date().toISOString(),
        })
        .eq("email", session.user.email);

      if (error) throw error;
    } else {
      // Create new profile
      const { error } = await supabaseAdmin
        .from("profiles")
        .insert({
          email: session.user.email,
          name: session.user.name || "",
          address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Address saved successfully",
    });
  } catch (error: any) {
    console.error("[Address POST] Error:", error);
    return NextResponse.json(
      { error: error.message },
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
