import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Link, Font } from '@react-pdf/renderer';

// Register fonts with fallback - use Helvetica as fallback if Inter fails to load
try {
  Font.register({
    family: 'Inter',
    fonts: [
      { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
      { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
      { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
    ],
  });
} catch (e) {
  console.warn('Failed to register Inter font, using Helvetica fallback');
}

// Configure hyphenation callback to prevent crashes
Font.registerHyphenationCallback(word => [word]);

const SIGNUP_URL = 'https://futureproof.work/ai-optimizer-sign-up';
const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

// Professional color palette - guaranteed visibility on white
const colors = {
  primary: '#1e293b',      // Dark slate for headings
  secondary: '#f97316',    // Orange accent
  accent: '#6366f1',       // Indigo accent
  text: '#334155',         // Dark gray for body text
  textLight: '#64748b',    // Medium gray for secondary text
  textMuted: '#94a3b8',    // Light gray for subtle text
  background: '#ffffff',   // White background
  cardBg: '#f8fafc',       // Very light gray for cards
  border: '#e2e8f0',       // Light border
  success: '#22c55e',      // Green
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: colors.background,
    fontFamily: 'Helvetica',  // Use Helvetica as base - Inter loads async and may not be ready
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.secondary,
  },
  brandLogo: {
    maxHeight: 40,
    maxWidth: 120,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  poweredByText: {
    fontSize: 7,
    color: colors.textMuted,
    marginBottom: 4,
  },
  futureproofLogo: {
    height: 16,
    objectFit: 'contain',
  },
  // Title section
  titleSection: {
    marginBottom: 24,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  // Score cards row
  scoreCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.primary,
  },
  scoreUnit: {
    fontSize: 10,
    color: colors.textLight,
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionIcon: {
    width: 20,
    height: 20,
    backgroundColor: colors.secondary,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.primary,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  // Executive summary
  summaryHeadline: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  paragraph: {
    fontSize: 10,
    color: colors.text,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
  },
  // Platform cards
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  platformCard: {
    width: '48%',
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  platformName: {
    fontSize: 11,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 6,
  },
  platformScore: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.secondary,
    marginBottom: 8,
  },
  platformMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  platformMetricLabel: {
    fontSize: 8,
    color: colors.textLight,
  },
  platformMetricValue: {
    fontSize: 8,
    fontWeight: 600,
    color: colors.text,
  },
  // Rankings
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankingRowHighlight: {
    backgroundColor: '#fff7ed',
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  rankBadge: {
    width: 22,
    height: 22,
    backgroundColor: colors.cardBg,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankBadgeHighlight: {
    backgroundColor: colors.secondary,
  },
  rankNumber: {
    fontSize: 9,
    fontWeight: 600,
    color: colors.text,
  },
  rankNumberHighlight: {
    color: '#ffffff',
  },
  rankBrand: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
  },
  rankBrandHighlight: {
    fontWeight: 600,
    color: colors.secondary,
  },
  rankMentions: {
    fontSize: 8,
    color: colors.textMuted,
    marginRight: 12,
  },
  rankShare: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.text,
    width: 40,
    textAlign: 'right',
  },
  // Recommendations
  recCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  recTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
  },
  // CTA
  ctaSection: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 10,
    color: '#cbd5e1',
    marginBottom: 12,
    textAlign: 'center',
    maxWidth: 300,
  },
  ctaButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  ctaButtonText: {
    fontSize: 10,
    fontWeight: 600,
    color: '#ffffff',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: 8,
    color: colors.secondary,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.textMuted,
  },
});

const platformNames = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity'
};

const BrandedPDFReport = ({ dashboardData }) => {
  return (
    <Document>
      {/* Page 1: Executive Summary & Scores */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {dashboardData.brand_logo ? (
            <Image src={dashboardData.brand_logo} style={styles.brandLogo} />
          ) : (
            <Text style={styles.brandName}>{dashboardData.brand_name}</Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Image src={FUTUREPROOF_LOGO} style={styles.futureproofLogo} />
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.brandName}>{dashboardData.brand_name}</Text>
          <Text style={styles.reportTitle}>AI Visibility Report</Text>
          <Text style={styles.reportDate}>Generated on {dashboardData.report_date}</Text>
        </View>

        <View style={styles.scoreCardsRow}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Visibility Score</Text>
            <Text style={styles.scoreValue}>{dashboardData.visibility_score || 0}</Text>
            <Text style={styles.scoreUnit}>out of 100</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Grade</Text>
            <Text style={styles.scoreValue}>{dashboardData.grade || 'C'}</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Share of Voice</Text>
            <Text style={styles.scoreValue}>{dashboardData.brand_sov || 0}%</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Rank</Text>
            <Text style={styles.scoreValue}>#{dashboardData.brand_rank || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Executive Summary</Text>
          </View>
          {dashboardData.executive_summary?.headline && (
            <Text style={styles.summaryHeadline}>{dashboardData.executive_summary.headline}</Text>
          )}
          {(dashboardData.executive_summary?.paragraphs || []).map((p, i) => (
            <Text key={i} style={styles.paragraph}>{p}</Text>
          ))}
          <View style={styles.bulletList}>
            {(dashboardData.executive_summary?.bullets || []).slice(0, 4).map((bullet, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Want to Improve Your AI Visibility?</Text>
          <Text style={styles.ctaText}>Get personalized recommendations and track your progress over time</Text>
          <Link src={SIGNUP_URL} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started Free</Text>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AI Visibility Report for {dashboardData.brand_name}</Text>
          <Link src={SIGNUP_URL}>
            <Text style={styles.footerLink}>futureproof.work</Text>
          </Link>
          <Text style={styles.pageNumber}>Page 1 of 3</Text>
        </View>
      </Page>

      {/* Page 2: Platform Performance & Rankings */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {dashboardData.brand_logo ? (
            <Image src={dashboardData.brand_logo} style={styles.brandLogo} />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: 700, color: colors.primary }}>{dashboardData.brand_name}</Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Image src={FUTUREPROOF_LOGO} style={styles.futureproofLogo} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Platform Performance</Text>
            <Text style={styles.sectionSubtitle}>How AI assistants see your brand</Text>
          </View>
          <View style={styles.platformGrid}>
            {['chatgpt', 'claude', 'gemini', 'perplexity'].map(platform => {
              const data = dashboardData.platforms?.[platform] || {};
              return (
                <View key={platform} style={styles.platformCard}>
                  <Text style={styles.platformName}>{platformNames[platform]}</Text>
                  <Text style={styles.platformScore}>{data.score || 0}</Text>
                  <View style={styles.platformMetric}>
                    <Text style={styles.platformMetricLabel}>Mention Rate</Text>
                    <Text style={styles.platformMetricValue}>{data.mention || 0}%</Text>
                  </View>
                  <View style={styles.platformMetric}>
                    <Text style={styles.platformMetricLabel}>Sentiment</Text>
                    <Text style={styles.platformMetricValue}>{data.sentiment || 0}%</Text>
                  </View>
                  <View style={styles.platformMetric}>
                    <Text style={styles.platformMetricLabel}>Recommendation</Text>
                    <Text style={styles.platformMetricValue}>{data.recommendation || 0}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.accent }]} />
            <Text style={styles.sectionTitle}>Competitive Landscape</Text>
            <Text style={styles.sectionSubtitle}>Share of voice rankings</Text>
          </View>
          {(dashboardData.brand_rankings || []).slice(0, 10).map((brand, i) => (
            <View key={i} style={[styles.rankingRow, brand.is_tracked_brand && styles.rankingRowHighlight]}>
              <View style={[styles.rankBadge, brand.is_tracked_brand && styles.rankBadgeHighlight]}>
                <Text style={[styles.rankNumber, brand.is_tracked_brand && styles.rankNumberHighlight]}>{i + 1}</Text>
              </View>
              <Text style={[styles.rankBrand, brand.is_tracked_brand && styles.rankBrandHighlight]}>{brand.brand}</Text>
              <Text style={styles.rankMentions}>{brand.mentions} mentions</Text>
              <Text style={styles.rankShare}>{brand.share_of_voice}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AI Visibility Report for {dashboardData.brand_name}</Text>
          <Link src={SIGNUP_URL}>
            <Text style={styles.footerLink}>futureproof.work</Text>
          </Link>
          <Text style={styles.pageNumber}>Page 2 of 3</Text>
        </View>
      </Page>

      {/* Page 3: Recommendations & CTA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {dashboardData.brand_logo ? (
            <Image src={dashboardData.brand_logo} style={styles.brandLogo} />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: 700, color: colors.primary }}>{dashboardData.brand_name}</Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Image src={FUTUREPROOF_LOGO} style={styles.futureproofLogo} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.success }]} />
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <Text style={styles.sectionSubtitle}>How to improve your AI visibility</Text>
          </View>
          {(dashboardData.recommendations || []).slice(0, 6).map((rec, i) => (
            <View key={i} style={styles.recCard}>
              <Text style={styles.recTitle}>{rec.title || rec.action || `Recommendation ${i + 1}`}</Text>
              <Text style={styles.recDesc}>{rec.description || rec.impact || ''}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Dominate AI Search?</Text>
          <Text style={styles.ctaText}>
            Join leading brands using FutureProof to optimize their AI visibility. Get real-time monitoring, competitive insights, and actionable recommendations.
          </Text>
          <Link src={SIGNUP_URL} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Start Your Free Trial</Text>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AI Visibility Report for {dashboardData.brand_name}</Text>
          <Link src={SIGNUP_URL}>
            <Text style={styles.footerLink}>futureproof.work</Text>
          </Link>
          <Text style={styles.pageNumber}>Page 3 of 3</Text>
        </View>
      </Page>
    </Document>
  );
};

export default BrandedPDFReport;
