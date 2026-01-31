/**
 * Shared full report UI for trial (App.jsx) and paid (Dashboard.jsx).
 * When isPaidUser: no upgrade CTAs. When onBackToDashboard: show "Back to Dashboard" button.
 */
import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import BrandedPDFReport from './BrandedPDFReport';
import {
  CheckCircle, ChevronRight, Sparkles, Award, BookOpen, Info, Lightbulb, MessageSquare, ChevronDown,
  Download, Loader2, AlertCircle, X, BarChart3
} from 'lucide-react';
import { platformLogos, platformNames } from '../utils/reportData';

const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

const formatLLMResponse = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .trim();
};

const FormattedResponse = ({ text }) => {
  if (!text) return <span className="fp-text-muted">No response</span>;
  const cleanText = formatLLMResponse(text);
  const lines = cleanText.split('\n').filter(line => line.trim());
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (/^\d+[\.\)]\s/.test(trimmed)) return <p key={i} className="pl-4 text-white/80">{trimmed}</p>;
        if (/^[-•]\s/.test(trimmed)) return <p key={i} className="pl-4 text-white/80">{trimmed.replace(/^[-•]\s/, '• ')}</p>;
        return <p key={i} className="text-white/80">{trimmed}</p>;
      })}
    </div>
  );
};

