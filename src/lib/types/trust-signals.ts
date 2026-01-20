/**
 * Trust Signals System Types
 * Replaces the old verification/trust score system with multiple independent signals
 */

// ============================================================================
// Community Vouching
// ============================================================================

export type VouchStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface Vouch {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: VouchStatus;
  relationship: 'met_irl' | 'partner' | 'friend' | 'event_cohost' | 'community_member';
  message: string | null; // Optional message about how they know the person
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  revoked_at: string | null;
  rejection_reason: string | null;
}

export interface VouchRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  created_at: string;
}

// ============================================================================
// Activity Tracking
// ============================================================================

export interface ActivityMetrics {
  user_id: string;
  last_active_at: string;
  account_created_at: string;
  message_count: number;
  average_response_time_hours: number | null; // null = no messages yet
  response_rate: number; // 0-100%
  event_attendance_count: number;
  profile_views_received: number;
  profile_completeness: number; // 0-100%
  updated_at: string;
}

export interface ActivityStatus {
  status: 'active_now' | 'active_today' | 'active_this_week' | 'active_this_month' | 'inactive';
  label: string;
  color: string;
}

// ============================================================================
// Trust Signals
// ============================================================================

export interface TrustSignal {
  type: TrustSignalType;
  label: string;
  icon: string;
  earned_at: string | null;
  value?: number | string; // For signals with values (e.g., vouch count)
}

export type TrustSignalType =
  | 'community_vouches'
  | 'account_age'
  | 'active_status'
  | 'response_rate'
  | 'profile_completeness'
  | 'event_attendance'
  | 'partner_links'
  | 'video_profile'
  | 'photo_verified'
  | 'phone_verified'
  | 'id_verified'
  | 'ai_verified';

export interface TrustSignals {
  community_vouches: number;
  account_age_days: number;
  active_status: ActivityStatus;
  response_rate: number | null;
  profile_completeness: number;
  event_attendance_count: number;
  partner_count: number;
  has_video_profile: boolean;
  is_photo_verified: boolean;
  is_phone_verified: boolean;
  is_id_verified: boolean;
  is_ai_verified: boolean;
}

// ============================================================================
// Profile Completeness
// ============================================================================

export interface ProfileCompletenessBreakdown {
  overall: number; // 0-100%
  sections: {
    basic_info: { complete: boolean; weight: number }; // name, age, gender, location
    photos: { complete: boolean; weight: number }; // at least 3 photos
    bio: { complete: boolean; weight: number }; // at least 100 chars
    relationship_style: { complete: boolean; weight: number }; // selected style
    interests: { complete: boolean; weight: number }; // at least 3 interests
    consent_checklist: { complete: boolean; weight: number }; // filled out
    partner_links: { complete: boolean; weight: number }; // at least 1 partner
    video_profile: { complete: boolean; weight: number }; // uploaded video
  };
}

// ============================================================================
// Search Filters
// ============================================================================

export interface TrustSignalFilters {
  min_vouches?: number; // minimum community vouches
  min_account_age_days?: number; // minimum account age
  must_be_active_within?: 'day' | 'week' | 'month'; // last active
  min_response_rate?: number; // minimum response rate (0-100)
  min_profile_completeness?: number; // minimum completeness (0-100)
  min_event_attendance?: number; // minimum events attended
  min_partner_links?: number; // minimum verified partners
  must_have_video?: boolean; // must have video profile
  must_be_photo_verified?: boolean;
  must_be_phone_verified?: boolean;
  must_be_id_verified?: boolean;
  must_be_ai_verified?: boolean;
}

// ============================================================================
// AI Verification
// ============================================================================

export interface AIVerificationResult {
  id: string;
  user_id: string;
  verification_type: 'photo_consistency' | 'message_pattern' | 'profile_text';
  status: 'pending' | 'pass' | 'fail' | 'review_needed';
  confidence_score: number; // 0-100%
  details: Record<string, any>;
  flagged_reasons: string[];
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoConsistencyCheck {
  photos_analyzed: number;
  same_person_confidence: number; // 0-100%
  faces_detected: number;
  inconsistencies: string[];
}

export interface MessagePatternAnalysis {
  messages_analyzed: number;
  bot_probability: number; // 0-100%
  suspicious_patterns: string[];
  response_time_variance: number;
}

export interface ProfileTextAnalysis {
  scam_probability: number; // 0-100%
  flagged_phrases: string[];
  language_consistency: number; // 0-100%
  copy_paste_likelihood: number; // 0-100%
}

// ============================================================================
// Review Queue
// ============================================================================

export interface SuspiciousAccountReport {
  id: string;
  reported_user_id: string;
  report_type: 'ai_flagged' | 'user_reported' | 'pattern_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  details: Record<string, any>;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  assigned_to: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface VouchStats {
  total_vouches: number;
  pending_requests: number;
  given_vouches: number;
  received_vouches: number;
}

export interface TrustLevel {
  level: 'newcomer' | 'community_member' | 'trusted_member' | 'well_connected';
  label: string;
  color: string;
  minVouches: number;
}

export const TRUST_LEVELS: Record<string, TrustLevel> = {
  newcomer: {
    level: 'newcomer',
    label: 'Newcomer',
    color: '#6b7280',
    minVouches: 0,
  },
  community_member: {
    level: 'community_member',
    label: 'Community Member',
    color: '#3b82f6',
    minVouches: 1,
  },
  trusted_member: {
    level: 'trusted_member',
    label: 'Trusted Member',
    color: '#8b5cf6',
    minVouches: 3,
  },
  well_connected: {
    level: 'well_connected',
    label: 'Well-Connected',
    color: '#ec4899',
    minVouches: 6,
  },
};

export function getTrustLevel(vouchCount: number): TrustLevel {
  if (vouchCount >= 6) return TRUST_LEVELS.well_connected;
  if (vouchCount >= 3) return TRUST_LEVELS.trusted_member;
  if (vouchCount >= 1) return TRUST_LEVELS.community_member;
  return TRUST_LEVELS.newcomer;
}
