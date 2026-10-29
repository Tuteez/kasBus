// Read-only check that the Supabase schema matches what the app expects.
// Usage: npm run db:check  (reads .env.local)
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("✗ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing (.env.local).");
  process.exit(1);
}

const TABLES = {
  team: "id,name",
  events: "id,title,type,date_time,location,notes,created_at",
  attendance: "id,event_id,player_name,player_key,response,updated_at",
};

let failed = false;
for (const [table, columns] of Object.entries(TABLES)) {
  const res = await fetch(`${url}/rest/v1/${table}?select=${columns}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (res.ok) {
    const rows = await res.json();
    console.log(`✓ ${table}${table === "team" ? ` (${rows[0]?.name ?? "no row!"})` : ""}`);
    if (table === "team" && rows.length === 0) failed = true;
  } else {
    failed = true;
    const body = await res.json().catch(() => ({}));
    console.log(`✗ ${table}: HTTP ${res.status} ${body.code ?? ""} ${body.message ?? ""}`);
  }
}

if (failed) {
  console.error("\nRun supabase/schema.sql in Supabase Dashboard → SQL Editor, then re-run this check.");
  process.exit(1);
}
console.log("\nDatabase is ready.");
