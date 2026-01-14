// Dating App Data Types

export interface User {
  id: string;
  email_or_phone: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
}

export interface LinkedPartner {
  id: string;
  name: string;
  age: number;
  photo?: string;
  // If this is a Blend user, this links to their profile
  blend_user_id?: string;
  blend_profile?: Profile; // Populated when fetched
  // Indicates if this partner is on Blend or manually added
  is_on_blend: boolean;
  // Relationship details
  relationship_type?: 'partner' | 'meta' | 'anchor' | 'comet' | 'nesting_partner' | 'dating';
  relationship_duration?: string;
  // Link status for Blend users
  link_status?: 'pending' | 'confirmed' | 'declined';
  linked_at?: string;
}

export interface ProfilePhoto {
  uri: string;
  hidden_until_match: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  city: string;
  bio: string;
  photos: string[];
  photo_settings?: ProfilePhoto[]; // Per-photo visibility settings
  photos_hidden_until_match?: boolean; // Legacy: Hide all photos until users match
  pace_preference: 'slow' | 'medium' | 'fast';
  no_photos: boolean;
  open_to_meet: boolean;
  virtual_only?: boolean;
  response_style: 'quick' | 'relaxed';
  voice_intro_url?: string;
  intent_ids: string[];
  prompt_responses: PromptResponse[];
  linked_partner?: LinkedPartner;
  // Location fields for map view
  latitude?: number;
  longitude?: number;
  show_on_map?: boolean;
}

export interface Intent {
  id: string;
  label: string;
  description: string;
  emoji: string;
  is_active: boolean;
}

export interface ProfilePrompt {
  id: string;
  prompt_text: string;
  is_active: boolean;
}

export interface PromptResponse {
  id: string;
  profile_id: string;
  prompt_id: string;
  prompt_text: string;
  response_text: string;
}

export interface Match {
  id: string;
  user_1_id: string;
  user_2_id: string;
  shared_intent_ids: string[];
  status: 'pending' | 'active' | 'archived';
  matched_at: string;
}

export interface ChatThread {
  id: string;
  match_id: string;
  unlocked: boolean;
  first_message_type?: 'prompt' | 'reaction' | 'voice';
  last_message_at?: string;
  archived_at?: string;
  // Group chat fields
  is_group?: boolean;
  group_name?: string;
  group_photo?: string;
  participant_ids?: string[];
  created_by?: string;
}

export interface MessageReaction {
  emoji: string;
  user_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  message_type: 'text' | 'voice' | 'system' | 'image' | 'video' | 'video_call' | 'gif';
  content: string;
  media_url?: string;
  media_thumbnail?: string;
  is_first_message: boolean;
  created_at: string;
  read_at?: string;
  // Video call fields
  call_status?: 'started' | 'ended' | 'missed';
  call_duration?: number; // in seconds
  // Self-destruct timer fields
  self_destruct_seconds?: number; // Timer duration (5, 10, 30 seconds)
  viewed_at?: string; // When recipient first viewed the media
  is_expired?: boolean; // Whether the media has expired
  // Reply fields
  reply_to_id?: string; // ID of the message being replied to
  reply_to_content?: string; // Preview of the replied message content
  reply_to_sender_id?: string; // Sender of the original message
  // Reactions
  reactions?: MessageReaction[];
}

export interface FirstMessagePrompt {
  id: string;
  prompt_text: string;
  category: 'curiosity' | 'playful' | 'boundary';
  is_active: boolean;
}

// Extended types for UI
export interface MatchWithProfile extends Match {
  other_profile: Profile;
  thread?: ChatThread;
  last_message?: Message;
  unread_count: number;
}

export interface DiscoverProfile extends Profile {
  shared_intents: Intent[];
  distance?: string;
}

// Like from another user
export interface Like {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  seen: boolean;
}

