import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-my-custom-header": "stash-site",
    },
  },
});

// Helper to ensure profiles table exists and handle schema cache issues
export async function ensureProfilesTable() {
  try {
    // Test query to check if profiles table is accessible
    const { error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .limit(1);
    
    if (error && error.message.includes("schema cache")) {
      console.error("[Supabase] Schema cache issue detected, table may not exist");
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Supabase] Error checking profiles table:", e);
    return false;
  }
}
