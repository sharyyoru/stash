import "dotenv/config";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Load .env.local explicitly
import { config } from "dotenv";
config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log("=== STRIPE: latest 10 subscriptions metadata ===");
  const subs = await stripe.subscriptions.list({ limit: 10 });
  for (const s of subs.data) {
    console.log(
      JSON.stringify({
        id: s.id,
        status: s.status,
        created: new Date(s.created * 1000).toISOString(),
        metadata: s.metadata,
      })
    );
  }

  console.log("\n=== STRIPE: latest 10 checkout sessions metadata ===");
  const sessions = await stripe.checkout.sessions.list({ limit: 10 });
  for (const cs of sessions.data) {
    console.log(
      JSON.stringify({
        id: cs.id,
        mode: cs.mode,
        created: new Date(cs.created * 1000).toISOString(),
        subscription: cs.subscription,
        metadata: cs.metadata,
      })
    );
  }

  console.log("\n=== SUPABASE: latest 10 subscription rows (volume cols) ===");
  const { data, error } = await supabase
    .from("secret_stash_subscriptions")
    .select("id, user_email, created_at, starting_volume_id, starting_volume_title")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) {
    console.log("DB ERROR:", error.message);
    console.log("(If the error mentions a column not existing, migration 008 was never applied.)");
  } else {
    for (const r of data) console.log(JSON.stringify(r));
  }
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
