import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigration() {
  console.log("Running migration to add pdf_url and instruction_images columns...");
  
  const sql = `
    ALTER TABLE mocs ADD COLUMN IF NOT EXISTS pdf_url TEXT;
    ALTER TABLE mocs ADD COLUMN IF NOT EXISTS instruction_images JSONB DEFAULT '[]';
  `;
  
  // Try using the REST API with service role key
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseServiceKey,
      "Authorization": `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ sql }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.log("REST API approach failed:", text);
    console.log("\nPlease run this SQL manually in your Supabase Dashboard SQL Editor:");
    console.log("---");
    console.log(sql);
    console.log("---");
    console.log("\nAfter running the SQL, run: npx tsx scripts/seed-jay-raider-mech.ts");
  } else {
    console.log("Migration completed successfully!");
  }
}

runMigration();
