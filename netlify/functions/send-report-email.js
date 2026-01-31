/**
 * Send "report ready" email to paid user.
 * Fetches email from Clerk by clerk_user_id, sends via SendGrid.
 * Link: https://ai.futureproof.work/dashboard?report=SESSION_ID
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

const DASHBOARD_REPORT_URL = 'https://ai.futureproof.work/dashboard?report=';
const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

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

  if (!SENDGRID_API_KEY || !CLERK_SECRET_KEY) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'SENDGRID_API_KEY or CLERK_SECRET_KEY not set' })
    };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const { session_id: sessionId, clerk_user_id: clerkUserId, brand_name: brandName, visibility_score: visibilityScore } = body;

    if (!sessionId || !clerkUserId || !brandName) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'session_id, clerk_user_id, and brand_name required' })
      };
    }

    const score = Number(visibilityScore) || 0;
    const viewUrl = `${DASHBOARD_REPORT_URL}${encodeURIComponent(sessionId)}`;

    const clerkRes = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(clerkUserId)}`, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!clerkRes.ok) {
      const errText = await clerkRes.text();
      console.error('Clerk user fetch error:', clerkRes.status, errText);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Could not fetch user from Clerk' })
      };
    }

    const user = await clerkRes.json();
    const email = user.primary_email_address_id
      ? (user.email_addresses || []).find(e => e.id === user.primary_email_address_id)?.email_address
      : (user.email_addresses || [])[0]?.email_address;

    if (!email) {
      console.error('No email for Clerk user:', clerkUserId);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'User has no email address' })
      };
    }

    const summary = `${brandName} has a visibility score of ${score}. View your full report for platform breakdown, competitor analysis, and recommendations.`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#0f0f14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#0f0f14; color:#ffffff; padding:32px; border-radius:16px;">
    <div style="text-align:center; margin-bottom:32px;">
      <img src="${FUTUREPROOF_LOGO}" alt="FutureProof" style="height:32px; margin-bottom:16px;" />
      <h1 style="color:#ffffff; margin:0; font-size:24px;">Your AI Visibility Report is Ready</h1>
    </div>
    <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,122,61,0.3); border-radius:12px; padding:24px; margin-bottom:24px;">
      <p style="color:#ffffff; font-size:16px; line-height:1.6; margin:0;">${summary}</p>
    </div>
    <div style="text-align:center; margin-bottom:24px;">
      <div style="display:inline-block; margin-bottom:16px; padding:16px 24px; background:linear-gradient(135deg, rgba(255,122,61,0.2), rgba(139,92,246,0.2)); border-radius:12px; border:1px solid rgba(255,122,61,0.4);">
        <div style="font-size:32px; font-weight:700; color:#ff7a3d;">${score}</div>
        <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.6);">Visibility Score</div>
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${viewUrl}" style="display:inline-block; padding:14px 28px; background:linear-gradient(90deg, #ff7a3d, #ff6b4a); color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; border-radius:12px; box-shadow:0 4px 14px rgba(255,107,74,0.3);">View Full Report</a>
    </div>
    <p style="text-align:center; margin-top:24px; font-size:12px; color:rgba(255,255,255,0.5);">AI Visibility Intelligence Platform</p>
  </div>
</body>
</html>`;

    const emailPayload = {
      personalizations: [{ to: [{ email }] }],
      from: { email: 'ai-ready@futureproof.work', name: 'FutureProof AI' },
      subject: `Your AI Visibility Report for ${brandName} is Ready`,
      content: [{ type: 'text/html', value: html }]
    };

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SENDGRID_API_KEY}`
      },
      body: JSON.stringify(emailPayload)
    });

    if (!sgRes.ok) {
      const errText = await sgRes.text();
      console.error('SendGrid error:', sgRes.status, errText);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Failed to send email' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true, sent_to: email })
    };
  } catch (err) {
    console.error('send-report-email error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal error' })
    };
  }
};
