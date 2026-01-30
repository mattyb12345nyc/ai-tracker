---
name: aeo-brand-visibility
description: Expert guidance on Answer Engine Optimization (AEO)—optimizing brand visibility across AI platforms (ChatGPT, Claude, Gemini, Perplexity). Covers LLM retrieval and recommendation behavior, brand mention rates, share of voice, sentiment, and competitive positioning. Use when building or refining AI visibility tracking tools, analyzing AI-generated answers, optimizing for AI recommendations, or when the user mentions AEO, answer engines, or brand visibility in AI.
---

# Answer Engine Optimization (AEO)

Apply AEO expertise when optimizing how brands appear in AI-generated answers, designing tracking or measurement tools, or interpreting AI visibility data.

## Core Concept: AEO vs SEO

- **SEO** optimizes for organic search rankings and click-through. Key signal: links, keywords, crawlable content.
- **AEO** optimizes for **AI recommendations** in answer engines. Key signal: **whether and how LLMs mention, rank, and recommend your brand** in response to purchase-intent queries.
- **Primary metric**: AI recommendation rate and quality—not search position or traffic. Brands must be surfaced and endorsed in model outputs.

## How LLMs Surface Brands

- Models retrieve from training data, RAG indexes, and (where applicable) live search.
- Responses favor **salient, well-structured** information: clear value props, comparison-friendly attributes, and consistent association with relevant intents.
- **Purchase-intent queries** (e.g. “best X for Y”, “X vs Y”, “alternatives to X”) drive recommendation behavior. Optimize for these.
- **Position in the answer** matters: first-mentioned brands typically get more weight. Track order, not just presence.

## Key Metrics to Track and Optimize

| Metric | What it measures | Why it matters |
|--------|------------------|----------------|
| **Mention rate** | % of relevant queries where the brand appears | Baseline visibility |
| **Position** | Where the brand appears (first, second, …) in the response | Influence on consideration |
| **Sentiment** | Tone (negative / neutral / positive) of the mention | Reputation in AI answers |
| **Recommendation** | Explicit endorsement (e.g. “I recommend X”) | Strongest conversion signal |
| **Share of voice** | Brand’s share of mentions vs. competitors per query or topic | Relative visibility |
| **Competitive positioning** | Which competitors are mentioned, in what order, with what sentiment | Context for strategy |

Use **message alignment** (fit between query intent and how the brand is presented) as a quality overlay on these metrics.

## Platform Considerations

- **ChatGPT, Claude, Gemini, Perplexity** differ in retrieval, phrasing, and citation behavior.
- Track **per-platform** (mention, position, sentiment, recommendation, competitors) to spot gaps and prioritize optimization.
- **Consistency across platforms** is a useful health signal; large variance suggests platform-specific opportunities.

## Building Tracking and Measurement Tools

When implementing AI visibility tracking:

1. **Query design**: Use **buyer-intent questions** (best X, X vs Y, alternatives, comparisons) that mirror how people ask AI for recommendations.
2. **Structured scoring**: Store per-platform, per-query scores for mention, position, sentiment, recommendation (e.g. 0–100) plus competitor lists. Persist raw responses for auditing.
3. **Aggregations**: Compute mention rate, share of voice, and platform-level averages. Support time-series for trends.
4. **Reporting**: Surface visibility score (numeric 0–100), best/worst platforms, and actionable insights (e.g. “Improve sentiment on Claude for category X”).

## Optimization Guidance

- **Content and positioning**: Ensure clear, comparison-friendly information about the brand (features, use cases, differentiators) in owned and third-party sources LLMs may use.
- **Query coverage**: Map high-intent queries per category; track and improve performance on those first.
- **Competitive context**: Monitor which competitors appear, in what order, and with what sentiment. Use this to refine messaging and positioning.
- **Iterate**: Re-run tracking on the same questions over time to measure impact of content or strategy changes.

## Summary Checklist

When working on AEO or AI visibility:

- [ ] Treat **AI recommendations** as the north-star metric, not traditional SEO.
- [ ] Track **mention**, **position**, **sentiment**, **recommendation**, and **share of voice** per platform.
- [ ] Use **purchase-intent questions** for tracking and optimization.
- [ ] Compare **competitive positioning** across platforms and over time.
- [ ] Design tools to store per-query, per-platform data and support trend analysis.
