// Rebrickable API integration for LEGO parts data and images
// API Documentation: https://rebrickable.com/api/v3/docs/

const REBRICKABLE_API_KEY = process.env.REBRICKABLE_API_KEY;
const REBRICKABLE_BASE_URL = "https://rebrickable.com/api/v3";
const REBRICKABLE_CDN_URL = "https://cdn.rebrickable.com/media";

export type RebrickablePart = {
  part_num: string;
  name: string;
  part_cat_id: number;
  part_url: string;
  part_img_url: string | null;
  external_ids: {
    BrickLink?: string[];
    BrickOwl?: string[];
    Brickset?: string[];
    LDraw?: string[];
    LEGO?: string[];
  };
  print_of: string | null;
};

export type RebrickableColor = {
  id: number;
  name: string;
  rgb: string;
  is_trans: boolean;
  external_ids: {
    BrickLink?: { ext_ids: number[]; ext_descrs: string[][] };
    BrickOwl?: { ext_ids: number[]; ext_descrs: string[][] };
    LEGO?: { ext_ids: number[]; ext_descrs: string[][] };
    LDraw?: { ext_ids: number[]; ext_descrs: string[][] };
  };
};

export type RebrickablePartColor = {
  part_num: string;
  color: RebrickableColor;
  part_img_url: string | null;
  num_sets: number;
  num_set_parts: number;
  elements: string[];
};

export type PartWithImage = {
  partNum: string;
  name: string;
  colorId: number;
  colorName: string;
  colorRgb: string;
  quantity: number;
  imageUrl: string | null;
  elementIds: string[];
  isSpare: boolean;
};

