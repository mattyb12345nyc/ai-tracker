/**
 * Get analysis status by session_id.
 * Returns { status: 'processing' | 'complete' } by checking Airtable Dashboard table.
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
    const sessionId = event.queryStringParameters?.session_id ||
      (event.body ? JSON.parse(event.body)?.session_id : null);
    if (!sessionId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'session_id required' })
      };
    }

    const escaped = String(sessionId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const formula = encodeURIComponent(`{session_id}="${escaped}"`);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DASHBOARD_TABLE_ID}?filterByFormula=${formula}&maxRecords=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('get-analysis-status Airtable error:', res.status, err);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Airtable error: ${res.status}` })
      };
    }

    const json = await res.json();
    const status = json.records && json.records.length > 0 ? 'complete' : 'processing';

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    };
  } catch (err) {
    console.error('get-analysis-status error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal error' })
    };
  }
};