// Pind (private message without matching)
export interface Pind {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

// ===== UNIQUE BLEND FEATURES =====

// Relationship Structure Types
export type RelationshipStructure =
  | 'hierarchical'      // Primary + secondaries
  | 'non_hierarchical'  // All relationships equal
  | 'solo_poly'         // Independent polyamory
  | 'relationship_anarchy' // No labels/hierarchy
  | 'kitchen_table'     // Everyone knows each other
  | 'parallel'          // Minimal meta interaction
  | 'garden_party'      // Comfortable when needed
  | 'mono_poly'         // One mono, one poly partner
  | 'triad'             // Three-person relationship
  | 'quad'              // Four-person relationship
  | 'vee'               // One person with two partners
  | 'swinger'           // Recreational play only
  | 'open_relationship'; // Dating separately

// Polycule Member (for relationship map)
export interface PolyculeConnection {
  id: string;
  name: string;
  photo?: string;
  relationship_type: 'partner' | 'meta' | 'anchor' | 'comet' | 'nesting_partner' | 'dating';
  connection_strength: 'primary' | 'secondary' | 'casual' | 'platonic';
  connected_to: string[]; // IDs of who they're connected to
  notes?: string;
  // Blend user linking
  blend_user_id?: string; // If linked to a Blend user
  is_on_blend?: boolean; // Whether they're on Blend
  link_status?: 'pending' | 'confirmed' | 'declined';
}

export interface Polycule {
  id: string;
  user_id: string;
  members: PolyculeConnection[];
  structure: RelationshipStructure;
  visibility: 'public' | 'matches_only' | 'private';
  updated_at: string;
}

// Relationship Agreement
export interface AgreementSection {
  id: string;
  category: 'communication' | 'boundaries' | 'intimacy' | 'time' | 'safety' | 'disclosure' | 'veto' | 'custom';
  title: string;
  content: string;
  agreed_by: string[]; // user_ids who agreed
  last_updated: string;
}

export interface RelationshipAgreement {
  id: string;
  user_id: string;
  title: string;
  sections: AgreementSection[];
  partner_ids: string[]; // Who this agreement is with
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

// Calendar / Date Scheduling
export interface ScheduledDate {
  id: string;
  user_id: string;
  partner_id: string;
  partner_name: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  notes?: string;
  is_overnight: boolean;
  reminder_sent: boolean;
  created_at: string;
}

// Education Content
export interface EducationArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'basics' | 'communication' | 'jealousy' | 'boundaries' | 'structures' | 'safety' | 'coming_out' | 'resources';
  read_time: number; // minutes
  is_bookmarked?: boolean;
  image_url?: string;
}

// ENM Compatibility Quiz
export interface QuizQuestion {
  id: string;
  question: string;
  category: 'communication' | 'jealousy' | 'time' | 'hierarchy' | 'disclosure' | 'boundaries';
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  value: number; // 1-5 scale
}

export interface QuizResult {
  id: string;
  user_id: string;
  answers: { question_id: string; option_id: string; value: number }[];
  scores: {
    communication_style: number;
    jealousy_management: number;
    time_management: number;
    hierarchy_preference: number;
    disclosure_level: number;
    boundary_firmness: number;
  };
  compatibility_profile: string;
  completed_at: string;
}

// STI Safety
export interface STITestRecord {
  id: string;
  user_id: string;
  test_date: string;
  next_test_date?: string;
  tests_included: string[]; // e.g., ['HIV', 'HSV-1', 'HSV-2', 'Chlamydia', etc.]
  all_negative: boolean;
  notes?: string;
  visibility: 'public' | 'matches_only' | 'private';
  verified?: boolean; // Future: document upload
}

// Consent Checklist
export interface ConsentItem {
  id: string;
  activity: string;
  category: 'touch' | 'intimacy' | 'communication' | 'photos' | 'social' | 'kink';
  user_consent: 'yes' | 'no' | 'maybe' | 'discuss' | null;
  partner_consent?: 'yes' | 'no' | 'maybe' | 'discuss' | null;
  notes?: string;
}

export interface ConsentChecklist {
  id: string;
  user_id: string;
  partner_id?: string;
  items: ConsentItem[];
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

// Meet the Partners Section
export interface PartnerProfile {
  id: string;
  name: string;
  age?: number;
  photo?: string;
  relationship_type: string;
  relationship_duration?: string;
  bio?: string;
  involvement_level: 'always_present' | 'sometimes_present' | 'aware_only' | 'kitchen_table';
  can_message: boolean;
  // Blend user linking
  blend_user_id?: string;
  is_on_blend?: boolean;
  link_status?: 'pending' | 'confirmed' | 'declined';
}

// ENM Identity Badges
export type ENMBadge =
  | 'poly_pioneer'      // 5+ years in ENM
  | 'communication_pro' // High quiz scores
  | 'safety_first'      // Regular STI testing
  | 'boundary_master'   // Complete agreement
  | 'community_builder' // Active in groups
  | 'verified_couple'   // Verified couple account
  | 'solo_journey'      // Solo poly
  | 'newbie_friendly'   // Open to ENM newcomers
  | 'kink_aware'        // Kink-friendly
  | 'travel_ready';     // Open to long distance

// ===== INTERACTIVE GAMES =====

export type GameType =
  | 'truth_or_dare'
  | 'hot_seat'
  | 'story_chain'
  | 'mystery_date_planner'
  | 'compatibility_triangle'
  | 'group_challenge';

export type GameStatus = 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';

export type TruthOrDareDifficulty = 'playful' | 'flirty' | 'intimate';

export interface GameParticipant {
  user_id: string;
  display_name: string;
  photo?: string;
  is_couple?: boolean;
  couple_partner_id?: string;
  score: number;
  skips_used: number;
  turns_taken: number;
}

export interface GameChallenge {
  id: string;
  type: 'truth' | 'dare';
  difficulty: TruthOrDareDifficulty;
  content: string;
  for_couples: boolean;
  timer_seconds?: number;
  is_custom?: boolean;
  created_by?: string;
}

export interface HotSeatQuestion {
  id: string;
  question: string;
  category: 'fun' | 'deep' | 'spicy' | 'relationship';
  is_custom: boolean;
  asked_by?: string;
  created_by?: string;
}

export interface StoryEntry {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  redo_votes: string[];
  is_redone: boolean;
}

export interface StoryPrompt {
  id: string;
  category: 'romantic' | 'adventurous' | 'fantasy' | 'funny';
  prompt: string;
  is_custom?: boolean;
  created_by?: string;
}

export interface DateSuggestion {
  id: string;
  category: 'location' | 'activity' | 'vibe' | 'time';
  value: string;
  suggested_by: string;
  votes: string[];
  image_url?: string;
}

export interface CompatibilityAnswer {
  question_id: string;
  user_id: string;
  answer: string;
}

export interface GroupChallengeTask {
  id: string;
  description: string;
  completed_by: string[];
  required_completions: number;
  proof_type?: 'photo' | 'text' | 'none';
}

// Game-specific state types
export interface TruthOrDareState {
  current_challenge?: GameChallenge;
  current_target_ids: string[];
  difficulty: TruthOrDareDifficulty;
  challenge_started_at?: string;
  challenges_completed: number;
}

export interface HotSeatState {
  hot_seat_user_id: string;
  seat_started_at: string;
  seat_duration_seconds: number;
  current_question?: HotSeatQuestion;
  question_started_at?: string;
  questions_answered: number;
  questions_skipped: number;
  question_queue: HotSeatQuestion[];
  rotation_order: string[];
  current_rotation_index: number;
}

export interface StoryChainState {
  prompt: StoryPrompt;
  entries: StoryEntry[];
  current_author_id: string;
  turn_started_at: string;
  turn_duration_seconds: number;
  turn_order: string[];
  current_turn_index: number;
  redo_threshold: number;
}

export interface MysteryDatePlannerState {
  suggestions: DateSuggestion[];
  current_category: 'location' | 'activity' | 'vibe' | 'time';
  voting_phase: boolean;
  final_plan?: {
    location: string;
    activity: string;
    vibe: string;
    time: string;
  };
}

export interface CompatibilityTriangleState {
  questions: { id: string; question: string }[];
  answers: CompatibilityAnswer[];
  current_question_index: number;
  phase: 'answering' | 'revealing';
  results?: {
    user1_user2_match: number;
    user2_user3_match: number;
    user1_user3_match: number;
    all_three_match: number;
    shared_answers: string[];
  };
}

export interface GroupChallengeState {
  challenge_pack: string;
  tasks: GroupChallengeTask[];
  overall_progress: number;
  unlocked_rewards: string[];
}

export type GameState =
  | { type: 'truth_or_dare'; data: TruthOrDareState }
  | { type: 'hot_seat'; data: HotSeatState }
  | { type: 'story_chain'; data: StoryChainState }
  | { type: 'mystery_date_planner'; data: MysteryDatePlannerState }
  | { type: 'compatibility_triangle'; data: CompatibilityTriangleState }
  | { type: 'group_challenge'; data: GroupChallengeState };

export interface GameSession {
  id: string;
  thread_id: string;
  game_type: GameType;
  status: GameStatus;
  participants: GameParticipant[];
  current_turn_user_id?: string;
  state: GameState;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  created_by: string;
  settings: {
    max_rounds?: number;
    timer_enabled: boolean;
    allow_skips: boolean;
    max_skips_per_player: number;
  };
}

export interface GameMove {
  id: string;
  game_id: string;
  user_id: string;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
}

// Extended Profile with new features
export interface ExtendedProfile extends Profile {
  // Relationship info
  relationship_structure?: RelationshipStructure;
  polycule?: Polycule;
  partners?: PartnerProfile[];

