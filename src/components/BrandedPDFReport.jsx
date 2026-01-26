import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Link, Font } from '@react-pdf/renderer';

// Register fonts (using system fonts as fallback)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const SIGNUP_URL = 'https://futureproof.work/ai-optimizer-sign-up';
const FUTUREPROOF_LOGO = 'http://cdn.mcauto-images-production.sendgrid.net/d157e984273caff5/d19d829c-a9a9-4fad-b0e7-7938012be26c/800x200.png';

// Create styles with brand colors
const createStyles = (brandAssets) => {
  const primaryColor = brandAssets?.primary_color || '#1a1a2e';
  const secondaryColor = brandAssets?.secondary_color || '#ff7a3d';
  const accentColor = brandAssets?.accent_color || '#8b5cf6';

  return StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: '#ffffff',
      fontFamily: 'Inter',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
    },
    brandLogo: {
      maxHeight: 50,
      maxWidth: 150,
      objectFit: 'contain',
    },
    poweredBy: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    poweredByText: {
      fontSize: 8,
      color: '#666666',
    },
    futureproofLogo: {
      height: 20,
      objectFit: 'contain',
    },
    title: {
      fontSize: 28,
      fontWeight: 700,
      color: primaryColor,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: '#666666',
      marginBottom: 20,
    },
    reportDate: {
      fontSize: 10,
      color: '#999999',
      marginBottom: 30,
    },
    section: {
      marginBottom: 25,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e5e5',
    },
    sectionIcon: {
      width: 24,
      height: 24,
      backgroundColor: secondaryColor,
      borderRadius: 4,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: primaryColor,
    },
    sectionSubtitle: {
      fontSize: 10,
      color: '#666666',
      marginLeft: 'auto',
    },
    executiveSummaryHeadline: {
      fontSize: 14,
      fontWeight: 600,
      color: primaryColor,
      marginBottom: 10,
    },
    paragraph: {
      fontSize: 10,
      color: '#333333',
      lineHeight: 1.5,
      marginBottom: 8,
    },
    bulletList: {
      marginTop: 10,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    bullet: {
      width: 6,
      height: 6,
      backgroundColor: secondaryColor,
      borderRadius: 3,
      marginRight: 8,
      marginTop: 4,
    },
    bulletText: {
      fontSize: 9,
      color: '#555555',
      flex: 1,
    },
    scoreCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    scoreBox: {
      width: '23%',
      padding: 12,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      alignItems: 'center',
      borderLeftWidth: 3,
      borderLeftColor: secondaryColor,
    },
    scoreLabel: {
      fontSize: 8,
      color: '#666666',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    scoreValue: {
      fontSize: 20,
      fontWeight: 700,
      color: primaryColor,
    },
    scoreUnit: {
      fontSize: 10,
      color: '#999999',
    },
    platformGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    platformCard: {
      width: '48%',
      padding: 12,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      marginBottom: 10,
    },
    platformName: {
      fontSize: 12,
      fontWeight: 600,
      color: primaryColor,
      marginBottom: 8,
    },
    platformScore: {
      fontSize: 18,
      fontWeight: 700,
      color: secondaryColor,
      marginBottom: 4,
    },
    platformMetric: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    platformMetricLabel: {
      fontSize: 8,
      color: '#666666',
    },
    platformMetricValue: {
      fontSize: 8,
      fontWeight: 600,
      color: '#333333',
    },
    rankingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    rankingRowHighlight: {
      backgroundColor: `${secondaryColor}15`,
      borderLeftWidth: 3,
      borderLeftColor: secondaryColor,
    },
    rankNumber: {
      width: 24,
      height: 24,
      backgroundColor: '#e5e5e5',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    rankNumberHighlight: {
      backgroundColor: secondaryColor,
    },
    rankNumberText: {
      fontSize: 10,
      fontWeight: 600,
      color: '#666666',
    },
    rankNumberTextHighlight: {
      color: '#ffffff',
    },
    rankBrand: {
      fontSize: 10,
      color: '#333333',
      flex: 1,
    },
    rankBrandHighlight: {
      fontWeight: 600,
      color: secondaryColor,
    },
    rankMentions: {
      fontSize: 9,
      color: '#999999',
      marginRight: 15,
    },
    rankShare: {
      fontSize: 10,
      fontWeight: 600,
      color: '#333333',
    },
    recommendationCard: {
      padding: 12,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    recommendationTitle: {
      fontSize: 11,
      fontWeight: 600,
      color: primaryColor,
      marginBottom: 4,
    },
    recommendationDesc: {
      fontSize: 9,
      color: '#555555',
      lineHeight: 1.4,
    },
    ctaSection: {
      marginTop: 30,
      padding: 20,
      backgroundColor: primaryColor,
      borderRadius: 8,
      alignItems: 'center',
    },
    ctaTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: '#ffffff',
      marginBottom: 8,
      textAlign: 'center',
    },
    ctaText: {
      fontSize: 10,
      color: '#ffffff',
      opacity: 0.9,
      marginBottom: 15,
      textAlign: 'center',
    },
    ctaButton: {
      backgroundColor: secondaryColor,
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 6,
    },
    ctaButtonText: {
      fontSize: 11,
      fontWeight: 600,
      color: '#ffffff',
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#e5e5e5',
    },
    footerText: {
      fontSize: 8,
      color: '#999999',
    },
    footerLink: {
      fontSize: 8,
      color: secondaryColor,
    },
    pageNumber: {
      fontSize: 8,
      color: '#999999',
    },
  });
};

