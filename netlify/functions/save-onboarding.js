/**
 * Save paid onboarding data to Airtable (Brands + Tracked Questions) and update Clerk metadata.
 * Requires Airtable tables "Brands" and "Tracked Questions" with the documented fields.
 * Set AIRTABLE_BRANDS_TABLE_ID and AIRTABLE_TRACKED_QUESTIONS_TABLE_ID in Netlify (or .env).
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appgSZR92pGCMlUOc';
const AIRTABLE_BRANDS_TABLE_ID = process.env.AIRTABLE_BRANDS_TABLE_ID;
const AIRTABLE_TRACKED_QUESTIONS_TABLE_ID = process.env.AIRTABLE_TRACKED_QUESTIONS_TABLE_ID;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function updateClerkOnboarding(userId, brandName) {
  if (!CLERK_SECRET_KEY) {
    console.warn('CLERK_SECRET_KEY not set; skipping Clerk metadata update');
    return;
  }
  const getRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` }
  });
  if (!getRes.ok) {
    const err = await getRes.text();
    throw new Error(`Clerk GET user failed: ${getRes.status} ${err}`);
  }
  const user = await getRes.json();
  const currentPublic = user.public_metadata || {};
  const updated = {
    ...currentPublic,
    onboardingComplete: true,
    primaryBrand: brandName || currentPublic.primaryBrand
  };
  const patchRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ public_metadata: updated })
  });
  if (!patchRes.ok) {
    const err = await patchRes.text();
    throw new Error(`Clerk PATCH user failed: ${patchRes.status} ${err}`);
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
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

  if (!AIRTABLE_BRANDS_TABLE_ID || !AIRTABLE_TRACKED_QUESTIONS_TABLE_ID) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'AIRTABLE_BRANDS_TABLE_ID and AIRTABLE_TRACKED_QUESTIONS_TABLE_ID must be set. Create "Brands" and "Tracked Questions" tables in Airtable and add their table IDs to Netlify env.'
      })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      clerkUserId,
      brandName,
      brandUrl,
      businessGoals,
      selectedQuestions,
      plan
    } = body;

    if (!clerkUserId || !brandName) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'clerkUserId and brandName required' })
      };
    }

    const questions = Array.isArray(selectedQuestions)
      ? selectedQuestions.filter((q) => typeof q === 'string' && q.trim())
      : [];
    const createdAt = new Date().toISOString();
    const headers = {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // a) Create/update record in Brands table
    const brandFields = {
      clerk_user_id: String(clerkUserId),
      brand_name: String(brandName),
      brand_url: String(brandUrl || ''),
      business_goals: String(businessGoals || ''),
      created_at: createdAt
    };
    const brandRes = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_BRANDS_TABLE_ID}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          records: [{ fields: brandFields }]
        })
      }
    );
    if (!brandRes.ok) {
      const err = await brandRes.text();
      console.error('Airtable Brands create failed:', brandRes.status, err);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `Airtable Brands error: ${brandRes.status}`, details: err })
      };
    }

    // b) Create records in Tracked Questions table (one per question)
    let questionsCreated = 0;
    if (questions.length > 0) {
      const questionRecords = questions.map((question_text) => ({
        fields: {
          clerk_user_id: String(clerkUserId),
          brand_name: String(brandName),
          question_text: String(question_text).trim(),
          status: 'active',
          created_at: createdAt
        }
      }));
      const questionsRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TRACKED_QUESTIONS_TABLE_ID}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ records: questionRecords })
        }
      );
      if (!questionsRes.ok) {
        const err = await questionsRes.text();
        console.error('Airtable Tracked Questions create failed:', questionsRes.status, err);
        return {
          statusCode: 502,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: `Airtable Tracked Questions error: ${questionsRes.status}`, details: err })
        };
      }
      const questionsData = await questionsRes.json();
      questionsCreated = (questionsData.records || []).length;
    }

    // c) Update Clerk user metadata
    await updateClerkOnboarding(clerkUserId, brandName);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, questionsCreated })
    };
  } catch (err) {
    console.error('save-onboarding error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal error' })
    };
  }
};
