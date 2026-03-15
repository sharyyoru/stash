/**
 * Script to seed Master Lloyd MOC with images
 * Run with: npx ts-node scripts/seed-master-lloyd.ts
 * 
 * Prerequisites:
 * 1. Run the migration in Supabase SQL Editor first (supabase/migrations/004_mocs.sql)
 * 2. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const IMAGES_DIR = "C:\\Users\\user\\Desktop\\ninjago\\MasterLloyd";
const MOC_SLUG = "master-lloyd-santoryu-style";

async function uploadImage(filePath: string, fileName: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `${MOC_SLUG}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from("MOC")
      .upload(storagePath, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading ${fileName}:`, error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("MOC")
      .getPublicUrl(storagePath);

    console.log(`✓ Uploaded: ${fileName}`);
    return urlData.publicUrl;
  } catch (err) {
    console.error(`Error reading file ${fileName}:`, err);
    return null;
  }
}

async function seedMasterLloyd() {
  console.log("\n🧱 Seeding Master Lloyd MOC\n");
  console.log("Step 1: Uploading images to MOC bucket...\n");

  // Get all PNG files from the directory
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith(".png")).sort();
  const uploadedImages: string[] = [];

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const url = await uploadImage(filePath, file);
    if (url) {
      uploadedImages.push(url);
    }
  }

  if (uploadedImages.length === 0) {
    console.error("No images were uploaded successfully");
    process.exit(1);
  }

  console.log(`\n✓ Uploaded ${uploadedImages.length} images\n`);

  // Master Lloyd MOC data
  const masterLloydMoc = {
    slug: MOC_SLUG,
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
    images: uploadedImages,
    videos: [],
    cover_image: uploadedImages[0], // First image as cover
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log("Step 2: Creating MOC in database...\n");

  // Check if MOC already exists
  const { data: existing } = await supabase
    .from("mocs")
    .select("id")
    .eq("slug", MOC_SLUG)
    .single();

  let result;
  if (existing) {
    // Update existing
    result = await supabase
      .from("mocs")
      .update({
        ...masterLloydMoc,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", MOC_SLUG)
      .select()
      .single();
    console.log("✓ Updated existing MOC");
  } else {
    // Insert new
    result = await supabase
      .from("mocs")
      .insert(masterLloydMoc)
      .select()
      .single();
    console.log("✓ Created new MOC");
  }

  if (result.error) {
    console.error("Error saving MOC:", result.error.message);
    process.exit(1);
  }

  console.log("\n✅ Master Lloyd MOC seeded successfully!");
  console.log(`\nView at: /build/${MOC_SLUG}`);
  console.log(`Edit at: /editbuild\n`);
}

seedMasterLloyd().catch(console.error);