const platformNames = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity'
};

const BrandedPDFReport = ({ dashboardData }) => {
  const brandAssets = dashboardData.brand_assets || {};
  const styles = createStyles(brandAssets);

  return (
    <Document>
      {/* Page 1: Executive Summary & Overview */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {dashboardData.brand_logo ? (
            <Image src={dashboardData.brand_logo} style={styles.brandLogo} />
          ) : (
            <Text style={styles.title}>{dashboardData.brand_name}</Text>
          )}
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Image src={FUTUREPROOF_LOGO} style={styles.futureproofLogo} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{dashboardData.brand_name}</Text>
        <Text style={styles.subtitle}>AI Visibility Report</Text>
        <Text style={styles.reportDate}>Generated on {dashboardData.report_date}</Text>

        {/* Score Overview */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Visibility Score</Text>
            <Text style={styles.scoreValue}>{dashboardData.visibility_score || 0}</Text>
            <Text style={styles.scoreUnit}>/ 100</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Grade</Text>
            <Text style={styles.scoreValue}>{dashboardData.grade || 'C'}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Share of Voice</Text>
            <Text style={styles.scoreValue}>{dashboardData.brand_sov || 0}%</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Brand Rank</Text>
            <Text style={styles.scoreValue}>#{dashboardData.brand_rank || '-'}</Text>
          </View>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Executive Summary</Text>
          </View>
          {dashboardData.executive_summary?.headline && (
            <Text style={styles.executiveSummaryHeadline}>
              {dashboardData.executive_summary.headline}
            </Text>
          )}
          {(dashboardData.executive_summary?.paragraphs || []).map((p, i) => (
            <Text key={i} style={styles.paragraph}>{p}</Text>
          ))}
          <View style={styles.bulletList}>
            {(dashboardData.executive_summary?.bullets || []).slice(0, 4).map((bullet, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Want to Improve Your AI Visibility?</Text>
          <Text style={styles.ctaText}>
            Get personalized recommendations and track your progress over time
          </Text>
          <Link src={SIGNUP_URL} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started Free</Text>
          </Link>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AI Visibility Report for {dashboardData.brand_name}</Text>
          <Link src={SIGNUP_URL}>
            <Text style={styles.footerLink}>futureproof.work</Text>
          </Link>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2: Platform Performance */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {dashboardData.brand_logo ? (
            <Image src={dashboardData.brand_logo} style={styles.brandLogo} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: 700 }}>{dashboardData.brand_name}</Text>
          )}
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Image src={FUTUREPROOF_LOGO} style={styles.futureproofLogo} />
          </View>
        </View>

        {/* Platform Performance */}
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

        {/* Brand Rankings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Competitive Landscape</Text>
            <Text style={styles.sectionSubtitle}>Share of voice rankings</Text>
          </View>
          {(dashboardData.brand_rankings || []).slice(0, 10).map((brand, i) => (
            <View
              key={i}
              style={[
                styles.rankingRow,
                brand.is_tracked_brand && styles.rankingRowHighlight
              ]}
            >
              <View style={[
                styles.rankNumber,
                brand.is_tracked_brand && styles.rankNumberHighlight
              ]}>
                <Text style={[
                  styles.rankNumberText,
                  brand.is_tracked_brand && styles.rankNumberTextHighlight
                ]}>{i + 1}</Text>
              </View>
              <Text style={[
                styles.rankBrand,
                brand.is_tracked_brand && styles.rankBrandHighlight
              ]}>{brand.brand}</Text>
              <Text style={styles.rankMentions}>{brand.mentions} mentions</Text>
              <Text style={styles.rankShare}>{brand.share_of_voice}%</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AI Visibility Report for {dashboardData.brand_name}</Text>
          <Link src={SIGNUP_URL}>
            <Text style={styles.footerLink}>futureproof.work</Text>
          </Link>
          <Text style={styles.pageNumber}>Page 2</Text>
        </View>
      </Page>

      {/* Page 3: Recommendations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {dashboardData.brand_logo ? (
            <Image src={dashboardData.brand_logo} style={styles.brandLogo} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: 700 }}>{dashboardData.brand_name}</Text>
          )}
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>Powered by</Text>
            <Image src={FUTUREPROOF_LOGO} style={styles.futureproofLogo} />
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <Text style={styles.sectionSubtitle}>How to improve your AI visibility</Text>
          </View>
          {(dashboardData.recommendations || []).slice(0, 6).map((rec, i) => (
            <View key={i} style={styles.recommendationCard}>
              <Text style={styles.recommendationTitle}>{rec.title || rec.action || `Recommendation ${i + 1}`}</Text>
              <Text style={styles.recommendationDesc}>{rec.description || rec.impact || ''}</Text>
            </View>
          ))}
        </View>

        {/* Final CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Dominate AI Search?</Text>
          <Text style={styles.ctaText}>
            Join leading brands using FutureProof to optimize their AI visibility.
            Get real-time monitoring, competitive insights, and actionable recommendations.
          </Text>
          <Link src={SIGNUP_URL} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Start Your Free Trial</Text>
          </Link>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>AI Visibility Report for {dashboardData.brand_name}</Text>
          <Link src={SIGNUP_URL}>
            <Text style={styles.footerLink}>futureproof.work</Text>
          </Link>
          <Text style={styles.pageNumber}>Page 3</Text>
        </View>
      </Page>
    </Document>
  );
};

export default BrandedPDFReport;
