import uuid
import json
import os
import requests
from datetime import datetime
from anthropic import Anthropic

# Initialize Claude client
client = Anthropic()

# API Keys (loaded from environment variables)
BRAND_DEV_API_KEY = os.environ.get("BRAND_DEV_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
PERPLEXITY_API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")
AIRTABLE_API_KEY = os.environ.get("AIRTABLE_API_KEY", "")
AIRTABLE_BASE_ID = os.environ.get("AIRTABLE_BASE_ID", "appgSZR92pGCMlUOc")


def save_to_airtable(results: list, session_id: str, table_name: str = "Raw Question Data") -> list:
    """Save tracker results to Airtable (Steps 22-24)"""
    
    from urllib.parse import quote
    url = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{quote(table_name)}"
    headers = {
        "Authorization": f"Bearer {AIRTABLE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    created_records = []
    
    # Airtable accepts max 10 records per request
    for i in range(0, len(results), 10):
        batch = results[i:i+10]
        
        records = []
        for idx, r in enumerate(batch):
            analysis = r.get('analysis', {})
            
            record = {
                "fields": {
                    "session_id": session_id,
                    "run_id": r.get('run_id', ''),
                    "customer_id": r.get('customer_id', ''),
                    "question_number": i + idx + 1,
                    "question_text": r.get('question_text', ''),
                    "question_category": r.get('question_category', ''),
                    "analyzed_at": r.get('run_date', ''),
                    
                    # Raw responses
                    "chatgpt_response": r.get('chatgpt_response', ''),
                    "claude_response": r.get('claude_response', ''),
                    "gemini_response": r.get('gemini_response', ''),
                    "perplexity_response": r.get('perplexity_response', ''),
                    
                    # ChatGPT scores
                    "chatgpt_mention": analysis.get('chatgpt', {}).get('mention', 0),
                    "chatgpt_position": analysis.get('chatgpt', {}).get('position', 0),
                    "chatgpt_sentiment": analysis.get('chatgpt', {}).get('sentiment', 0),
                    "chatgpt_recommendation": analysis.get('chatgpt', {}).get('recommendation', 0),
                    "chatgpt_message_alignment": analysis.get('chatgpt', {}).get('message_alignment', 0),
                    "chatgpt_overall": analysis.get('chatgpt', {}).get('overall', 0),
                    "chatgpt_competitors_mentioned": [analysis.get('chatgpt', {}).get('competitors_mentioned', '')] if analysis.get('chatgpt', {}).get('competitors_mentioned') else [],
                    "chatgpt_notes": analysis.get('chatgpt', {}).get('notes', ''),
                    
                    # Claude scores
                    "claude_mention": analysis.get('claude', {}).get('mention', 0),
                    "claude_position": analysis.get('claude', {}).get('position', 0),
                    "claude_sentiment": analysis.get('claude', {}).get('sentiment', 0),
                    "claude_recommendation": analysis.get('claude', {}).get('recommendation', 0),
                    "claude_message_alignment": analysis.get('claude', {}).get('message_alignment', 0),
                    "claude_overall": analysis.get('claude', {}).get('overall', 0),
                    "claude_competitors_mentioned": [analysis.get('claude', {}).get('competitors_mentioned', '')] if analysis.get('claude', {}).get('competitors_mentioned') else [],
                    "claude_notes": analysis.get('claude', {}).get('notes', ''),
                    
                    # Gemini scores
                    "gemini_mention": analysis.get('gemini', {}).get('mention', 0),
                    "gemini_position": analysis.get('gemini', {}).get('position', 0),
                    "gemini_sentiment": analysis.get('gemini', {}).get('sentiment', 0),
                    "gemini_recommendation": analysis.get('gemini', {}).get('recommendation', 0),
                    "gemini_message_alignment": analysis.get('gemini', {}).get('message_alignment', 0),
                    "gemini_overall": analysis.get('gemini', {}).get('overall', 0),
                    "gemini_competitors_mentioned": [analysis.get('gemini', {}).get('competitors_mentioned', '')] if analysis.get('gemini', {}).get('competitors_mentioned') else [],
                    "gemini_notes": analysis.get('gemini', {}).get('notes', ''),
                    
                    # Perplexity scores
                    "perplexity_mention": analysis.get('perplexity', {}).get('mention', 0),
                    "perplexity_position": analysis.get('perplexity', {}).get('position', 0),
                    "perplexity_sentiment": analysis.get('perplexity', {}).get('sentiment', 0),
                    "perplexity_recommendation": analysis.get('perplexity', {}).get('recommendation', 0),
                    "perplexity_message_alignment": analysis.get('perplexity', {}).get('message_alignment', 0),
                    "perplexity_overall": analysis.get('perplexity', {}).get('overall', 0),
                    "perplexity_competitors_mentioned": [analysis.get('perplexity', {}).get('competitors_mentioned', '')] if analysis.get('perplexity', {}).get('competitors_mentioned') else [],
                    "perplexity_notes": analysis.get('perplexity', {}).get('notes', '')
                }
            }
            records.append(record)
        
        payload = {"records": records}
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            created_records.extend(response.json().get('records', []))
        else:
            print(f"Airtable error: {response.status_code} - {response.text}")
    
    return created_records


def analyze_run_data(results: list, brand_name: str, valid_competitors: list, industry: str) -> dict:
    """Aggregate all question results into dashboard metrics (Step 27)"""
    import re
    
    def avg(nums):
        valid = [n for n in nums if isinstance(n, (int, float)) and n <= 100]
        return round(sum(valid) / len(valid), 1) if valid else 0
    
    def avg_nonzero(nums):
        valid = [n for n in nums if isinstance(n, (int, float)) and n > 0 and n <= 100]
        return round(sum(valid) / len(valid), 1) if valid else 0
    
    def is_invalid_brand(name):
        if not name:
            return True
        lower = name.lower().strip()
        invalid_exact = ['none', 'n/a', 'na', 'null', 'undefined', 'other', 'none explicitly', 'none mentioned']
        return lower in invalid_exact or len(name) > 40
    
    def extract_clean_brands(comp_str):
        if not comp_str:
            return []
        brands = []
        parts = re.split(r'[;,]', str(comp_str))
        for part in parts:
            part = part.strip()
            part = re.sub(r'\s*\([^)]*\)\s*$', '', part).strip()
            if is_invalid_brand(part):
                continue
            for vc in valid_competitors:
                if vc.lower().strip() == part.lower().strip():
                    brands.append(vc)
                    break
            else:
                if len(part) > 1 and len(part) < 35:
                    brands.append(part.title())
        return list(set(brands))
    
    # Capitalize brand name
    brand_name = brand_name[0].upper() + brand_name[1:] if len(brand_name) > 1 else brand_name.upper()
    
    num_questions = len(results)
    platforms = ['chatgpt', 'claude', 'gemini', 'perplexity']
    platform_names = {'chatgpt': 'ChatGPT', 'claude': 'Claude', 'gemini': 'Gemini', 'perplexity': 'Perplexity'}
    
    # Build platform data from results
    platform_data = {p: {'mention': [], 'position': [], 'sentiment': [], 'recommendation': [], 
                         'message_alignment': [], 'overall': [], 'competitors_mentioned': []} for p in platforms}
    
    for r in results:
        analysis = r.get('analysis', {})
        for p in platforms:
            p_analysis = analysis.get(p, {})
            platform_data[p]['mention'].append(p_analysis.get('mention', 0))
            platform_data[p]['position'].append(p_analysis.get('position', 0))
            platform_data[p]['sentiment'].append(p_analysis.get('sentiment', 0))
            platform_data[p]['recommendation'].append(min(p_analysis.get('recommendation', 0), 100))
            platform_data[p]['message_alignment'].append(p_analysis.get('message_alignment', 0))
            platform_data[p]['overall'].append(p_analysis.get('overall', 0))
            platform_data[p]['competitors_mentioned'].append(p_analysis.get('competitors_mentioned', ''))
    
    # Count brand mentions
    brand_mention_counts = {}
    brand_sentiment_scores = {}
    brand_mentioned_per_question = []
    
    for i in range(num_questions):
        question_brand_mentioned = False
        for p in platforms:
            mention_val = platform_data[p]['mention'][i]
            sentiment_val = platform_data[p]['sentiment'][i]
            if mention_val > 0:
                question_brand_mentioned = True
                brand_mention_counts[brand_name] = brand_mention_counts.get(brand_name, 0) + 1
                if brand_name not in brand_sentiment_scores:
                    brand_sentiment_scores[brand_name] = []
                if 0 < sentiment_val <= 100:
                    brand_sentiment_scores[brand_name].append(sentiment_val)
        brand_mentioned_per_question.append(question_brand_mentioned)
    
    # Extract competitor mentions
    all_competitors = set()
    for p in platforms:
        for comp_str in platform_data[p]['competitors_mentioned']:
            all_competitors.update(extract_clean_brands(comp_str))
    
    for comp in all_competitors:
        if comp and comp.lower() != brand_name.lower():
            count = sum(1 for p in platforms for c in platform_data[p]['competitors_mentioned'] if comp.lower() in str(c).lower())
            if count > 0:
                brand_mention_counts[comp] = count
                brand_sentiment_scores[comp] = [50]
    
    brand_appeared_count = sum(1 for m in brand_mentioned_per_question if m)
    brand_coverage = round((brand_appeared_count / num_questions) * 100, 1) if num_questions > 0 else 0
    
    # Brand rankings
    total_mentions = sum(brand_mention_counts.values())
    brand_rankings = []
    for brand, count in brand_mention_counts.items():
        if is_invalid_brand(brand):
            continue
        sov = round((count / total_mentions) * 100, 1) if total_mentions > 0 else 0
        is_tracked = brand.lower() == brand_name.lower()
        brand_rankings.append({'brand': brand, 'mentions': count, 'share_of_voice': sov, 'is_tracked_brand': is_tracked})
    
    brand_rankings.sort(key=lambda x: x['mentions'], reverse=True)
    top_10_rankings = brand_rankings[:10]
    
    brand_rank = None
    brand_sov = 0
    for i, b in enumerate(brand_rankings):
        if b['is_tracked_brand']:
            brand_rank = i + 1
            brand_sov = b['share_of_voice']
            break
    
    # Platform metrics
    platforms_summary = {}
    for p in platforms:
        platforms_summary[p] = {
            'score': avg(platform_data[p]['overall']),
            'mention': avg(platform_data[p]['mention']),
            'sentiment': avg_nonzero(platform_data[p]['sentiment']),
            'recommendation': avg(platform_data[p]['recommendation'])
        }
    
    all_scores = [platforms_summary[p]['score'] for p in platforms]
    overall_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
    
    sorted_platforms = sorted(platforms_summary.items(), key=lambda x: x[1]['score'], reverse=True)
    best_model = platform_names[sorted_platforms[0][0]] if sorted_platforms else ''
    worst_model = platform_names[sorted_platforms[-1][0]] if sorted_platforms else ''
    
    # Platform consistency
    platform_mention_rates = {p: avg(platform_data[p]['mention']) for p in platforms}
    consistency_values = list(platform_mention_rates.values())
    platform_consistency = {
        'rates': platform_mention_rates,
        'variance': round(max(consistency_values) - min(consistency_values), 1) if consistency_values else 0,
        'strongest': max(platform_mention_rates, key=platform_mention_rates.get) if platform_mention_rates else '',
        'weakest': min(platform_mention_rates, key=platform_mention_rates.get) if platform_mention_rates else '',
        'is_consistent': (max(consistency_values) - min(consistency_values)) < 30 if consistency_values else True
    }
    
    # Question breakdown
    question_breakdown = []
    for i, r in enumerate(results):
        mentioned_on = []
        for p in platforms:
            if platform_data[p]['mention'][i] > 0:
                mentioned_on.append(p[0].upper())
        question_breakdown.append({
            'q': i + 1,
            'text': r.get('question_text', '')[:50],
            'category': r.get('question_category', ''),
            'm': 1 if mentioned_on else 0,
            'p': ''.join(mentioned_on)
        })
    
    # Recommendations
    recommendations = []
    avg_rec = avg([platforms_summary[p]['recommendation'] for p in platforms])
    avg_sent = avg_nonzero([platforms_summary[p]['sentiment'] for p in platforms])
    
    if brand_coverage < 50:
        recommendations.append({'priority': 'high', 'action': 'Increase visibility', 'detail': f'{brand_coverage}% coverage'})
    if avg_rec < 30:
        recommendations.append({'priority': 'high', 'action': 'Improve recommendations', 'detail': f'{avg_rec}% rate'})
    if 0 < avg_sent < 60:
        recommendations.append({'priority': 'medium', 'action': 'Enhance sentiment', 'detail': f'{avg_sent}%'})
    
    # Executive summary
    top_competitors_list = [b['brand'] for b in top_10_rankings if not b['is_tracked_brand']][:3]
    avg_sent_display = avg_sent if avg_sent > 0 else 50
    
    if brand_rank and brand_rank <= 3 and brand_coverage >= 50:
        headline = f"{brand_name} leads AI visibility"
    elif brand_coverage >= 50:
        headline = f"{brand_name} has moderate AI visibility"
    else:
        headline = f"{brand_name} has limited AI visibility"
    
    exec_summary = {
        'headline': headline,
        'visibility_score': overall_score,
        'brand_coverage': brand_coverage,
        'brand_rank': brand_rank,
        'brand_sov': brand_sov,
        'best_model': best_model,
        'worst_model': worst_model,
        'avg_sentiment': avg_sent_display,
        'avg_recommendation': avg_rec,
        'top_competitors': top_competitors_list
    }
    
    return {
        'visibility_score': overall_score,
        'brand_name': brand_name,
        'industry': industry,
        'best_model': best_model,
        'worst_model': worst_model,
        'executive_summary': exec_summary,
        'brand_rankings': top_10_rankings,
        'brand_rank': brand_rank if brand_rank else 0,
        'brand_sov': brand_sov,
        'platform_consistency': platform_consistency,
        'platforms_summary': platforms_summary,
        'question_breakdown': question_breakdown,
        'brand_coverage': brand_coverage,
        'recommendations': recommendations,
        'num_questions_processed': num_questions
    }


def save_dashboard_output(analysis: dict, run_id: str, session_id: str, brand_logo: str, 
                          table_name: str = "tblheMjYJzu1f88Ft") -> dict:
    """Save aggregated analysis to Dashboard Output table (Step 30)"""
    
    from urllib.parse import quote
    url = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/{table_name}"
    headers = {
        "Authorization": f"Bearer {AIRTABLE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    score = analysis.get('visibility_score', 0)

    # Build platforms_json
    platforms_summary = analysis.get('platforms_summary', {})
    platforms_json = {}
    for p, data in platforms_summary.items():
        platforms_json[p] = {
            'score': data.get('score', 0),
            'mention': data.get('mention', 0),
            'sentiment': data.get('sentiment', 50),
            'recommendation': data.get('recommendation', 0),
            'trend': 'flat'
        }
    
    # Build share_of_voice_json
    brand_rankings = analysis.get('brand_rankings', [])
    competitors_sov = [{'name': b['brand'], 'share': b['share_of_voice']} 
                       for b in brand_rankings if not b.get('is_tracked_brand')][:3]
    share_of_voice_json = {
        'brand': analysis.get('brand_sov', 0),
        'competitors': competitors_sov
    }
    
    # Build alerts
    alerts = []
    for p, data in platforms_summary.items():
        rec = data.get('recommendation', 0)
        if rec == 0:
            alerts.append({'type': 'critical', 'message': f"{p.title()} never recommends {analysis['brand_name']}", 'platform': p})
        elif rec < 40:
            alerts.append({'type': 'warning', 'message': f"{p.title()} recommendation rate is only {rec}%", 'platform': p})
    
    # Build actions
    actions = []
    sorted_platforms = sorted(platforms_summary.items(), key=lambda x: x[1]['score'])
    worst = sorted_platforms[0] if sorted_platforms else None
    best = sorted_platforms[-1] if sorted_platforms else None
    
    if worst:
        actions.append({'priority': 'high', 'action': f"Investigate why {worst[0].title()} underperforms", 
                       'impact': f"Score: {worst[1]['score']}", 'effort': 'High'})
    if best:
        actions.append({'priority': 'low', 'action': f"Maintain {best[0].title()} performance", 
                       'impact': 'Protect top performer', 'effort': 'Low'})
    
    # Build record - only include writable fields
    fields = {
        "run_id": run_id,
        "session_id": session_id,
        "brand_name": analysis.get('brand_name', ''),
        "brand_logo": brand_logo,
        "report_date": datetime.now().strftime('%Y-%m-%d'),
        "visibility_score": float(score),
        "best_model": analysis.get('best_model', ''),
        "worst_model": analysis.get('worst_model', ''),
        "platforms_json": json.dumps(platforms_json),
        "share_of_voice_json": json.dumps(share_of_voice_json),
        "alerts_json": json.dumps(alerts),
        "actions_json": json.dumps(actions),
        "recommendations_json": json.dumps(analysis.get('recommendations', [])),
        "platform_consistency_json": json.dumps(analysis.get('platform_consistency', {})),
        "question_breakdown_json": json.dumps(analysis.get('question_breakdown', [])),
        "brand_rankings_json": json.dumps(brand_rankings),
        "executive_summary_json": json.dumps(analysis.get('executive_summary', {})),
        "history_json": json.dumps([{'date': 'Current', 'score': score}])
    }
    
    # Only add numeric fields if they have non-zero values
    if analysis.get('brand_coverage', 0) > 0:
        fields["brand_coverage"] = float(analysis.get('brand_coverage', 0))
    if analysis.get('brand_rank', 0) > 0:
        fields["brand_rank"] = int(analysis.get('brand_rank', 0))
    if analysis.get('brand_sov', 0) > 0:
        fields["brand_sov"] = float(analysis.get('brand_sov', 0))
    
    record = {"fields": fields}
    
    response = requests.post(url, headers=headers, json={"records": [record]})
    
    if response.status_code == 200:
        return response.json().get('records', [{}])[0]
    else:
        print(f"Dashboard Output error: {response.status_code} - {response.text}")
        return {}


def query_chatgpt(question: str) -> str:
    """Query ChatGPT (Step 16)"""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": question}],
        "max_tokens": 2048
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content']
    return f"Error: {response.status_code}"


def query_claude(question: str) -> str:
    """Query Claude (Step 17)"""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": question}]
    )
    return response.content[0].text


def query_gemini(question: str) -> str:
    """Query Gemini (Step 18)"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": question}]}]
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()['candidates'][0]['content']['parts'][0]['text']
    return f"Error: {response.status_code}"


def query_perplexity(question: str) -> str:
    """Query Perplexity (Step 19)"""
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-sonar-large-128k-online",
        "messages": [{"role": "user", "content": question}]
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content']
    return f"Error: {response.status_code}"


def analyze_responses(brand_name: str, key_messages: list, competitors: list, 
                      question: str, responses: dict) -> dict:
    """Claude analyzes all 4 LLM responses (Step 20)"""
    
    prompt = f"""You are analyzing AI responses for brand visibility.
BRAND: {brand_name}
KEY MESSAGES: {key_messages}
COMPETITORS: {competitors}
QUESTION: {question}
RESPONSES:
ChatGPT: {responses['chatgpt']}
Claude: {responses['claude']}
Gemini: {responses['gemini']}
Perplexity: {responses['perplexity']}

Score each response (0-100) on:
- mention: Was the brand mentioned? (0=no, 100=yes prominently)
- position: Where was brand positioned? (100=first, 75=second, 50=mentioned, 0=absent)
- sentiment: How positive? (0=negative, 50=neutral, 100=positive)
- recommendation: Was it recommended? (0=no, 100=explicitly recommended)
- message_alignment: Did it reflect key messages? (0-100)
- overall: Weighted average

Return ONLY valid JSON:
{{
  "chatgpt": {{"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":""}},
  "claude": {{"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":""}},
  "gemini": {{"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":""}},
  "perplexity": {{"mention":0,"position":0,"sentiment":0,"recommendation":0,"message_alignment":0,"overall":0,"competitors_mentioned":"","notes":""}}
}}"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Parse JSON (Step 21)
    raw = response.content[0].text
    cleaned = raw.replace('```json', '').replace('```', '').strip()
    first_brace = cleaned.find('{')
    last_brace = cleaned.rfind('}')
    if first_brace != -1 and last_brace != -1:
        cleaned = cleaned[first_brace:last_brace + 1]
    
    return json.loads(cleaned)


def run_tracker_loop(questions: list, brand_name: str, key_messages: list, 
                     competitors: list, run_id: str, customer_id: str) -> list:
    """Main loop: query all LLMs for each question, analyze, return results (Steps 15-21)"""
    
    results = []
    
    for i, q in enumerate(questions):
        print(f"  Processing question {i+1}/{len(questions)}: {q['text'][:50]}...")
        
        # Query all 4 LLMs (Steps 16-19)
        responses = {
            'chatgpt': query_chatgpt(q['text']),
            'claude': query_claude(q['text']),
            'gemini': query_gemini(q['text']),
            'perplexity': query_perplexity(q['text'])
        }
        
        # Analyze responses (Step 20-21)
        analysis = analyze_responses(brand_name, key_messages, competitors, q['text'], responses)
        
        # Build result record
        result = {
            'run_id': run_id,
            'customer_id': customer_id,
            'run_date': datetime.now().strftime('%Y-%m-%d'),
            'brand_name': brand_name,
            'question_text': q['text'],
            'question_category': q['category'],
            'chatgpt_response': responses['chatgpt'],
            'claude_response': responses['claude'],
            'gemini_response': responses['gemini'],
            'perplexity_response': responses['perplexity'],
            'analysis': analysis
        }
        results.append(result)
    
    return results


def get_brand_assets(domain: str) -> dict:
    """Pull brand assets from Brand.dev API
    
    Replaces Zapier Step 8: Pull brand assets
    """
    
    # Extract domain from URL if full URL provided
    if domain:
        domain = domain.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
    
    url = f"https://api.brand.dev/v1/brand/retrieve?domain={domain}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {BRAND_DEV_API_KEY}"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": f"Brand.dev API error: {response.status_code}"}


def parse_brand_assets(brand_data: dict) -> dict:
    """Parse Brand.dev response into usable format
    
    Replaces Zapier Step 9: Parse Brand.dev brand assets
    """
    
    brand = brand_data.get('brand', {})
    
    # Get colors
    colors = brand.get('colors', [])
    primary_color = colors[0]['hex'] if len(colors) > 0 else '#000000'
    secondary_color = colors[1]['hex'] if len(colors) > 1 else '#ffffff'
    tertiary_color = colors[2]['hex'] if len(colors) > 2 else '#cccccc'
    
    # Find primary logo (png/jpeg only, prefer "logo" over "icon")
    valid_extensions = ['.png', '.jpg', '.jpeg']
    all_logos = brand.get('logos', [])
    
    def is_valid_logo(logo):
        url = logo.get('url', '').lower()
        return any(url.endswith(ext) for ext in valid_extensions)
    
    # First try "logo" type
    primary_logo = next((l for l in all_logos if l.get('type') == 'logo' and is_valid_logo(l)), None)
    # Fallback to any valid image
    if not primary_logo:
        primary_logo = next((l for l in all_logos if is_valid_logo(l)), None)
    
    # Get best backdrop (widest)
    backdrops = brand.get('backdrops', [])
    primary_backdrop = max(backdrops, key=lambda b: b.get('resolution', {}).get('width', 0)) if backdrops else None
    
    # Get socials
    socials = brand.get('socials', [])
    def get_social(social_type):
        return next((s.get('url', '') for s in socials if s.get('type') == social_type), '')
    
    # Get industry
    industries = brand.get('industries', {}).get('eic', [])
    
    return {
        'brand_name': brand.get('title', ''),
        'brand_description': brand.get('description', ''),
        'brand_slogan': brand.get('slogan', ''),
        'brand_domain': brand.get('domain', ''),
        
        'primary_color': primary_color,
        'secondary_color': secondary_color,
        'tertiary_color': tertiary_color,
        'all_colors': colors,
        
        'primary_logo_url': primary_logo.get('url', '') if primary_logo else '',
        'primary_logo_type': primary_logo.get('type', '') if primary_logo else '',
        'primary_logo_mode': primary_logo.get('mode', '') if primary_logo else '',
        'primary_logo_width': primary_logo.get('resolution', {}).get('width', 0) if primary_logo else 0,
        'primary_logo_height': primary_logo.get('resolution', {}).get('height', 0) if primary_logo else 0,
        'all_logos': all_logos,
        
        'primary_backdrop_url': primary_backdrop.get('url', '') if primary_backdrop else '',
        'primary_backdrop_width': primary_backdrop.get('resolution', {}).get('width', 0) if primary_backdrop else 0,
        'primary_backdrop_height': primary_backdrop.get('resolution', {}).get('height', 0) if primary_backdrop else 0,
        
        'twitter_url': get_social('x'),
        'instagram_url': get_social('instagram'),
        'linkedin_url': get_social('linkedin'),
        
        'industry': industries[0].get('industry', '') if industries else '',
        'subindustry': industries[0].get('subindustry', '') if industries else ''
    }


def define_industry(brand_name: str, competitors: list, key_messages: list) -> dict:
    """Define industry using Claude API
    
    Replaces Zapier Step 4: Define Industry (ChatGPT)
    """
    
    prompt = f"""Analyze the brand and competitors listed below. Determine the specific industry and output JSON only.
Brand: {brand_name}
User-Listed Competitors: {competitors}
Key messages: {key_messages}
Return this exact JSON structure:
{{
  "industry": "specific industry name",
  "industry_keywords": ["keyword1", "keyword2", "keyword3"],
  "valid_competitors": ["Company1", "Company2", "Company3"],
  "brand_variations": ["variation1", "variation2"],
  "invalid_inputs": ["any user-listed items that are not actual competitors"],
  "disambiguation_term": "phrase to add to queries to avoid confusion"
}}
Rules:
- industry: Be specific (e.g. "consumer insights software" not "technology")
- industry_keywords: 3-5 terms that define this industry
- valid_competitors: Include user-listed competitors that ARE real competitors + add 10-15 more legitimate competitors in this exact industry. Use proper capitalization (e.g. "SurveyMonkey" not "surveymonkey").
- brand_variations: All common spellings/abbreviations of the brand name
- invalid_inputs: Flag any user-listed items that are not actual competing companies
- disambiguation_term: A clarifying phrase to prevent AI misinterpretation (e.g. "market research platform" vs "AI development platform")
JSON only. No explanation."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Parse JSON from response
    response_text = response.content[0].text.strip()
    # Remove markdown code blocks if present
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
    response_text = response_text.strip()
    
    return json.loads(response_text)

def parse_webhook_input(data: dict) -> dict:
    """Parse incoming webhook data into structured format
    
    Replaces Zapier Steps 1-3:
    - Step 1: Catch webhook from website
    - Step 2: Create Run_ID
    - Step 3: Create Customer ID
    """
    
    # Extract questions into clean list
    questions = []
    for i in range(1, data.get('question_count', 0) + 1):
        q_key = str(i)
        if q_key in data.get('questions', {}):
            questions.append({
                'text': data['questions'][q_key]['Questions Text'],
                'category': data['questions'][q_key]['Questions Category']
            })
    
    return {
        'session_id': data.get('session_id'),
        'run_id': f"RUN_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6].upper()}",
        'customer_id': f"CUST_{uuid.uuid4().hex[:8].upper()}",
        'brand_name': data.get('brand_name'),
        'website': data.get('website'),  # User enters directly
        'email': data.get('email'),
        'key_messages': data.get('key_messages', []),
        'competitors': data.get('competitors', []),
        'questions': questions,
        'question_count': len(questions),
        'timestamp': data.get('timestamp', datetime.now().isoformat())
    }


# Test with sample data
if __name__ == "__main__":
    sample_input = {
        'session_id': 'SES_1769121224684_EJJB',
        'brand_name': 'Suzy',
        'website': 'suzy.com',
        'email': 'mattb@suzy.com',
        'key_messages': [
            'on demand insights',
            'consumer research tool',
            'user experience research',
            'market research platform',
            'consumer insights platform'
        ],
        'competitors': ['zappi', 'qualtrics', 'toluna'],
        'questions': {
            '1': {'Questions Text': 'How do companies gather real-time customer feedback and insights?', 'Questions Category': 'Awareness'},
            '2': {'Questions Text': 'What tools help businesses understand user experience problems?', 'Questions Category': 'Awareness'},
            '3': {'Questions Text': 'How do organizations conduct market research efficiently?', 'Questions Category': 'Awareness'}
        },
        'question_count': 3,
        'timestamp': '2026-01-22T22:33:44.684Z'
    }
    
    # Step 1-3: Parse webhook
    result = parse_webhook_input(sample_input)
    print("Steps 1-3: Parsed webhook data:")
    for key, value in result.items():
        print(f"  {key}: {value}")
    
    # Step 4-6: Define Industry
    print("\nSteps 4-6: Defining industry...")
    industry_data = define_industry(
        result['brand_name'],
        result['competitors'],
        result['key_messages']
    )
    print("Industry data:")
    print(json.dumps(industry_data, indent=2))
    
    # Step 8: Pull brand assets
    print("\nStep 8: Pulling brand assets...")
    brand_assets = get_brand_assets(result['website'])
    
    # Step 9: Parse brand assets
    print("Step 9: Parsing brand assets...")
    parsed_brand = parse_brand_assets(brand_assets)
    print(f"  Brand: {parsed_brand['brand_name']}")
    print(f"  Colors: {parsed_brand['primary_color']}, {parsed_brand['secondary_color']}, {parsed_brand['tertiary_color']}")
    print(f"  Logo: {parsed_brand['primary_logo_url'][:50]}..." if parsed_brand['primary_logo_url'] else "  Logo: None")
    
    # Steps 15-21: Run tracker loop (test with 1 question)
    print("\nSteps 15-21: Running tracker loop (1 question for test)...")
    tracker_results = run_tracker_loop(
        questions=result['questions'][:1],  # Just 1 for testing
        brand_name=result['brand_name'],
        key_messages=result['key_messages'],
        competitors=result['competitors'],
        run_id=result['run_id'],
        customer_id=result['customer_id']
    )
    
    print("\nResults:")
    for r in tracker_results:
        print(f"  Question: {r['question_text'][:50]}...")
        print(f"  ChatGPT overall: {r['analysis']['chatgpt']['overall']}")
        print(f"  Claude overall: {r['analysis']['claude']['overall']}")
        print(f"  Gemini overall: {r['analysis']['gemini']['overall']}")
        print(f"  Perplexity overall: {r['analysis']['perplexity']['overall']}")
    
    # Steps 22-24: Save to Airtable
    print("\nSteps 22-24: Saving to Airtable...")
    saved = save_to_airtable(tracker_results, result['session_id'])
    print(f"  Saved {len(saved)} records to Airtable")
    
    # Step 27: Analyze aggregate data
    print("\nStep 27: Analyzing aggregate data...")
    analysis = analyze_run_data(
        results=tracker_results,
        brand_name=result['brand_name'],
        valid_competitors=industry_data.get('valid_competitors', []),
        industry=industry_data.get('industry', '')
    )
    print(f"  Visibility Score: {analysis['visibility_score']}")
    print(f"  Brand Coverage: {analysis['brand_coverage']}%")
    print(f"  Best Model: {analysis['best_model']}")
    print(f"  Headline: {analysis['executive_summary']['headline']}")
    
    # Step 30: Save to Dashboard Output
    print("\nStep 30: Saving to Dashboard Output...")
    dashboard_record = save_dashboard_output(
        analysis=analysis,
        run_id=result['run_id'],
        session_id=result['session_id'],
        brand_logo=parsed_brand.get('primary_logo_url', '')
    )
    print(f"  Dashboard record created: {dashboard_record.get('id', 'Error')}")