  // Safety
  last_sti_test?: STITestRecord;

  // Compatibility
  quiz_result?: QuizResult;

  // Badges
  badges?: ENMBadge[];

  // Agreements (visible to matches)
  public_agreements?: RelationshipAgreement[];
}

// ===== AI MATCHING SYSTEM =====

export type ProfileAction = 'view' | 'like' | 'pass' | 'super_like' | 'message';

export interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_profile_id: string;
  dwell_time_ms: number;
  action: ProfileAction;
  created_at: string;
  // Snapshot of viewed profile for pattern analysis
  profile_snapshot?: {
    age: number;
    relationship_structure?: RelationshipStructure;
    intent_ids: string[];
    bio_length: number;
    photo_count: number;
    has_voice_intro: boolean;
    pace_preference: string;
    response_style: string;
  };
}

export interface ConversationMetrics {
  thread_id: string;
  user_id: string;
  other_user_id: string;
  messages_sent: number;
  messages_received: number;
  avg_response_time_ms: number;
  avg_message_length: number;
  longest_streak_days: number;
  last_active_at: string;
  met_in_person: boolean;
  connection_quality: 'cold' | 'warm' | 'hot' | 'connected';
  created_at: string;
  updated_at: string;
}

export interface AttractionPatterns {
  // Age preferences learned from behavior
  preferred_age_range: [number, number];
  avg_liked_age: number;

