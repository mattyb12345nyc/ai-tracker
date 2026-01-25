// API Keys from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const AIRTABLE_BASE_ID = "appgSZR92pGCMlUOc";
const SITE_URL = process.env.URL || "https://ai-tracker.netlify.app";

// Query ChatGPT
async function queryChatGPT(question) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: question }],
        max_tokens: 2048,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
    return `Error: ${response.status}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Query Claude
async function queryClaude(question) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: question }],
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.content[0].text;
    }
    return `Error: ${response.status}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Query Gemini
async function queryGemini(question) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }],
        }),
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
    return `Error: ${response.status}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Query Perplexity
async function queryPerplexity(question) {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [{ role: "user", content: question }],
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
    return `Error: ${response.status}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Analyze responses using Claude
async function analyzeResponses(brandName, keyMessages, competitors, question, responses) {
  const prompt = `You are analyzing AI responses for brand visibility.
BRAND: ${brandName}
KEY MESSAGES: ${keyMessages.join(", ")}
COMPETITORS: ${competitors.join(", ")}
QUESTION: ${question}
RESPONSES:
ChatGPT: ${responses.chatgpt}
Claude: ${responses.claude}
Gemini: ${responses.gemini}
Perplexity: ${responses.perplexity}

Score each response (0-100) on:
- mention: Was the brand mentioned? (0=no, 100=yes prominently)
- position: Where was brand positioned? (100=first, 75=second, 50=mentioned, 0=absent)
- sentiment: How positive? (0=negative, 50=neutral, 100=positive)
- recommendation: Was it recommended? (0=no, 100=explicitly recommended)
- message_alignment: Did it reflect key messages? (0-100)
- overall: Weighted average

Return ONLY valid JSON:
{
  "chatgpt": {"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":""},
  "claude": {"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":""},
  "gemini": {"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":""},
  "perplexity": {"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":""}
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    let raw = data.content[0].text;
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("Analysis error:", error);
    return {
      chatgpt: { mention: 0, position: 0, sentiment: 0, recommendation: 0, message_alignment: 0, overall: 0, competitors_mentioned: "", notes: "" },
      claude: { mention: 0, position: 0, sentiment: 0, recommendation: 0, message_alignment: 0, overall: 0, competitors_mentioned: "", notes: "" },
      gemini: { mention: 0, position: 0, sentiment: 0, recommendation: 0, message_alignment: 0, overall: 0, competitors_mentioned: "", notes: "" },
      perplexity: { mention: 0, position: 0, sentiment: 0, recommendation: 0, message_alignment: 0, overall: 0, competitors_mentioned: "", notes: "" },
    };
  }
}

// Save results to Airtable Raw Question Data table
async function saveToAirtable(results, sessionId) {
  const tableName = "raw question data";
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const createdRecords = [];

  // Airtable accepts max 10 records per request
  for (let i = 0; i < results.length; i += 10) {
    const batch = results.slice(i, i + 10);
    const records = batch.map((r, idx) => {
      const analysis = r.analysis || {};
      return {
        fields: {
          session_id: sessionId,
          run_id: r.run_id || "",
          customer_id: r.customer_id || "",
          question_number: i + idx + 1,
          question_text: r.question_text || "",
          question_category: r.question_category || "",
          analyzed_at: r.run_date || "",
          chatgpt_response: r.chatgpt_response || "",
          claude_response: r.claude_response || "",
          gemini_response: r.gemini_response || "",
          perplexity_response: r.perplexity_response || "",
          chatgpt_mention: analysis.chatgpt?.mention || 0,
          chatgpt_position: analysis.chatgpt?.position || 0,
          chatgpt_sentiment: analysis.chatgpt?.sentiment || 0,
          chatgpt_recommendation: analysis.chatgpt?.recommendation || 0,
          chatgpt_message_alignment: analysis.chatgpt?.message_alignment || 0,
          chatgpt_overall: analysis.chatgpt?.overall || 0,
          chatgpt_notes: analysis.chatgpt?.notes || "",
          claude_mention: analysis.claude?.mention || 0,
          claude_position: analysis.claude?.position || 0,
          claude_sentiment: analysis.claude?.sentiment || 0,
          claude_recommendation: analysis.claude?.recommendation || 0,
          claude_message_alignment: analysis.claude?.message_alignment || 0,
          claude_overall: analysis.claude?.overall || 0,
          claude_notes: analysis.claude?.notes || "",
          gemini_mention: analysis.gemini?.mention || 0,
          gemini_position: analysis.gemini?.position || 0,
          gemini_sentiment: analysis.gemini?.sentiment || 0,
          gemini_recommendation: analysis.gemini?.recommendation || 0,
          gemini_message_alignment: analysis.gemini?.message_alignment || 0,
          gemini_overall: analysis.gemini?.overall || 0,
          gemini_notes: analysis.gemini?.notes || "",
          perplexity_mention: analysis.perplexity?.mention || 0,
          perplexity_position: analysis.perplexity?.position || 0,
          perplexity_sentiment: analysis.perplexity?.sentiment || 0,
          perplexity_recommendation: analysis.perplexity?.recommendation || 0,
          perplexity_message_alignment: analysis.perplexity?.message_alignment || 0,
          perplexity_overall: analysis.perplexity?.overall || 0,
          perplexity_notes: analysis.perplexity?.notes || "",
        },
      };
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ records }),
      });
      if (response.ok) {
        const data = await response.json();
        createdRecords.push(...(data.records || []));
      } else {
        const errorBody = await response.text();
        console.error(`Airtable error: ${response.status} - ${errorBody}`);
        console.error(`Token prefix: ${AIRTABLE_API_KEY?.substring(0, 10)}...`);
      }
    } catch (error) {
      console.error("Airtable save error:", error);
    }
  }

  return createdRecords;
}

// Analyze aggregated run data
function analyzeRunData(results, brandName, validCompetitors, industry) {
  const avg = (nums) => {
    const valid = nums.filter((n) => typeof n === "number" && n <= 100);
    return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : 0;
  };

  const avgNonzero = (nums) => {
    const valid = nums.filter((n) => typeof n === "number" && n > 0 && n <= 100);
    return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : 0;
  };

  brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  const numQuestions = results.length;
  const platforms = ["chatgpt", "claude", "gemini", "perplexity"];
  const platformNames = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" };

  const platformData = {};
  for (const p of platforms) {
    platformData[p] = { mention: [], position: [], sentiment: [], recommendation: [], message_alignment: [], overall: [], competitors_mentioned: [] };
  }

  for (const r of results) {
    const analysis = r.analysis || {};
    for (const p of platforms) {
      const pAnalysis = analysis[p] || {};
      platformData[p].mention.push(pAnalysis.mention || 0);
      platformData[p].position.push(pAnalysis.position || 0);
      platformData[p].sentiment.push(pAnalysis.sentiment || 0);
      platformData[p].recommendation.push(Math.min(pAnalysis.recommendation || 0, 100));
      platformData[p].message_alignment.push(pAnalysis.message_alignment || 0);
      platformData[p].overall.push(pAnalysis.overall || 0);
      platformData[p].competitors_mentioned.push(pAnalysis.competitors_mentioned || "");
    }
  }

  // Count brand mentions
  const brandMentionCounts = {};
  const brandMentionedPerQuestion = [];

  for (let i = 0; i < numQuestions; i++) {
    let questionBrandMentioned = false;
    for (const p of platforms) {
      if (platformData[p].mention[i] > 0) {
        questionBrandMentioned = true;
        brandMentionCounts[brandName] = (brandMentionCounts[brandName] || 0) + 1;
      }
    }
    brandMentionedPerQuestion.push(questionBrandMentioned);
  }

  const brandAppearedCount = brandMentionedPerQuestion.filter((m) => m).length;
  const brandCoverage = numQuestions > 0 ? Math.round((brandAppearedCount / numQuestions) * 1000) / 10 : 0;

  // Brand rankings
  const totalMentions = Object.values(brandMentionCounts).reduce((a, b) => a + b, 0);
  const brandRankings = [];
  for (const [brand, count] of Object.entries(brandMentionCounts)) {
    const sov = totalMentions > 0 ? Math.round((count / totalMentions) * 1000) / 10 : 0;
    const isTracked = brand.toLowerCase() === brandName.toLowerCase();
    brandRankings.push({ brand, mentions: count, share_of_voice: sov, is_tracked_brand: isTracked });
  }
  brandRankings.sort((a, b) => b.mentions - a.mentions);

  let brandRank = null;
  let brandSov = 0;
  for (let i = 0; i < brandRankings.length; i++) {
    if (brandRankings[i].is_tracked_brand) {
      brandRank = i + 1;
      brandSov = brandRankings[i].share_of_voice;
      break;
    }
  }

  // Platform metrics
  const platformsSummary = {};
  for (const p of platforms) {
    platformsSummary[p] = {
      score: avg(platformData[p].overall),
      mention: avg(platformData[p].mention),
      sentiment: avgNonzero(platformData[p].sentiment),
      recommendation: avg(platformData[p].recommendation),
    };
  }

  const allScores = platforms.map((p) => platformsSummary[p].score);
  const overallScore = allScores.length ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0;

  const sortedPlatforms = Object.entries(platformsSummary).sort((a, b) => b[1].score - a[1].score);
  const bestModel = sortedPlatforms.length ? platformNames[sortedPlatforms[0][0]] : "";
  const worstModel = sortedPlatforms.length ? platformNames[sortedPlatforms[sortedPlatforms.length - 1][0]] : "";

  // Platform consistency
  const platformMentionRates = {};
  for (const p of platforms) {
    platformMentionRates[p] = avg(platformData[p].mention);
  }
  const consistencyValues = Object.values(platformMentionRates);
  const platformConsistency = {
    rates: platformMentionRates,
    variance: consistencyValues.length ? Math.round((Math.max(...consistencyValues) - Math.min(...consistencyValues)) * 10) / 10 : 0,
    strongest: Object.entries(platformMentionRates).sort((a, b) => b[1] - a[1])[0]?.[0] || "",
    weakest: Object.entries(platformMentionRates).sort((a, b) => a[1] - b[1])[0]?.[0] || "",
    is_consistent: consistencyValues.length ? Math.max(...consistencyValues) - Math.min(...consistencyValues) < 30 : true,
  };

  // Question breakdown
  const questionBreakdown = results.map((r, i) => {
    const mentionedOn = [];
    for (const p of platforms) {
      if (platformData[p].mention[i] > 0) {
        mentionedOn.push(p[0].toUpperCase());
      }
    }
    return {
      q: i + 1,
      text: (r.question_text || "").substring(0, 50),
      category: r.question_category || "",
      m: mentionedOn.length ? 1 : 0,
      p: mentionedOn.join(""),
    };
  });

  // Recommendations
  const recommendations = [];
  const avgRec = avg(platforms.map((p) => platformsSummary[p].recommendation));
  const avgSent = avgNonzero(platforms.map((p) => platformsSummary[p].sentiment));

  if (brandCoverage < 50) {
    recommendations.push({ priority: "high", action: "Increase visibility", detail: `${brandCoverage}% coverage` });
  }
  if (avgRec < 30) {
    recommendations.push({ priority: "high", action: "Improve recommendations", detail: `${avgRec}% rate` });
  }
  if (avgSent > 0 && avgSent < 60) {
    recommendations.push({ priority: "medium", action: "Enhance sentiment", detail: `${avgSent}%` });
  }

  // Executive summary
  const topCompetitorsList = brandRankings.filter((b) => !b.is_tracked_brand).slice(0, 3).map((b) => b.brand);
  const avgSentDisplay = avgSent > 0 ? avgSent : 50;

  let headline;
  if (brandRank && brandRank <= 3 && brandCoverage >= 50) {
    headline = `${brandName} leads AI visibility`;
  } else if (brandCoverage >= 50) {
    headline = `${brandName} has moderate AI visibility`;
  } else {
    headline = `${brandName} has limited AI visibility`;
  }

  const execSummary = {
    headline,
    visibility_score: overallScore,
    brand_coverage: brandCoverage,
    brand_rank: brandRank,
    brand_sov: brandSov,
    best_model: bestModel,
    worst_model: worstModel,
    avg_sentiment: avgSentDisplay,
    avg_recommendation: avgRec,
    top_competitors: topCompetitorsList,
  };

  return {
    visibility_score: overallScore,
    brand_name: brandName,
    industry,
    best_model: bestModel,
    worst_model: worstModel,
    executive_summary: execSummary,
    brand_rankings: brandRankings.slice(0, 10),
    brand_rank: brandRank || 0,
    brand_sov: brandSov,
    platform_consistency: platformConsistency,
    platforms_summary: platformsSummary,
    question_breakdown: questionBreakdown,
    brand_coverage: brandCoverage,
    recommendations,
    num_questions_processed: numQuestions,
  };
}

// Save dashboard output to Airtable
async function saveDashboardOutput(analysis, runId, sessionId, brandLogo) {
  const tableId = "tblheMjYJzu1f88Ft";
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const score = analysis.visibility_score || 0;
  let grade;
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";
  else grade = "F";

  const platformsSummary = analysis.platforms_summary || {};
  const platformsJson = {};
  for (const [p, data] of Object.entries(platformsSummary)) {
    platformsJson[p] = {
      score: data.score || 0,
      mention: data.mention || 0,
      sentiment: data.sentiment || 50,
      recommendation: data.recommendation || 0,
      trend: "flat",
    };
  }

  const brandRankings = analysis.brand_rankings || [];
  const competitorsSov = brandRankings
    .filter((b) => !b.is_tracked_brand)
    .slice(0, 3)
    .map((b) => ({ name: b.brand, share: b.share_of_voice }));
  const shareOfVoiceJson = {
    brand: analysis.brand_sov || 0,
    competitors: competitorsSov,
  };

  const alerts = [];
  for (const [p, data] of Object.entries(platformsSummary)) {
    const rec = data.recommendation || 0;
    if (rec === 0) {
      alerts.push({ type: "critical", message: `${p.charAt(0).toUpperCase() + p.slice(1)} never recommends ${analysis.brand_name}`, platform: p });
    } else if (rec < 40) {
      alerts.push({ type: "warning", message: `${p.charAt(0).toUpperCase() + p.slice(1)} recommendation rate is only ${rec}%`, platform: p });
    }
  }

  const actions = [];
  const sortedPlatforms = Object.entries(platformsSummary).sort((a, b) => a[1].score - b[1].score);
  const worst = sortedPlatforms[0];
  const best = sortedPlatforms[sortedPlatforms.length - 1];

  if (worst) {
    actions.push({ priority: "high", action: `Investigate why ${worst[0].charAt(0).toUpperCase() + worst[0].slice(1)} underperforms`, impact: `Score: ${worst[1].score}`, effort: "High" });
  }
  if (best) {
    actions.push({ priority: "low", action: `Maintain ${best[0].charAt(0).toUpperCase() + best[0].slice(1)} performance`, impact: "Protect top performer", effort: "Low" });
  }

  const fields = {
    run_id: runId,
    session_id: sessionId,
    brand_name: analysis.brand_name || "",
    brand_logo: brandLogo || "",
    report_date: new Date().toISOString().split("T")[0],
    visibility_score: parseFloat(score),
    grade,
    best_model: analysis.best_model || "",
    worst_model: analysis.worst_model || "",
    platforms_json: JSON.stringify(platformsJson),
    share_of_voice_json: JSON.stringify(shareOfVoiceJson),
    alerts_json: JSON.stringify(alerts),
    actions_json: JSON.stringify(actions),
    recommendations_json: JSON.stringify(analysis.recommendations || []),
    platform_consistency_json: JSON.stringify(analysis.platform_consistency || {}),
    question_breakdown_json: JSON.stringify(analysis.question_breakdown || []),
    brand_rankings_json: JSON.stringify(brandRankings),
    executive_summary_json: JSON.stringify(analysis.executive_summary || {}),
    history_json: JSON.stringify([{ date: "Current", score }]),
  };

  // Send as rounded integers (Airtable may reject decimals)
  fields.brand_coverage = Math.round(analysis.brand_coverage || 0);
  fields.brand_rank = Math.round(analysis.brand_rank || 0);
  fields.brand_sov = Math.round(analysis.brand_sov || 0);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ records: [{ fields }] }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.records?.[0] || {};
    }
    const errorBody = await response.text();
    console.error(`Dashboard Output error: ${response.status} - ${errorBody}`);
    console.error(`Token prefix: ${AIRTABLE_API_KEY?.substring(0, 10)}...`);
    return {};
  } catch (error) {
    console.error("Dashboard save error:", error);
    return {};
  }
}

// Send dashboard link via SendGrid
async function sendDashboardEmail(email, brandName, sessionId, visibilityScore, grade) {
  if (!SENDGRID_API_KEY || !email) {
    console.log("Skipping email: missing API key or email address");
    return;
  }

  const dashboardUrl = `${SITE_URL}?report=${sessionId}`;

  const emailContent = {
    personalizations: [{ to: [{ email }] }],
    from: { email: "ai-ready@futureproof.work", name: "FutureProof AI" },
    subject: `Your AI Visibility Report for ${brandName} is Ready`,
    content: [
      {
        type: "text/html",
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0891b2;">Your AI Visibility Report is Ready</h1>
            <p>Great news! We've finished analyzing <strong>${brandName}</strong> across ChatGPT, Claude, Gemini, and Perplexity.</p>

            <div style="background: #f0f9ff; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="margin: 0 0 8px 0; color: #0e7490;">Visibility Score: ${visibilityScore}</h2>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${grade === 'A' ? '#10b981' : grade === 'B' ? '#22c55e' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#f97316' : '#ef4444'};">Grade: ${grade}</p>
            </div>

            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(to right, #06b6d4, #3b82f6); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Full Report</a>

            <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
              This report shows how AI assistants mention, recommend, and position your brand when users ask buying-intent questions.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">FutureProof AI Visibility Tracker</p>
          </div>
        `,
      },
    ],
  };

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailContent),
    });

    if (response.ok) {
      console.log(`Dashboard email sent to ${email}`);
    } else {
      console.error(`SendGrid error: ${response.status}`);
    }
  } catch (error) {
    console.error("Email send error:", error);
  }
}

