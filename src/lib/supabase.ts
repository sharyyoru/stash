import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (for admin operations)
export function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(supabaseUrl, serviceRoleKey);
}

// Upload image to custom-img bucket
export async function uploadCustomImage(
  file: File,
  productId: string,
  orderId?: string
): Promise<{ url: string; path: string } | null> {
  try {
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${productId}_${orderId || "temp"}_${timestamp}.${ext}`;
    const filePath = `customizations/${fileName}`;

    const { data, error } = await supabase.storage
      .from("custom-img")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading custom image:", error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("custom-img")
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error("Error in uploadCustomImage:", error);
    return null;
  }
}
