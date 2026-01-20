/**
 * Premium Subscription & Monetization Types
 *
 * Defines subscription tiers, virtual goods, and monetization features
 */

export type SubscriptionTier = 'free' | 'premium' | 'premium_plus';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'past_due' | 'canceled' | 'expired';

  // Billing
  billing_cycle: 'monthly' | 'yearly';
  amount: number; // cents
  currency: string;

  // Stripe/RevenueCat integration
  provider: 'stripe' | 'apple' | 'google';
  provider_subscription_id: string;
  provider_customer_id: string;

  // Dates
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  canceled_at: string | null;
  trial_end: string | null;

  created_at: string;
  updated_at: string;
}

export interface SubscriptionFeatures {
  // Likes
  daily_likes_limit: number | null; // null = unlimited
  super_likes_per_month: number;

  // Discovery
  advanced_filters: boolean;
  see_who_liked_you: boolean;
  profile_boost_per_month: number;

  // Privacy
  incognito_mode: boolean;
  hide_from_non_premium: boolean;
  blur_photos_until_match: boolean;

  // Events
  events_per_month: number | null; // null = unlimited
  promoted_event_listings: boolean;

  // Messaging
  read_receipts: boolean;
  priority_messages: boolean;
  unlimited_rewinds: boolean;

  // Profile
  video_profile_slots: number;
  verified_badge_fast_track: boolean;

  // Other
  no_ads: boolean;
  priority_support: boolean;
  relationship_os_access: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    daily_likes_limit: 10,
    super_likes_per_month: 0,
    advanced_filters: false,
    see_who_liked_you: false,
    profile_boost_per_month: 0,
    incognito_mode: false,
    hide_from_non_premium: false,
    blur_photos_until_match: false,
    events_per_month: 1,
    promoted_event_listings: false,
    read_receipts: false,
    priority_messages: false,
    unlimited_rewinds: false,
    video_profile_slots: 1,
    verified_badge_fast_track: false,
    no_ads: false,
    priority_support: false,
    relationship_os_access: false,
  },
  premium: {
    daily_likes_limit: null, // unlimited
    super_likes_per_month: 5,
    advanced_filters: true,
    see_who_liked_you: true,
    profile_boost_per_month: 2,
    incognito_mode: false,
    hide_from_non_premium: false,
    blur_photos_until_match: false,
    events_per_month: null, // unlimited
    promoted_event_listings: true,
    read_receipts: false,
    priority_messages: true,
    unlimited_rewinds: false,
    video_profile_slots: 3,
    verified_badge_fast_track: false,
    no_ads: true,
    priority_support: true,
    relationship_os_access: false,
  },
  premium_plus: {
    daily_likes_limit: null, // unlimited
    super_likes_per_month: 20,
    advanced_filters: true,
    see_who_liked_you: true,
    profile_boost_per_month: 5,
    incognito_mode: true,
    hide_from_non_premium: true,
    blur_photos_until_match: true,
    events_per_month: null, // unlimited
    promoted_event_listings: true,
    read_receipts: true,
    priority_messages: true,
    unlimited_rewinds: true,
    video_profile_slots: 10,
    verified_badge_fast_track: true,
    no_ads: true,
    priority_support: true,
    relationship_os_access: true,
  },
};

// Virtual Goods
export interface SuperLike {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null; // Optional ice breaker
  seen: boolean;
  created_at: string;
}

export interface ProfileBoost {
  id: string;
  user_id: string;
  profile_id: string;
  duration_minutes: number; // Usually 30
  started_at: string;
  ends_at: string;
  impressions: number; // How many people saw it
  likes_gained: number;
  status: 'active' | 'completed' | 'canceled';
  created_at: string;
}

export interface VirtualGift {
  id: string;
  code: string; // 'roses', 'champagne', 'heart', etc.
  name: string;
  description: string;
  animation_url: string;
  price_cents: number;
  category: 'romantic' | 'playful' | 'spicy' | 'appreciation';
}

export interface SentGift {
  id: string;
  gift_id: string;
  from_user_id: string;
  to_user_id: string;
  thread_id: string;
  message: string | null;
  viewed_at: string | null;
  created_at: string;
}

// Usage Tracking
export interface DailyUsage {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD

  likes_used: number;
  super_likes_used: number;
  boosts_used: number;
  rewinds_used: number;

  created_at: string;
  updated_at: string;
}

// In-App Purchases
export interface PurchasableItem {
  id: string;
  type: 'super_like_pack' | 'boost' | 'gift';
  name: string;
  description: string;
  price_cents: number;
  quantity: number | null; // null for single items

  // App Store / Play Store product IDs
  apple_product_id: string;
  google_product_id: string;

  discount_percentage: number | null;
  is_featured: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  item_id: string;

  quantity: number;
  amount_cents: number;
  currency: string;

  provider: 'stripe' | 'apple' | 'google';
  provider_transaction_id: string;

  status: 'pending' | 'completed' | 'failed' | 'refunded';

  created_at: string;
  updated_at: string;
}

// Referral Program
export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;

  status: 'pending' | 'completed' | 'expired';

  // Rewards
  referrer_reward_type: 'premium_days' | 'credits' | 'super_likes';
  referrer_reward_amount: number;
  referrer_reward_claimed: boolean;

  referred_reward_type: 'premium_days' | 'credits' | 'super_likes';
  referred_reward_amount: number;
  referred_reward_claimed: boolean;

  // Conditions
  required_action: 'signup' | 'first_match' | 'premium_purchase';
  completed_at: string | null;

  created_at: string;
  expires_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string; // e.g., "ALEX2024"
  uses: number;
  max_uses: number | null; // null = unlimited
  active: boolean;
  created_at: string;
}