export default function ReportView({
  dashboardData,
  sessionId,
  isPaidUser,
  onBackToDashboard,
  searchParams,
  setSearchParams
}) {
  const selectedPlatform = searchParams?.get('platform') && ['chatgpt', 'claude', 'gemini', 'perplexity'].includes(searchParams.get('platform'))
    ? searchParams.get('platform')
    : null;
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [expandedResponses, setExpandedResponses] = useState({});
  const [hasSeenExpandTip, setHasSeenExpandTip] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  const goBackToReport = () => {
    if (sessionId && setSearchParams) setSearchParams({ report: sessionId });
  };

  const handlePlatformDiveDeeper = (platform) => {
    if (sessionId && setSearchParams) setSearchParams({ report: sessionId, platform });
  };

  const handleDownloadPDF = async () => {
    if (!dashboardData) return;
    setIsGeneratingPDF(true);
    setPdfError(null);
    try {
      const blob = await pdf(<BrandedPDFReport dashboardData={dashboardData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dashboardData.brand_name.replace(/\s+/g, '-')}-AI-Visibility-Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
      setPdfError('Failed to generate PDF. Please try again.');
    }
    setIsGeneratingPDF(false);
  };

  const toggleQuestionExpand = (qIndex) => {
    setExpandedQuestions(prev => ({ ...prev, [qIndex]: !prev[qIndex] }));
    if (!hasSeenExpandTip) setHasSeenExpandTip(true);
  };

  const toggleResponseExpand = (questionIndex, platform) => {
    const key = `${questionIndex}-${platform}`;
    setExpandedResponses(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!dashboardData) return null;

  return (
    <div className="min-h-screen text-white fp-shell font-body">
      <div className="fp-sphere fp-sphere-1" />
      <div className="fp-sphere fp-sphere-2" />

      <header className="fp-header sticky top-0 backdrop-blur-xl z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-6 md:h-8" />
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="font-semibold text-sm md:text-base hidden sm:inline">AI Visibility Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff7a3d] to-[#ff6b4a] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#ff6b4a]/20"
              >
                <BarChart3 className="w-4 h-4" />
                Back to Dashboard
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl fp-button-primary text-sm font-semibold transition-all disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Generating...</span></>
              ) : (
                <><Download className="w-4 h-4" /><span className="hidden sm:inline">Download PDF</span></>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {!selectedPlatform && (
          <div className="animate-fadeIn space-y-4 md:space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {dashboardData.brand_logo && (
                  <img src={dashboardData.brand_logo} alt={dashboardData.brand_name} className="h-12 md:h-16 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                <div>
                  <h1 className="text-xl md:text-3xl font-bold flex flex-col md:flex-row md:items-center gap-1 md:gap-3">{dashboardData.brand_name}<span className="text-sm md:text-lg font-normal fp-text-muted">AI Visibility Report</span></h1>
                  <p className="fp-text-muted mt-1 text-sm">{dashboardData.report_date}</p>
                </div>
              </div>
            </div>

            {pdfError && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {pdfError}
                <button onClick={() => setPdfError(null)} className="ml-auto hover:text-red-300"><X className="w-5 h-5" /></button>
              </div>
            )}

            <div className="fp-card-strong rounded-2xl md:rounded-3xl p-4 md:p-8">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" /></div>
                <div><h2 className="text-lg md:text-xl font-bold">Executive Summary</h2><p className="text-xs md:text-sm fp-text-muted">TL;DR of the most important findings</p></div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-lg md:text-2xl font-semibold text-white/90">{dashboardData.executive_summary?.headline}</h3>
                {(dashboardData.executive_summary?.paragraphs || []).map((p, i) => (<p key={i} className="text-sm md:text-base text-white/80 leading-relaxed">{p}</p>))}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mt-4 md:mt-6">
                  {(dashboardData.executive_summary?.bullets || []).map((bullet, i) => (<li key={i} className="flex items-start gap-2 text-xs md:text-sm fp-text-muted"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--fp-accent-3)' }} /><span>{bullet}</span></li>))}
                </ul>
              </div>
            </div>

            <div className="fp-card rounded-2xl md:rounded-3xl p-4 md:p-8">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><Award className="w-5 h-5 md:w-6 md:h-6 text-white" /></div>
                <div className="flex-1"><h2 className="text-lg md:text-xl font-bold">Brand Rankings</h2><p className="text-xs md:text-sm fp-text-muted">Share of voice across all AI responses</p></div>
                {dashboardData.brand_sov !== undefined && (<div className="text-right"><div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--fp-accent-1)' }}>{dashboardData.brand_sov}%</div><div className="text-xs md:text-sm fp-text-muted">Share of Voice</div></div>)}
              </div>
              {(() => {
                const rankings = dashboardData.brand_rankings || [];
                const trackedRank = rankings.findIndex(b => b.is_tracked_brand) + 1;
                const topBrands = rankings.filter(b => !b.is_tracked_brand).slice(0, 3).map(b => b.brand);
                const leader = rankings[0];
                const trackedBrand = rankings.find(b => b.is_tracked_brand);
                let summary = '';
                if (trackedBrand && trackedRank === 1) summary = `${dashboardData.brand_name} leads the category with ${trackedBrand.share_of_voice}% share of voice. ${topBrands.length > 0 ? `Key competitors ${topBrands.slice(0, 2).join(' and ')} follow closely behind.` : ''}`;
                else if (trackedBrand && trackedRank <= 3) summary = `${dashboardData.brand_name} ranks #${trackedRank} with ${trackedBrand.share_of_voice}% share of voice. ${leader ? `${leader.brand} currently leads at ${leader.share_of_voice}%.` : ''}`;
                else if (trackedBrand && trackedRank <= 5) summary = `${dashboardData.brand_name} holds position #${trackedRank}. ${topBrands.length > 0 ? `${topBrands.slice(0, 2).join(', ')} dominate AI recommendations.` : ''}`;
                else if (trackedBrand) summary = `${dashboardData.brand_name} ranks #${trackedRank} with ${trackedBrand.share_of_voice}% share of voice.`;
                else summary = `${dashboardData.brand_name} was not mentioned in the analyzed AI responses. ${topBrands.length > 0 ? `${topBrands.slice(0, 3).join(', ')} dominate this category.` : ''}`;
                return summary ? <p className="text-sm fp-text-muted leading-relaxed mb-6 px-1">{summary}</p> : null;
              })()}
              <div className="space-y-3">
                {(dashboardData.brand_rankings || []).slice(0, 10).map((brand, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${brand.is_tracked_brand ? 'fp-stage-active' : 'fp-card'}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${brand.is_tracked_brand ? 'fp-rank-number text-white' : 'fp-rank-number-neutral'}`}>{i + 1}</span>
                    <span className={`flex-1 font-medium ${brand.is_tracked_brand ? 'text-white' : 'text-white/80'}`} style={brand.is_tracked_brand ? { color: 'var(--fp-accent-1)' } : {}}>{brand.brand}</span>
                    <span className="fp-text-muted text-sm">{brand.mentions} mentions</span>
                    <span className={`font-semibold ${brand.is_tracked_brand ? 'text-white' : 'text-white/80'}`} style={brand.is_tracked_brand ? { color: 'var(--fp-accent-1)' } : {}}>{brand.share_of_voice}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fp-card rounded-2xl md:rounded-3xl p-4 md:p-8">
              <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><h2 className="text-lg md:text-xl font-bold">Top Sources</h2><div className="group relative"><Info className="w-4 h-4 fp-text-muted cursor-help" /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">Where the information in AI answers is largely coming from</div></div></div>
                  <p className="text-xs md:text-sm fp-text-muted">Executive summary of cited sources across AI responses</p>
                </div>
              </div>
              {(() => {
                const topSources = dashboardData.top_sources || {};
                const summary = topSources?.summary;
                const legacyList = Array.isArray(topSources) ? topSources : [];
                if (summary) return <div className="py-2"><p className="text-sm md:text-base text-white/90 leading-relaxed">{summary}</p></div>;
                if (legacyList.length > 0) {
                  const maxP = Math.max(...legacyList.map(s => s.percentage), 1);
                  return (
                    <div className="space-y-3">
                      {legacyList.slice(0, 5).map((source, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl fp-card">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold fp-rank-number-neutral">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1"><span className="font-medium text-white/80 truncate">{source.name}</span><span className="text-sm fp-text-muted ml-2">{source.count} refs</span></div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(source.percentage / maxP) * 100}%`, background: 'linear-gradient(90deg, var(--fp-accent-1), var(--fp-accent-2))' }} /></div>
                          </div>
                          <span className="font-semibold text-white/80 w-12 text-right">{source.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return <div className="text-center py-6"><p className="fp-text-muted text-sm">No sources summary for this run yet.</p></div>;
              })()}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {['chatgpt', 'claude', 'gemini', 'perplexity'].map(p => {
                const data = dashboardData.platforms?.[p] || {};
                return (
                  <div key={p} className="relative fp-card rounded-2xl p-4 md:p-6 hover:border-[rgba(255,122,61,0.5)] transition-all">
                    <button
                      onClick={() => handlePlatformDiveDeeper(p)}
                      className="absolute top-3 right-3 md:top-4 md:right-4 px-2 md:px-3 py-1 md:py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 text-white hover:opacity-90 fp-button-primary"
                    >
                      Dive Deeper
                    </button>
                    <img src={platformLogos[p]} alt={platformNames[p]} className="h-6 md:h-8 object-contain mb-3 md:mb-4" />
                    <div className="text-xl md:text-2xl font-bold">{data.score || 0}</div>
                    <div className="text-xs md:text-sm fp-text-muted">Overall Score</div>
                    <div className="mt-3 md:mt-4 space-y-1 text-xs md:text-sm">
                      <div className="flex justify-between"><span className="fp-text-muted">Mention</span><span>{data.mention || 0}%</span></div>
                      <div className="flex justify-between"><span className="fp-text-muted">Sentiment</span><span>{data.sentiment || 0}%</span></div>
                      <div className="flex justify-between"><span className="fp-text-muted">Recommend</span><span>{data.recommendation || 0}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="fp-card-strong rounded-2xl md:rounded-3xl p-4 md:p-8">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-white" /></div>
                <div><h2 className="text-lg md:text-xl font-bold">Content Strategy Recommendations</h2><p className="text-xs md:text-sm fp-text-muted">AI-powered content strategies to improve your visibility rankings</p></div>
              </div>
              <div className="space-y-3 md:space-y-4">
                {(dashboardData.recommendations || []).map((rec, i) => {
                  const priorityColors = { high: { bg: 'fp-stage-active', border: 'fp-stage-active', badge: 'fp-badge-success' }, medium: { bg: 'fp-stage-complete', border: 'fp-stage-complete', badge: 'fp-badge' }, low: { bg: 'fp-card', border: 'fp-card', badge: 'fp-badge-neutral' } };
                  const colors = priorityColors[rec.priority] || priorityColors.medium;
                  return (
                    <div key={i} className={`relative p-4 md:p-6 rounded-xl border ${colors.bg} ${colors.border}`}>
                      <div className="flex items-start gap-3 md:gap-4">
                        <span className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm font-bold shrink-0 ${colors.badge}`}>{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wide ${colors.badge.split(' ')[1]}`}>{rec.priority} priority</span>
                            {rec.content_type && <span className="px-2 py-0.5 rounded text-[10px] md:text-xs fp-badge-neutral">{rec.content_type}</span>}
                          </div>
                          <h3 className="font-semibold text-base md:text-lg text-white/90 mb-1 md:mb-2">{rec.title || rec.action}</h3>
                          <p className="text-xs md:text-sm fp-text-muted leading-relaxed mb-3">{rec.description || rec.detail || 'Implement this strategy to improve your AI visibility.'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!dashboardData.recommendations || dashboardData.recommendations.length === 0) && (
                  <div className="text-center py-6 md:py-8 fp-text-muted text-sm">Content recommendations will be generated based on AI analysis</div>
                )}
              </div>
            </div>

            <div className="fp-card rounded-2xl md:rounded-3xl p-4 md:p-8">
              <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl fp-icon-gradient flex items-center justify-center shrink-0"><MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white" /></div>
                <div><h2 className="text-lg md:text-xl font-bold">Question-by-Question Analysis</h2><p className="text-xs md:text-sm fp-text-muted">How each AI responded to test queries</p></div>
              </div>
              <div className="space-y-3 md:space-y-4">
                {(dashboardData.question_breakdown || []).map((q, qIndex) => {
                  const isQuestionExpanded = expandedQuestions[qIndex];
                  return (
                    <div key={qIndex} className="rounded-xl md:rounded-2xl fp-card overflow-hidden">
                      <div onClick={() => toggleQuestionExpand(qIndex)} className="p-3 md:p-6 flex items-start gap-2 md:gap-4 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] group" style={{ borderBottom: isQuestionExpanded ? '1px solid rgba(255,107,74,0.15)' : 'none' }}>
                        <span className={`w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg flex items-center justify-center text-xs md:text-sm font-bold shrink-0 ${q.brand_mentioned ? 'fp-rank-number text-white' : 'fp-rank-number-neutral'}`}>{q.question_number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white/90 text-sm md:text-base">{q.question_text}</p>
                          <div className="flex items-center gap-1.5 md:gap-2 mt-1.5 md:mt-2 flex-wrap">
                            <span className="px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs fp-badge-neutral">{q.category}</span>
                            {q.brand_mentioned ? <span className="px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs fp-badge-success">Mentioned</span> : <span className="px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs fp-badge-neutral">Not Mentioned</span>}
                            {!hasSeenExpandTip && qIndex === 0 && <span className="px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs bg-[#ff6b4a]/20 text-[#ff6b4a] animate-pulse">Tap to expand</span>}
                          </div>
                          {!isQuestionExpanded && <p className="text-xs md:text-sm fp-text-muted mt-2 md:mt-3 line-clamp-2">{q.executive_summary}</p>}
                        </div>
                        <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 fp-text-muted transition-transform duration-300 ease-out group-hover:text-[#ff6b4a] ${isQuestionExpanded ? 'rotate-180' : ''}`} />
                      </div>
                      <div className={`transition-all duration-300 ease-out overflow-hidden ${isQuestionExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="px-3 md:px-6 pb-4 md:pb-6 pt-3 md:pt-4">
                          <p className="text-xs md:text-sm fp-text-muted mb-3 md:mb-4">{q.executive_summary}</p>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                            {['chatgpt', 'claude', 'gemini', 'perplexity'].map(p => {
                              const data = q.platforms?.[p] || {};
                              const isExpanded = expandedResponses[`${qIndex}-${p}`];
                              return (
                                <div key={p} className="bg-white/[0.05] rounded-xl overflow-hidden">
                                  <button onClick={(e) => { e.stopPropagation(); toggleResponseExpand(qIndex, p); }} className="w-full p-2 md:p-3 text-left hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                                      <img src={platformLogos[p]} alt={p} className="h-3 md:h-4 object-contain" />
                                      <span className={`ml-auto text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded ${data.mention > 0 ? 'fp-badge-success' : 'fp-badge-neutral'}`}>{data.mention > 0 ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="text-base md:text-lg font-bold">{data.overall || 0}</div>
                                    <div className="text-[10px] md:text-xs fp-text-muted">Score</div>
                                  </button>
                                  {isExpanded && (
                                    <div className="p-2 md:p-3 border-t fp-divider">
                                      {data.notes && <div className="mb-2 md:mb-3 p-2 rounded-lg fp-card-strong"><p className="text-[10px] md:text-xs leading-relaxed" style={{ color: 'var(--fp-accent-1)' }}>{data.notes}</p></div>}
                                      <div className="max-h-48 md:max-h-64 overflow-y-auto"><div className="text-[10px] md:text-xs leading-relaxed"><FormattedResponse text={data.full_response || data.response_summary} /></div></div>
                                      {data.competitors_mentioned?.length > 0 && <div className="mt-2 text-[10px] md:text-xs fp-text-muted">Competitors: {data.competitors_mentioned.join(', ')}</div>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {dashboardData && selectedPlatform && (
          <div className="animate-fadeIn space-y-8">
            <button onClick={goBackToReport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#F5A623] to-[#D4145A] text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#D4145A]/20">
              ← Back to Report
            </button>
            <div className="flex items-center gap-4 md:gap-6">
              <img src={platformLogos[selectedPlatform]} alt={selectedPlatform} className="w-12 h-12 md:w-16 md:h-16 object-contain" />
              <div><h1 className="text-2xl md:text-3xl font-bold">{platformNames[selectedPlatform]} Deep Dive</h1><p className="fp-text-muted text-sm md:text-base">Detailed analysis for {dashboardData.brand_name}</p></div>
            </div>
            <div className="fp-card-strong rounded-2xl md:rounded-3xl p-4 md:p-8">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Executive Summary</h2>
              <p className="text-white/80 leading-relaxed text-sm md:text-lg">{dashboardData.platform_deep_dives?.[selectedPlatform]?.executive_summary}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-6 md:mt-8">
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--fp-accent-1)' }}>{dashboardData.platform_deep_dives?.[selectedPlatform]?.mention_rate}%</div><div className="text-xs md:text-sm fp-text-muted">Mention Rate</div></div>
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--fp-accent-1)' }}>{dashboardData.platform_deep_dives?.[selectedPlatform]?.sentiment}%</div><div className="text-xs md:text-sm fp-text-muted">Sentiment</div></div>
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--fp-accent-1)' }}>{dashboardData.platform_deep_dives?.[selectedPlatform]?.recommendation_rate}%</div><div className="text-xs md:text-sm fp-text-muted">Recommendation</div></div>
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--fp-accent-3)' }}>{dashboardData.platform_deep_dives?.[selectedPlatform]?.overall_score}</div><div className="text-xs md:text-sm fp-text-muted">Overall Score</div></div>
              </div>
            </div>
            <div className="fp-card rounded-2xl md:rounded-3xl p-4 md:p-8">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">{platformNames[selectedPlatform]} Responses</h2>
              <div className="space-y-4 md:space-y-6">
                {(dashboardData.question_breakdown || []).map((q, qIndex) => {
                  const platformData = q.platforms?.[selectedPlatform];
                  if (!platformData) return null;
                  return (
                    <div key={qIndex} className="p-4 md:p-6 rounded-xl fp-card">
                      <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                        <span className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold shrink-0 ${platformData.mention > 0 ? 'fp-rank-number text-white' : 'fp-rank-number-neutral'}`}>{q.question_number}</span>
                        <div>
                          <p className="font-medium text-white/90 text-sm md:text-base">{q.question_text}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded text-[10px] md:text-xs fp-badge-neutral">{q.category}</span>
                            {platformData.mention > 0 ? <span className="px-2 py-0.5 rounded text-[10px] md:text-xs fp-badge-success">Mentioned</span> : <span className="px-2 py-0.5 rounded text-[10px] md:text-xs fp-badge">Not Mentioned</span>}
                            <span className="text-[10px] md:text-xs fp-text-muted">Score: {platformData.overall}</span>
                          </div>
                        </div>
                      </div>
                      {platformData.notes && <div className="mb-3 md:mb-4 p-2 md:p-3 rounded-xl fp-card-strong"><p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--fp-accent-1)' }}>{platformData.notes}</p></div>}
                      <div className="p-3 md:p-4 fp-card rounded-xl max-h-64 md:max-h-96 overflow-y-auto text-xs md:text-sm leading-relaxed"><FormattedResponse text={platformData.full_response || platformData.response_summary} /></div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-3 md:mt-4 text-xs md:text-sm">
                        <div><span className="fp-text-muted">Mention:</span> <span className="font-medium">{platformData.mention}%</span></div>
                        <div><span className="fp-text-muted">Sentiment:</span> <span className="font-medium">{platformData.sentiment}%</span></div>
                        <div><span className="fp-text-muted">Recommend:</span> <span className="font-medium">{platformData.recommendation}%</span></div>
                        <div><span className="fp-text-muted">Position:</span> <span className="font-medium">{platformData.position}</span></div>
                      </div>
                      {platformData.competitors_mentioned?.length > 0 && <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t fp-divider text-xs md:text-sm"><span className="fp-text-muted">Competitors: </span><span className="fp-text-muted">{platformData.competitors_mentioned.join(', ')}</span></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="relative border-t border-[rgba(255,107,74,0.15)] mt-8 md:mt-16 pb-20 md:pb-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-2">
          <img src={FUTUREPROOF_LOGO} alt="FutureProof" className="h-5 md:h-6 opacity-40" />
          <div className="text-xs md:text-sm fp-text-subtle">AI Visibility Intelligence Platform</div>
        </div>
      </footer>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.6s ease-out; }`}</style>
    </div>
  );
}
