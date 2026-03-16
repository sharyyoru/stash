import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Jay's Raider Mech MOC data
const jayRaiderMechMoc = {
  slug: "jays-raider-mech",
  title: "Jay's Raider Mech",
  description: "A compact yet powerful Ninjago mech designed for Jay, the Master of Lightning. This sleek battle mech features an aggressive stance with articulated limbs, lightning-themed color scheme in blue and gold accents, and dual arm-mounted weapons. Perfect for quick strikes and agile combat maneuvers, the Raider Mech embodies Jay's energetic and fast-paced fighting style. Built with detailed mechanical joints and a secure cockpit, this MOC offers both playability and display appeal.",
  design_features: [
    "Articulated limbs with ball joints",
    "Lightning-blue color scheme",
    "Dual arm weapons",
    "Secure minifigure cockpit",
    "Compact battle-ready stance",
    "Gold accent details"
  ],
  parts_list: [
    { part_id: "973", name: "Jay Torso (Lightning)", color: "Blue", source: "Ninjago Set", quantity: 1 },
    { part_id: "970", name: "Hips and Legs", color: "Black", source: "Ninjago Set", quantity: 1 },
    { part_id: "3626", name: "Jay's Head", color: "Yellow", source: "Ninjago Set", quantity: 1 },
    { part_id: "92081", name: "Mech Torso Frame", color: "Dark Bluish Gray", source: "BrickLink", quantity: 1 },
    { part_id: "90617", name: "Ball Joint Socket", color: "Dark Bluish Gray", source: "Pick-a-Brick", quantity: 4 },
    { part_id: "32474", name: "Ball Joint Connector", color: "Dark Bluish Gray", source: "Pick-a-Brick", quantity: 4 },
    { part_id: "98313", name: "Mech Arm Upper", color: "Blue", source: "BrickLink", quantity: 2 },
    { part_id: "98314", name: "Mech Arm Lower", color: "Blue", source: "BrickLink", quantity: 2 },
    { part_id: "57518", name: "Mech Hand", color: "Dark Bluish Gray", source: "BrickLink", quantity: 2 },
    { part_id: "30374", name: "Blaster Gun", color: "Pearl Dark Gray", source: "Pick-a-Brick", quantity: 2 },
    { part_id: "98312", name: "Mech Leg Upper", color: "Blue", source: "BrickLink", quantity: 2 },
    { part_id: "98315", name: "Mech Leg Lower", color: "Blue", source: "BrickLink", quantity: 2 },
    { part_id: "15068", name: "Mech Foot", color: "Dark Bluish Gray", source: "BrickLink", quantity: 2 },
    { part_id: "30367", name: "Cockpit Glass", color: "Trans-Light Blue", source: "Pick-a-Brick", quantity: 1 },
    { part_id: "3024", name: "1x1 Plate", color: "Pearl Gold", source: "Pick-a-Brick", quantity: 6 },
    { part_id: "4070", name: "1x1 Brick Modified", color: "Blue", source: "Pick-a-Brick", quantity: 4 },
    { part_id: "3023", name: "1x2 Plate", color: "Blue", source: "Pick-a-Brick", quantity: 8 },
    { part_id: "3004", name: "1x2 Brick", color: "Dark Bluish Gray", source: "Pick-a-Brick", quantity: 4 },
    { part_id: "11477", name: "Curved Slope", color: "Blue", source: "Pick-a-Brick", quantity: 4 },
    { part_id: "54200", name: "Cheese Slope", color: "Pearl Gold", source: "Pick-a-Brick", quantity: 4 }
  ],
  instructions: [
    { step: 1, text: "Start by building the mech's torso frame using the main structural pieces. Attach the ball joint sockets at the shoulder and hip positions." },
    { step: 2, text: "Construct the cockpit area with the cockpit glass piece and add the gold accent plates around the chest for that lightning energy look." },
    { step: 3, text: "Build both arms by connecting the upper arm pieces to the ball joints, then attach the lower arms and the mech hands with blaster weapons." },
    { step: 4, text: "Assemble the legs starting with the upper leg pieces connected to the hip ball joints, then add the lower legs and finish with the sturdy mech feet." },
    { step: 5, text: "Add the curved slopes and cheese slopes in blue and gold to give the mech its sleek, lightning-themed appearance." },
    { step: 6, text: "Place Jay minifigure into the cockpit and secure the cockpit glass. Your Raider Mech is ready for battle!" }
  ],
  images: [
    "/mocs/jay-raider-mech/jay-raider-mech_instructions.jpg",
    "/mocs/jay-raider-mech/jay-raider-mech_instructions_2.jpg",
    "/mocs/jay-raider-mech/jay-raider-mech_instructions_3.jpg",
    "/mocs/jay-raider-mech/jay-raider-mech_instructions_4.jpg"
  ],
  videos: [
    "/mocs/jay-raider-mech/jay-raider-mech_instructions-ig.mp4"
  ],
  cover_image: "/mocs/jay-raider-mech/jay-raider-mech_instructions.jpg",
  pdf_url: "/mocs/jay-raider-mech/Jay's Raider Mech Instructions.pdf",
  instruction_images: [
    "/mocs/jay-raider-mech/jay-raider-mech_instructions-ig-01.jpg",
    "/mocs/jay-raider-mech/jay-raider-mech_instructions-ig-01_2.jpg",
    "/mocs/jay-raider-mech/jay-raider-mech_instructions.jpg",
    "/mocs/jay-raider-mech/jay-raider-mech_instructions_2.jpg",
    "/mocs/jay-raider-mech/jay-raider-mech_instructions_3.jpg",
    "/mocs/jay-raider-mech/jay-raider-mech_instructions_4.jpg"
  ],
  status: "published" as const,
};

// POST - Seed Jay's Raider Mech MOC (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Jay's Raider Mech already exists
    const { data: existing } = await supabaseAdmin
      .from("mocs")
      .select("id")
      .eq("slug", jayRaiderMechMoc.slug)
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from("mocs")
        .update({
          ...jayRaiderMechMoc,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", jayRaiderMechMoc.slug)
        .select()
        .single();

      if (error) {
        console.error("[Seed Jay's Raider Mech] Update error:", error);
        throw error;
      }

      return NextResponse.json({ 
        message: "Jay's Raider Mech MOC updated successfully", 
        moc: data,
        updated: true
      });
    }

    // Insert new Jay's Raider Mech MOC
    const { data, error } = await supabaseAdmin
      .from("mocs")
      .insert({
        ...jayRaiderMechMoc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Seed Jay's Raider Mech] Insert error:", error);
      throw error;
    }

    return NextResponse.json({ 
      message: "Jay's Raider Mech MOC created successfully", 
      moc: data 
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Seed Jay's Raider Mech] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
