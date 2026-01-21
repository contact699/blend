/**
 * Profile Text Scam Scanner
 * Detects scam language and copy-paste profiles using Claude AI
 */

import Anthropic from '@anthropic-ai/sdk';
import { ProfileTextAnalysis } from '@/lib/types/trust-signals';
import { supabase } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
});

class ProfileTextScanner {
  /**
   * Scan profile text for scam indicators
   */
  async scanProfileText(
    userId: string,
    profileText: {
      bio: string;
      display_name: string;
      interests?: string[];
    }
  ): Promise<ProfileTextAnalysis> {
    try {
      const analysis = await this.analyzeWithAI(profileText);

      // Save to database
      await this.saveAnalysisResult(userId, analysis);

      // Create report if scam detected
      if (analysis.scam_probability >= 60 || analysis.flagged_phrases.length >= 3) {
        await this.createSuspiciousReport(userId, analysis);
      }

      return analysis;
    } catch (error) {
      console.error('Profile text scanning failed:', error);
      throw error;
    }
  }

  /**
   * Analyze profile text with Claude AI
   */
  private async analyzeWithAI(profileText: {
    bio: string;
    display_name: string;
    interests?: string[];
  }): Promise<ProfileTextAnalysis> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a scam detector for a dating app. Analyze this profile for scam indicators.

PROFILE DATA:
Name: ${profileText.display_name}
Bio: ${profileText.bio}
Interests: ${profileText.interests?.join(', ') || 'None'}

SCAM INDICATORS:
1. Too-good-to-be-true descriptions (model, rich, generous, etc.)
2. Requests for money, gifts, or financial info
3. External contact info (phone, WhatsApp, Telegram, email)
4. Cryptocurrency or investment mentions
5. Links to external sites
6. Overly sexual or explicit language
7. Professional/commercial language (escort, sugar daddy/baby)
8. Copy-paste generic bios
9. Poor grammar/translation artifacts (foreign scammers)
10. Urgency language ("limited time", "act now")

LEGITIMATE INDICATORS:
1. Personal, authentic language
2. Specific details and preferences
3. Humor and personality
4. ENM/polyamory-specific content
5. Local references
6. Normal typos and informal language

Respond in JSON:
{
  "scam_probability_percentage": 0-100,
  "flagged_phrases": ["phrase1", "phrase2"],
  "scam_type": "financial" | "catfish" | "commercial" | "spam" | "none",
  "is_copy_paste": true/false,
  "copy_paste_likelihood_percentage": 0-100,
  "language_consistency_percentage": 0-100,
  "suspicious_reasons": ["reason1", "reason2"],
  "is_likely_scam": true/false
}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const result = JSON.parse(content.text);