// Color ID to name mapping (common LEGO colors from Rebrickable)
const COLOR_MAP: Record<number, { name: string; rgb: string }> = {
  0: { name: "Black", rgb: "05131D" },
  1: { name: "Blue", rgb: "0055BF" },
  2: { name: "Green", rgb: "237841" },
  3: { name: "Dark Turquoise", rgb: "008F9B" },
  4: { name: "Red", rgb: "C91A09" },
  5: { name: "Dark Pink", rgb: "C870A0" },
  6: { name: "Brown", rgb: "583927" },
  7: { name: "Light Gray", rgb: "9BA19D" },
  8: { name: "Dark Gray", rgb: "6D6E5C" },
  9: { name: "Light Blue", rgb: "B4D2E3" },
  10: { name: "Bright Green", rgb: "4B9F4A" },
  11: { name: "Light Turquoise", rgb: "55A5AF" },
  12: { name: "Salmon", rgb: "F2705E" },
  13: { name: "Pink", rgb: "FC97AC" },
  14: { name: "Yellow", rgb: "F2CD37" },
  15: { name: "White", rgb: "FFFFFF" },
  16: { name: "Light Green", rgb: "C2DAB8" },
  17: { name: "Light Yellow", rgb: "FFF03A" },
  18: { name: "Light Orange", rgb: "F3CF9B" },
  19: { name: "Bright Light Orange", rgb: "F8BB3D" },
  20: { name: "Bright Light Blue", rgb: "9FC3E9" },
  21: { name: "Bright Light Red", rgb: "FCAC00" },
  22: { name: "Purple", rgb: "81007B" },
  23: { name: "Dark Blue Violet", rgb: "2032B0" },
  25: { name: "Orange", rgb: "FE8A18" },
  26: { name: "Magenta", rgb: "923978" },
  27: { name: "Lime", rgb: "BBE90B" },
  28: { name: "Dark Tan", rgb: "958A73" },
  29: { name: "Bright Pink", rgb: "E4ADC8" },
  30: { name: "Medium Lavender", rgb: "AC78BA" },
  31: { name: "Lavender", rgb: "E1D5ED" },
  32: { name: "Trans-Black IR Lens", rgb: "635F52" },
  33: { name: "Trans-Dark Blue", rgb: "0020A0" },
  34: { name: "Trans-Green", rgb: "84B68D" },
  35: { name: "Trans-Bright Green", rgb: "D9E4A7" },
  36: { name: "Trans-Red", rgb: "C91A09" },
  37: { name: "Trans-Dark Pink", rgb: "DF6695" },
  38: { name: "Trans-Neon Orange", rgb: "FF800D" },
  39: { name: "Trans-Very Lt Blue", rgb: "C1DFF0" },
  40: { name: "Trans-Black", rgb: "635F52" },
  41: { name: "Trans-Medium Blue", rgb: "85A3B4" },
  42: { name: "Trans-Neon Green", rgb: "F8F184" },
  43: { name: "Trans-Light Blue", rgb: "AEEFEC" },
  44: { name: "Trans-Bright Reddish Lilac", rgb: "96709F" },
  45: { name: "Trans-Pink", rgb: "FC97AC" },
  46: { name: "Trans-Yellow", rgb: "F5CD2F" },
  47: { name: "Trans-Clear", rgb: "FCFCFC" },
  52: { name: "Trans-Purple", rgb: "A5A5CB" },
  54: { name: "Trans-Neon Yellow", rgb: "DAB000" },
  57: { name: "Trans-Orange", rgb: "F08F1C" },
  60: { name: "Chrome Antique Brass", rgb: "645A4C" },
  61: { name: "Chrome Blue", rgb: "6C96BF" },
  62: { name: "Chrome Green", rgb: "3CB371" },
  63: { name: "Chrome Pink", rgb: "AA4D8E" },
  64: { name: "Chrome Black", rgb: "1B2A34" },
  65: { name: "Metallic Gold", rgb: "DBAC34" },
  66: { name: "Pearl Light Gold", rgb: "DCBC81" },
  67: { name: "Metallic Silver", rgb: "A5A9B4" },
  68: { name: "Metallic Copper", rgb: "764D3B" },
  69: { name: "Pearl Light Gray", rgb: "A0A5A9" },
  70: { name: "Reddish Brown", rgb: "582A12" },
  71: { name: "Light Bluish Gray", rgb: "A0A5A9" },
  72: { name: "Dark Bluish Gray", rgb: "6C6E68" },
  73: { name: "Medium Blue", rgb: "5C9DD1" },
  74: { name: "Medium Green", rgb: "73DCA1" },
  76: { name: "Medium Dark Pink", rgb: "F785B1" },
  77: { name: "Light Pink", rgb: "FECCCF" },
  78: { name: "Light Flesh", rgb: "F6D7B3" },
  79: { name: "Milky White", rgb: "FFFFFF" },
  80: { name: "Metallic Green", rgb: "899B5F" },
  82: { name: "Chrome Silver", rgb: "E0E0E0" },
  83: { name: "Pearl White", rgb: "F2F3F2" },
  84: { name: "Copper", rgb: "AA4D8E" },
  85: { name: "Dark Bluish Gray", rgb: "6C6E68" },
  86: { name: "Dark Brown", rgb: "352100" },
  89: { name: "Blue Violet", rgb: "4C61DB" },
  92: { name: "Flesh", rgb: "D09168" },
  100: { name: "Light Salmon", rgb: "FEBABD" },
  110: { name: "Violet", rgb: "4354A3" },
  112: { name: "Medium Blue Violet", rgb: "6874CA" },
  114: { name: "Glitter Trans-Dark Pink", rgb: "DF6695" },
  115: { name: "Medium Lime", rgb: "C7D23C" },
  118: { name: "Aqua", rgb: "B3D7D1" },
  120: { name: "Light Lime", rgb: "D9E4A7" },
  125: { name: "Light Orange", rgb: "F9BA61" },
  128: { name: "Dark Nougat", rgb: "AD6140" },
  132: { name: "Speckle Black Silver", rgb: "000000" },
  133: { name: "Speckle Black Gold", rgb: "000000" },
  134: { name: "Copper", rgb: "964A27" },
  135: { name: "Pearl Sand Blue", rgb: "7988A1" },
  137: { name: "Metal Blue", rgb: "5677BA" },
  142: { name: "Pearl Gold", rgb: "AA7F2E" },
  148: { name: "Pearl Dark Gray", rgb: "575857" },
  150: { name: "Pearl Very Light Gray", rgb: "BBBDBC" },
  151: { name: "Very Light Bluish Gray", rgb: "E4E8E8" },
  152: { name: "Flat Dark Gold", rgb: "B48455" },
  153: { name: "Flat Silver", rgb: "898788" },
  154: { name: "Trans-Light Purple", rgb: "96709F" },
  155: { name: "Olive Green", rgb: "9B9A5A" },
  158: { name: "Sand Green", rgb: "A0BCAC" },
  168: { name: "Glitter Trans-Clear", rgb: "FCFCFC" },
  178: { name: "Flat Dark Gold", rgb: "B0A06F" },
  179: { name: "Flat Silver", rgb: "898788" },
  182: { name: "Trans-Orange", rgb: "F08F1C" },
  183: { name: "Pearl White", rgb: "F2F3F2" },
  191: { name: "Bright Light Orange", rgb: "F8BB3D" },
  212: { name: "Bright Light Blue", rgb: "9FC3E9" },
  226: { name: "Bright Light Yellow", rgb: "FFF03A" },
  232: { name: "Sky Blue", rgb: "7DBFDD" },
  268: { name: "Dark Purple", rgb: "3F3691" },
  272: { name: "Dark Blue", rgb: "0D325B" },
  288: { name: "Dark Green", rgb: "184632" },
  294: { name: "Glow In Dark Trans", rgb: "BDC6AD" },
  297: { name: "Pearl Gold", rgb: "CC9C2B" },
  308: { name: "Dark Brown", rgb: "352100" },
  320: { name: "Dark Red", rgb: "720E0F" },
  321: { name: "Dark Azure", rgb: "078BC9" },
  322: { name: "Medium Azure", rgb: "36AEBF" },
  323: { name: "Light Aqua", rgb: "ADC3C0" },
  326: { name: "Spring Yellowish Green", rgb: "E4FFB0" },
  330: { name: "Olive Green", rgb: "9B9A5A" },
  335: { name: "Sand Blue", rgb: "6074A1" },
  351: { name: "Medium Dark Flesh", rgb: "CC702A" },
  366: { name: "Earth Orange", rgb: "FA9C1C" },
  373: { name: "Sand Purple", rgb: "845E84" },
  378: { name: "Sand Green", rgb: "A0BCAC" },
  379: { name: "Sand Blue", rgb: "6074A1" },
  450: { name: "Fabuland Brown", rgb: "B67B50" },
  462: { name: "Medium Orange", rgb: "FFA70B" },
  484: { name: "Dark Orange", rgb: "A95500" },
  503: { name: "Very Light Gray", rgb: "E6E3DA" },
  1000: { name: "Glow In Dark White", rgb: "D4D5C9" },
  9999: { name: "[No Color/Unknown]", rgb: "CCCCCC" },
};