  // Profile style preferences
  bio_length_preference: 'short' | 'medium' | 'long';
  preferred_photo_count: number;
  prefers_voice_intros: boolean;

  // Relationship preferences
  preferred_relationship_structures: RelationshipStructure[];
  preferred_intents: string[];

  // Content patterns (extracted from liked bios/prompts)
  values_keywords: string[];
  activity_keywords: string[];
  communication_keywords: string[];

  // Behavioral preferences
  preferred_pace: 'slow' | 'medium' | 'fast';
  preferred_response_style: 'quick' | 'relaxed';
}

export interface BehavioralPatterns {
  // Activity patterns
  avg_daily_sessions: number;
  avg_session_duration_mins: number;
  typical_active_hours: number[]; // 0-23
  most_active_day: number; // 0-6 (Sunday-Saturday)

  // Interaction style
  avg_profiles_viewed_per_session: number;
  like_rate: number; // percentage of viewed profiles liked
  message_initiation_rate: number; // how often they message first

  // Communication style
  message_style: 'verbose' | 'balanced' | 'concise';
  avg_message_length: number;
  response_speed: 'fast' | 'moderate' | 'slow';
  avg_response_time_mins: number;

  // Dating pace
  avg_days_to_first_message: number;
  avg_days_to_meetup_suggestion: number;
}

export interface UserTasteProfile {
  user_id: string;
  attraction_patterns: AttractionPatterns;
  behavioral_patterns: BehavioralPatterns;

  // Aggregated stats
  total_profiles_viewed: number;
  total_likes: number;
  total_passes: number;
  total_matches: number;
  total_conversations: number;
  successful_connections: number; // met in person or long engagement

  // Pattern confidence (0-1, increases with more data)
  confidence_score: number;

  created_at: string;
  updated_at: string;
}

export interface CompatibilityDimension {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  explanation: string;
  factors: string[];
}

export interface CompatibilityScore {
  overall_score: number; // 0-100
  dimensions: {
    intent_compatibility: CompatibilityDimension;
    quiz_compatibility: CompatibilityDimension;
    relationship_structure_fit: CompatibilityDimension;
    communication_style_match: CompatibilityDimension;
    values_alignment: CompatibilityDimension;
    behavioral_compatibility: CompatibilityDimension;
  };
  match_explanation: string;
  conversation_starters: string[];
  potential_challenges: string[];
  calculated_at: string;
}

export interface SmartMatchRecommendation {
  profile_id: string;
  compatibility_score: CompatibilityScore;
  recommendation_reason: 'high_compatibility' | 'similar_users_liked' | 'complements_you' | 'trending';
  similar_users_who_liked: number; // count of similar users who liked this profile
  rank: number;
}

export interface SimilarUser {
  user_id: string;
  similarity_score: number; // 0-1
  shared_likes: number;
  shared_passes: number;
  taste_overlap: number; // 0-1
}

// ===== EVENTS SYSTEM =====

export type EventCategory =
  | 'social'
  | 'dating'
  | 'education'
  | 'party'
  | 'outdoor'
  | 'wellness'
  | 'meetup'
  | 'virtual'
  | 'private'
  | 'community';

export type EventVisibility = 'public' | 'friends_only' | 'invite_only' | 'private';

export type RSVPStatus = 'going' | 'maybe' | 'not_going' | 'waitlist' | 'pending_approval';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface EventLocation {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  is_virtual?: boolean;
  virtual_link?: string;
}

export interface EventHost {
  user_id: string;
  display_name: string;
  photo?: string;
  reputation_stars: number;
  events_hosted: number;
}

export interface EventAttendee {
  id: string;
  user_id: string;
  display_name: string;
  photo?: string;
  rsvp_status: RSVPStatus;
  rsvp_at: string;
  approved_at?: string;
  checked_in_at?: string;
  waitlist_position?: number;
  notes?: string;
}

export interface Event {
  id: string;
  host_id: string;
  host: EventHost;
  title: string;
  description: string;
  cover_image?: string;
  category: EventCategory;
  tags: string[];
  location: EventLocation;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time?: string;
  timezone: string;
  max_attendees?: number;
  current_attendees: number;
  waitlist_count: number;
  visibility: EventVisibility;
  requires_approval: boolean;
  status: EventStatus;
  is_featured: boolean;
  is_recurring: boolean;
  recurring_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  parent_event_id?: string; // For recurring events
  attendees: EventAttendee[];
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  message?: string; // For approval requests
  created_at: string;
  updated_at: string;
  approved_by?: string;
}

export interface EventChatThread {
  id: string;
  event_id: string;
  is_active: boolean;
  messages: EventChatMessage[];
  created_at: string;
  last_message_at?: string;
}

export interface EventChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name: string;
  sender_photo?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'gif';
  created_at: string;
  read_by: string[];
}

