import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import {
  parsePartsListCsv,
  enrichPartsWithNames,
  getColorInfo,
  getPartImageUrl,
  fetchPartDetails,
  type PartWithImage,
  type MocPartsList,
} from "../../../../lib/rebrickable";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// GET - Fetch parts for a MOC
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const partNum = searchParams.get("partNum");

    // If partNum is provided, fetch single part details
    if (partNum) {
      const details = await fetchPartDetails(partNum);
      if (details) {
        return NextResponse.json(details);
      }
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    // Otherwise fetch parts list for a MOC
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const { data: moc, error } = await supabaseAdmin
      .from("mocs")
      .select("parts_list")
      .eq("slug", slug)
      .single();

    if (error || !moc) {
      return NextResponse.json({ error: "MOC not found" }, { status: 404 });
    }

    return NextResponse.json({ parts: moc.parts_list || [] });
  } catch (error: any) {
    console.error("[Parts API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Update parts list for a MOC (from CSV or manual)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slug, csvContent, parts, enrichWithApi } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    let partsList: PartWithImage[] = [];

    // Parse from CSV if provided
    if (csvContent) {
      partsList = parsePartsListCsv(csvContent);
    } else if (Array.isArray(parts)) {
      partsList = parts;
    } else {
      return NextResponse.json(
        { error: "Either csvContent or parts array is required" },
        { status: 400 }
      );
    }

    // Optionally enrich with names from API
    if (enrichWithApi && process.env.REBRICKABLE_API_KEY) {
      partsList = await enrichPartsWithNames(partsList);
    }

    // Calculate totals
    const totalParts = partsList.reduce((sum, p) => sum + p.quantity, 0);
    const uniqueParts = partsList.length;

    // Create the parts list object
    const mocPartsList: MocPartsList = {
      parts: partsList,
      totalParts,
      uniqueParts,
      lastUpdated: new Date().toISOString(),
      source: csvContent ? "csv" : "manual",
    };

    // Update the MOC
    const { error } = await supabaseAdmin
      .from("mocs")
      .update({
        parts_list: mocPartsList,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);

    if (error) {
      console.error("[Parts API] Error updating MOC:", error);
      return NextResponse.json({ error: "Failed to update MOC" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      totalParts,
      uniqueParts,
      parts: partsList,
    });
  } catch (error: any) {
    console.error("[Parts API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Generate part image URLs for existing parts
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Fetch current MOC
    const { data: moc, error: fetchError } = await supabaseAdmin
      .from("mocs")
      .select("parts_list")
      .eq("slug", slug)
      .single();

    if (fetchError || !moc) {
      return NextResponse.json({ error: "MOC not found" }, { status: 404 });
    }

    const currentParts = moc.parts_list as MocPartsList | null;
    if (!currentParts?.parts) {
      return NextResponse.json({ error: "No parts list found" }, { status: 400 });
    }

    // Regenerate image URLs for all parts
    const updatedParts = currentParts.parts.map((part) => ({
      ...part,
      imageUrl: getPartImageUrl(part.partNum, part.colorId),
      colorName: getColorInfo(part.colorId).name,
      colorRgb: getColorInfo(part.colorId).rgb,
    }));

    // Update the MOC
    const updatedPartsList: MocPartsList = {
      ...currentParts,
      parts: updatedParts,
      lastUpdated: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from("mocs")
      .update({
        parts_list: updatedPartsList,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", slug);

    if (updateError) {
      console.error("[Parts API] Error updating MOC:", updateError);
      return NextResponse.json({ error: "Failed to update MOC" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      parts: updatedParts,
    });
  } catch (error: any) {
    console.error("[Parts API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
