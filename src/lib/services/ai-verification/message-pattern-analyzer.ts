/**
 * Message Pattern Analyzer
 * Detects bot-like behavior in messaging patterns
 */

// @ts-expect-error - Optional dependency not installed yet
import Anthropic from '@anthropic-ai/sdk';
import { MessagePatternAnalysis } from '@/lib/types/trust-signals';
import { supabase } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
});

interface Message {
  from_user_id: string;
  to_user_id: string;
  content: string;
  created_at: string;
}

class MessagePatternAnalyzer {
  /**
   * Analyze user's messaging patterns for bot-like behavior
   */
  async analyzeMessagingPatterns(
    userId: string,
    minMessages: number = 20
  ): Promise<MessagePatternAnalysis> {
    try {
      // Get user's recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select('from_user_id, to_user_id, content, created_at')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!messages || messages.length < minMessages) {
        return {
          messages_analyzed: messages?.length || 0,
          bot_probability: 0,
          suspicious_patterns: [],
          response_time_variance: 0,
        };
      }

      // Analyze patterns
      const botProbability = await this.detectBotBehavior(userId, messages);
      const suspiciousPatterns = await this.findSuspiciousPatterns(userId, messages);
      const responseTimeVariance = this.calculateResponseTimeVariance(userId, messages);

      const analysis: MessagePatternAnalysis = {
        messages_analyzed: messages.length,
        bot_probability: botProbability,
        suspicious_patterns: suspiciousPatterns,
        response_time_variance: responseTimeVariance,
      };

      // Save to database
      await this.saveAnalysisResult(userId, analysis);

      // Create report if suspicious
      if (botProbability >= 70 || suspiciousPatterns.length >= 3) {
        await this.createSuspiciousReport(userId, analysis);
      }

      return analysis;
    } catch (error) {
      console.error('Message pattern analysis failed:', error);
      throw error;
    }
  }

  /**
   * Detect bot-like behavior using Claude AI
   */
  private async detectBotBehavior(userId: string, messages: Message[]): Promise<number> {
    try {
      // Get messages sent by user
      const userMessages = messages
        .filter((m) => m.from_user_id === userId)
        .slice(0, 30)
        .map((m) => m.content);

      if (userMessages.length < 10) return 0;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Use Haiku for speed/cost
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `You are analyzing messages from a dating app user to detect bot behavior.

Analyze these ${userMessages.length} messages and determine if they exhibit bot-like patterns:

BOT INDICATORS:
1. Identical or nearly identical messages repeated
2. Generic template-like responses
3. Unnatural language patterns (too formal, too generic)
4. Lack of personalization or context awareness
5. Immediate responses to every message (no human delay)
6. Promotional language (links, offers, scams)
7. Inconsistent conversation flow
8. Repetitive phrases or structures

HUMAN INDICATORS:
1. Natural language variations
2. Typos, informal language
3. Context-aware responses
4. Personal details and stories
5. Emotional expression
6. Variable response times

Messages to analyze:
${userMessages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

Respond in JSON:
{
  "bot_probability_percentage": 0-100,
  "confidence": 0-100,
  "evidence": ["reason1", "reason2"],
  "is_likely_bot": true/false
}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const result = JSON.parse(content.text);
      return result.bot_probability_percentage;
    } catch (error) {
      console.error('Bot detection failed:', error);
      return 0;
    }
  }

  /**
   * Find suspicious messaging patterns
   */
  private async findSuspiciousPatterns(
    userId: string,
    messages: Message[]
  ): Promise<string[]> {
    const patterns: string[] = [];

    const userMessages = messages.filter((m) => m.from_user_id === userId);

    // Pattern 1: Too many identical messages
    const messageFrequency = new Map<string, number>();
    userMessages.forEach((msg) => {
      const count = messageFrequency.get(msg.content) || 0;
      messageFrequency.set(msg.content, count + 1);
    });

    for (const [message, count] of messageFrequency.entries()) {
      if (count >= 5 && message.length > 20) {
        patterns.push(`Identical message sent ${count} times: "${message.substring(0, 50)}..."`);
      }
    }

    // Pattern 2: Extremely fast response times (bot-like)
    const responseTimes = this.getResponseTimes(userId, messages);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    if (avgResponseTime < 10 && responseTimes.length >= 10) {
      // Average < 10 seconds
      patterns.push('Suspiciously fast response times (avg < 10 seconds)');
    }

    // Pattern 3: No variance in response times (bot scheduling)
    const variance = this.calculateVariance(responseTimes);
    if (variance < 100 && responseTimes.length >= 10) {
      patterns.push('No variance in response times (scheduled bot)');
    }

    // Pattern 4: Messages only during specific hours (bot schedule)
    const hourDistribution = new Map<number, number>();
    userMessages.forEach((msg) => {
      const hour = new Date(msg.created_at).getHours();
      hourDistribution.set(hour, (hourDistribution.get(hour) || 0) + 1);
    });

    const activeHours = Array.from(hourDistribution.keys()).filter((h) => hourDistribution.get(h)! > 0);
    if (activeHours.length <= 3 && userMessages.length >= 20) {
      patterns.push('Messages only sent during 3 or fewer hours (bot schedule)');
    }

    // Pattern 5: Same message to multiple different users
    const recipientMap = new Map<string, Set<string>>();
    userMessages.forEach((msg) => {
      if (!recipientMap.has(msg.content)) {
        recipientMap.set(msg.content, new Set());
      }
      recipientMap.get(msg.content)!.add(msg.to_user_id);
    });

    for (const [message, recipients] of recipientMap.entries()) {
      if (recipients.size >= 5 && message.length > 30) {
        patterns.push(`Same message sent to ${recipients.size} different users`);
      }
    }

    // Pattern 6: Messages contain URLs or promotional language
    const promotionalMessages = userMessages.filter((msg) =>
      /https?:\/\/|www\.|\.com|buy now|click here|limited time|offer|discount/i.test(
        msg.content
      )
    );

    if (promotionalMessages.length >= 5) {
      patterns.push('Multiple messages contain promotional/spam language');
    }

    return patterns;
  }

  /**
   * Calculate response time variance
   */
  private calculateResponseTimeVariance(userId: string, messages: Message[]): number {
    const responseTimes = this.getResponseTimes(userId, messages);
    return this.calculateVariance(responseTimes);
  }

  /**
   * Get response times in seconds
   */
  private getResponseTimes(userId: string, messages: Message[]): number[] {
    const times: number[] = [];

    // Sort by timestamp
    const sorted = [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // If current is received and next is sent by user
      if (current.to_user_id === userId && next.from_user_id === userId) {
        const diff =
          new Date(next.created_at).getTime() - new Date(current.created_at).getTime();
        const seconds = diff / 1000;
        times.push(seconds);
      }
    }

    return times;
  }

  /**
   * Calculate variance
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Save analysis result to database
   */
  private async saveAnalysisResult(
    userId: string,
    analysis: MessagePatternAnalysis
  ): Promise<void> {
    try {
      const status =
        analysis.bot_probability >= 80
          ? 'fail'
          : analysis.bot_probability >= 60
            ? 'review_needed'
            : 'pass';

      await supabase.from('ai_verifications').insert({
        user_id: userId,
        verification_type: 'message_pattern',
        status,
        confidence_score: 100 - analysis.bot_probability,
        details: {
          messages_analyzed: analysis.messages_analyzed,
          suspicious_patterns: analysis.suspicious_patterns,
          response_time_variance: analysis.response_time_variance,
        },
        flagged_reasons: analysis.suspicious_patterns,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save message analysis:', error);
    }
  }

  /**
   * Create suspicious account report
   */
  private async createSuspiciousReport(
    userId: string,
    analysis: MessagePatternAnalysis
  ): Promise<void> {
    try {
      const severity =
        analysis.bot_probability >= 90
          ? 'critical'
          : analysis.bot_probability >= 70
            ? 'high'
            : 'medium';

      await supabase.from('suspicious_account_reports').insert({
        reported_user_id: userId,
        report_type: 'pattern_detected',
        severity,
        reason: 'Bot-like messaging patterns detected',
        details: {
          bot_probability: analysis.bot_probability,
          messages_analyzed: analysis.messages_analyzed,
          suspicious_patterns: analysis.suspicious_patterns,
        },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`🚨 Created bot pattern report for user ${userId} (${severity})`);
    } catch (error) {
      console.error('Failed to create suspicious report:', error);
    }
  }

  /**
   * Quick bot check (for real-time use)
   */
  async quickBotCheck(userId: string, recentMessages: string[]): Promise<boolean> {
    if (recentMessages.length < 5) return false;

    // Simple heuristics for quick check
    const identicalCount = new Map<string, number>();
    recentMessages.forEach((msg) => {
      identicalCount.set(msg, (identicalCount.get(msg) || 0) + 1);
    });

    // If 50%+ messages are identical, likely bot
    for (const count of identicalCount.values()) {
      if (count / recentMessages.length >= 0.5) {
        return true;
      }
    }

    // Check for spam keywords
    const spamKeywords = /viagra|cialis|crypto|bitcoin|investment|xxx|porn|casino|pills/i;
    const spamCount = recentMessages.filter((msg) => spamKeywords.test(msg)).length;

    if (spamCount >= 3) {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const messagePatternAnalyzer = new MessagePatternAnalyzer();