export interface EventNotification {
  id: string;
  user_id: string;
  event_id: string;
  type:
    | 'event_near_you'
    | 'event_reminder_1d'
    | 'event_reminder_1h'
    | 'rsvp_approved'
    | 'rsvp_declined'
    | 'waitlist_spot_open'
    | 'event_updated'
    | 'event_cancelled'
    | 'new_event_message'
    | 'host_message'
    | 'attendee_joined'
    | 'attendee_left';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface EventReport {
  id: string;
  event_id: string;
  reporter_id: string;
  reason: 'inappropriate' | 'spam' | 'scam' | 'harassment' | 'safety' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface EventReview {
  id: string;
  event_id: string;
  user_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  created_at: string;
}

export interface EventAnalytics {
  event_id: string;
  views_count: number;
  unique_viewers: number;
  rsvp_count: number;
  going_count: number;
  maybe_count: number;
  waitlist_count: number;
  check_in_count: number;
  conversion_rate: number; // views to RSVPs
  attendance_rate: number; // RSVPs to check-ins
  avg_rating: number;
  reviews_count: number;
  demographics: {
    age_ranges: { range: string; count: number }[];
    cities: { city: string; count: number }[];
  };
  engagement: {
    chat_messages_count: number;
    photos_shared: number;
  };
}

export interface EventFilter {
  category?: EventCategory;
  location?: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  date_range?: {
    start: string;
    end: string;
  };
  tags?: string[];
  visibility?: EventVisibility;
  has_spots?: boolean;
  is_virtual?: boolean;
  host_id?: string;
}

export interface EventDraft {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  cover_image?: string;
  category?: EventCategory;
  tags?: string[];
  location?: Partial<EventLocation>;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  max_attendees?: number;
  visibility?: EventVisibility;
  requires_approval?: boolean;
  saved_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'event' | 'date' | 'reminder';
  start: string;
  end?: string;
  color: string;
  event_id?: string;
  scheduled_date_id?: string;
}

export interface EventWithDetails extends Event {
  is_attending: boolean;
  user_rsvp_status?: RSVPStatus;
  chat_thread?: EventChatThread;
  analytics?: EventAnalytics;
  reviews?: EventReview[];
  similar_events?: Event[];
}

// ===== TRUST SCORE SYSTEM =====

export type TrustTier = 'newcomer' | 'member' | 'trusted' | 'verified' | 'ambassador';

export type TrustBadge =
  | 'verified_photo'        // Photo verified as real person
  | 'verified_social'       // Connected social media accounts
  | 'community_vouched'     // Vouched by 3+ trusted members
  | 'event_host'            // Successfully hosted events
  | 'safe_dater'            // 5+ positive date reviews
  | 'great_communicator'    // High response rate & quality
  | 'reliable'              // Shows up to scheduled dates
  | 'respectful'            // No reports, good boundaries
  | 'sti_transparent'       // Regularly updates STI status
  | 'consent_champion'      // Completed consent checklist, positive feedback
  | 'long_term_member'      // 1+ year on platform
  | 'community_builder';    // Active in events, groups

export interface TrustDimension {
  id: string;
  name: string;
  score: number;       // 0-100
  weight: number;      // How much this affects overall score
  description: string;
  factors: TrustFactor[];
}

export interface TrustFactor {
  id: string;
  name: string;
  value: number;
  maxValue: number;
  description: string;
  lastUpdated: string;
}

export interface DateReview {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_photo?: string;
  reviewed_user_id: string;
  date_id?: string;           // Optional link to scheduled date
  event_id?: string;          // Optional link to event
  met_in_person: boolean;
  rating: 1 | 2 | 3 | 4 | 5;
  categories: {
    communication: 1 | 2 | 3 | 4 | 5;
    respect: 1 | 2 | 3 | 4 | 5;
    authenticity: 1 | 2 | 3 | 4 | 5;
    safety: 1 | 2 | 3 | 4 | 5;
  };
  positives: DateReviewTag[];
  concerns: DateReviewConcern[];
  comment?: string;
  is_anonymous: boolean;
  created_at: string;
  verified: boolean;          // System verified they actually met
}

export type DateReviewTag =
  | 'great_conversation'
  | 'respectful_boundaries'
  | 'photos_accurate'
  | 'on_time'
  | 'good_communication'
  | 'felt_safe'
  | 'genuine_person'
  | 'fun_to_be_around'
  | 'honest_about_intentions'
  | 'considerate_of_partners';

export type DateReviewConcern =
  | 'photos_misleading'
  | 'pushy_behavior'
  | 'poor_communication'
  | 'showed_up_late'
  | 'different_intentions'
  | 'boundary_issues'
  | 'ghosted_after'
  | 'uncomfortable_vibes';

export interface CommunityVouch {
  id: string;
  voucher_id: string;
  voucher_name: string;
  voucher_photo?: string;
  voucher_trust_tier: TrustTier;
  vouched_user_id: string;
  relationship: 'dated' | 'friends' | 'event_met' | 'community';
  duration_known: 'less_than_month' | '1_6_months' | '6_12_months' | 'over_year';
  message?: string;
  created_at: string;
}

export interface TrustReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  type: 'harassment' | 'fake_profile' | 'inappropriate' | 'safety' | 'scam' | 'no_show' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence_urls?: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at?: string;
  resolution?: string;
}

export interface TrustScore {
  user_id: string;
  overall_score: number;          // 0-100
  tier: TrustTier;
  badges: TrustBadge[];
  dimensions: {
    behavior: TrustDimension;     // App behavior (response rate, completion rate)
    community: TrustDimension;    // Community feedback (reviews, vouches)
    reliability: TrustDimension;  // Shows up, follows through
    safety: TrustDimension;       // No reports, respects boundaries
    engagement: TrustDimension;   // Active, contributes to community
    transparency: TrustDimension; // Profile completeness, STI updates
  };
  stats: {
    dates_completed: number;
    events_attended: number;
    events_hosted: number;
    reviews_received: number;
    average_rating: number;
    vouches_received: number;
    vouches_given: number;
    reports_received: number;
    reports_upheld: number;
    response_rate: number;
    message_quality_score: number;
    profile_completeness: number;
    days_on_platform: number;
    last_active: string;
  };
  history: TrustScoreChange[];
  created_at: string;
  updated_at: string;
}

export interface TrustScoreChange {
  id: string;
  timestamp: string;
  previous_score: number;
  new_score: number;
  reason: string;
  dimension_affected: keyof TrustScore['dimensions'];
  factor: string;
}

export interface TrustSettings {
  user_id: string;
  // Who can message you based on trust
  min_trust_to_message: TrustTier;
  // Show trust score on profile
  show_trust_score: boolean;
  // Allow anonymous reviews
  allow_anonymous_reviews: boolean;
  // Notify on trust changes
  notify_on_trust_change: boolean;
  // Auto-block low trust users
  auto_block_threshold?: number;
}

export interface TrustNotification {
  id: string;
  user_id: string;
  type:
    | 'score_increased'
    | 'score_decreased'
    | 'badge_earned'
    | 'tier_upgraded'
    | 'review_received'
    | 'vouch_received'
    | 'report_resolved';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// Trust tier thresholds
export const TRUST_TIER_THRESHOLDS: Record<TrustTier, { min: number; max: number }> = {
  newcomer: { min: 0, max: 24 },
  member: { min: 25, max: 49 },
  trusted: { min: 50, max: 74 },
  verified: { min: 75, max: 89 },
  ambassador: { min: 90, max: 100 },
};

// Trust tier metadata
export const TRUST_TIER_INFO: Record<TrustTier, { label: string; color: string; icon: string; description: string }> = {
  newcomer: {
    label: 'Newcomer',
    color: '#71717a',
    icon: '🌱',
    description: 'New to the community',
  },
  member: {
    label: 'Member',
    color: '#60a5fa',
    icon: '👤',
    description: 'Active community member',
  },
  trusted: {
    label: 'Trusted',
    color: '#4ade80',
    icon: '✓',
    description: 'Verified through positive interactions',
  },
  verified: {
    label: 'Verified',
    color: '#a855f7',
    icon: '🛡️',
    description: 'Highly trusted community member',
  },
  ambassador: {
    label: 'Ambassador',
    color: '#fbbf24',
    icon: '⭐',
    description: 'Community leader and role model',
  },
};

// ===== SEARCH SYSTEM =====

export type SearchResultType = 'profile' | 'event' | 'article' | 'message';

export type GenderIdentity =
  | 'woman'
  | 'man'
  | 'non_binary'
  | 'trans_woman'
  | 'trans_man'
  | 'genderqueer'
  | 'genderfluid'
  | 'agender'
  | 'two_spirit'
  | 'other';

export type SeekingType = 'solo_poly' | 'couples' | 'triads' | 'singles_exploring' | 'any';

export type ConnectionType = 'romantic' | 'sexual' | 'platonic' | 'activity_partners' | 'any';

export type CurrentSituation =
  | 'has_primary'
  | 'has_nesting_partner'
  | 'dating_casually'
  | 'seeking_committed'
  | 'single_exploring'
  | 'in_open_relationship';

export type QuickFilterType =
  | 'nearby'
  | 'online_now'
  | 'verified'
  | 'highly_rated'
  | 'new_members'
  | 'hosting_events'
  | 'mutual_connections'
  | 'recently_active';

export type SearchSortOption =
  | 'distance'
  | 'trust_score'
  | 'newest'
  | 'most_active'
  | 'response_rate'
  | 'mutual_connections'
  | 'compatibility'
  | 'random';

export type SearchViewMode = 'card' | 'list' | 'map';

export interface LocationFilter {
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles: number;
  includeVirtual: boolean;
}

export interface BasicsFilter {
  ageRange: [number, number];
  genderIdentities: GenderIdentity[];
  pronounsRequired: boolean;
}

export interface RelationshipFilter {
  seekingTypes: SeekingType[];
  relationshipStyles: RelationshipStructure[];
  currentSituations: CurrentSituation[];
  connectionTypes: ConnectionType[];
}

export interface TrustFilter {
  minTrustScore?: number;
  minTrustTier?: TrustTier;
  requirePhotoVerification: boolean;
  requirePhoneVerification: boolean;
  mustHaveReviews: boolean;
  isEventHost: boolean;
  minAccountAgeDays?: number;
}

export interface CompatibilityFilter {
  values: string[];  // communication-focused, lgbtq-friendly, kink-friendly
  lifestyle: {
    smoking?: 'yes' | 'no' | 'sometimes' | 'any';
    drinking?: 'yes' | 'no' | 'socially' | 'any';
    hasChildren?: 'yes' | 'no' | 'any';
    wantsChildren?: 'yes' | 'no' | 'maybe' | 'any';
  };
  interests: string[];
}

export interface ActivityFilter {
  activeWithinDays?: number;
  minResponseRate?: number;
  minProfileCompleteness?: number;
}

export interface DealbreakersFilter {
  excludeNoPhotos: boolean;
  excludeIncompleteProfiles: boolean;
  excludeLowTrustScores: boolean;
  excludeAlreadyPassed: boolean;
  excludeAlreadyMatched: boolean;
}

export interface SearchFilters {
  query: string;
  quickFilters: QuickFilterType[];
  location: LocationFilter;
  basics: BasicsFilter;
  relationship: RelationshipFilter;
  trust: TrustFilter;
  compatibility: CompatibilityFilter;
  activity: ActivityFilter;
  dealbreakers: DealbreakersFilter;
  mutualConnectionsMin?: number;
  showOnlyExtendedNetwork: boolean;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  notificationsEnabled: boolean;
  created_at: string;
  last_used_at: string;
}

export interface SearchResult {
  type: SearchResultType;
  id: string;
  score: number;  // Relevance/compatibility score
  matchReasons: string[];
}

export interface ProfileSearchResult extends SearchResult {
  type: 'profile';
  profile: Profile;
  distance?: number;
  mutualConnections: number;
  compatibilityScore?: number;
  trustScore?: number;
  trustTier?: TrustTier;
  isOnline: boolean;
  lastActive?: string;
}

export interface EventSearchResult extends SearchResult {
  type: 'event';
  event: Event;
  distance?: number;
}

export interface ArticleSearchResult extends SearchResult {
  type: 'article';
  article: EducationArticle;
}

export interface MessageSearchResult extends SearchResult {
  type: 'message';
  message: Message;
  threadId: string;
  otherUserName: string;
  otherUserPhoto?: string;
}

export type AnySearchResult = ProfileSearchResult | EventSearchResult | ArticleSearchResult | MessageSearchResult;

export interface SearchResultsGroup {
  type: SearchResultType;
  label: string;
  results: AnySearchResult[];
  totalCount: number;
}

export interface BrowseCategory {
  id: string;
  label: string;
  icon: string;
  filters: Partial<SearchFilters>;
  count?: number;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: '',
  quickFilters: [],
  location: {
    radiusMiles: 50,
    includeVirtual: true,
  },
  basics: {
    ageRange: [18, 65],
    genderIdentities: [],
    pronounsRequired: false,
  },
  relationship: {
    seekingTypes: [],
    relationshipStyles: [],
    currentSituations: [],
    connectionTypes: [],
  },
  trust: {
    requirePhotoVerification: false,
    requirePhoneVerification: false,
    mustHaveReviews: false,
    isEventHost: false,
  },
  compatibility: {
    values: [],
    lifestyle: {},
    interests: [],
  },
  activity: {},
  dealbreakers: {
    excludeNoPhotos: false,
    excludeIncompleteProfiles: false,
    excludeLowTrustScores: false,
    excludeAlreadyPassed: false,
    excludeAlreadyMatched: true,
  },
  showOnlyExtendedNetwork: false,
};

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { id: 'suggested', label: 'Suggested For You', icon: '✨', filters: {} },
  { id: 'nearby', label: 'Near You', icon: '📍', filters: { quickFilters: ['nearby'] } },
  { id: 'highly_rated', label: 'Highly Rated', icon: '⭐', filters: { quickFilters: ['highly_rated'] } },
  { id: 'couples', label: 'Couples Seeking', icon: '💑', filters: { relationship: { ...DEFAULT_SEARCH_FILTERS.relationship, seekingTypes: ['couples'] } } },
  { id: 'kitchen_table', label: 'Kitchen Table Poly', icon: '🏠', filters: { relationship: { ...DEFAULT_SEARCH_FILTERS.relationship, relationshipStyles: ['kitchen_table'] } } },
  { id: 'new_members', label: 'New Members', icon: '🌱', filters: { quickFilters: ['new_members'] } },
  { id: 'hosting_events', label: 'Hosting Events', icon: '🎉', filters: { quickFilters: ['hosting_events'] } },
  { id: 'mutual', label: 'Mutual Connections', icon: '🤝', filters: { quickFilters: ['mutual_connections'] } },
  { id: 'recently_active', label: 'Recently Active', icon: '🟢', filters: { quickFilters: ['recently_active'] } },
];

export const QUICK_FILTER_OPTIONS: { id: QuickFilterType; label: string; icon: string }[] = [
  { id: 'nearby', label: 'Nearby', icon: '📍' },
  { id: 'online_now', label: 'Online Now', icon: '🟢' },
  { id: 'verified', label: 'Verified', icon: '✓' },
  { id: 'highly_rated', label: 'Highly Rated', icon: '⭐' },
  { id: 'new_members', label: 'New Members', icon: '🌱' },
  { id: 'hosting_events', label: 'Hosting Events', icon: '🎉' },
  { id: 'mutual_connections', label: 'Mutual', icon: '🤝' },
  { id: 'recently_active', label: 'Active', icon: '💬' },
];

export const SORT_OPTIONS: { id: SearchSortOption; label: string }[] = [
  { id: 'compatibility', label: 'Compatibility' },
  { id: 'distance', label: 'Distance' },
  { id: 'trust_score', label: 'Trust Score' },
  { id: 'newest', label: 'Newest' },
  { id: 'most_active', label: 'Most Active' },
  { id: 'response_rate', label: 'Response Rate' },
  { id: 'mutual_connections', label: 'Mutual Connections' },
  { id: 'random', label: 'Random' },
];

export const GENDER_OPTIONS: { id: GenderIdentity; label: string }[] = [
  { id: 'woman', label: 'Woman' },
  { id: 'man', label: 'Man' },
  { id: 'non_binary', label: 'Non-Binary' },
  { id: 'trans_woman', label: 'Trans Woman' },
  { id: 'trans_man', label: 'Trans Man' },
  { id: 'genderqueer', label: 'Genderqueer' },
  { id: 'genderfluid', label: 'Genderfluid' },
  { id: 'agender', label: 'Agender' },
  { id: 'two_spirit', label: 'Two-Spirit' },
  { id: 'other', label: 'Other' },
];

export const SEEKING_OPTIONS: { id: SeekingType; label: string }[] = [
  { id: 'solo_poly', label: 'Solo Poly' },
  { id: 'couples', label: 'Couples' },
  { id: 'triads', label: 'Triads' },
  { id: 'singles_exploring', label: 'Singles Exploring ENM' },
  { id: 'any', label: 'Open to All' },
];

export const CONNECTION_OPTIONS: { id: ConnectionType; label: string }[] = [
  { id: 'romantic', label: 'Romantic' },
  { id: 'sexual', label: 'Sexual' },
  { id: 'platonic', label: 'Platonic' },
  { id: 'activity_partners', label: 'Activity Partners' },
  { id: 'any', label: 'Any Connection' },
];

export const SITUATION_OPTIONS: { id: CurrentSituation; label: string }[] = [
  { id: 'has_primary', label: 'Has Primary Partner' },
  { id: 'has_nesting_partner', label: 'Has Nesting Partner' },
  { id: 'dating_casually', label: 'Dating Casually' },
  { id: 'seeking_committed', label: 'Seeking Committed' },
  { id: 'single_exploring', label: 'Single & Exploring' },
  { id: 'in_open_relationship', label: 'In Open Relationship' },
];

export const VALUE_OPTIONS: string[] = [
  'Communication-focused',
  'LGBTQ+ friendly',
  'Kink-friendly',
  'Sex-positive',
  'Consent-focused',
  'Body-positive',
  'Neurodivergent-friendly',
  'Sober-friendly',
  '420-friendly',
];

export const INTEREST_TAGS: string[] = [
  'Travel', 'Music', 'Art', 'Outdoors', 'Gaming', 'Cooking',
  'Fitness', 'Reading', 'Movies', 'Dancing', 'Yoga', 'Photography',
  'Camping', 'Wine', 'Coffee', 'Pets', 'Activism', 'Tech',
  'Fashion', 'Food', 'Sports', 'Comedy', 'Podcasts', 'Spirituality',
];
