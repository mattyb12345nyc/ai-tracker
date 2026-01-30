#!/usr/bin/env node
/**
 * Test Airtable Tracked Questions table integration (save-onboarding).
 * Run from project root. Loads .env if present.
 *
 * Usage:
 *   node scripts/test-tracked-questions-airtable.js
 *   node scripts/test-tracked-questions-airtable.js <table_id>   # use table_id if env not set
 *
 * Requires AIRTABLE_API_KEY and AIRTABLE_TRACKED_QUESTIONS_TABLE_ID in .env (or pass table_id as first arg).
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
const tableIdArg =
  process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
const trackedQuestionsTableId =
  process.env.AIRTABLE_TRACKED_QUESTIONS_TABLE_ID || tableIdArg;

async function main() {
  if (!AIRTABLE_API_KEY) {
    console.error(
      "Missing AIRTABLE_API_KEY. Set it in .env or run: AIRTABLE_API_KEY=xxx node scripts/test-tracked-questions-airtable.js"
    );
    process.exit(1);
  }

  if (!trackedQuestionsTableId) {
    console.error(
      "Missing AIRTABLE_TRACKED_QUESTIONS_TABLE_ID. Either set it in .env or run:\n  node scripts/test-tracked-questions-airtable.js <your_table_id>\n\nTable ID is in the Airtable URL (tbl...)."
    );
    process.exit(1);
  }

  console.log("Airtable Tracked Questions table test");
  console.log("Base ID:", AIRTABLE_BASE_ID);
  console.log("Tracked Questions Table ID:", trackedQuestionsTableId);
  console.log("");

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${trackedQuestionsTableId}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const now = new Date().toISOString();
  const testRecords = [
    {
      clerk_user_id: "test_user_tracked_questions",
      brand_name: "Test Brand",
      question_text: "What are the best luxury handbags for everyday use?",
      status: "active",
      created_at: now,
    },
    {
      clerk_user_id: "test_user_tracked_questions",
      brand_name: "Test Brand",
      question_text: "What designer brands do you recommend for professional women?",
      status: "active",
      created_at: now,
    },
    {
      clerk_user_id: "test_user_tracked_questions",
      brand_name: "Test Brand",
      question_text: "Top 5 handbag brands for quality and style?",
      status: "active",
      created_at: now,
    },
  ].map((fields) => ({ fields }));

  console.log("Creating", testRecords.length, "test question records (all long text):");
  testRecords.forEach((r, i) => {
    console.log("  ", i + 1, r.fields.question_text);
  });
  console.log("");

  const createRes = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ records: testRecords }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error("Create failed:", createRes.status, errText);
    process.exit(1);
  }

  const data = await createRes.json();
  const records = data.records || [];
  console.log("Tracked Questions table: OK");
  console.log("  Created", records.length, "record(s)");
  records.forEach((rec, i) => {
    console.log("    ", rec.id, "—", rec.fields?.question_text?.slice(0, 50) + "...");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