// Get part image URL using CDN (no API key needed for basic images)
export function getPartImageUrl(partNum: string, colorId: number): string {
  // Try LDraw render first (most consistent)
  return `${REBRICKABLE_CDN_URL}/parts/ldraw/${colorId}/${partNum}.png`;
}

// Get part image URL fallback (element-based)
export function getPartElementImageUrl(partNum: string): string {
  return `${REBRICKABLE_CDN_URL}/parts/elements/${partNum}.jpg`;
}

// Get color info from the map
export function getColorInfo(colorId: number): { name: string; rgb: string } {
  return COLOR_MAP[colorId] || { name: `Color ${colorId}`, rgb: "CCCCCC" };
}

// Fetch part details from Rebrickable API
export async function fetchPartDetails(partNum: string): Promise<RebrickablePart | null> {
  if (!REBRICKABLE_API_KEY) {
    console.warn("[Rebrickable] API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${REBRICKABLE_BASE_URL}/lego/parts/${partNum}/?key=${REBRICKABLE_API_KEY}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      console.error(`[Rebrickable] Failed to fetch part ${partNum}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Rebrickable] Error fetching part ${partNum}:`, error);
    return null;
  }
}

// Fetch part color details (includes specific color image)
export async function fetchPartColorDetails(
  partNum: string,
  colorId: number
): Promise<RebrickablePartColor | null> {
  if (!REBRICKABLE_API_KEY) {
    console.warn("[Rebrickable] API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${REBRICKABLE_BASE_URL}/lego/parts/${partNum}/colors/${colorId}/?key=${REBRICKABLE_API_KEY}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      console.error(`[Rebrickable] Failed to fetch part ${partNum} color ${colorId}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Rebrickable] Error fetching part color ${partNum}/${colorId}:`, error);
    return null;
  }
}

// Fetch color list
export async function fetchColors(): Promise<RebrickableColor[]> {
  if (!REBRICKABLE_API_KEY) {
    console.warn("[Rebrickable] API key not configured");
    return [];
  }

  try {
    const response = await fetch(
      `${REBRICKABLE_BASE_URL}/lego/colors/?key=${REBRICKABLE_API_KEY}&page_size=200`,
      { next: { revalidate: 86400 * 7 } } // Cache for 7 days
    );

    if (!response.ok) {
      console.error(`[Rebrickable] Failed to fetch colors: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`[Rebrickable] Error fetching colors:`, error);
    return [];
  }
}

// Parse CSV parts list and enrich with image URLs
export function parsePartsListCsv(csvContent: string): PartWithImage[] {
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

    parts.push({
      partNum,
      name: "", // Will be populated by API call if needed
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

// Enrich parts with names from API (batch operation)
export async function enrichPartsWithNames(parts: PartWithImage[]): Promise<PartWithImage[]> {
  if (!REBRICKABLE_API_KEY) {
    return parts;
  }

  const enrichedParts = await Promise.all(
    parts.map(async (part) => {
      const details = await fetchPartDetails(part.partNum);
      if (details) {
        return {
          ...part,
          name: details.name,
          imageUrl: details.part_img_url || part.imageUrl,
        };
      }
      return part;
    })
  );

  return enrichedParts;
}

// Generate parts list HTML for instructions
export function generatePartsListHtml(parts: PartWithImage[]): string {
  const sortedParts = [...parts].sort((a, b) => {
    // Sort by color, then by part number
    if (a.colorName !== b.colorName) {
      return a.colorName.localeCompare(b.colorName);
    }
    return a.partNum.localeCompare(b.partNum);
  });

  let html = `<div class="parts-list">
    <h2>Parts List</h2>
    <div class="parts-grid">`;

  for (const part of sortedParts) {
    if (part.isSpare) continue; // Skip spare parts
    
    html += `
      <div class="part-item" style="border-left: 4px solid #${part.colorRgb};">
        <div class="part-image">
          <img src="${part.imageUrl}" alt="${part.name || part.partNum}" 
               onerror="this.src='${getPartElementImageUrl(part.partNum)}'" />
        </div>
        <div class="part-info">
          <span class="part-num">${part.partNum}</span>
          <span class="part-name">${part.name || "Part"}</span>
          <span class="part-color">${part.colorName}</span>
          <span class="part-qty">×${part.quantity}</span>
        </div>
      </div>`;
  }

  html += `</div></div>`;
  return html;
}

// Type for MOC parts list storage
export type MocPartsList = {
  parts: PartWithImage[];
  totalParts: number;
  uniqueParts: number;
  lastUpdated: string;
  source: "rebrickable" | "manual" | "csv";
  rebrickableMocId?: string;
};
