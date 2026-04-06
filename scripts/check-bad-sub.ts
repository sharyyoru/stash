import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data } = await supabase
    .from("secret_stash_subscriptions")
    .select("id, user_email, user_name, status, current_period_start, current_period_end")
    .eq("id", "sub_1TAx9v1qJ0GuI3TsOx8YYREm")
    .single();
  
  console.log("Subscription with bad dates:");
  console.log(data);
  
  // This subscription doesn't exist in Stripe - mark as cancelled and fix dates
  if (data && new Date(data.current_period_start).getFullYear() < 2020) {
    console.log("\nThis subscription has 1970 dates and doesn't exist in Stripe.");
    console.log("Marking as cancelled and fixing dates...");
    
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("secret_stash_subscriptions")
      .update({
        status: "cancelled",
        current_period_start: now,
        current_period_end: now,
        updated_at: now,
      })
      .eq("id", data.id);
    
    if (error) {
      console.log("Error:", error.message);
    } else {
      console.log("✅ Done - marked as cancelled with current date");
    }
  }
}

check();
