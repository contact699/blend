/**
 * Profile Completeness Calculator
 * Calculates how complete a user's profile is based on multiple factors
 */

import { Profile } from '@/lib/types';
import { ProfileCompletenessBreakdown } from '@/lib/types/trust-signals';
import { supabase } from '@/lib/supabase';

class ProfileCompletenessCalculator {
  /**
   * Calculate profile completeness breakdown
   */
  async calculateCompleteness(profile: Profile): Promise<ProfileCompletenessBreakdown> {
    const sections = {
      // Basic Info (20%) - name, age, gender, location
      basic_info: {
        complete: this.checkBasicInfo(profile),
        weight: 20,
      },

      // Photos (20%) - at least 3 photos
      photos: {
        complete: this.checkPhotos(profile),
        weight: 20,
      },

      // Bio (15%) - at least 100 characters
      bio: {
        complete: this.checkBio(profile),
        weight: 15,
      },

      // Relationship Style (10%) - selected relationship style
      relationship_style: {
        complete: await this.checkRelationshipStyle(profile.user_id),
        weight: 10,
      },

      // Interests (10%) - at least 3 interests
      interests: {
        complete: await this.checkInterests(profile.user_id),
        weight: 10,
      },

      // Consent Checklist (10%) - filled out
      consent_checklist: {
        complete: await this.checkConsentChecklist(profile.user_id),
        weight: 10,
      },

      // Partner Links (10%) - at least 1 partner
      partner_links: {
        complete: await this.checkPartnerLinks(profile.user_id),
        weight: 10,
      },

      // Video Profile (5%) - uploaded video
      video_profile: {
        complete: await this.checkVideoProfile(profile.id),
        weight: 5,
      },
    };

    // Calculate overall completeness
    let overall = 0;
    Object.entries(sections).forEach(([_, section]) => {
      if (section.complete) {
        overall += section.weight;
      }
    });

    return {
      overall,
      sections,
    };
  }

  /**
   * Check basic info completeness
   */
  private checkBasicInfo(profile: Profile): boolean {
    return !!(
      profile.display_name &&
      profile.age &&
      profile.city
    );
  }

  /**
   * Check photos completeness
   */
  private checkPhotos(profile: Profile): boolean {
    return (profile.photos?.length || 0) >= 3;
  }

  /**
   * Check bio completeness
   */
  private checkBio(profile: Profile): boolean {
    return (profile.bio?.length || 0) >= 100;
  }

  /**
   * Check relationship style completeness
   */
  private async checkRelationshipStyle(userId: string): Promise<boolean> {
    try {
      // Check if user has selected relationship style preferences
      // This would typically be stored in a preferences table
      // For now, we'll check if the profile has relationship_style field
      const { data } = await supabase
        .from('profiles')
        .select('relationship_style')
        .eq('user_id', userId)
        .single();

      return !!data?.relationship_style;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check interests completeness
   */
  private async checkInterests(userId: string): Promise<boolean> {
    try {
      // TODO: Implement interests checking when interests table exists
      // const { count } = await supabase
      //   .from('user_interests')
      //   .select('*', { count: 'exact', head: true })
      //   .eq('user_id', userId);

      // return (count || 0) >= 3;

      // For now, return false
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check consent checklist completeness
   */
  private async checkConsentChecklist(userId: string): Promise<boolean> {
    try {
      const { count } = await supabase
        .from('consent_checklist_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // At least 10 items filled out (out of 26 total)
      return (count || 0) >= 10;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check partner links completeness
   */
  private async checkPartnerLinks(userId: string): Promise<boolean> {
    try {
      const { count } = await supabase
        .from('partner_links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      return (count || 0) >= 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check video profile completeness
   */
  private async checkVideoProfile(profileId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('video_profiles')
        .select('id')
        .eq('profile_id', profileId)
        .eq('moderation_status', 'approved')
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get incomplete sections
   */
  async getIncompleteSections(profile: Profile): Promise<Array<{
    section: string;
    label: string;
    description: string;
    weight: number;
  }>> {
    const completeness = await this.calculateCompleteness(profile);
    const incomplete: Array<{
      section: string;
      label: string;
      description: string;
      weight: number;
    }> = [];

    const labels: Record<string, { label: string; description: string }> = {
      basic_info: {
        label: 'Basic Info',
        description: 'Add your name, age, and location',
      },
      photos: {
        label: 'Photos',
        description: 'Upload at least 3 photos',
      },
      bio: {
        label: 'Bio',
        description: 'Write a bio with at least 100 characters',
      },
      relationship_style: {
        label: 'Relationship Style',
        description: 'Select your relationship preferences',
      },
      interests: {
        label: 'Interests',
        description: 'Add at least 3 interests',
      },
      consent_checklist: {
        label: 'Consent Checklist',
        description: 'Fill out your consent preferences',
      },
      partner_links: {
        label: 'Partner Links',
        description: 'Link at least one partner',
      },
      video_profile: {
        label: 'Video Profile',
        description: 'Upload a video introduction',
      },
    };

    Object.entries(completeness.sections).forEach(([key, section]) => {
      if (!section.complete) {
        incomplete.push({
          section: key,
          label: labels[key].label,
          description: labels[key].description,
          weight: section.weight,
        });
      }
    });

    // Sort by weight (highest first)
    incomplete.sort((a, b) => b.weight - a.weight);

    return incomplete;
  }

  /**
   * Update profile completeness in database
   */
  async updateCompletenessInDatabase(userId: string, completeness: number): Promise<void> {
    try {
      await supabase
        .from('activity_metrics')
        .upsert({
          user_id: userId,
          profile_completeness: completeness,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to update profile completeness:', error);
    }
  }
}

// Export singleton instance
export const profileCompletenessCalculator = new ProfileCompletenessCalculator();