// Verification System (replacing Trust Scores)
export type VerificationType =
  | 'id_verified'
  | 'photo_verified'
  | 'video_verified'
  | 'phone_verified'
  | 'email_verified'
  | 'sti_verified'
  | 'event_host'
  | 'community_vouched';

export interface Verification {
  id: string;
  user_id: string;
  profile_id: string;
  type: VerificationType;

  status: 'pending' | 'approved' | 'rejected' | 'expired';

  // Evidence/data
  evidence_url: string | null; // Photo, video, document
  verification_data: Record<string, any> | null;

  verified_at: string | null;
  expires_at: string | null;

  verified_by: string | null; // Admin user ID
  rejection_reason: string | null;

  created_at: string;
  updated_at: string;
}

// Community Vouch (replacing trust score vouching)
export interface CommunityVouch {
  id: string;
  voucher_id: string;
  vouched_user_id: string;

  relationship: 'friend' | 'partner' | 'metamour' | 'dated' | 'event_attendee';
  message: string;

  // Visibility
  is_public: boolean;
  show_voucher_name: boolean;

  created_at: string;
}

// Video Profiles
export interface VideoProfile {
  id: string;
  profile_id: string;
  user_id: string;

  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;

  // Moderation
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_notes: string | null;

  // Stats
  view_count: number;

  is_primary: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;
}

// Safety Features
export interface SafetyCheckIn {
  id: string;
  user_id: string;

  // Date details
  date_with_user_id: string;
  date_with_name: string;
  location: string;
  scheduled_time: string;

  // Trusted contact
  trusted_contact_name: string;
  trusted_contact_phone: string;
  trusted_contact_email: string;

  // Check-ins
  check_ins: Array<{
    scheduled_time: string;
    completed: boolean;
    completed_at: string | null;
    status: 'safe' | 'need_help' | 'missed';
  }>;

  // Emergency
  emergency_triggered: boolean;
  emergency_triggered_at: string | null;
  emergency_resolved_at: string | null;

  status: 'scheduled' | 'active' | 'completed' | 'emergency' | 'canceled';

  created_at: string;
  updated_at: string;
}

// Group Discovery (Couple Mode)
export interface GroupProfile {
  id: string;
  name: string;
  bio: string;

  member_profile_ids: string[];
  primary_profile_id: string; // Who manages it

  photos: Array<{
    storage_path: string;
    display_order: number;
  }>;

  // Discovery settings
  seeking: string[];
  intent_ids: string[];

  // Stats
  like_count: number;
  match_count: number;

  active: boolean;

  created_at: string;
  updated_at: string;
}

export interface GroupLike {
  id: string;
  from_group_id: string | null; // null if individual
  from_profile_id: string | null; // null if group
  to_group_id: string | null;
  to_profile_id: string | null;
  seen: boolean;
  created_at: string;
}

// Relationship Dashboard
export interface RelationshipNote {
  id: string;
  user_id: string;
  partner_user_id: string;

  title: string;
  content: string;
  category: 'preferences' | 'boundaries' | 'health' | 'dates' | 'general';

  is_shared: boolean; // Shared with partner

  created_at: string;
  updated_at: string;
}

export interface RelationshipCalendar {
  id: string;
  user_id: string;

  partner_user_id: string | null; // null for solo events
  partner_name: string;

  event_type: 'date' | 'anniversary' | 'check_in' | 'sti_test' | 'other';
  title: string;
  description: string;

  start_time: string;
  end_time: string;
  location: string | null;

  reminder_minutes: number[];

  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_end_date: string | null;

  created_at: string;
  updated_at: string;
}

// Educational Content
export interface EducationalCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  author_bio: string;

  thumbnail_url: string;

  category: 'communication' | 'jealousy' | 'boundaries' | 'safety' | 'sti' | 'relationships';
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  duration_minutes: number;
  lesson_count: number;

  // Pricing
  is_free: boolean;
  price_cents: number;
  included_in_premium: boolean;

  // Stats
  enrollment_count: number;
  rating: number;
  review_count: number;

  published: boolean;
  published_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  course_id: string;

  title: string;
  content: string; // Markdown
  video_url: string | null;

  display_order: number;
  duration_minutes: number;

  quiz_questions: Array<{
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    explanation: string;
  }>;

  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;

  progress: number; // 0-100
  completed_lessons: string[]; // lesson IDs

  started_at: string;
  completed_at: string | null;

  rating: number | null;
  review: string | null;

  created_at: string;
  updated_at: string;
}

// Analytics for premium features
export interface FeatureUsageAnalytics {
  user_id: string;
  date: string;

  // Discovery
  profiles_viewed: number;
  likes_sent: number;
  super_likes_sent: number;
  passes: number;

  // Matches
  matches_gained: number;
  messages_sent: number;
  messages_received: number;

  // Premium features
  advanced_searches: number;
  profile_boosts_used: number;
  incognito_sessions: number;

  // Revenue indicators
  conversion_opportunities_shown: number;
  conversion_opportunities_clicked: number;
}
