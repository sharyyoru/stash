import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Helper to detect schema cache / missing table errors
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || "";
  return msg.includes("schema cache") || 
         (msg.includes("relation") && msg.includes("does not exist")) ||
         (msg.includes("table") && msg.includes("does not exist"));
}

export type MOCInstruction = {
  step: number;
  text: string;
  image_url?: string;
};

export type MOC = {
  id: string;
  slug: string;
  title: string;
  description: string;
  design_features: string[];
  parts_list: { part_id: string; name: string; color: string; source: string; quantity?: number }[];
  instructions: MOCInstruction[];
  images: string[];
  videos: string[];
  cover_image: string;
  pdf_url?: string;
  instruction_images?: string[];
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

// GET - Fetch all MOCs (public can see published, admin can see all)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdminUser = isAdmin(session?.user?.email);
    
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    
    // If slug is provided, fetch single MOC
    if (slug) {
      let query = supabaseAdmin
        .from("mocs")
        .select("*")
        .eq("slug", slug)
        .single();
      
      // Non-admins can only see published MOCs
      if (!isAdminUser) {
        query = supabaseAdmin
          .from("mocs")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .single();
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (isTableMissingError(error)) {
          return NextResponse.json({ error: "Database not set up. Run migrations." }, { status: 503 });
        }
        if (error.code === "PGRST116") {
          return NextResponse.json({ error: "MOC not found" }, { status: 404 });
        }
        throw error;
      }
      
      return NextResponse.json({ moc: data });
    }
    
    // Fetch all MOCs
    let query = supabaseAdmin
      .from("mocs")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Non-admins can only see published MOCs
    if (!isAdminUser) {
      query = query.eq("status", "published");
    }
    
    const { data, error } = await query;
    
    if (error) {
      if (isTableMissingError(error)) {
        return NextResponse.json({ mocs: [], warning: "Database not set up" });
      }
      throw error;
    }
    
    return NextResponse.json({ mocs: data || [] });
  } catch (error: any) {
    console.error("[Build API GET] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new MOC (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { title, description, design_features, parts_list, instructions, images, videos, cover_image, pdf_url, instruction_images, status } = body;
    
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    const { data, error } = await supabaseAdmin
      .from("mocs")
      .insert({
        slug,
        title,
        description: description || "",
        design_features: design_features || [],
        parts_list: parts_list || [],
        instructions: instructions || [],
        images: images || [],
        videos: videos || [],
        cover_image: cover_image || "",
        pdf_url: pdf_url || null,
        instruction_images: instruction_images || [],
        status: status || "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      if (isTableMissingError(error)) {
        return NextResponse.json({ error: "Database not set up. Run migrations." }, { status: 503 });
      }
      if (error.code === "23505") {
        return NextResponse.json({ error: "A MOC with this title already exists" }, { status: 409 });
      }
      throw error;
    }
    
    return NextResponse.json({ moc: data, message: "MOC created successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("[Build API POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update existing MOC (admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { id, title, description, design_features, parts_list, instructions, image_url, status } = body;
    
    if (!id) {
      return NextResponse.json({ error: "MOC ID is required" }, { status: 400 });
    }
    
    // Generate new slug if title changed
    const slug = title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : undefined;
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (design_features !== undefined) updateData.design_features = design_features;
    if (parts_list !== undefined) updateData.parts_list = parts_list;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.videos !== undefined) updateData.videos = body.videos;
    if (body.cover_image !== undefined) updateData.cover_image = body.cover_image;
    if (body.pdf_url !== undefined) updateData.pdf_url = body.pdf_url;
    if (body.instruction_images !== undefined) updateData.instruction_images = body.instruction_images;
    if (status !== undefined) updateData.status = status;
    
    const { data, error } = await supabaseAdmin
      .from("mocs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      if (isTableMissingError(error)) {
        return NextResponse.json({ error: "Database not set up. Run migrations." }, { status: 503 });
      }
      throw error;
    }
    
    return NextResponse.json({ moc: data, message: "MOC updated successfully" });
  } catch (error: any) {
    console.error("[Build API PUT] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete MOC (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "MOC ID is required" }, { status: 400 });
    }
    
    const { error } = await supabaseAdmin
      .from("mocs")
      .delete()
      .eq("id", id);
    
    if (error) {
      if (isTableMissingError(error)) {
        return NextResponse.json({ error: "Database not set up. Run migrations." }, { status: 503 });
      }
      throw error;
    }
    
    return NextResponse.json({ message: "MOC deleted successfully" });
  } catch (error: any) {
    console.error("[Build API DELETE] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
