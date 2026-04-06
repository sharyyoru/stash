import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey);

async function fixSubscriptionDates() {
  console.log("🔄 Fetching subscriptions from database...\n");

  // Get all subscriptions from our database
  const { data: dbSubscriptions, error: dbError } = await supabase
    .from("secret_stash_subscriptions")
    .select("*");

  if (dbError) {
    console.error("❌ Failed to fetch subscriptions:", dbError.message);
    process.exit(1);
  }

  console.log(`Found ${dbSubscriptions?.length || 0} subscriptions\n`);

  const epochDate = "1970-01-01";
  let fixed = 0;
  let errors = 0;
  let alreadyOk = 0;

  for (const dbSub of dbSubscriptions || []) {
    const periodStart = dbSub.current_period_start?.split("T")[0];
    const periodEnd = dbSub.current_period_end?.split("T")[0];

    // Check if dates are epoch (1970-01-01) or missing or before 2020
    const needsFix =
      !periodStart ||
      !periodEnd ||
      periodStart === epochDate ||
      periodEnd === epochDate ||
      new Date(dbSub.current_period_start).getFullYear() < 2020 ||
      new Date(dbSub.current_period_end).getFullYear() < 2020;

    if (needsFix) {
      try {
        console.log(`🔧 Fixing: ${dbSub.id} (${dbSub.user_email})`);
        console.log(`   Old dates: ${periodStart} → ${periodEnd}`);

        // Fetch fresh data from Stripe
        const stripeSub = (await stripe.subscriptions.retrieve(dbSub.id)) as any;

        if (stripeSub && stripeSub.current_period_start && stripeSub.current_period_end) {
          const newPeriodStart = new Date(stripeSub.current_period_start * 1000).toISOString();
          const newPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

          // Update in database
          const { error: updateError } = await supabase
            .from("secret_stash_subscriptions")
            .update({
              current_period_start: newPeriodStart,
              current_period_end: newPeriodEnd,
              status: stripeSub.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", dbSub.id);

          if (updateError) {
            console.log(`   ❌ Error: ${updateError.message}`);
            errors++;
          } else {
            console.log(`   ✅ Fixed: ${newPeriodStart.split("T")[0]} → ${newPeriodEnd.split("T")[0]}`);
            fixed++;
          }
        } else {
          console.log(`   ⚠️  Skipped: Stripe subscription not found or missing period data`);
          errors++;
        }
      } catch (stripeError: any) {
        console.log(`   ❌ Error: ${stripeError.message}`);
        errors++;
      }
    } else {
      alreadyOk++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log(`   Total: ${dbSubscriptions?.length || 0}`);
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ✓ Already OK: ${alreadyOk}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log("=".repeat(50));
}

fixSubscriptionDates()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
