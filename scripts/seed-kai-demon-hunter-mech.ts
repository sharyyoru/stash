import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Kai's Demon Hunter Mech MOC data
const kaiDemonHunterMechMoc = {
  slug: "kais-demon-hunter-mech",
  title: "Kai's Demon Hunter Mech",
  description: "Forged in fire. Built to hunt. Designed for maximum posability and underworld-clearing power, this custom MOC features fully articulated dragon wings, an armored opening cockpit, and swappable blazing weapons to take down any threat. Whether it's striking from the sky or slashing on the ground, the ninja of fire has never looked more battle-ready. Scale of 1-10, how hot is this build?",
  design_features: [
    "Fully articulated dragon wings",
    "Armored opening cockpit",
    "Swappable blazing weapons",
    "Maximum posability design",
    "Fire-themed red and black color scheme",
    "Battle-ready aggressive stance"
  ],
  parts_list: [
    { part_id: "973", name: "Kai Torso (Fire)", color: "Red", source: "Ninjago Set", quantity: 1 },
    { part_id: "970", name: "Hips and Legs", color: "Black", source: "Ninjago Set", quantity: 1 },
    { part_id: "3626", name: "Kai's Head", color: "Yellow", source: "Ninjago Set", quantity: 1 },
    { part_id: "92081", name: "Mech Torso Frame", color: "Dark Red", source: "BrickLink", quantity: 1 },
    { part_id: "90617", name: "Ball Joint Socket", color: "Black", source: "Pick-a-Brick", quantity: 6 },
    { part_id: "32474", name: "Ball Joint Connector", color: "Black", source: "Pick-a-Brick", quantity: 6 },
    { part_id: "98313", name: "Mech Arm Upper", color: "Dark Red", source: "BrickLink", quantity: 2 },
    { part_id: "98314", name: "Mech Arm Lower", color: "Dark Red", source: "BrickLink", quantity: 2 },
    { part_id: "57518", name: "Mech Hand", color: "Black", source: "BrickLink", quantity: 2 },
    { part_id: "21459", name: "Dragon Wing Large", color: "Trans-Orange", source: "BrickLink", quantity: 2 },
    { part_id: "11089", name: "Dragon Wing Frame", color: "Dark Red", source: "BrickLink", quantity: 2 },
    { part_id: "98312", name: "Mech Leg Upper", color: "Dark Red", source: "BrickLink", quantity: 2 },
    { part_id: "98315", name: "Mech Leg Lower", color: "Dark Red", source: "BrickLink", quantity: 2 },
    { part_id: "15068", name: "Mech Foot", color: "Black", source: "BrickLink", quantity: 2 },
    { part_id: "30367", name: "Cockpit Glass", color: "Trans-Red", source: "Pick-a-Brick", quantity: 1 },
    { part_id: "3024", name: "1x1 Plate", color: "Pearl Gold", source: "Pick-a-Brick", quantity: 8 },
    { part_id: "4070", name: "1x1 Brick Modified", color: "Dark Red", source: "Pick-a-Brick", quantity: 6 },
    { part_id: "3023", name: "1x2 Plate", color: "Red", source: "Pick-a-Brick", quantity: 10 },
    { part_id: "3004", name: "1x2 Brick", color: "Black", source: "Pick-a-Brick", quantity: 6 },
    { part_id: "11477", name: "Curved Slope", color: "Dark Red", source: "Pick-a-Brick", quantity: 6 },
    { part_id: "54200", name: "Cheese Slope", color: "Trans-Orange", source: "Pick-a-Brick", quantity: 6 },
    { part_id: "99563", name: "Flame Piece", color: "Trans-Orange", source: "Pick-a-Brick", quantity: 4 },
    { part_id: "37341", name: "Katana Blade", color: "Pearl Dark Gray", source: "BrickLink", quantity: 2 }
  ],
  instructions: [
    { step: 1, text: "Begin by constructing the core torso frame using the dark red structural pieces. Install ball joint sockets at all limb connection points - shoulders, hips, and wing mounts." },
    { step: 2, text: "Build the armored cockpit section with the trans-red cockpit glass. Add gold accent plates around the chest area to create the fire energy core aesthetic." },
    { step: 3, text: "Assemble both arms using the upper and lower arm pieces connected via ball joints. Attach the mech hands and equip them with the katana blades as blazing weapons." },
    { step: 4, text: "Construct the legs starting from the hip ball joints. Connect upper legs, then lower legs, and finish with the heavy-duty mech feet for a stable battle stance." },
    { step: 5, text: "Build the dragon wing assemblies using the wing frames and trans-orange wing pieces. Attach them to the back torso ball joints for full articulation." },
    { step: 6, text: "Add flame pieces to the weapons and wing tips. Apply curved slopes and decorative elements in dark red and trans-orange for the complete demon hunter look." },
    { step: 7, text: "Place Kai minifigure into the cockpit and secure it. Pose the wings and weapons - your Demon Hunter Mech is ready to hunt!" }
  ],
  images: [
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_6.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_2.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_3.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_4.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_5.jpg"
  ],
  videos: [
    "https://www.instagram.com/p/DV84YeiCAlm/"
  ],
  cover_image: "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_6.jpg",
  pdf_url: "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech-Instructions.pdf",
  instruction_images: [
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_2.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_3.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_4.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_5.jpg",
    "/mocs/kai-demon-hunter-mech/Kai-DemonHunter-Mech_6.jpg"
  ],
  status: "published",
};

async function seedKaiDemonHunterMech() {
  console.log("Seeding Kai's Demon Hunter Mech MOC...");
  
  // Check if it already exists
  const { data: existing } = await supabase
    .from("mocs")
    .select("id")
    .eq("slug", kaiDemonHunterMechMoc.slug)
    .single();

  if (existing) {
    console.log("Kai's Demon Hunter Mech already exists, updating...");
    const { data, error } = await supabase
      .from("mocs")
      .update({
        ...kaiDemonHunterMechMoc,
        updated_at: new Date().toISOString(),
      })
      .eq("slug", kaiDemonHunterMechMoc.slug)
      .select()
      .single();

    if (error) {
      console.error("Error updating:", error);
      process.exit(1);
    }
    console.log("Updated successfully:", data.title);
  } else {
    console.log("Creating new Kai's Demon Hunter Mech MOC...");
    const { data, error } = await supabase
      .from("mocs")
      .insert({
        ...kaiDemonHunterMechMoc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting:", error);
      process.exit(1);
    }
    console.log("Created successfully:", data.title);
  }
  
  console.log("Done!");
}

seedKaiDemonHunterMech();
