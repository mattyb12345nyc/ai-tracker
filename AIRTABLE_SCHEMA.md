# AIRTABLE_SCHEMA.md

Schema for Airtable base: appgSZR92pGCMlUOc

## Table: Dashboard Output
- **ID:** tblheMjYJzu1f88Ft
- **Primary Field ID:** fld1HasiDFOWfH9JT

### Fields

| Field Name | Type | ID |
|------------|------|-----|
| run_id | multilineText | fld1HasiDFOWfH9JT |
| brand_name | multilineText | fld6VyuwK8pyRhBzZ |
| brand_logo | multilineText | flds38rpPChGkUZgk |
| report_date | date | fldP12Ma2RtRxiOtj |
| deck_url | multilineText | fldFXqSwO06oaQgO8 |
| visibility_score | number | fldURLgIudO6JEPf4 |
| session_id | singleLineText | fldWnXWFYj3hMGvUI |
| clerk_user_id | singleLineText | (add in Airtable) — Clerk user ID for trial report persistence |
| previous_score | singleSelect | fld5weLSt2EQ829lW |
| best_model | singleSelect | fldbm29Y2xX1RCRGi |
| worst_model | singleSelect | fldB8rQh2QxPcb5wm |
| platforms_json | multilineText | fldKvwBuq0CYc43jw |
| share_of_voice_json | multilineText | fldDGbZXSOspCWpbP |
| message_alignment_json | multilineText | fld9LorXIPEL0QhW1 |
| alerts_json | multilineText | fldbpshAYPTvI9g44 |
| competitor_context_json | multilineText | fldfmwmUkX6O9bj6X |
| actions_json | multilineText | fldv21ggfON8LRzeD |
| history_json | multilineText | fld0e7nAXg2BvxpDI |
| question_breakdown_json | multilineText | fldhOk4SdYzRSItqG |
| insights_json | multilineText | fldAzpMyjJdEyLLe9 |
| brand_rankings_json | multilineText | fldiRFQLyiT9epFEA |
| sentiment_rankings_json | multilineText | fld3ewlbBs7Q5ytB6 |
| platform_consistency_json | multilineText | fldaR81J7Socrzx2J |
| platform_deep_dives_json | multilineText | fldXOMGQ7jogdXbi4 |
| brand_keywords_json | multilineText | fldjoMJKU9JznIHhn |
| source_attribution_json | multilineText | fldeshGK6qqzRVlLF |
| recommendations_json | multilineText | fld5IcU7lOHLlvVrq |
| accuracy_flags_json | multilineText | fldVtg4tE2HG3XrAS |
| brand_coverage | multilineText | fldtYeWysA7JtqoOG |
| brand_rank | multilineText | fldBOa7SPV1FZdWRA |
| brand_sov | multilineText | fld5fUcIA1Hdu7NlD |
| executive_summary_json | multilineText | fldAAG4Xn44fTah4t |

## Table: raw question data
- **ID:** tblusxWUrocGCwUHb
- **Primary Field ID:** fld2tOpJwN7GwlQm3

### Fields

| Field Name | Type | ID |
|------------|------|-----|
| run_id | multilineText | fld2tOpJwN7GwlQm3 |
| session_id | singleLineText | fldVVqUl0Yalf42kx |
| customer_id | singleLineText | fldpVxGVUitqgUZAT |
| question_number | number | fldZyUGLmSnUMFaph |
| question_text | multilineText | fldBD5Uu1qT5YvNo1 |
| question_category | multilineText | fldVUGUc8aYW7eMPg |
| analyzed_at | date | fldBHf01VEhaAEGi6 |
| chatgpt_response | multilineText | fldIMPUL6RjNoy7G3 |
| chatgpt_mention | number | fldE57ZAbdraiC3yj |
| chatgpt_position | number | fld38noSHxcEzlgNQ |
| chatgpt_sentiment | number | fld0DL22oRauivuDr |
| chatgpt_recommendation | number | fldngfHVak4kCJSS6 |
| chatgpt_message_alignment | number | fldHoROhTI60F5zuR |
| chatgpt_overall | number | fld6ZxbDyq5OTu9Jj |
| chatgpt_competitors_mentioned | multipleSelects | fldhglruanuUjfXnB |
| chatgpt_notes | multilineText | fld3LedAVEvgAKOMf |
| claude_response | multilineText | fldf4iVIOZ8g0RHrc |
| claude_mention | number | fldn2LCjoL9fcD3e2 |
| claude_position | number | fldEhHx2GKUCsDtZL |
| claude_sentiment | number | fldAaH81I1dWbELqv |
| claude_recommendation | number | fld2mbAWsqXLx7cbR |
| claude_message_alignment | number | fldapBGtE2yzgf2OP |
| claude_overall | number | fldcIq4yO4GdhTqrK |
| claude_competitors_mentioned | multipleSelects | fldOGKXphSitCLJN0 |
| claude_notes | multilineText | fldss1bs7zHuKF3WY |
| gemini_response | multilineText | fldZvlhNLQd01eQPg |
| gemini_mention | number | fldeLcOlBjiJ9whUg |
| gemini_position | number | fldYRhMnpmrTVnn0Y |
| gemini_sentiment | number | fldpNWPjpUG9fAhMr |
| gemini_recommendation | number | fldhxeL1Q9fNNOxX9 |
| gemini_message_alignment | number | fldJCSfI5lAASXV4J |
| gemini_overall | number | fldXt9s8pt8nWUEVK |
| gemini_competitors_mentioned | multipleSelects | fldJCheYrDEu7SWJ0 |
| gemini_notes | multilineText | fldjN64BjGZxGosZ1 |
| perplexity_response | multilineText | fldMlQP1J99yNo23F |
| perplexity_mention | number | fldxt9WSnuK8KfewA |
| perplexity_position | number | fldX2IaPEIcxxT5d2 |
| perplexity_sentiment | number | fldKOFHTIR8kWRbNH |
| perplexity_recommendation | number | fld30xy7qLsj4oKN1 |
| perplexity_message_alignment | number | fldpPBVpNFQTj2OoJ |
| perplexity_overall | number | fldscFaGlGeCIQ3sw |
| perplexity_competitors_mentioned | multipleSelects | fldLKOLopwVAEnyvo |
| perplexity_notes | multilineText | fldtgWEIebQlAtuOa |

