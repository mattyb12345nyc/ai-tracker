/**
 * Get user's tracked questions from Airtable (Tracked Questions table).
 * Returns questions where clerk_user_id matches and status = "active".
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appgSZR92pGCMlUOc';
const AIRTABLE_TRACKED_QUESTIONS_TABLE_ID = process.env.AIRTABLE_TRACKED_QUESTIONS_TABLE_ID;

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_TRACKED_QUESTIONS_TABLE_ID) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'AIRTABLE_API_KEY or AIRTABLE_TRACKED_QUESTIONS_TABLE_ID not set' })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const clerkUserId = body.clerkUserId || (event.queryStringParameters && event.queryStringParameters.clerkUserId);
    if (!clerkUserId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'clerkUserId required' })
      };
    }

    const formula = `AND({clerk_user_id}="${String(clerkUserId).replace(/"/g, '\\"')}", {status}="active")`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TRACKED_QUESTIONS_TABLE_ID}?filterByFormula=${encodeURIComponent(formula)}&sort%5B0%5D%5Bfield%5D=created_at&sort%5B0%5D%5Bdirection%5D=asc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Airtable get-tracked-questions error:', res.status, err);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Airtable error: ${res.status}`, details: err })
      };
    }

    const json = await res.json();
    const questions = (json.records || []).map((record) => ({
      id: record.id,
      question_text: record.fields.question_text || '',
      brand_name: record.fields.brand_name || '',
      status: record.fields.status || 'active',
      created_at: record.fields.created_at
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questions })
    };
  } catch (err) {
    console.error('get-tracked-questions error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal error' })
    };
  }
};