      return {
        scam_probability: result.scam_probability_percentage,
        flagged_phrases: result.flagged_phrases,
        language_consistency: result.language_consistency_percentage,
        copy_paste_likelihood: result.copy_paste_likelihood_percentage,
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        scam_probability: 0,
        flagged_phrases: [],
        language_consistency: 100,
        copy_paste_likelihood: 0,
      };
    }
  }

  /**
   * Quick scam check using regex patterns
   */
  quickScamCheck(text: string): { is_suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Financial scam keywords
    const financialKeywords =
      /\b(bitcoin|crypto|investment|forex|trading|send money|western union|paypal|venmo|cashapp|zelle|wire transfer|bank account|routing number)\b/i;
    if (financialKeywords.test(text)) {
      reasons.push('Contains financial/cryptocurrency keywords');
    }

    // External contact info
    const contactInfo =
      /\b(\d{10}|\+\d{11}|whatsapp|telegram|kik|wickr|snapchat:|snap:|insta:|ig:)\b/i;
    if (contactInfo.test(text)) {
      reasons.push('Contains external contact information');
    }

    // URLs
    const urls = /(https?:\/\/|www\.|\.com|\.net|\.org|\.io)/i;
    if (urls.test(text)) {
      reasons.push('Contains URLs or web links');
    }

    // Commercial language
    const commercial = /\b(escort|sugar daddy|sugar baby|arrangement|allowance|ppm|cpm)\b/i;
    if (commercial.test(text)) {
      reasons.push('Contains commercial/transactional language');
    }

    // Overly sexual (spam/catfish)
    const explicitCount = (
      text.match(/\b(sex|fuck|cock|pussy|dick|cum|horny|nude|naked)\b/gi) || []
    ).length;
    if (explicitCount >= 5) {
      reasons.push('Excessive explicit sexual language');
    }

    // Generic templates
    const genericPhrases = [
      'looking for fun',
      'no drama',
      'new to the area',
      'just seeing what is out there',
      'here for a good time not a long time',
    ];
    const genericCount = genericPhrases.filter((phrase) =>
      text.toLowerCase().includes(phrase)
    ).length;
    if (genericCount >= 3) {
      reasons.push('Multiple generic template phrases');
    }

    // Urgency language
    const urgency = /\b(limited time|act now|hurry|asap|immediate|urgent)\b/i;
    if (urgency.test(text)) {
      reasons.push('Contains urgency/pressure language');
    }

    return {
      is_suspicious: reasons.length >= 2,
      reasons,
    };
  }

  /**
   * Detect if profile bio is copy-pasted from another source
   */
  async detectCopyPaste(bio: string): Promise<{
    is_copy_paste: boolean;
    confidence: number;
    similar_profiles_found: number;
  }> {
    try {
      // Search for similar bios in database
      const { data: similarProfiles } = await supabase
        .from('profiles')
        .select('bio')
        .ilike('bio', `%${bio.substring(0, 50)}%`)
        .limit(10);

      const similarCount = similarProfiles?.length || 0;

      // If 3+ profiles have same bio, it's likely copy-paste
      const is_copy_paste = similarCount >= 3;
      const confidence = Math.min(similarCount * 30, 100);

      return {
        is_copy_paste,
        confidence,
        similar_profiles_found: similarCount,
      };
    } catch (error) {
      console.error('Copy-paste detection failed:', error);
      return {
        is_copy_paste: false,
        confidence: 0,
        similar_profiles_found: 0,
      };
    }
  }

  /**
   * Save analysis result to database
   */
  private async saveAnalysisResult(
    userId: string,
    analysis: ProfileTextAnalysis
  ): Promise<void> {
    try {
      const status =
        analysis.scam_probability >= 80
          ? 'fail'
          : analysis.scam_probability >= 60
            ? 'review_needed'
            : 'pass';

      await supabase.from('ai_verifications').insert({
        user_id: userId,
        verification_type: 'profile_text',
        status,
        confidence_score: 100 - analysis.scam_probability,
        details: {
          flagged_phrases: analysis.flagged_phrases,
          copy_paste_likelihood: analysis.copy_paste_likelihood,
          language_consistency: analysis.language_consistency,
        },
        flagged_reasons: analysis.flagged_phrases,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save profile text analysis:', error);
    }
  }

  /**
   * Create suspicious account report
   */
  private async createSuspiciousReport(
    userId: string,
    analysis: ProfileTextAnalysis
  ): Promise<void> {
    try {
      const severity =
        analysis.scam_probability >= 90
          ? 'critical'
          : analysis.scam_probability >= 70
            ? 'high'
            : 'medium';

      await supabase.from('suspicious_account_reports').insert({
        reported_user_id: userId,
        report_type: 'ai_flagged',
        severity,
        reason: 'Profile text contains scam indicators',
        details: {
          scam_probability: analysis.scam_probability,
          flagged_phrases: analysis.flagged_phrases,
          copy_paste_likelihood: analysis.copy_paste_likelihood,
        },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`🚨 Created scam profile report for user ${userId} (${severity})`);
    } catch (error) {
      console.error('Failed to create suspicious report:', error);
    }
  }

  /**
   * Batch scan all profiles (run periodically)
   */
  async batchScanProfiles(limit: number = 100): Promise<{
    scanned: number;
    flagged: number;
  }> {
    try {
      // Get profiles without recent scans
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, bio')
        .limit(limit);

      if (!profiles) return { scanned: 0, flagged: 0 };

      let flagged = 0;

      for (const profile of profiles) {
        if (!profile.bio || profile.bio.length < 20) continue;

        const analysis = await this.scanProfileText(profile.user_id, {
          bio: profile.bio,
          display_name: profile.display_name,
        });

        if (analysis.scam_probability >= 60) {
          flagged++;
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`✅ Batch scan complete: ${profiles.length} scanned, ${flagged} flagged`);

      return {
        scanned: profiles.length,
        flagged,
      };
    } catch (error) {
      console.error('Batch scan failed:', error);
      return { scanned: 0, flagged: 0 };
    }
  }
}

// Export singleton instance
export const profileTextScanner = new ProfileTextScanner();
