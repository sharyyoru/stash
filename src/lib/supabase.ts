import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

// Client-side Supabase client (uses anon key)
// Only create if URL is available to prevent crashes
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key not configured");
    return null;
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

// Server-side Supabase client with service role (for admin operations)
export function getServiceSupabase(): SupabaseClient | null {
  if (!supabaseUrl) {
    console.warn("Supabase URL not configured");
    return null;
  }
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!serviceRoleKey) {
    console.warn("Supabase Service Role Key not configured");
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

export { getSupabaseClient as supabase };

// Upload image to custom-img bucket
export async function uploadCustomImage(
  file: File,
  productId: string,
  orderId?: string
): Promise<{ url: string; path: string } | null> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.error("Supabase client not available - missing environment variables");
      return null;
    }

    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${productId}_${orderId || "temp"}_${timestamp}.${ext}`;
    const filePath = `customizations/${fileName}`;

    const { data, error } = await client.storage
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
    const { data: urlData } = client.storage
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
