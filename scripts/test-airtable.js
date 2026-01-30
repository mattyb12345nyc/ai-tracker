#!/usr/bin/env node
/**
 * Test Airtable integration: read Dashboard table and optionally filter by session_id.
 * Run from project root. Loads .env if present.
 *
 * Usage:
 *   node scripts/test-airtable.js
 *   node scripts/test-airtable.js <session_id>
 *
 * Requires AIRTABLE_API_KEY in .env or environment.
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load .env if present
if (existsSync(join(root, ".env"))) {
  const env = readFileSync(join(root, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = "appgSZR92pGCMlUOc";
const DASHBOARD_TABLE_ID = "tblheMjYJzu1f88Ft";
const RAW_TABLE_ID = "tblusxWUrocGCwUHb";

async function main() {
  if (!AIRTABLE_API_KEY) {
    console.error("Missing AIRTABLE_API_KEY. Set it in .env or run: AIRTABLE_API_KEY=xxx node scripts/test-airtable.js");
    process.exit(1);
  }

  const sessionId = process.argv[2];

  console.log("Airtable integration test");
  console.log("Base ID:", AIRTABLE_BASE_ID);
  console.log("Dashboard Table:", DASHBOARD_TABLE_ID);
  if (sessionId) console.log("Filter session_id:", sessionId);
  console.log("");

  // 1. List Dashboard records (1 or filter by session_id)
  const dashboardUrl = sessionId
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}?filterByFormula=${encodeURIComponent(`{session_id}="${sessionId}"`)}&maxRecords=1`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}?sort%5B0%5D%5Bfield%5D=report_date&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=3`;

  const dashRes = await fetch(dashboardUrl, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });

  if (!dashRes.ok) {
    console.error("Dashboard request failed:", dashRes.status, await dashRes.text());
    process.exit(1);
  }

  const dashJson = await dashRes.json();
  const records = dashJson.records || [];

  console.log("Dashboard table: OK");
  console.log("Records returned:", records.length);
  if (records.length > 0) {
    const r = records[0].fields;
    console.log("  Latest record:", {
      session_id: r.session_id,
      clerk_user_id: r.clerk_user_id ?? "(not set)",
      brand_name: r.brand_name,
      report_date: r.report_date,
      visibility_score: r.visibility_score,
    });
  }
  console.log("");

  // 2. List Raw Question Data (1 record to verify table access)
  const rawUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RAW_TABLE_ID}?maxRecords=1`;
  const rawRes = await fetch(rawUrl, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });

  if (!rawRes.ok) {
    console.error("Raw question data request failed:", rawRes.status, await rawRes.text());
    process.exit(1);
  }

  const rawJson = await rawRes.json();
  console.log("Raw question data table: OK");
  console.log("  (Sample count:", (rawJson.records || []).length, "record(s))");
  console.log("");

  console.log("Airtable integration: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
