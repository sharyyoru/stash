import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumns() {
  console.log("Adding pdf_url and instruction_images columns to mocs table...");
  
  // Try to add pdf_url column
  const { error: error1 } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE mocs ADD COLUMN IF NOT EXISTS pdf_url TEXT;"
  });
  
  if (error1) {
    console.log("Note: pdf_url column may already exist or RPC not available:", error1.message);
  } else {
    console.log("Added pdf_url column");
  }
  
  // Try to add instruction_images column
  const { error: error2 } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE mocs ADD COLUMN IF NOT EXISTS instruction_images JSONB DEFAULT '[]'::jsonb;"
  });
  
  if (error2) {
    console.log("Note: instruction_images column may already exist or RPC not available:", error2.message);
  } else {
    console.log("Added instruction_images column");
  }
  
  console.log("Done! You may need to add these columns manually via Supabase dashboard if RPC is not available.");
}

addColumns();
