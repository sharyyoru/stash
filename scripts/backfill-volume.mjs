import { config } from "dotenv";
config({ path: ".env.local" });

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Build a map of subscriptionId -> { id, title } from a metadata object
function readVolume(metadata) {
  if (!metadata) return null;
  const id = metadata.startingVolumeId || null;
  const title = metadata.startingVolumeTitle || null;
  if (!id && !title) return null;
  return { id, title };
}

async function buildSessionMap() {
  // subscriptionId -> volume (from checkout session metadata)
  const map = new Map();
  let startingAfter;
  // Paginate through all checkout sessions
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await stripe.checkout.sessions.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const cs of page.data) {
      if (!cs.subscription) continue;
      const vol = readVolume(cs.metadata);
      if (vol && !map.has(cs.subscription)) map.set(cs.subscription, vol);
    }
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return map;
}

async function main() {
  console.log(APPLY ? "=== BACKFILL (APPLY) ===" : "=== BACKFILL (DRY RUN) ===");

  // 1. Get DB rows missing volume
  const { data: rows, error } = await supabase
    .from("secret_stash_subscriptions")
    .select("id, user_email, starting_volume_id, starting_volume_title")
    .or("starting_volume_id.is.null,starting_volume_title.is.null");

  if (error) {
    console.error("DB read error:", error.message);
    process.exit(1);
  }

  console.log(`Rows missing volume: ${rows.length}`);

  // 2. Build session map for fallback
  const sessionMap = await buildSessionMap();

  let resolved = 0;
  let updated = 0;
  const unresolved = [];

  for (const row of rows) {
    let vol = null;

    // Prefer subscription metadata (set via subscription_data.metadata)
    try {
      const sub = await stripe.subscriptions.retrieve(row.id);
      vol = readVolume(sub.metadata);
    } catch {
      // subscription may no longer exist in Stripe
    }

    // Fallback to checkout session metadata
    if (!vol && sessionMap.has(row.id)) {
      vol = sessionMap.get(row.id);
    }

    if (!vol) {
      unresolved.push(row.id);
      continue;
    }

    resolved++;
    console.log(
      `${row.id}  ${row.user_email}  ->  ${vol.title || vol.id}`
    );

    if (APPLY) {
      const { error: upErr } = await supabase
        .from("secret_stash_subscriptions")
        .update({
          starting_volume_id: vol.id,
          starting_volume_title: vol.title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (upErr) console.error(`  ! update failed: ${upErr.message}`);
      else updated++;
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Resolved from Stripe: ${resolved}`);
  console.log(`Updated in DB:        ${APPLY ? updated : "(dry run, 0)"}`);
  console.log(`Unresolved (no metadata in Stripe): ${unresolved.length}`);
  if (unresolved.length) console.log("Unresolved IDs:", unresolved.join(", "));
  if (!APPLY) console.log("\nRun again with --apply to write changes.");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
