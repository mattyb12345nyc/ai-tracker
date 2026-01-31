/**
 * Fetch user's reports from Airtable Dashboard table.
 * Query param or body: clerk_user_id (required).
 * Returns only records where clerk_user_id matches; excludes other users' data.
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appgSZR92pGCMlUOc';
const DASHBOARD_TABLE_ID = 'tblheMjYJzu1f88Ft';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  if (!AIRTABLE_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'AIRTABLE_API_KEY not set' })
    };
  }

  try {
    const clerkUserId = event.queryStringParameters?.clerk_user_id ||
      (event.body ? JSON.parse(event.body)?.clerk_user_id : null);

    if (!clerkUserId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'clerk_user_id required' })
      };
    }

    const escaped = String(clerkUserId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const formula = `{clerk_user_id}="${escaped}"`;

    console.log('fetch-reports: clerk_user_id =', clerkUserId);
    console.log('fetch-reports: filterByFormula =', formula);

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}?filterByFormula=${encodeURIComponent(formula)}&sort%5B0%5D%5Bfield%5D=report_date&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=20`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('fetch-reports Airtable error:', res.status, err);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Airtable error: ${res.status}` })
      };
    }

    const json = await res.json();
    const records = json.records || [];
    console.log('fetch-reports: records found =', records.length);

    // Return only matching reports; never fall back to all reports when none match.
    const reports = records.map(record => ({
      id: record.id,
      session_id: record.fields.session_id,
      brand_name: record.fields.brand_name,
      report_date: record.fields.report_date,
      visibility_score: parseFloat(record.fields.visibility_score) || 0,
      brand_logo: record.fields.brand_logo || '',
      is_trial: record.fields.is_trial === true,
      question_count: record.fields.question_count != null ? Number(record.fields.question_count) : undefined,
      clerk_user_id: record.fields.clerk_user_id
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reports })
    };
  } catch (err) {
    console.error('fetch-reports error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal error' })
    };
  }
};
