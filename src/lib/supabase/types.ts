// Supabase Database Types
// All IDs use UUIDs to prevent IDOR attacks

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID
          email: string | null;
          phone: string | null;
          is_active: boolean;
          last_active_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          is_active?: boolean;
          last_active_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          is_active?: boolean;
          last_active_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string; // UUID
          user_id: string; // UUID - FK to users
          display_name: string;
          age: number;
          city: string;
          bio: string;
          pace_preference: 'slow' | 'medium' | 'fast';
          no_photos: boolean;
          open_to_meet: boolean;
          virtual_only: boolean;
          response_style: 'quick' | 'relaxed';
          voice_intro_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          age: number;
          city: string;
          bio?: string;
          pace_preference?: 'slow' | 'medium' | 'fast';
          no_photos?: boolean;
          open_to_meet?: boolean;
          virtual_only?: boolean;
          response_style?: 'quick' | 'relaxed';
          voice_intro_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          age?: number;
          city?: string;
          bio?: string;
          pace_preference?: 'slow' | 'medium' | 'fast';
          no_photos?: boolean;
          open_to_meet?: boolean;
          virtual_only?: boolean;
          response_style?: 'quick' | 'relaxed';
          voice_intro_url?: string | null;
          updated_at?: string;
        };
      };
      photos: {
        Row: {
          id: string; // UUID
          profile_id: string; // UUID - FK to profiles
          storage_path: string; // Path in private bucket
          order_index: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          storage_path: string;
          order_index?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          storage_path?: string;
          order_index?: number;
          is_primary?: boolean;
        };
      };
      intents: {
        Row: {
          id: string; // UUID
          label: string;
          description: string;
          emoji: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          label: string;
          description: string;
          emoji: string;
          is_active?: boolean;
        };
        Update: {
          label?: string;
          description?: string;
          emoji?: string;
          is_active?: boolean;
        };
      };
      profile_intents: {
        Row: {
          id: string; // UUID
          profile_id: string; // UUID - FK to profiles
          intent_id: string; // UUID - FK to intents
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          intent_id: string;
          created_at?: string;
        };
        Update: never;
      };
      prompt_responses: {
        Row: {
          id: string; // UUID
          profile_id: string; // UUID - FK to profiles
          prompt_id: string;
          prompt_text: string;
          response_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          prompt_id: string;
          prompt_text: string;
          response_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          response_text?: string;
          updated_at?: string;
        };
      };
      linked_partners: {
        Row: {
          id: string; // UUID
          profile_id: string; // UUID - FK to profiles
          name: string;
          age: number;
          photo_storage_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          age: number;
          photo_storage_path?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          age?: number;
          photo_storage_path?: string | null;
        };
      };
      matches: {
        Row: {
          id: string; // UUID
          user_1_id: string; // UUID - FK to users
          user_2_id: string; // UUID - FK to users
          status: 'pending' | 'active' | 'archived';
          matched_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_1_id: string;
          user_2_id: string;
          status?: 'pending' | 'active' | 'archived';
          matched_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'active' | 'archived';
          updated_at?: string;
        };
      };
      match_intents: {
        Row: {
          id: string; // UUID
          match_id: string; // UUID - FK to matches
          intent_id: string; // UUID - FK to intents
        };
        Insert: {
          id?: string;
          match_id: string;
          intent_id: string;
        };
        Update: never;
      };
      chat_threads: {
        Row: {
          id: string; // UUID
          match_id: string; // UUID - FK to matches
          unlocked: boolean;
          first_message_type: 'prompt' | 'reaction' | 'voice' | null;
          is_group: boolean;
          group_name: string | null;
          group_photo_path: string | null;
          created_by: string | null; // UUID - FK to users
          last_message_at: string | null;
          archived_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          unlocked?: boolean;
          first_message_type?: 'prompt' | 'reaction' | 'voice' | null;
          is_group?: boolean;
          group_name?: string | null;
          group_photo_path?: string | null;
          created_by?: string | null;
          last_message_at?: string | null;
          archived_at?: string | null;
          created_at?: string;
        };
        Update: {
          unlocked?: boolean;
          first_message_type?: 'prompt' | 'reaction' | 'voice' | null;
          group_name?: string | null;
          group_photo_path?: string | null;
          last_message_at?: string | null;
          archived_at?: string | null;
        };
      };
      chat_participants: {
        Row: {
          id: string; // UUID
          thread_id: string; // UUID - FK to chat_threads
          user_id: string; // UUID - FK to users
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          thread_id: string;
          user_id: string;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          left_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string; // UUID
          thread_id: string; // UUID - FK to chat_threads
          sender_id: string; // UUID - FK to users
          message_type: 'text' | 'voice' | 'system' | 'image' | 'video' | 'video_call';
          content: string;
          media_storage_path: string | null;
          media_thumbnail_path: string | null;
          is_first_message: boolean;
          call_status: 'started' | 'ended' | 'missed' | null;
          call_duration: number | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          message_type?: 'text' | 'voice' | 'system' | 'image' | 'video' | 'video_call';
          content: string;
          media_storage_path?: string | null;
          media_thumbnail_path?: string | null;
          is_first_message?: boolean;
          call_status?: 'started' | 'ended' | 'missed' | null;
          call_duration?: number | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          content?: string;
          read_at?: string | null;
        };
      };
      likes: {
        Row: {
          id: string; // UUID
          from_user_id: string; // UUID - FK to users
          to_user_id: string; // UUID - FK to users
          seen: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          seen?: boolean;
          created_at?: string;
        };
        Update: {
          seen?: boolean;
        };
      };
      pinds: {
        Row: {
          id: string; // UUID
          from_user_id: string; // UUID - FK to users
          to_user_id: string; // UUID - FK to users
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          message?: string;
          read?: boolean;
        };
      };
      blocked_users: {
        Row: {
          id: string; // UUID
          blocker_id: string; // UUID - FK to users
          blocked_id: string; // UUID - FK to users
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      reports: {
        Row: {
          id: string; // UUID
          reporter_id: string; // UUID - FK to users
          reported_user_id: string; // UUID - FK to users
          reason: string;
          details: string | null;
          status: 'pending' | 'reviewed' | 'resolved';
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id: string;
          reason: string;
          details?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved';
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'reviewed' | 'resolved';
          reviewed_at?: string | null;
        };
      };
      partner_links: {
        Row: {
          id: string; // UUID
          profile_id: string; // UUID - FK to profiles
          invited_email: string | null; // Email of invited partner
          linked_user_id: string | null; // UUID - FK to users (if partner has an account)
          relationship_type: string; // anchor, nesting_partner, partner, dating, comet, meta, fwb
          status: 'pending' | 'confirmed' | 'declined';
          name: string; // Display name for the partner
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          invited_email?: string | null;
          linked_user_id?: string | null;
          relationship_type: string;
          status?: 'pending' | 'confirmed' | 'declined';
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          invited_email?: string | null;
          linked_user_id?: string | null;
          relationship_type?: string;
          status?: 'pending' | 'confirmed' | 'declined';
          name?: string;
          updated_at?: string;
        };
      };
      trust_scores: {
        Row: {
          id: string; // UUID
          user_id: string; // UUID - FK to users
          overall_score: number; // 0-100
          tier: 'newcomer' | 'member' | 'trusted' | 'verified' | 'ambassador';
          badges: string[]; // Array of badge IDs
          dimensions: {
            behavior: { score: number; description: string };
            community: { score: number; description: string };
            reliability: { score: number; description: string };
            safety: { score: number; description: string };
            engagement: { score: number; description: string };
            transparency: { score: number; description: string };
          };
          stats: {
            dates_completed: number;
            events_attended: number;
            events_hosted: number;
            reviews_received: number;
            average_rating: number;
            vouches_received: number;
            response_rate: number;
            days_on_platform: number;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          overall_score?: number;
          tier?: 'newcomer' | 'member' | 'trusted' | 'verified' | 'ambassador';
          badges?: string[];
          dimensions?: Record<string, unknown>;
          stats?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          overall_score?: number;
          tier?: 'newcomer' | 'member' | 'trusted' | 'verified' | 'ambassador';
          badges?: string[];
          dimensions?: Record<string, unknown>;
          stats?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      date_reviews: {
        Row: {
          id: string; // UUID
          reviewer_id: string; // UUID - FK to users
          reviewed_user_id: string; // UUID - FK to users
          rating: number; // 1-5
          categories: {
            communication: number;
            respect: number;
            authenticity: number;
            safety: number;
          };
          positives: string[];
          concerns: string[];
          comment: string | null;
          is_anonymous: boolean;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          reviewed_user_id: string;
          rating: number;
          categories: Record<string, number>;
          positives?: string[];
          concerns?: string[];
          comment?: string | null;
          is_anonymous?: boolean;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          rating?: number;
          categories?: Record<string, number>;
          positives?: string[];
          concerns?: string[];
          comment?: string | null;
          verified?: boolean;
        };
      };
      community_vouches: {
        Row: {
          id: string; // UUID
          voucher_id: string; // UUID - FK to users
          vouched_user_id: string; // UUID - FK to users
          relationship: 'dated' | 'friends' | 'event_met' | 'community';
          duration_known: 'less_than_month' | '1_6_months' | '6_12_months' | 'over_year';
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          voucher_id: string;
          vouched_user_id: string;
          relationship: 'dated' | 'friends' | 'event_met' | 'community';
          duration_known: 'less_than_month' | '1_6_months' | '6_12_months' | 'over_year';
          message?: string | null;
          created_at?: string;
        };
        Update: {
          message?: string | null;
        };
      };
      user_taste_profiles: {
        Row: {
          id: string; // UUID
          user_id: string; // UUID - FK to users
          attraction_patterns: {
            preferred_age_range: [number, number];
            avg_liked_age: number;
            bio_length_preference: 'short' | 'medium' | 'long';
            preferred_photo_count: number;
            preferred_relationship_structures: string[];
          };
          behavioral_patterns: {
            avg_session_duration_mins: number;
            avg_profiles_viewed_per_session: number;
            typical_active_hours: number[];
            message_style: 'brief' | 'moderate' | 'verbose';
            response_speed: 'quick' | 'moderate' | 'thoughtful';
          };
          total_profiles_viewed: number;
          total_likes: number;
          total_passes: number;
          confidence_score: number; // 0-1
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          attraction_patterns?: Record<string, unknown>;
          behavioral_patterns?: Record<string, unknown>;
          total_profiles_viewed?: number;
          total_likes?: number;
          total_passes?: number;
          confidence_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          attraction_patterns?: Record<string, unknown>;
          behavioral_patterns?: Record<string, unknown>;
          total_profiles_viewed?: number;
          total_likes?: number;
          total_passes?: number;
          confidence_score?: number;
          updated_at?: string;
        };
      };
      profile_views: {
        Row: {
          id: string; // UUID
          viewer_id: string; // UUID - FK to users
          viewed_profile_id: string; // UUID - FK to profiles
          action: 'view' | 'like' | 'super_like' | 'pass';
          dwell_time_ms: number;
          profile_metadata: {
            age: number;
            bio_length: number;
            photo_count: number;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          viewer_id: string;
          viewed_profile_id: string;
          action: 'view' | 'like' | 'super_like' | 'pass';
          dwell_time_ms?: number;
          profile_metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          action?: 'view' | 'like' | 'super_like' | 'pass';
          dwell_time_ms?: number;
        };
      };
      events: {
        Row: {
          id: string; // UUID
          host_id: string; // UUID - FK to users
          title: string;
          description: string | null;
          category: 'social' | 'dating' | 'education' | 'party' | 'outdoor' | 'wellness' | 'meetup' | 'virtual' | 'private' | 'community';
          cover_photo_url: string | null;
          location: string | null;
          meeting_link: string | null;
          start_time: string; // TIMESTAMPTZ
          end_time: string; // TIMESTAMPTZ
          timezone: string;
          max_attendees: number | null;
          visibility: 'public' | 'friends_only' | 'invite_only';
          requires_approval: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          host_id: string;
          title: string;
          description?: string | null;
          category: 'social' | 'dating' | 'education' | 'party' | 'outdoor' | 'wellness' | 'meetup' | 'virtual' | 'private' | 'community';
          cover_photo_url?: string | null;
          location?: string | null;
          meeting_link?: string | null;
          start_time: string;
          end_time: string;
          timezone?: string;
          max_attendees?: number | null;
          visibility?: 'public' | 'friends_only' | 'invite_only';
          requires_approval?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: 'social' | 'dating' | 'education' | 'party' | 'outdoor' | 'wellness' | 'meetup' | 'virtual' | 'private' | 'community';
          cover_photo_url?: string | null;
          location?: string | null;
          meeting_link?: string | null;
          start_time?: string;
          end_time?: string;
          timezone?: string;
          max_attendees?: number | null;
          visibility?: 'public' | 'friends_only' | 'invite_only';
          requires_approval?: boolean;
          tags?: string[];
          updated_at?: string;
          cancelled_at?: string | null;
        };
      };
      event_rsvps: {
        Row: {
          id: string; // UUID
          event_id: string; // UUID - FK to events
          user_id: string; // UUID - FK to users
          status: 'going' | 'maybe' | 'waitlist' | 'pending' | 'declined';
          checked_in: boolean;
          checked_in_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status: 'going' | 'maybe' | 'waitlist' | 'pending' | 'declined';
          checked_in?: boolean;
          checked_in_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'going' | 'maybe' | 'waitlist' | 'pending' | 'declined';
          checked_in?: boolean;
          checked_in_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_signed_photo_url: {
        Args: { photo_path: string; expires_in?: number };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type DbEvent = Database['public']['Tables']['events']['Row'];
export type DbEventInsert = Database['public']['Tables']['events']['Insert'];
export type DbEventUpdate = Database['public']['Tables']['events']['Update'];

export type DbEventRsvp = Database['public']['Tables']['event_rsvps']['Row'];
export type DbEventRsvpInsert = Database['public']['Tables']['event_rsvps']['Insert'];
export type DbEventRsvpUpdate = Database['public']['Tables']['event_rsvps']['Update'];

// Event with host profile information
export interface EventWithHost extends DbEvent {
  host?: {
    id: string;
    user_id: string;
    display_name: string;
    photo_url?: string | null;
  };
  rsvp_counts?: {
    going: number;
    maybe: number;
    waitlist: number;
    pending: number;
  };
  user_rsvp?: DbEventRsvp | null;
}

// Event with RSVP details
export interface EventWithRsvps extends EventWithHost {
  rsvps?: Array<
    DbEventRsvp & {
      user?: {
        id: string;
        display_name: string;
        photo_url?: string | null;
      };
    }
  >;
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience types
export type User = Tables<'users'>;
export type Profile = Tables<'profiles'>;
export type Photo = Tables<'photos'>;
export type Intent = Tables<'intents'>;
export type Match = Tables<'matches'>;
export type ChatThread = Tables<'chat_threads'>;
export type Message = Tables<'messages'>;
export type Like = Tables<'likes'>;
export type Pind = Tables<'pinds'>;
export type BlockedUser = Tables<'blocked_users'>;
export type Report = Tables<'reports'>;
export type PartnerLink = Tables<'partner_links'>;
export type Event = Tables<'events'>;
export type EventAttendee = Tables<'event_attendees'>;
export type TrustScoreRow = Tables<'trust_scores'>;
export type DateReviewRow = Tables<'date_reviews'>;
export type CommunityVouchRow = Tables<'community_vouches'>;
export type UserTasteProfileRow = Tables<'user_taste_profiles'>;
export type ProfileViewRow = Tables<'profile_views'>;
