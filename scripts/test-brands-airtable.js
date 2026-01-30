#!/usr/bin/env node
/**
 * Test Airtable Brands table integration (save-onboarding).
 * Run from project root. Loads .env if present.
 *
 * Usage:
 *   node scripts/test-brands-airtable.js
 *   node scripts/test-brands-airtable.js <table_id>   # use table_id if env not set
 *   node scripts/test-brands-airtable.js --delete      # delete the last created test record (by record id in output)
 *
 * Requires AIRTABLE_API_KEY and AIRTABLE_BRANDS_TABLE_ID in .env (or pass table_id as first arg).
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

if (existsSync(join(root, ".env"))) {
  const env = readFileSync(join(root, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "appgSZR92pGCMlUOc";
const AIRTABLE_BRANDS_TABLE_ID =
  process.env.AIRTABLE_BRANDS_TABLE_ID || process.argv[2];
const doDelete = process.argv.includes("--delete");
const tableIdArg = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : null;
const brandsTableId = process.env.AIRTABLE_BRANDS_TABLE_ID || tableIdArg;

async function main() {
  if (!AIRTABLE_API_KEY) {
    console.error(
      "Missing AIRTABLE_API_KEY. Set it in .env or run: AIRTABLE_API_KEY=xxx node scripts/test-brands-airtable.js"
    );
    process.exit(1);
  }

  if (!brandsTableId) {
    console.error(
      "Missing AIRTABLE_BRANDS_TABLE_ID. Either set it in .env or run:\n  node scripts/test-brands-airtable.js <your_brands_table_id>\n\nFind the table ID in Airtable: open the base → Brands table → URL contains the table id (tbl...)."
    );
    process.exit(1);
  }

  console.log("Airtable Brands table test");
  console.log("Base ID:", AIRTABLE_BASE_ID);
  console.log("Brands Table ID:", brandsTableId);
  console.log("");

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${brandsTableId}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  if (doDelete) {
    const recordId = process.argv[3];
    if (!recordId || !recordId.startsWith("rec")) {
      console.error("Usage for delete: node scripts/test-brands-airtable.js --delete <record_id>");
      process.exit(1);
    }
    const delRes = await fetch(`${url}/${recordId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!delRes.ok) {
      console.error("Delete failed:", delRes.status, await delRes.text());
      process.exit(1);
    }
    console.log("Deleted record:", recordId);
    return;
  }

  const now = new Date().toISOString();
  const testFields = {
    clerk_user_id: "test_user_brands_integration",
    brand_name: "Test Brand (integration)",
    brand_url: "https://example.com",
    business_goals: "Increase brand awareness, track competitor mentions, improve AI search rankings.",
    created_at: now,
  };

  console.log("Creating test record with fields (all long text):");
  console.log("  clerk_user_id:", testFields.clerk_user_id);
  console.log("  brand_name:", testFields.brand_name);
  console.log("  brand_url:", testFields.brand_url);
  console.log("  business_goals:", testFields.business_goals);
  console.log("  created_at:", testFields.created_at);
  console.log("");

  const createRes = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      records: [{ fields: testFields }],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error("Create failed:", createRes.status, errText);
    process.exit(1);
  }

  const data = await createRes.json();
  const record = data.records?.[0];
  if (!record?.id) {
    console.error("Unexpected response: no record id", data);
    process.exit(1);
  }

  console.log("Brands table: OK");
  console.log("  Created record ID:", record.id);
  console.log("  Fields stored:", record.fields);
  console.log("");
  console.log("To delete this test record:");
  console.log("  node scripts/test-brands-airtable.js", brandsTableId, "--delete", record.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
