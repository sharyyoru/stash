/**
 * Script to update Master Lloyd MOC with accurate parts data from Rebrickable CSV
 * Run with: npx ts-node scripts/update-master-lloyd-parts.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Color ID to name mapping (common LEGO colors from Rebrickable)
const COLOR_MAP: Record<number, { name: string; rgb: string }> = {
  0: { name: "Black", rgb: "05131D" },
  10: { name: "Bright Green", rgb: "4B9F4A" },
  14: { name: "Yellow", rgb: "F2CD37" },
  15: { name: "White", rgb: "FFFFFF" },
  70: { name: "Reddish Brown", rgb: "582A12" },
  191: { name: "Bright Light Orange", rgb: "F8BB3D" },
  297: { name: "Pearl Gold", rgb: "CC9C2B" },
  484: { name: "Dark Orange", rgb: "A95500" },
  9999: { name: "[No Color/Unknown]", rgb: "CCCCCC" },
};

// Part names for Master Lloyd MOC (from Rebrickable)
const PART_NAMES: Record<string, string> = {
  "68297": "Minifigure Hair Short Bowl Cut",
  "7727": "Flag 1 x 2 on Flagpole, Straight",
  "69562pat0001": "Minifig Scabbard for 2 Katanas",
  "32607": "Technic Pin 3/4",
  "40379": "Ninjago Blade Claw Hook with Clip",
  "21459": "Minifigure Weapon Katana with Octagonal Guard",
  "93055": "Minifigure Weapon Katana with Square Guard",
  "54200": "Slope 30 1 x 1 x 2/3",
  "970c27pr0007": "Hips and Legs with Green Sash Pattern",
  "973c27h01pr0011": "Torso with Arms, Hands with Green Ninja Suit Pattern",
  "7373": "Rock 2 x 2 Crystal",
  "3626cpr2255": "Minifigure Head with Lloyd Pattern",
  "3062b": "Brick Round 1 x 1 Open Stud",
};

type PartWithImage = {
  partNum: string;
  name: string;
  colorId: number;
  colorName: string;
  colorRgb: string;
  quantity: number;
  imageUrl: string;
  elementIds: string[];
  isSpare: boolean;
};

function getColorInfo(colorId: number): { name: string; rgb: string } {
  return COLOR_MAP[colorId] || { name: `Color ${colorId}`, rgb: "CCCCCC" };
}

function getPartImageUrl(partNum: string, colorId: number): string {
  return `https://cdn.rebrickable.com/media/parts/ldraw/${colorId}/${partNum}.png`;
}

function parsePartsListCsv(csvContent: string): PartWithImage[] {
  const lines = csvContent.trim().split("\n");
  const parts: PartWithImage[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [partNum, colorIdStr, quantityStr, isSpareStr] = line.split(",");
    const colorId = parseInt(colorIdStr, 10);
    const quantity = parseInt(quantityStr, 10);
    const isSpare = isSpareStr?.toLowerCase() === "true";

    const colorInfo = getColorInfo(colorId);
    const imageUrl = getPartImageUrl(partNum, colorId);
    const name = PART_NAMES[partNum] || `Part ${partNum}`;

    parts.push({
      partNum,
      name,
      colorId,
      colorName: colorInfo.name,
      colorRgb: colorInfo.rgb,
      quantity,
      imageUrl,
      elementIds: [],
      isSpare,
    });
  }

  return parts;
}

async function updateMasterLloydParts() {
  console.log("🔧 Updating Master Lloyd MOC with accurate parts data...\n");

  // Read the CSV file
  const csvPath = path.join(
    "C:",
    "Users",
    "user",
    "Desktop",
    "ninjago",
    "MasterLloyd",
    "rebrickable_parts_moc-255673-master-lloyd-three-sword-style.csv"
  );

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  console.log("📄 CSV Content:");
  console.log(csvContent);
  console.log("\n");

  // Parse the CSV
  const parts = parsePartsListCsv(csvContent);
  console.log(`✅ Parsed ${parts.length} unique parts\n`);

  // Display parts
  console.log("📦 Parts List:");
  console.log("─".repeat(80));
  for (const part of parts) {
    console.log(
      `  ${part.partNum.padEnd(20)} | ${part.colorName.padEnd(20)} | x${part.quantity} | ${part.name}`
    );
  }
  console.log("─".repeat(80));

  // Calculate totals
  const totalParts = parts.reduce((sum, p) => sum + p.quantity, 0);
  const uniqueParts = parts.length;

  console.log(`\n📊 Total: ${totalParts} parts (${uniqueParts} unique)\n`);

  // Create the parts list object
  const mocPartsList = {
    parts,
    totalParts,
    uniqueParts,
    lastUpdated: new Date().toISOString(),
    source: "csv",
    rebrickableMocId: "moc-255673",
  };

  // Update the MOC in database
  const { data, error } = await supabase
    .from("mocs")
    .update({
      parts_list: mocPartsList,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", "master-lloyd-santoryu-style")
    .select();

  if (error) {
    console.error("❌ Error updating MOC:", error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error("❌ MOC not found with slug: master-lloyd-santoryu-style");
    process.exit(1);
  }

  console.log("✅ Successfully updated Master Lloyd MOC with accurate parts data!");
  console.log("\n📸 Sample part image URLs:");
  parts.slice(0, 3).forEach((part) => {
    console.log(`  ${part.partNum}: ${part.imageUrl}`);
  });
}

updateMasterLloydParts().catch(console.error);