// Main processing function
async function processAnalysis(data) {
  const {
    session_id: sessionId,
    run_id: runId,
    brand_name: brandName,
    email,
    industry,
    category,
    key_messages: keyMessages,
    competitors,
    questions,
  } = data;

  console.log(`Starting analysis for ${brandName} (${sessionId})`);

  // Parse key messages and competitors
  const keyMessagesList = typeof keyMessages === "string" ? keyMessages.split(",").map((s) => s.trim()) : keyMessages || [];
  const competitorsList = typeof competitors === "string" ? competitors.split(",").map((s) => s.trim()) : competitors || [];

  // Process each question
  const results = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const questionText = q.text || q;
    const questionCategory = q.category || "General";

    console.log(`  Processing question ${i + 1}/${questions.length}: ${questionText.substring(0, 50)}...`);

    // Query all 4 AI platforms in parallel
    const [chatgptResponse, claudeResponse, geminiResponse, perplexityResponse] = await Promise.all([
      queryChatGPT(questionText),
      queryClaude(questionText),
      queryGemini(questionText),
      queryPerplexity(questionText),
    ]);

    const responses = {
      chatgpt: chatgptResponse,
      claude: claudeResponse,
      gemini: geminiResponse,
      perplexity: perplexityResponse,
    };

    // Analyze responses
    const analysis = await analyzeResponses(brandName, keyMessagesList, competitorsList, questionText, responses);

    results.push({
      run_id: runId,
      customer_id: sessionId,
      run_date: new Date().toISOString().split("T")[0],
      brand_name: brandName,
      question_text: questionText,
      question_category: questionCategory,
      chatgpt_response: chatgptResponse,
      claude_response: claudeResponse,
      gemini_response: geminiResponse,
      perplexity_response: perplexityResponse,
      analysis,
    });
  }

  console.log(`Saving ${results.length} results to Airtable...`);

  // Save raw results to Airtable
  await saveToAirtable(results, sessionId);

  // Analyze aggregated data
  const aggregatedAnalysis = analyzeRunData(results, brandName, competitorsList, industry || category || "");

  // Save dashboard output
  await saveDashboardOutput(aggregatedAnalysis, runId, sessionId, "");

  // Calculate grade for email
  const score = aggregatedAnalysis.visibility_score || 0;
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";

  // Send dashboard link via email
  await sendDashboardEmail(email, brandName, sessionId, score, grade);

  console.log(`Analysis complete for ${brandName}`);
  return aggregatedAnalysis;
}

// Netlify Background Function handler
// The "-background" suffix in the filename enables background execution (up to 15 min)
export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    // For background functions, the processing runs and completes
    // The frontend polls Airtable for results, so we just need to process
    await processAnalysis(data);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Analysis complete",
        session_id: data.session_id,
      }),
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
