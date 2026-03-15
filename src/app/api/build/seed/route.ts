import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Master Lloyd MOC data - images will be uploaded separately
const masterLloydMoc = {
  slug: "master-lloyd-santoryu-style",
  title: "Master Lloyd (Santoryu Style)",
  description: "A Ninjago x One Piece crossover MOC. Lloyd Garmadon reimagined as Roronoa Zoro, wielding three katanas using the Santoryu style. This unique fusion combines the ninja aesthetic of Ninjago with the iconic Santoryu (Three Sword Style) fighting technique from One Piece.",
  design_features: [
    "Santoryu Stance with mouth-blade",
    "Island Base with palm tree",
    "Fusion Aesthetic",
    "Custom weapon configuration",
    "Tropical scenery display"
  ],
  parts_list: [
    { part_id: "973", name: "Torso", color: "Green", source: "Ninjago Set" },
    { part_id: "970", name: "Hips and Legs", color: "Black", source: "Ninjago Set" },
    { part_id: "30173", name: "1x1 Neck Bracket", color: "Dark Bluish Gray", source: "BrickLink" },
    { part_id: "21459", name: "Lloyd's Head", color: "Yellow", source: "Ninjago Set" },
    { part_id: "11437", name: "White Katana", color: "White", source: "Ninjago Set" },
    { part_id: "42446", name: "Lloyd Hairpiece", color: "Bright Light Yellow", source: "Ninjago Set" },
    { part_id: "68547", name: "Golden Scimitar", color: "Pearl Gold", source: "Castle Set" },
    { part_id: "3958", name: "Dragon Hilt Katana", color: "Pearl Dark Gray", source: "Ninjago Set" },
    { part_id: "3020", name: "6x6 Tan Wedge Plate", color: "Tan", source: "BrickLink" },
    { part_id: "2566", name: "2x4 Gray Plate", color: "Light Bluish Gray", source: "Pick-a-Brick" },
    { part_id: "32607", name: "1x1 Round (Palm Tree Trunk)", color: "Reddish Brown", source: "BrickLink" },
    { part_id: "28573", name: "Plant Leaves & Flowers", color: "Green/Orange", source: "Pick-a-Brick" }
  ],
  instructions: [
    { step: 1, text: "Minifigure: Place a 1x1 neck bracket over the neck stud, attach the head, clip the white katana into the bracket, and fit the hairpiece over it." },
    { step: 2, text: "Weapons: Equip the Golden Scimitar in the right hand and the Dragon Hilt Katana in the left." },
    { step: 3, text: "Base: Build a 6x6 tan wedge foundation with a central 2x4 gray plate for elevation." },
    { step: 4, text: "Scenery: Construct the palm tree using brown 1x1 rounds and add orange flowers and green leaves for tropical detail." }
  ],
  images: [] as string[],
  videos: [] as string[],
  cover_image: "",
  status: "published" as const,
};

// POST - Seed the Master Lloyd MOC (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Master Lloyd already exists
    const { data: existing } = await supabaseAdmin
      .from("mocs")
      .select("id")
      .eq("slug", masterLloydMoc.slug)
      .single();

    if (existing) {
      return NextResponse.json({ 
        message: "Master Lloyd MOC already exists", 
        exists: true 
      });
    }

    // Insert the Master Lloyd MOC
    const { data, error } = await supabaseAdmin
      .from("mocs")
      .insert({
        ...masterLloydMoc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[Seed MOC] Error:", error);
      throw error;
    }

    return NextResponse.json({ 
      message: "Master Lloyd MOC created successfully", 
      moc: data 
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Seed MOC] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
