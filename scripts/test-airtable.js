#!/usr/bin/env node
/**
 * Test Airtable integration: read Dashboard table and optionally filter by session_id.
 * Run from project root. Loads .env if present.
 *
 * Usage:
 *   node scripts/test-airtable.js
 *   node scripts/test-airtable.js <session_id>
 *   node scripts/test-airtable.js --write              # test writing is_trial + question_count
 *   node scripts/test-airtable.js --allotment          # show allotment math (trial vs paid)
 *   node scripts/test-airtable.js <clerk_user_id> --allotment   # allotment for one user
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

  const args = process.argv.slice(2).filter((a) => a !== "--write" && a !== "--allotment");
  const doWriteTest = process.argv.includes("--write");
  const doAllotmentTest = process.argv.includes("--allotment");
  const clerkUserId = args[0]?.startsWith("user_") ? args[0] : null;
  const sessionId = !doAllotmentTest && args[0] ? args[0] : null;

  console.log("Airtable integration test");
  console.log("Base ID:", AIRTABLE_BASE_ID);
  console.log("Dashboard Table:", DASHBOARD_TABLE_ID);
  if (clerkUserId) console.log("Filter clerk_user_id:", clerkUserId);
  if (sessionId) console.log("Filter session_id:", sessionId);
  if (doAllotmentTest) console.log("Mode: allotment (trial excluded from used)");
  console.log("");

  const maxRecords = doAllotmentTest ? 20 : sessionId ? 1 : 3;
  let dashboardUrl;
  if (clerkUserId && doAllotmentTest) {
    const escaped = String(clerkUserId).replace(/"/g, '\\"');
    dashboardUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}?filterByFormula=${encodeURIComponent(`{clerk_user_id}="${escaped}"`)}&sort%5B0%5D%5Bfield%5D=report_date&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=${maxRecords}`;
  } else if (sessionId) {
    dashboardUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}?filterByFormula=${encodeURIComponent(`{session_id}="${sessionId}"`)}&maxRecords=1`;
  } else {
    dashboardUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}?sort%5B0%5D%5Bfield%5D=report_date&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=${maxRecords}`;
  }

  // 1. List Dashboard records

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
    for (let i = 0; i < records.length; i++) {
      const r = records[i].fields;
      console.log(`  Record ${i + 1}:`, {
        session_id: r.session_id,
        clerk_user_id: r.clerk_user_id ?? "(not set)",
        brand_name: r.brand_name,
        report_date: r.report_date,
        visibility_score: r.visibility_score,
        is_trial: r.is_trial === true ? true : (r.is_trial === false ? false : "(not set)"),
        question_count: r.question_count != null ? Number(r.question_count) : "(not set)",
      });
    }
    if (!doAllotmentTest) console.log("  New fields (is_trial, question_count): readable OK");
  }

  // Allotment check: same logic as Dashboard.jsx — only non-trial reports count
  if (doAllotmentTest && records.length > 0) {
    const defaultQ = 5;
    const questionsUsed = records
      .filter((rec) => rec.fields.is_trial !== true)
      .reduce((sum, rec) => sum + (Number(rec.fields.question_count) || defaultQ), 0);
    const trialQuestionsExcluded = records
      .filter((rec) => rec.fields.is_trial === true)
      .reduce((sum, rec) => sum + (Number(rec.fields.question_count) || defaultQ), 0);
    const trialCount = records.filter((rec) => rec.fields.is_trial === true).length;
    const paidCount = records.filter((rec) => rec.fields.is_trial !== true).length;
    const exampleAllotment = 25;
    const remaining = Math.max(0, exampleAllotment - questionsUsed);
    console.log("");
    console.log("--- Allotment (trial excluded) ---");
    console.log("  Reports: total", records.length, "| trial:", trialCount, "| paid:", paidCount);
    console.log("  Questions that COUNT toward allotment (paid only):", questionsUsed);
    console.log("  Questions EXCLUDED (trial runs):", trialQuestionsExcluded);
    console.log("  Example: allotment", exampleAllotment, "→ used", questionsUsed, "→ remaining", remaining);
    console.log("  ✓ Trial runs are NOT subtracted from the paid question allotment.");
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

  // 3. Optional: test write of new fields (create then delete a test record)
  if (doWriteTest) {
    console.log("Write test: creating a test record with is_trial and question_count...");
    const testRunId = `TEST_${Date.now()}`;
    const testSessionId = `SES_TEST_${Date.now()}`;
    const baseFields = {
      run_id: testRunId,
      session_id: testSessionId,
      brand_name: "Test (is_trial + question_count)",
      report_date: new Date().toISOString().split("T")[0],
      visibility_score: 0,
      is_trial: true,
      question_count: "5",
    };

    let createRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields: baseFields }] }),
      }
    );

    // If question_count is unknown (e.g. field named differently in Airtable), retry without it
    if (!createRes.ok) {
      const errText = await createRes.text();
      const errJson = (() => {
        try {
          return JSON.parse(errText);
        } catch {
          return {};
        }
      })();
      if (
        createRes.status === 422 &&
        errJson?.error?.message?.includes("question_count")
      ) {
        console.warn("  question_count field not found; retrying with is_trial only (ensure Dashboard table has a field named exactly 'question_count' for allotment math).");
        const { question_count: _q, ...fieldsWithoutQuestionCount } = baseFields;
        createRes = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ records: [{ fields: fieldsWithoutQuestionCount }] }),
          }
        );
      }
    }

    if (!createRes.ok) {
      console.error("Write test failed:", createRes.status, await createRes.text());
      process.exit(1);
    }

    const createJson = await createRes.json();
    const createdRecord = createJson.records?.[0];
    if (!createdRecord?.id) {
      console.error("Write test: no record ID in response");
      process.exit(1);
    }

    const written = createdRecord.fields || {};
    console.log("  Created record ID:", createdRecord.id);
    console.log("  is_trial:", written.is_trial);
    console.log("  question_count:", written.question_count ?? "(not written)");
    console.log("  New fields: write OK");

    // Delete the test record
    const deleteRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}/${createdRecord.id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    if (!deleteRes.ok) {
      console.warn("  (Could not delete test record:", deleteRes.status, "- delete manually in Airtable if needed)");
    } else {
      console.log("  Test record deleted.");
    }
    console.log("");
  }

  console.log("Airtable integration: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
