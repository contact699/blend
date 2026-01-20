/**
 * Photo Consistency AI Checker
 * Uses Claude Vision API to verify if multiple photos show the same person
 */

import Anthropic from '@anthropic-ai/sdk';
import { PhotoConsistencyCheck, AIVerificationResult } from '@/lib/types/trust-signals';
import { supabase } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
});

class PhotoConsistencyChecker {
  /**
   * Check if multiple photos show the same person
   */
  async checkPhotoConsistency(
    userId: string,
    photoUrls: string[]
  ): Promise<PhotoConsistencyCheck> {
    if (photoUrls.length < 2) {
      throw new Error('Need at least 2 photos for consistency check');
    }

    try {
      // Convert photo URLs to base64 or direct URLs for Claude
      const imageMessages = photoUrls.map((url) => ({
        type: 'image' as const,
        source: {
          type: 'url' as const,
          url,
        },
      }));

      // Call Claude Vision API
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a photo verification AI for a dating app. Analyze these ${photoUrls.length} photos and determine if they show the same person.

IMPORTANT INSTRUCTIONS:
1. Look for consistent facial features (eyes, nose, mouth, face shape)
2. Account for different angles, lighting, and expressions
3. Consider age differences (photos may be from different years)
4. Flag if photos appear to be of different people
5. Detect if any photos are AI-generated, stock photos, or celebrities
6. Note any suspicious patterns (all professional photos, all heavily filtered, etc.)

Respond in JSON format:
{
  "same_person": true/false,
  "confidence_percentage": 0-100,
  "faces_detected": number,
  "inconsistencies": ["reason1", "reason2"],
  "suspicious_patterns": ["pattern1", "pattern2"],
  "recommendation": "approve" | "review_needed" | "reject"
}`,
              },
              ...imageMessages,
            ],
          },
        ],
      });

      // Parse AI response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = JSON.parse(content.text);

      const consistencyCheck: PhotoConsistencyCheck = {
        photos_analyzed: photoUrls.length,
        same_person_confidence: result.confidence_percentage,
        faces_detected: result.faces_detected,
        inconsistencies: result.inconsistencies || [],
      };

      // Save verification result to database
      await this.saveVerificationResult(
        userId,
        'photo_consistency',
        result.recommendation === 'approve'
          ? 'pass'
          : result.recommendation === 'reject'
            ? 'fail'
            : 'review_needed',
        result.confidence_percentage,
        {
          same_person: result.same_person,
          faces_detected: result.faces_detected,
          suspicious_patterns: result.suspicious_patterns || [],
        },
        result.inconsistencies
      );

      return consistencyCheck;
    } catch (error) {
      console.error('Photo consistency check failed:', error);
      throw error;
    }
  }

  /**
   * Quick verification (2-3 photos only)
   */
  async quickVerification(userId: string, photoUrls: string[]): Promise<boolean> {
    try {
      const result = await this.checkPhotoConsistency(userId, photoUrls.slice(0, 3));
      return result.same_person_confidence >= 80 && result.inconsistencies.length === 0;
    } catch (error) {
      console.error('Quick verification failed:', error);
      return false;
    }
  }

  /**
   * Verify single new photo against existing photos
   */
  async verifySinglePhoto(
    userId: string,
    newPhotoUrl: string,
    existingPhotoUrls: string[]
  ): Promise<boolean> {
    if (existingPhotoUrls.length === 0) {
      // First photo, auto-approve
      return true;
    }

    try {
      // Check against 2 existing photos (for speed)
      const photosToCheck = [newPhotoUrl, ...existingPhotoUrls.slice(0, 2)];
      const result = await this.checkPhotoConsistency(userId, photosToCheck);

      return result.same_person_confidence >= 75 && result.inconsistencies.length === 0;
    } catch (error) {
      console.error('Single photo verification failed:', error);
      return false;
    }
  }

  /**
   * Detect if photo is AI-generated or stock photo
   */
  async detectFakePhoto(photoUrl: string): Promise<{
    is_fake: boolean;
    confidence: number;
    reason: string;
  }> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a photo authenticity detector for a dating app. Analyze this photo and determine if it's:
1. AI-generated (Midjourney, DALL-E, Stable Diffusion, etc.)
2. A stock photo (Shutterstock, Unsplash, etc.)
3. A celebrity photo
4. An authentic selfie/personal photo

Look for:
- Unnatural skin texture, eyes, or facial features (AI artifacts)
- Watermarks or stock photo signatures
- Professional studio quality (stock photos)
- Recognizable celebrities
- Natural imperfections (real photos have them)

Respond in JSON:
{
  "is_fake": true/false,
  "confidence_percentage": 0-100,
  "reason": "detailed explanation",
  "photo_type": "ai_generated" | "stock_photo" | "celebrity" | "authentic"
}`,
              },
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: photoUrl,
                },
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const result = JSON.parse(content.text);

      return {
        is_fake: result.is_fake,
        confidence: result.confidence_percentage,
        reason: result.reason,
      };
    } catch (error) {
      console.error('Fake photo detection failed:', error);
      return { is_fake: false, confidence: 0, reason: 'Detection failed' };
    }
  }

  /**
   * Save verification result to database
   */
  private async saveVerificationResult(
    userId: string,
    verificationType: 'photo_consistency',
    status: 'pass' | 'fail' | 'review_needed',
    confidence: number,
    details: Record<string, any>,
    flaggedReasons: string[]
  ): Promise<void> {
    try {
      const { error } = await supabase.from('ai_verifications').insert({
        user_id: userId,
        verification_type: verificationType,
        status,
        confidence_score: confidence,
        details,
        flagged_reasons: flaggedReasons,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // If passed, create a flag to show "AI Verified" badge
      if (status === 'pass' && confidence >= 85) {
        // User is verified!
        console.log(`✅ User ${userId} passed photo consistency check (${confidence}% confidence)`);
      } else if (status === 'fail' || flaggedReasons.length > 0) {
        // Create suspicious account report
        await this.createSuspiciousReport(userId, flaggedReasons, confidence, details);
      }
    } catch (error) {
      console.error('Failed to save verification result:', error);
    }
  }

  /**
   * Create suspicious account report
   */
  private async createSuspiciousReport(
    userId: string,
    reasons: string[],
    confidence: number,
    details: Record<string, any>
  ): Promise<void> {
    try {
      const severity =
        confidence >= 90 ? 'critical' : confidence >= 70 ? 'high' : 'medium';

      await supabase.from('suspicious_account_reports').insert({
        reported_user_id: userId,
        report_type: 'ai_flagged',
        severity,
        reason: 'Photo consistency check failed',
        details: {
          confidence,
          ...details,
        },
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`🚨 Created suspicious account report for user ${userId} (${severity})`);
    } catch (error) {
      console.error('Failed to create suspicious report:', error);
    }
  }

  /**
   * Re-verify all user photos (run periodically or on demand)
   */
  async reverifyUser(userId: string): Promise<AIVerificationResult | null> {
    try {
      // Get all user photos
      const { data: profile } = await supabase
        .from('profiles')
        .select('photos')
        .eq('user_id', userId)
        .single();

      if (!profile || !profile.photos || profile.photos.length < 2) {
        return null;
      }

      await this.checkPhotoConsistency(userId, profile.photos);

      // Return latest verification result
      const { data: verification } = await supabase
        .from('ai_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_type', 'photo_consistency')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return verification;
    } catch (error) {
      console.error('Re-verification failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const photoConsistencyChecker = new PhotoConsistencyChecker();
