import { create } from 'zustand';
// DISABLED: persist middleware causes AsyncStorage access at module-level (crashes before RN ready)
// import { persist, createJSONStorage } from 'zustand/middleware';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Profile,
  Match,
  ChatThread,
  Message,
  Intent,
  Like,
  Ping,
  MessageReaction,
  GameSession,
  GameType,
  GameParticipant,
  TruthOrDareDifficulty,
  TruthOrDareState,
  HotSeatState,
  StoryChainState,
  GameChallenge,
  HotSeatQuestion,
  StoryEntry,
  StoryPrompt,
  ProfileView,
  ProfileAction,
  UserTasteProfile,
  ConversationMetrics,
  CompatibilityScore,
  RelationshipStructure,
  Event,
  EventAttendee,
  EventCategory,
  EventVisibility,
  RSVPStatus,
  EventChatThread,
  EventChatMessage,
  EventDraft,
  EventFilter,
  EventNotification,
  EventAnalytics,
  TrustScore,
  TrustTier,
  TrustBadge,
  TrustDimension,
  TrustScoreChange,
  DateReview,
  DateReviewTag,
  DateReviewConcern,
  CommunityVouch,
  TrustReport,
  TrustSettings,
  TrustNotification,
  TRUST_TIER_THRESHOLDS,
  // Search types
  SearchFilters,
  SavedSearch,
  SearchResultsGroup,
  AnySearchResult,
  QuickFilterType,
  SearchSortOption,
  SearchViewMode,
  DEFAULT_SEARCH_FILTERS,
} from '../types';
import {
  getRandomChallenge,
  getRandomQuestion,
  getRandomStoryPrompt,
  STORY_PROMPTS,
} from '../game-content';
import {
  buildTasteProfile,
  DEFAULT_TASTE_PROFILE,
} from '../matching/taste-profile';
import { INTENTS } from '../static-data';

interface DatingStore {
  // Auth state
  isOnboarded: boolean;
  currentUserId: string;

  // User profile
  currentProfile: Profile | null;

  // Matches and chats
  matches: Match[];
  threads: ChatThread[];
  messages: Message[];

  // Likes and Pings
  likes: Like[];
  pings: Ping[];

  // Discover
  discoveredProfiles: string[]; // IDs of profiles user has seen

  // Games
  gameSessions: GameSession[];

  // Custom game content
  customChallenges: GameChallenge[];
  customQuestions: HotSeatQuestion[];
  customPrompts: StoryPrompt[];

  // AI Matching
  profileViews: ProfileView[];
  conversationMetrics: ConversationMetrics[];
  tasteProfile: UserTasteProfile | null;
  smartMatchingEnabled: boolean;
  compatibilityCache: Record<string, CompatibilityScore>;

  // Events
  events: Event[];
  eventDrafts: EventDraft[];
  eventChats: EventChatThread[];
  eventNotifications: EventNotification[];
  userRSVPs: Record<string, RSVPStatus>;

  // Trust Score System
  trustScores: Record<string, TrustScore>;
  dateReviews: DateReview[];
  communityVouches: CommunityVouch[];
  trustReports: TrustReport[];
  trustSettings: TrustSettings | null;
  trustNotifications: TrustNotification[];

  // Search System
  searchFilters: SearchFilters;
  savedSearches: SavedSearch[];
  recentSearches: string[];
  searchHistory: { query: string; timestamp: string }[];
  searchViewMode: SearchViewMode;
  searchSortOption: SearchSortOption;

  // Actions
  setOnboarded: (value: boolean) => void;
  setCurrentProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;

  // Match actions
  createMatch: (otherUserId: string, otherProfileIntentIds?: string[]) => void;
  archiveMatch: (matchId: string) => void;

  // Chat actions
  sendMessage: (threadId: string, content: string, isFirstMessage: boolean, messageType?: 'text' | 'voice' | 'system' | 'image' | 'video' | 'video_call' | 'gif', mediaUrl?: string, selfDestructSeconds?: number, replyTo?: { id: string; content: string; senderId: string }) => void;
  unlockThread: (threadId: string, firstMessageType: 'prompt' | 'reaction' | 'voice') => void;
  markAsRead: (threadId: string) => void;
  createGroupChat: (groupName: string, participantIds: string[]) => void;
  markMessageViewed: (messageId: string) => void;
  expireMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;

  // Like actions
  markLikeSeen: (likeId: string) => void;
  likeBack: (likeId: string, otherProfileIntentIds?: string[]) => void;
  dismissLike: (likeId: string) => void;

  // Ping actions
  markPingRead: (pingId: string) => void;
  replyToPing: (pingId: string, otherProfileIntentIds?: string[]) => void;
  dismissPing: (pingId: string) => void;
  sendPing: (toUserId: string, message: string) => void;

  // Discover actions
  markProfileSeen: (profileId: string) => void;

  // AI Matching actions
  trackProfileView: (
    profileId: string,
    dwellTimeMs: number,
    action: ProfileAction,
    profileSnapshot?: ProfileView['profile_snapshot']
  ) => void;
  updateConversationMetrics: (threadId: string, otherUserId: string) => void;
  refreshTasteProfile: (profilesMap?: Map<string, Profile>) => void;
  setSmartMatchingEnabled: (enabled: boolean) => void;
  cacheCompatibilityScore: (profileId: string, score: CompatibilityScore) => void;
  getCachedCompatibilityScore: (profileId: string) => CompatibilityScore | null;
  clearCompatibilityCache: () => void;

  // Game actions
  startGame: (
    threadId: string,
    gameType: GameType,
    participants: GameParticipant[],
    settings?: Partial<GameSession['settings']>
  ) => GameSession | null;
  endGame: (gameId: string, cancelled?: boolean) => void;
  getActiveGameForThread: (threadId: string) => GameSession | null;

  // Truth or Dare actions
  setTruthOrDareDifficulty: (gameId: string, difficulty: TruthOrDareDifficulty) => void;
  drawChallenge: (gameId: string, targetIds: string[]) => GameChallenge | null;
  completeChallenge: (gameId: string) => void;
  skipChallenge: (gameId: string) => void;

  // Hot Seat actions
  startHotSeat: (gameId: string, userId: string) => void;
  askQuestion: (gameId: string, question: HotSeatQuestion) => void;
  answerQuestion: (gameId: string) => void;
  skipHotSeatQuestion: (gameId: string) => void;
  nextHotSeatPerson: (gameId: string) => void;

  // Story Chain actions
  addStoryEntry: (gameId: string, content: string) => void;
  voteRedo: (gameId: string, entryId: string) => void;
  redoEntry: (gameId: string, entryId: string) => void;

  // Custom content actions
  addCustomChallenge: (challenge: Omit<GameChallenge, 'id' | 'is_custom' | 'created_by'>) => void;
  removeCustomChallenge: (challengeId: string) => void;
  addCustomQuestion: (question: Omit<HotSeatQuestion, 'id' | 'is_custom' | 'created_by'>) => void;
  removeCustomQuestion: (questionId: string) => void;
  addCustomPrompt: (prompt: Omit<StoryPrompt, 'id' | 'is_custom' | 'created_by'>) => void;
  removeCustomPrompt: (promptId: string) => void;

  // Helpers
  getMatchWithProfile: (matchId: string) => { match: Match; profile: Profile | null; thread?: ChatThread; otherUserId?: string } | null;
  getThreadMessages: (threadId: string) => Message[];
  getUnlockedProfiles: () => Profile[];
  getSharedIntents: (profileIntentIds: string[]) => Intent[];
  checkAutoArchive: () => void;
  getUnseenLikesCount: () => number;
  getUnreadPingsCount: () => number;

  // Event actions
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'current_attendees' | 'waitlist_count' | 'attendees'>) => Event;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  cancelEvent: (eventId: string, reason: string) => void;
  duplicateEvent: (eventId: string) => Event | null;
  publishEvent: (eventId: string) => void;

  // RSVP actions
  rsvpToEvent: (eventId: string, status: RSVPStatus, message?: string) => void;
  cancelRSVP: (eventId: string) => void;
  approveAttendee: (eventId: string, userId: string) => void;
  declineAttendee: (eventId: string, userId: string) => void;
  promoteFromWaitlist: (eventId: string) => void;
  checkInAttendee: (eventId: string, userId: string) => void;
  removeAttendee: (eventId: string, userId: string) => void;

  // Event chat actions
  sendEventMessage: (eventId: string, content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'gif') => void;
  getEventChat: (eventId: string) => EventChatThread | null;

  // Event draft actions
  saveEventDraft: (draft: Omit<EventDraft, 'id' | 'user_id' | 'saved_at'>) => void;
  deleteEventDraft: (draftId: string) => void;
  loadEventDraft: (draftId: string) => EventDraft | null;

  // Event notification actions
  markEventNotificationRead: (notificationId: string) => void;
  getUnreadEventNotifications: () => EventNotification[];

  // Event helpers
  getMyHostedEvents: () => Event[];
  getMyAttendingEvents: () => Event[];
  getEventsByFilter: (filter: EventFilter) => Event[];
  getUserRSVPStatus: (eventId: string) => RSVPStatus | null;
  canHostPublicEvents: () => boolean;

  // Trust Score actions
  getTrustScore: (userId: string) => TrustScore | null;
  initializeTrustScore: (userId: string) => TrustScore;
  updateTrustScore: (userId: string, dimension: keyof TrustScore['dimensions'], change: number, reason: string) => void;

  // Date review actions
  submitDateReview: (review: Omit<DateReview, 'id' | 'created_at' | 'verified'>) => void;
  getReviewsForUser: (userId: string) => DateReview[];
  getMyReviews: () => DateReview[];

  // Vouch actions
  submitVouch: (vouch: Omit<CommunityVouch, 'id' | 'created_at' | 'voucher_trust_tier'>) => void;
  getVouchesForUser: (userId: string) => CommunityVouch[];

  // Report actions
  submitTrustReport: (report: Omit<TrustReport, 'id' | 'created_at' | 'status'>) => void;

  // Trust settings actions
  updateTrustSettings: (settings: Partial<TrustSettings>) => void;
  getTrustSettings: () => TrustSettings | null;

  // Trust notifications
  markTrustNotificationRead: (notificationId: string) => void;
  getUnreadTrustNotifications: () => TrustNotification[];

  // Trust helpers
  canMessageUser: (targetUserId: string) => boolean;
  calculateTrustTier: (score: number) => TrustTier;
  checkAndAwardBadges: (userId: string) => TrustBadge[];

  // Search actions
  setSearchFilters: (filters: SearchFilters) => void;
  updateSearchFilters: (updates: Partial<SearchFilters>) => void;
  resetSearchFilters: () => void;
  toggleQuickFilter: (filter: QuickFilterType) => void;
  clearQuickFilters: () => void;
  setSearchViewMode: (mode: SearchViewMode) => void;
  setSearchSortOption: (option: SearchSortOption) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  saveSearch: (name: string, filters: SearchFilters, notificationsEnabled?: boolean) => SavedSearch;
  updateSavedSearch: (searchId: string, updates: Partial<SavedSearch>) => void;
  deleteSavedSearch: (searchId: string) => void;
  getSavedSearches: () => SavedSearch[];
}

// DISABLED: All persistence disabled to prevent module-level AsyncStorage crashes
// Store will reset on app restart but won't crash on launch
const useDatingStore = create<DatingStore>()((set, get) => ({
      isOnboarded: false,
      currentUserId: '', // Will be set by auth
      currentProfile: null, // Will be loaded from Supabase
      matches: [], // Loaded via useMatches() hook
      threads: [], // Loaded via Supabase
      messages: [], // Loaded via useThreadMessages() hook
      likes: [], // Loaded via useLikesReceived() hook
      pings: [], // Loaded via usePingsReceived() hook
      discoveredProfiles: [],
      gameSessions: [],

      // Custom game content
      customChallenges: [],
      customQuestions: [],
      customPrompts: [],

      // AI Matching state
      profileViews: [],
      conversationMetrics: [],
      tasteProfile: null,
      smartMatchingEnabled: true,
      compatibilityCache: {},

      // Events state - loaded via useEvents() hook
      events: [],
      eventDrafts: [],
      eventChats: [],
      eventNotifications: [],
      userRSVPs: {},

      // Trust Score state
      trustScores: {},
      dateReviews: [],
      communityVouches: [],
      trustReports: [],
      trustSettings: null,
      trustNotifications: [],

      // Search state
      searchFilters: DEFAULT_SEARCH_FILTERS,
      savedSearches: [],
      recentSearches: [],
      searchHistory: [],
      searchViewMode: 'card' as SearchViewMode,
      searchSortOption: 'distance' as SearchSortOption,

      setOnboarded: (value) => set({ isOnboarded: value }),

      setCurrentProfile: (profile) => set({ currentProfile: profile }),

      updateProfile: (updates) =>
        set((state) => {
          if (state.currentProfile) {
            return { currentProfile: { ...state.currentProfile, ...updates } };
          }
          // If no profile exists, create a new one with the updates
          const defaultProfile: Profile = {
            id: '',
            user_id: state.currentUserId,
            display_name: '',
            age: 18,
            city: '',
            bio: '',
            photos: [],
            intent_ids: [],
            pace_preference: 'medium',
            response_style: 'relaxed',
            open_to_meet: true,
            virtual_only: false,
            no_photos: false,
            prompt_responses: [],
          };
          return { currentProfile: { ...defaultProfile, ...updates } };
        }),

      createMatch: (otherUserId, otherProfileIntentIds = []) => {
        const state = get();
        const currentProfile = state.currentProfile;

        if (!currentProfile) return;

        // Find shared intents between current user and other profile
        const sharedIntentIds = currentProfile.intent_ids.filter((id: string) =>
          otherProfileIntentIds.includes(id)
        );

        // If no intent IDs provided, allow match anyway (will be validated on backend)
        const finalSharedIntents = sharedIntentIds.length > 0 ? sharedIntentIds : currentProfile.intent_ids.slice(0, 1);

        const newMatchId = `match-${Date.now()}`;
        const newThreadId = `thread-${Date.now()}`;

        const newMatch: Match = {
          id: newMatchId,
          user_1_id: state.currentUserId,
          user_2_id: otherUserId,
          shared_intent_ids: finalSharedIntents,
          status: 'pending',
          matched_at: new Date().toISOString(),
        };

        const newThread: ChatThread = {
          id: newThreadId,
          match_id: newMatchId,
          unlocked: false,
        };

        set({
          matches: [...state.matches, newMatch],
          threads: [...state.threads, newThread],
        });
      },

      archiveMatch: (matchId) =>
        set((state) => ({
          matches: state.matches.map(m =>
            m.id === matchId ? { ...m, status: 'archived' as const } : m
          ),
          threads: state.threads.map(t =>
            t.match_id === matchId
              ? { ...t, archived_at: new Date().toISOString() }
              : t
          ),
        })),

      sendMessage: (threadId, content, isFirstMessage, messageType = 'text', mediaUrl, selfDestructSeconds, replyTo) => {
        const state = get();
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          thread_id: threadId,
          sender_id: state.currentUserId,
          message_type: messageType,
          content,
          media_url: mediaUrl,
          is_first_message: isFirstMessage,
          created_at: new Date().toISOString(),
          self_destruct_seconds: selfDestructSeconds,
          is_expired: false,
          reply_to_id: replyTo?.id,
          reply_to_content: replyTo?.content,
          reply_to_sender_id: replyTo?.senderId,
        };

        set({
          messages: [...state.messages, newMessage],
          threads: state.threads.map(t =>
            t.id === threadId
              ? { ...t, last_message_at: new Date().toISOString() }
              : t
          ),
        });
      },

      unlockThread: (threadId, firstMessageType) =>
        set((state) => ({
          threads: state.threads.map(t =>
            t.id === threadId
              ? { ...t, unlocked: true, first_message_type: firstMessageType }
              : t
          ),
          matches: state.matches.map(m => {
            const thread = state.threads.find(t => t.id === threadId);
            if (thread && m.id === thread.match_id) {
              return { ...m, status: 'active' as const };
            }
            return m;
          }),
        })),

      markAsRead: (threadId) => {
        const state = get();
        const now = new Date().toISOString();
        set({
          messages: state.messages.map(m =>
            m.thread_id === threadId && !m.read_at && m.sender_id !== state.currentUserId
              ? { ...m, read_at: now }
              : m
          ),
        });
      },

      createGroupChat: (groupName, participantIds) => {
        const state = get();
        const newThreadId = `group-${Date.now()}`;

        // Include current user in participants
        const allParticipants = [state.currentUserId, ...participantIds];

        const newThread: ChatThread = {
          id: newThreadId,
          match_id: `group-match-${Date.now()}`,
          unlocked: true,
          is_group: true,
          group_name: groupName,
          participant_ids: allParticipants,
          created_by: state.currentUserId,
          last_message_at: new Date().toISOString(),
        };

        // Add a system message for group creation
        const systemMessage: Message = {
          id: `msg-${Date.now()}`,
          thread_id: newThreadId,
          sender_id: 'system',
          message_type: 'system',
          content: `Group "${groupName}" created`,
          is_first_message: true,
          created_at: new Date().toISOString(),
        };

        set({
          threads: [...state.threads, newThread],
          messages: [...state.messages, systemMessage],
        });
      },

      markMessageViewed: (messageId) => {
        const state = get();
        set({
          messages: state.messages.map(m =>
            m.id === messageId && !m.viewed_at
              ? { ...m, viewed_at: new Date().toISOString() }
              : m
          ),
        });
      },

      expireMessage: (messageId) => {
        const state = get();
        set({
          messages: state.messages.map(m =>
            m.id === messageId
              ? { ...m, is_expired: true, media_url: undefined }
              : m
          ),
        });
      },

      addReaction: (messageId, emoji) => {
        const state = get();
        const newReaction: MessageReaction = {
          emoji,
          user_id: state.currentUserId,
          created_at: new Date().toISOString(),
        };
        set({
          messages: state.messages.map(m => {
            if (m.id !== messageId) return m;
            const existingReactions = m.reactions || [];
            // Check if user already reacted with this emoji
            const hasReaction = existingReactions.some(
              r => r.user_id === state.currentUserId && r.emoji === emoji
            );
            if (hasReaction) return m;
            return { ...m, reactions: [...existingReactions, newReaction] };
          }),
        });
      },

      removeReaction: (messageId, emoji) => {
        const state = get();
        set({
          messages: state.messages.map(m => {
            if (m.id !== messageId) return m;
            const existingReactions = m.reactions || [];
            return {
              ...m,
              reactions: existingReactions.filter(
                r => !(r.user_id === state.currentUserId && r.emoji === emoji)
              ),
            };
          }),
        });
      },

      markProfileSeen: (profileId) =>
        set((state) => ({
          discoveredProfiles: [...state.discoveredProfiles, profileId],
        })),

      // Like actions
      markLikeSeen: (likeId) =>
        set((state) => ({
          likes: state.likes.map(l =>
            l.id === likeId ? { ...l, seen: true } : l
          ),
        })),

      likeBack: (likeId, otherProfileIntentIds = []) => {
        const state = get();
        const like = state.likes.find(l => l.id === likeId);
        if (!like) return;

        // Create a match from the like
        const otherUserId = like.from_user_id;
        const currentProfile = state.currentProfile;

        if (!currentProfile) return;

        // Find shared intents or use a fallback
        const sharedIntentIds = currentProfile.intent_ids.filter((id: string) =>
          otherProfileIntentIds.includes(id)
        );
        const finalSharedIntents = sharedIntentIds.length > 0 ? sharedIntentIds : currentProfile.intent_ids.slice(0, 1);

        const newMatchId = `match-${Date.now()}`;
        const newThreadId = `thread-${Date.now()}`;

        const newMatch: Match = {
          id: newMatchId,
          user_1_id: state.currentUserId,
          user_2_id: otherUserId,
          shared_intent_ids: finalSharedIntents,
          status: 'pending',
          matched_at: new Date().toISOString(),
        };

        const newThread: ChatThread = {
          id: newThreadId,
          match_id: newMatchId,
          unlocked: false,
        };

        set({
          matches: [...state.matches, newMatch],
          threads: [...state.threads, newThread],
          likes: state.likes.filter(l => l.id !== likeId),
        });
      },

      dismissLike: (likeId) =>
        set((state) => ({
          likes: state.likes.filter(l => l.id !== likeId),
        })),

      // Ping actions
      markPingRead: (pingId) =>
        set((state) => ({
          pings: state.pings.map(p =>
            p.id === pingId ? { ...p, read: true } : p
          ),
        })),

      replyToPing: (pingId, otherProfileIntentIds = []) => {
        const state = get();
        const ping = state.pings.find(p => p.id === pingId);
        if (!ping) return;

        // Create a match from the ping
        const otherUserId = ping.from_user_id;
        const currentProfile = state.currentProfile;

        if (!currentProfile) return;

        // Find shared intents or use a fallback
        const sharedIntentIds = currentProfile.intent_ids.filter((id: string) =>
          otherProfileIntentIds.includes(id)
        );
        const finalSharedIntents = sharedIntentIds.length > 0 ? sharedIntentIds : currentProfile.intent_ids.slice(0, 1);

        const newMatchId = `match-${Date.now()}`;
        const newThreadId = `thread-${Date.now()}`;

        const newMatch: Match = {
          id: newMatchId,
          user_1_id: state.currentUserId,
          user_2_id: otherUserId,
          shared_intent_ids: finalSharedIntents,
          status: 'active',
          matched_at: new Date().toISOString(),
        };

        const newThread: ChatThread = {
          id: newThreadId,
          match_id: newMatchId,
          unlocked: true,
          first_message_type: 'prompt',
          last_message_at: new Date().toISOString(),
        };

        // Create initial message from their ping
        const initialMessage: Message = {
          id: `msg-${Date.now()}`,
          thread_id: newThreadId,
          sender_id: otherUserId,
          message_type: 'text',
          content: ping.message,
          is_first_message: true,
          created_at: ping.created_at,
        };

        set({
          matches: [...state.matches, newMatch],
          threads: [...state.threads, newThread],
          messages: [...state.messages, initialMessage],
          pings: state.pings.filter(p => p.id !== pingId),
        });
      },

      dismissPing: (pingId) =>
        set((state) => ({
          pings: state.pings.filter(p => p.id !== pingId),
        })),

      sendPing: (toUserId, message) => {
        const state = get();
        const newPing: Ping = {
          id: `ping-${Date.now()}`,
          from_user_id: state.currentUserId,
          to_user_id: toUserId,
          message,
          created_at: new Date().toISOString(),
          read: false,
        };

        set({
          pings: [...state.pings, newPing],
        });
      },

      getMatchWithProfile: (matchId) => {
        const state = get();
        const match = state.matches.find(m => m.id === matchId);
        if (!match) return null;

        const otherUserId = match.user_1_id === state.currentUserId
          ? match.user_2_id
          : match.user_1_id;

        // Profile should be fetched via useProfile(otherUserId) hook at the component level
        // Return match and thread only, profile fetching is handled by Supabase hooks
        const thread = state.threads.find(t => t.match_id === matchId);

        return { match, profile: null, thread, otherUserId };
      },

      getThreadMessages: (threadId) => {
        const state = get();
        return state.messages
          .filter(m => m.thread_id === threadId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      },

      getUnlockedProfiles: () => {
        // This function is deprecated - use useDiscoverProfiles() hook instead
        // Returns empty array to maintain type compatibility
        console.warn('getUnlockedProfiles is deprecated. Use useDiscoverProfiles() hook instead.');
        return [];
      },

      getSharedIntents: (profileIntentIds) => {
        const state = get();
        const currentProfile = state.currentProfile;
        if (!currentProfile) return [];

        return INTENTS.filter(
          (intent: Intent) =>
            currentProfile.intent_ids.includes(intent.id) &&
            profileIntentIds.includes(intent.id)
        );
      },

      checkAutoArchive: () => {
        const state = get();
        const now = new Date().getTime();
        const seventyTwoHours = 72 * 60 * 60 * 1000;

        const threadsToArchive = state.threads.filter(t => {
          if (t.archived_at) return false;
          if (!t.last_message_at) return false;

          const lastMessageTime = new Date(t.last_message_at).getTime();
          return now - lastMessageTime > seventyTwoHours;
        });

        if (threadsToArchive.length > 0) {
          set({
            threads: state.threads.map(t => {
              const shouldArchive = threadsToArchive.some(ta => ta.id === t.id);
              if (shouldArchive) {
                return { ...t, archived_at: new Date().toISOString() };
              }
              return t;
            }),
            matches: state.matches.map(m => {
              const threadToArchive = threadsToArchive.find(t => t.match_id === m.id);
              if (threadToArchive) {
                return { ...m, status: 'archived' as const };
              }
              return m;
            }),
          });
        }
      },

      getUnseenLikesCount: () => {
        const state = get();
        return state.likes.filter(l => !l.seen && l.to_user_id === state.currentUserId).length;
      },

      getUnreadPingsCount: () => {
        const state = get();
        return state.pings.filter(p => !p.read && p.to_user_id === state.currentUserId).length;
      },

      // ===== GAME ACTIONS =====

      startGame: (threadId, gameType, participants, settings) => {
        const state = get();
        const now = new Date().toISOString();

        // Check if there's already an active game for this thread
        const existingGame = state.gameSessions.find(
          (g) => g.thread_id === threadId && g.status === 'active'
        );
        if (existingGame) return null;

        const gameId = `game-${Date.now()}`;
        const defaultSettings: GameSession['settings'] = {
          timer_enabled: true,
          allow_skips: true,
          max_skips_per_player: 3,
          ...settings,
        };

        let initialState: GameSession['state'];

        switch (gameType) {
          case 'truth_or_dare':
            initialState = {
              type: 'truth_or_dare',
              data: {
                current_target_ids: [],
                difficulty: 'playful',
                challenges_completed: 0,
              },
            };
            break;
          case 'hot_seat':
            initialState = {
              type: 'hot_seat',
              data: {
                hot_seat_user_id: participants[0]?.user_id ?? '',
                seat_started_at: now,
                seat_duration_seconds: 300, // 5 minutes
                questions_answered: 0,
                questions_skipped: 0,
                question_queue: [],
                rotation_order: participants.map((p) => p.user_id),
                current_rotation_index: 0,
              },
            };
            break;
          case 'story_chain':
            const prompt = getRandomStoryPrompt() ?? STORY_PROMPTS[0];
            initialState = {
              type: 'story_chain',
              data: {
                prompt,
                entries: [],
                current_author_id: participants[0]?.user_id ?? '',
                turn_started_at: now,
                turn_duration_seconds: 180, // 3 minutes
                turn_order: participants.map((p) => p.user_id),
                current_turn_index: 0,
                redo_threshold: Math.ceil(participants.length / 2),
              },
            };
            break;
          default:
            // For unimplemented games, create a placeholder
            initialState = {
              type: 'truth_or_dare',
              data: {
                current_target_ids: [],
                difficulty: 'playful',
                challenges_completed: 0,
              },
            };
        }

        const newGame: GameSession = {
          id: gameId,
          thread_id: threadId,
          game_type: gameType,
          status: 'active',
          participants,
          current_turn_user_id: participants[0]?.user_id,
          state: initialState,
          created_at: now,
          started_at: now,
          created_by: state.currentUserId,
          settings: defaultSettings,
        };

        set({ gameSessions: [...state.gameSessions, newGame] });
        return newGame;
      },

      endGame: (gameId, cancelled = false) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) =>
            g.id === gameId
              ? {
                  ...g,
                  status: cancelled ? 'cancelled' : 'completed',
                  ended_at: new Date().toISOString(),
                }
              : g
          ),
        }));
      },

      getActiveGameForThread: (threadId) => {
        const state = get();
        return (
          state.gameSessions.find(
            (g) => g.thread_id === threadId && g.status === 'active'
          ) ?? null
        );
      },

      // Truth or Dare actions
      setTruthOrDareDifficulty: (gameId, difficulty) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'truth_or_dare') return g;
            return {
              ...g,
              state: {
                ...g.state,
                data: { ...g.state.data, difficulty },
              },
            };
          }),
        }));
      },

      drawChallenge: (gameId, targetIds) => {
        const state = get();
        const game = state.gameSessions.find((g) => g.id === gameId);
        if (!game || game.state.type !== 'truth_or_dare') return null;

        const gameState = game.state.data;
        const forCouples = targetIds.length > 1;
        const usedChallengeIds: string[] = []; // Could track used challenges if needed

        // Combine default challenges with custom challenges
        const customMatchingChallenges = state.customChallenges.filter(
          (c) =>
            c.difficulty === gameState.difficulty &&
            c.for_couples === forCouples &&
            !usedChallengeIds.includes(c.id)
        );

        // Get a default challenge
        const defaultChallenge = getRandomChallenge(
          gameState.difficulty,
          forCouples,
          usedChallengeIds
        );

        // Combine and pick randomly (giving custom challenges higher weight)
        const allChallenges = [
          ...customMatchingChallenges,
          ...customMatchingChallenges, // Double weight for custom
          ...(defaultChallenge ? [defaultChallenge] : []),
        ];

        if (allChallenges.length === 0) return null;

        const challenge = allChallenges[Math.floor(Math.random() * allChallenges.length)];
        if (!challenge) return null;

        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'truth_or_dare') return g;
            return {
              ...g,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  current_challenge: challenge,
                  current_target_ids: targetIds,
                  challenge_started_at: new Date().toISOString(),
                },
              },
            };
          }),
        }));

        return challenge;
      },

      completeChallenge: (gameId) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'truth_or_dare') return g;
            return {
              ...g,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  current_challenge: undefined,
                  current_target_ids: [],
                  challenge_started_at: undefined,
                  challenges_completed: g.state.data.challenges_completed + 1,
                },
              },
            };
          }),
        }));
      },

      skipChallenge: (gameId) => {
        const state = get();
        const game = state.gameSessions.find((g) => g.id === gameId);
        if (!game || game.state.type !== 'truth_or_dare') return;

        // Update skip count for the target users
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'truth_or_dare') return g;
            const targetIds = g.state.data.current_target_ids;
            return {
              ...g,
              participants: g.participants.map((p) =>
                targetIds.includes(p.user_id)
                  ? { ...p, skips_used: p.skips_used + 1 }
                  : p
              ),
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  current_challenge: undefined,
                  current_target_ids: [],
                  challenge_started_at: undefined,
                },
              },
            };
          }),
        }));
      },

      // Hot Seat actions
      startHotSeat: (gameId, userId) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'hot_seat') return g;
            return {
              ...g,
              current_turn_user_id: userId,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  hot_seat_user_id: userId,
                  seat_started_at: new Date().toISOString(),
                  current_question: undefined,
                  question_started_at: undefined,
                },
              },
            };
          }),
        }));
      },

      askQuestion: (gameId, question) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'hot_seat') return g;
            return {
              ...g,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  current_question: question,
                  question_started_at: new Date().toISOString(),
                },
              },
            };
          }),
        }));
      },

      answerQuestion: (gameId) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'hot_seat') return g;
            return {
              ...g,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  current_question: undefined,
                  question_started_at: undefined,
                  questions_answered: g.state.data.questions_answered + 1,
                },
              },
            };
          }),
        }));
      },

      skipHotSeatQuestion: (gameId) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'hot_seat') return g;
            return {
              ...g,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  current_question: undefined,
                  question_started_at: undefined,
                  questions_skipped: g.state.data.questions_skipped + 1,
                },
              },
            };
          }),
        }));
      },

      nextHotSeatPerson: (gameId) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'hot_seat') return g;
            const nextIndex =
              (g.state.data.current_rotation_index + 1) %
              g.state.data.rotation_order.length;
            const nextUserId = g.state.data.rotation_order[nextIndex];
            return {
              ...g,
              current_turn_user_id: nextUserId,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  hot_seat_user_id: nextUserId ?? '',
                  seat_started_at: new Date().toISOString(),
                  current_rotation_index: nextIndex,
                  current_question: undefined,
                  question_started_at: undefined,
                },
              },
            };
          }),
        }));
      },

      // Story Chain actions
      addStoryEntry: (gameId, content) => {
        const state = get();
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'story_chain') return g;

            const newEntry: StoryEntry = {
              id: `entry-${Date.now()}`,
              author_id: state.currentUserId,
              content,
              created_at: new Date().toISOString(),
              redo_votes: [],
              is_redone: false,
            };

            const nextIndex =
              (g.state.data.current_turn_index + 1) %
              g.state.data.turn_order.length;
            const nextAuthorId = g.state.data.turn_order[nextIndex];

            return {
              ...g,
              current_turn_user_id: nextAuthorId,
              participants: g.participants.map((p) =>
                p.user_id === state.currentUserId
                  ? { ...p, turns_taken: p.turns_taken + 1 }
                  : p
              ),
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  entries: [...g.state.data.entries, newEntry],
                  current_author_id: nextAuthorId ?? '',
                  turn_started_at: new Date().toISOString(),
                  current_turn_index: nextIndex,
                },
              },
            };
          }),
        }));
      },

      voteRedo: (gameId, entryId) => {
        const state = get();
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'story_chain') return g;

            return {
              ...g,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  entries: g.state.data.entries.map((e) =>
                    e.id === entryId &&
                    !e.redo_votes.includes(state.currentUserId)
                      ? { ...e, redo_votes: [...e.redo_votes, state.currentUserId] }
                      : e
                  ),
                },
              },
            };
          }),
        }));
      },

      redoEntry: (gameId, entryId) => {
        set((state) => ({
          gameSessions: state.gameSessions.map((g) => {
            if (g.id !== gameId || g.state.type !== 'story_chain') return g;

            const entryIndex = g.state.data.entries.findIndex(
              (e) => e.id === entryId
            );
            if (entryIndex === -1) return g;

            const entry = g.state.data.entries[entryIndex];
            const authorId = entry?.author_id ?? '';
            const authorIndex = g.state.data.turn_order.indexOf(authorId);

            return {
              ...g,
              current_turn_user_id: authorId,
              state: {
                ...g.state,
                data: {
                  ...g.state.data,
                  entries: g.state.data.entries.map((e) =>
                    e.id === entryId ? { ...e, is_redone: true } : e
                  ),
                  current_author_id: authorId,
                  turn_started_at: new Date().toISOString(),
                  current_turn_index:
                    authorIndex !== -1
                      ? authorIndex
                      : g.state.data.current_turn_index,
                },
              },
            };
          }),
        }));
      },

      // ===== CUSTOM CONTENT ACTIONS =====

      addCustomChallenge: (challenge) => {
        const state = get();
        const newChallenge: GameChallenge = {
          ...challenge,
          id: `custom-tod-${Date.now()}`,
          is_custom: true,
          created_by: state.currentUserId,
        };
        set({ customChallenges: [...state.customChallenges, newChallenge] });
      },

      removeCustomChallenge: (challengeId) => {
        set((state) => ({
          customChallenges: state.customChallenges.filter((c) => c.id !== challengeId),
        }));
      },

      addCustomQuestion: (question) => {
        const state = get();
        const newQuestion: HotSeatQuestion = {
          ...question,
          id: `custom-hs-${Date.now()}`,
          is_custom: true,
          created_by: state.currentUserId,
        };
        set({ customQuestions: [...state.customQuestions, newQuestion] });
      },

      removeCustomQuestion: (questionId) => {
        set((state) => ({
          customQuestions: state.customQuestions.filter((q) => q.id !== questionId),
        }));
      },

      addCustomPrompt: (prompt) => {
        const state = get();
        const newPrompt: StoryPrompt = {
          ...prompt,
          id: `custom-sp-${Date.now()}`,
          is_custom: true,
          created_by: state.currentUserId,
        };
        set({ customPrompts: [...state.customPrompts, newPrompt] });
      },

      removeCustomPrompt: (promptId) => {
        set((state) => ({
          customPrompts: state.customPrompts.filter((p) => p.id !== promptId),
        }));
      },

      // ===== AI MATCHING ACTIONS =====

      trackProfileView: (profileId, dwellTimeMs, action, profileSnapshot) => {
        const state = get();
        const newView: ProfileView = {
          id: `view-${Date.now()}`,
          viewer_id: state.currentUserId,
          viewed_profile_id: profileId,
          dwell_time_ms: dwellTimeMs,
          action,
          created_at: new Date().toISOString(),
          profile_snapshot: profileSnapshot,
        };

        set({
          profileViews: [...state.profileViews.slice(-500), newView], // Keep last 500 views
        });
      },

      updateConversationMetrics: (threadId, otherUserId) => {
        const state = get();
        const threadMessages = state.messages.filter(
          (m) => m.thread_id === threadId
        );
        const myMessages = threadMessages.filter(
          (m) => m.sender_id === state.currentUserId
        );
        const theirMessages = threadMessages.filter(
          (m) => m.sender_id === otherUserId
        );

        // Calculate average response time
        let totalResponseTime = 0;
        let responseCount = 0;
        for (let i = 1; i < threadMessages.length; i++) {
          const prev = threadMessages[i - 1];
          const curr = threadMessages[i];
          if (prev && curr && prev.sender_id !== curr.sender_id && curr.sender_id === state.currentUserId) {
            const prevTime = new Date(prev.created_at).getTime();
            const currTime = new Date(curr.created_at).getTime();
            totalResponseTime += currTime - prevTime;
            responseCount++;
          }
        }

        const avgResponseTimeMs =
          responseCount > 0 ? totalResponseTime / responseCount : 0;

        // Calculate average message length
        const avgMessageLength =
          myMessages.length > 0
            ? myMessages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0) /
              myMessages.length
            : 0;

        const existingMetrics = state.conversationMetrics.find(
          (m) => m.thread_id === threadId
        );

        // Calculate streak days
        const now = new Date();
        const lastMessageDate = threadMessages[threadMessages.length - 1]?.created_at
          ? new Date(threadMessages[threadMessages.length - 1]!.created_at)
          : now;

        // Determine connection quality based on metrics
        let connectionQuality: 'cold' | 'warm' | 'hot' | 'connected' = 'cold';
        if (myMessages.length > 20 && theirMessages.length > 20) {
          connectionQuality = 'connected';
        } else if (myMessages.length > 10 && theirMessages.length > 10) {
          connectionQuality = 'hot';
        } else if (myMessages.length > 3 && theirMessages.length > 3) {
          connectionQuality = 'warm';
        }

        const newMetrics: ConversationMetrics = {
          thread_id: threadId,
          user_id: state.currentUserId,
          other_user_id: otherUserId,
          messages_sent: myMessages.length,
          messages_received: theirMessages.length,
          avg_response_time_ms: avgResponseTimeMs,
          avg_message_length: avgMessageLength,
          longest_streak_days: existingMetrics?.longest_streak_days ?? 0,
          last_active_at: lastMessageDate.toISOString(),
          met_in_person: existingMetrics?.met_in_person ?? false,
          connection_quality: connectionQuality,
          created_at: existingMetrics?.created_at ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set({
          conversationMetrics: existingMetrics
            ? state.conversationMetrics.map((m) =>
                m.thread_id === threadId ? newMetrics : m
              )
            : [...state.conversationMetrics, newMetrics],
        });
      },

      refreshTasteProfile: (profilesMap = new Map<string, Profile>()) => {
        const state = get();
        if (state.profileViews.length < 5) {
          // Not enough data to build a meaningful profile
          return;
        }

        // profilesMap should be passed in from component using Supabase data
        // If empty, we can't build taste profile (caller needs to provide profiles)
        if (profilesMap.size === 0) {
          console.warn('refreshTasteProfile requires a profilesMap to be provided. Fetch profiles via Supabase hooks.');
          return;
        }

        const newTasteProfile = buildTasteProfile(
          state.currentUserId,
          state.profileViews,
          profilesMap,
          state.conversationMetrics
        );

        set({ tasteProfile: newTasteProfile });
      },

      setSmartMatchingEnabled: (enabled) => {
        set({ smartMatchingEnabled: enabled });
      },

      cacheCompatibilityScore: (profileId, score) => {
        set((state) => ({
          compatibilityCache: { ...state.compatibilityCache, [profileId]: score },
        }));
      },

      getCachedCompatibilityScore: (profileId) => {
        const state = get();
        return state.compatibilityCache[profileId] ?? null;
      },

      clearCompatibilityCache: () => {
        set({ compatibilityCache: {} });
      },

      // ===== EVENT ACTIONS =====

      createEvent: (eventData) => {
        const state = get();
        const now = new Date().toISOString();
        const newEvent: Event = {
          ...eventData,
          id: `event-${Date.now()}`,
          current_attendees: 0,
          waitlist_count: 0,
          attendees: [],
          created_at: now,
          updated_at: now,
        };

        set({ events: [...state.events, newEvent] });

        // Create event chat thread
        const newChatThread: EventChatThread = {
          id: `event-chat-${newEvent.id}`,
          event_id: newEvent.id,
          is_active: true,
          messages: [],
          created_at: now,
        };
        set({ eventChats: [...state.eventChats, newChatThread] });

        return newEvent;
      },

      updateEvent: (eventId, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, ...updates, updated_at: new Date().toISOString() }
              : e
          ),
        }));
      },

      deleteEvent: (eventId) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== eventId),
          eventChats: state.eventChats.filter((c) => c.event_id !== eventId),
        }));
      },

      cancelEvent: (eventId, reason) => {
        const state = get();
        const event = state.events.find((e) => e.id === eventId);
        if (!event) return;

        // Notify all attendees
        const notifications: EventNotification[] = event.attendees
          .filter((a) => a.rsvp_status === 'going' || a.rsvp_status === 'maybe')
          .map((attendee) => ({
            id: `notif-${Date.now()}-${attendee.user_id}`,
            user_id: attendee.user_id,
            event_id: eventId,
            type: 'event_cancelled' as const,
            title: 'Event Cancelled',
            body: `${event.title} has been cancelled: ${reason}`,
            read: false,
            created_at: new Date().toISOString(),
          }));

        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  status: 'cancelled' as const,
                  cancelled_at: new Date().toISOString(),
                  cancellation_reason: reason,
                }
              : e
          ),
          eventNotifications: [...state.eventNotifications, ...notifications],
        }));
      },

      duplicateEvent: (eventId) => {
        const state = get();
        const event = state.events.find((e) => e.id === eventId);
        if (!event) return null;

        const now = new Date().toISOString();
        const duplicatedEvent: Event = {
          ...event,
          id: `event-${Date.now()}`,
          title: `${event.title} (Copy)`,
          status: 'draft',
          current_attendees: 0,
          waitlist_count: 0,
          attendees: [],
          created_at: now,
          updated_at: now,
          cancelled_at: undefined,
          cancellation_reason: undefined,
        };

        set({ events: [...state.events, duplicatedEvent] });
        return duplicatedEvent;
      },

      publishEvent: (eventId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId
              ? { ...e, status: 'published' as const, updated_at: new Date().toISOString() }
              : e
          ),
        }));
      },

      // ===== RSVP ACTIONS =====

      rsvpToEvent: (eventId, status, message) => {
        const state = get();
        const event = state.events.find((e) => e.id === eventId);
        if (!event) return;

        const currentProfile = state.currentProfile;
        if (!currentProfile) return;

        const now = new Date().toISOString();
        let finalStatus = status;

        // Check if waitlist needed
        if (
          status === 'going' &&
          event.max_attendees &&
          event.current_attendees >= event.max_attendees
        ) {
          finalStatus = 'waitlist';
        }

        // Check if approval needed
        if (status === 'going' && event.requires_approval) {
          finalStatus = 'pending_approval';
        }

        const newAttendee: EventAttendee = {
          id: `attendee-${Date.now()}`,
          user_id: state.currentUserId,
          display_name: currentProfile.display_name,
          photo: currentProfile.photos[0],
          rsvp_status: finalStatus,
          rsvp_at: now,
          waitlist_position:
            finalStatus === 'waitlist' ? event.waitlist_count + 1 : undefined,
          notes: message,
        };

        // Update userRSVPs
        set((state) => ({
          userRSVPs: { ...state.userRSVPs, [eventId]: finalStatus },
          events: state.events.map((e) => {
            if (e.id !== eventId) return e;
            const existingAttendeeIndex = e.attendees.findIndex(
              (a) => a.user_id === state.currentUserId
            );
            let updatedAttendees: EventAttendee[];
            if (existingAttendeeIndex >= 0) {
              updatedAttendees = e.attendees.map((a, i) =>
                i === existingAttendeeIndex ? newAttendee : a
              );
            } else {
              updatedAttendees = [...e.attendees, newAttendee];
            }
            return {
              ...e,
              attendees: updatedAttendees,
              current_attendees:
                finalStatus === 'going'
                  ? e.current_attendees + 1
                  : e.current_attendees,
              waitlist_count:
                finalStatus === 'waitlist'
                  ? e.waitlist_count + 1
                  : e.waitlist_count,
            };
          }),
        }));

        // Notify host
        if (finalStatus === 'going' || finalStatus === 'pending_approval') {
          const notification: EventNotification = {
            id: `notif-${Date.now()}`,
            user_id: event.host_id,
            event_id: eventId,
            type: 'attendee_joined',
            title: 'New RSVP',
            body: `${currentProfile.display_name} wants to join ${event.title}`,
            read: false,
            created_at: now,
          };
          set((state) => ({
            eventNotifications: [...state.eventNotifications, notification],
          }));
        }
      },

      cancelRSVP: (eventId) => {
        const state = get();
        const event = state.events.find((e) => e.id === eventId);
        if (!event) return;

        const attendee = event.attendees.find(
          (a) => a.user_id === state.currentUserId
        );
        if (!attendee) return;

        const wasGoing = attendee.rsvp_status === 'going';

        const { [eventId]: _, ...remainingRSVPs } = state.userRSVPs;

        set((state) => ({
          userRSVPs: remainingRSVPs,
          events: state.events.map((e) => {
            if (e.id !== eventId) return e;
            return {
              ...e,
              attendees: e.attendees.filter(
                (a) => a.user_id !== state.currentUserId
              ),
              current_attendees: wasGoing
                ? e.current_attendees - 1
                : e.current_attendees,
            };
          }),
        }));

        // Promote from waitlist if there was a spot
        if (wasGoing) {
          get().promoteFromWaitlist(eventId);
        }
      },

      approveAttendee: (eventId, userId) => {
        const state = get();
        const event = state.events.find((e) => e.id === eventId);
        if (!event) return;

        const now = new Date().toISOString();

        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e;
            return {
              ...e,
              attendees: e.attendees.map((a) =>
                a.user_id === userId
                  ? { ...a, rsvp_status: 'going' as const, approved_at: now }
                  : a
              ),
              current_attendees: e.current_attendees + 1,
            };
          }),
        }));

        // Notify user
        const notification: EventNotification = {
          id: `notif-${Date.now()}`,
          user_id: userId,
          event_id: eventId,
          type: 'rsvp_approved',
          title: 'RSVP Approved',
          body: `You've been approved to attend ${event.title}!`,
          read: false,
          created_at: now,
        };
        set((state) => ({
          eventNotifications: [...state.eventNotifications, notification],
        }));
      },

      declineAttendee: (eventId, userId) => {
        const state = get();
        const event = state.events.find((e) => e.id === eventId);
        if (!event) return;

        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e;
            return {
              ...e,
              attendees: e.attendees.filter((a) => a.user_id !== userId),
            };
          }),
        }));

        // Notify user
        const notification: EventNotification = {
          id: `notif-${Date.now()}`,
          user_id: userId,
          event_id: eventId,
          type: 'rsvp_declined',
          title: 'RSVP Declined',
          body: `Your request to attend ${event.title} was not approved.`,
          read: false,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          eventNotifications: [...state.eventNotifications, notification],
        }));
      },

      promoteFromWaitlist: (eventId) => {
        const state = get();
        const event = state.events.find((e) => e.id === eventId);
        if (!event) return;

        // Find first person on waitlist
        const waitlistAttendee = event.attendees
          .filter((a) => a.rsvp_status === 'waitlist')
          .sort((a, b) => (a.waitlist_position ?? 0) - (b.waitlist_position ?? 0))[0];

        if (!waitlistAttendee) return;

        const now = new Date().toISOString();

        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e;
            return {
              ...e,
              attendees: e.attendees.map((a) =>
                a.user_id === waitlistAttendee.user_id
                  ? { ...a, rsvp_status: 'going' as const, waitlist_position: undefined }
                  : a
              ),
              current_attendees: e.current_attendees + 1,
              waitlist_count: e.waitlist_count - 1,
            };
          }),
        }));

        // Notify promoted user
        const notification: EventNotification = {
          id: `notif-${Date.now()}`,
          user_id: waitlistAttendee.user_id,
          event_id: eventId,
          type: 'waitlist_spot_open',
          title: 'Spot Available!',
          body: `A spot opened up for ${event.title}. You're now on the guest list!`,
          read: false,
          created_at: now,
        };
        set((state) => ({
          eventNotifications: [...state.eventNotifications, notification],
        }));
      },

      checkInAttendee: (eventId, userId) => {
        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e;
            return {
              ...e,
              attendees: e.attendees.map((a) =>
                a.user_id === userId
                  ? { ...a, checked_in_at: new Date().toISOString() }
                  : a
              ),
            };
          }),
        }));
      },

      removeAttendee: (eventId, userId) => {
        const state = get();
        const event = state.events.find((e) => e.id === eventId);
        if (!event) return;

        const attendee = event.attendees.find((a) => a.user_id === userId);
        if (!attendee) return;

        const wasGoing = attendee.rsvp_status === 'going';

        set((state) => ({
          events: state.events.map((e) => {
            if (e.id !== eventId) return e;
            return {
              ...e,
              attendees: e.attendees.filter((a) => a.user_id !== userId),
              current_attendees: wasGoing
                ? e.current_attendees - 1
                : e.current_attendees,
            };
          }),
        }));

        // Notify removed user
        const notification: EventNotification = {
          id: `notif-${Date.now()}`,
          user_id: userId,
          event_id: eventId,
          type: 'attendee_left',
          title: 'Removed from Event',
          body: `You've been removed from ${event.title}.`,
          read: false,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          eventNotifications: [...state.eventNotifications, notification],
        }));

        // Promote from waitlist
        if (wasGoing) {
          get().promoteFromWaitlist(eventId);
        }
      },

      // ===== EVENT CHAT ACTIONS =====

      sendEventMessage: (eventId, content, mediaUrl, mediaType) => {
        const state = get();
        const currentProfile = state.currentProfile;
        if (!currentProfile) return;

        const now = new Date().toISOString();
        const newMessage: EventChatMessage = {
          id: `event-msg-${Date.now()}`,
          thread_id: `event-chat-${eventId}`,
          sender_id: state.currentUserId,
          sender_name: currentProfile.display_name,
          sender_photo: currentProfile.photos[0],
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          created_at: now,
          read_by: [state.currentUserId],
        };

        set((state) => ({
          eventChats: state.eventChats.map((c) => {
            if (c.event_id !== eventId) return c;
            return {
              ...c,
              messages: [...c.messages, newMessage],
              last_message_at: now,
            };
          }),
        }));
      },

      getEventChat: (eventId) => {
        const state = get();
        return state.eventChats.find((c) => c.event_id === eventId) ?? null;
      },

      // ===== EVENT DRAFT ACTIONS =====

      saveEventDraft: (draftData) => {
        const state = get();
        const now = new Date().toISOString();
        const newDraft: EventDraft = {
          ...draftData,
          id: `draft-${Date.now()}`,
          user_id: state.currentUserId,
          saved_at: now,
        };

        set({ eventDrafts: [...state.eventDrafts, newDraft] });
      },

      deleteEventDraft: (draftId) => {
        set((state) => ({
          eventDrafts: state.eventDrafts.filter((d) => d.id !== draftId),
        }));
      },

      loadEventDraft: (draftId) => {
        const state = get();
        return state.eventDrafts.find((d) => d.id === draftId) ?? null;
      },

      // ===== EVENT NOTIFICATION ACTIONS =====

      markEventNotificationRead: (notificationId) => {
        set((state) => ({
          eventNotifications: state.eventNotifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      getUnreadEventNotifications: () => {
        const state = get();
        return state.eventNotifications.filter(
          (n) => !n.read && n.user_id === state.currentUserId
        );
      },

      // ===== EVENT HELPERS =====

      getMyHostedEvents: () => {
        const state = get();
        return state.events.filter((e) => e.host_id === state.currentUserId);
      },

      getMyAttendingEvents: () => {
        const state = get();
        return state.events.filter((e) =>
          e.attendees.some(
            (a) =>
              a.user_id === state.currentUserId &&
              (a.rsvp_status === 'going' || a.rsvp_status === 'maybe')
          )
        );
      },

      getEventsByFilter: (filter) => {
        const state = get();
        return state.events.filter((e) => {
          if (e.status !== 'published') return false;

          if (filter.category && e.category !== filter.category) return false;

          if (filter.visibility && e.visibility !== filter.visibility)
            return false;

          if (filter.is_virtual !== undefined) {
            if (filter.is_virtual && !e.location.is_virtual) return false;
            if (!filter.is_virtual && e.location.is_virtual) return false;
          }

          if (filter.has_spots) {
            if (e.max_attendees && e.current_attendees >= e.max_attendees)
              return false;
          }

          if (filter.date_range) {
            const eventDate = new Date(e.start_date);
            const startDate = new Date(filter.date_range.start);
            const endDate = new Date(filter.date_range.end);
            if (eventDate < startDate || eventDate > endDate) return false;
          }

          if (filter.tags && filter.tags.length > 0) {
            if (!filter.tags.some((tag) => e.tags.includes(tag))) return false;
          }

          if (filter.host_id && e.host_id !== filter.host_id) return false;

          return true;
        });
      },

      getUserRSVPStatus: (eventId) => {
        const state = get();
        return state.userRSVPs[eventId] ?? null;
      },

      canHostPublicEvents: () => {
        // Require 2+ reputation stars to host public events
        const state = get();
        // For now, return true since we don't have reputation system fully implemented
        return true;
      },

      // ===== TRUST SCORE ACTIONS =====

      getTrustScore: (userId) => {
        const state = get();
        return state.trustScores[userId] ?? null;
      },

      initializeTrustScore: (userId) => {
        const state = get();
        const existing = state.trustScores[userId];
        if (existing) return existing;

        const now = new Date().toISOString();
        const createDimension = (name: string, description: string): TrustDimension => ({
          id: `dim-${name}-${userId}`,
          name,
          score: 50,
          weight: 1 / 6,
          description,
          factors: [],
        });

        const newTrustScore: TrustScore = {
          user_id: userId,
          overall_score: 25,
          tier: 'newcomer',
          badges: [],
          dimensions: {
            behavior: createDimension('Behavior', 'How you interact on the app'),
            community: createDimension('Community', 'Feedback from other users'),
            reliability: createDimension('Reliability', 'Showing up and following through'),
            safety: createDimension('Safety', 'Respecting boundaries and consent'),
            engagement: createDimension('Engagement', 'Contributing to the community'),
            transparency: createDimension('Transparency', 'Profile completeness and honesty'),
          },
          stats: {
            dates_completed: 0,
            events_attended: 0,
            events_hosted: 0,
            reviews_received: 0,
            average_rating: 0,
            vouches_received: 0,
            vouches_given: 0,
            reports_received: 0,
            reports_upheld: 0,
            response_rate: 0,
            message_quality_score: 0,
            profile_completeness: 0,
            days_on_platform: 0,
            last_active: now,
          },
          history: [],
          created_at: now,
          updated_at: now,
        };

        set((state) => ({
          trustScores: { ...state.trustScores, [userId]: newTrustScore },
        }));

        return newTrustScore;
      },

      updateTrustScore: (userId, dimension, change, reason) => {
        const state = get();
        let trustScore = state.trustScores[userId];
        if (!trustScore) {
          trustScore = get().initializeTrustScore(userId);
        }

        const now = new Date().toISOString();
        const previousScore = trustScore.overall_score;

        // Update the specific dimension
        const updatedDimension = {
          ...trustScore.dimensions[dimension],
          score: Math.max(0, Math.min(100, trustScore.dimensions[dimension].score + change)),
        };

        // Calculate new overall score
        const dimensions = { ...trustScore.dimensions, [dimension]: updatedDimension };
        const overallScore = Math.round(
          Object.values(dimensions).reduce((sum, d) => sum + d.score * d.weight, 0)
        );

        // Determine new tier
        const newTier = get().calculateTrustTier(overallScore);

        // Create history entry
        const historyEntry: TrustScoreChange = {
          id: `change-${Date.now()}`,
          timestamp: now,
          previous_score: previousScore,
          new_score: overallScore,
          reason,
          dimension_affected: dimension,
          factor: reason,
        };

        const updatedTrustScore: TrustScore = {
          ...trustScore,
          dimensions,
          overall_score: overallScore,
          tier: newTier,
          history: [...trustScore.history.slice(-50), historyEntry],
          updated_at: now,
        };

        set((state) => ({
          trustScores: { ...state.trustScores, [userId]: updatedTrustScore },
        }));

        // Check for tier upgrade notification
        if (newTier !== trustScore.tier) {
          const notification: TrustNotification = {
            id: `trust-notif-${Date.now()}`,
            user_id: userId,
            type: overallScore > previousScore ? 'tier_upgraded' : 'score_decreased',
            title: overallScore > previousScore ? 'Trust Tier Upgraded!' : 'Trust Score Changed',
            body: overallScore > previousScore
              ? `You've reached ${newTier} status!`
              : `Your trust score has changed.`,
            read: false,
            created_at: now,
          };
          set({ trustNotifications: [...state.trustNotifications, notification] });
        }

        // Check and award badges
        get().checkAndAwardBadges(userId);
      },

      // Date review actions
      submitDateReview: (reviewData) => {
        const state = get();
        const now = new Date().toISOString();

        const newReview: DateReview = {
          ...reviewData,
          id: `review-${Date.now()}`,
          created_at: now,
          verified: false,
        };

        set({ dateReviews: [...state.dateReviews, newReview] });

        // Update the reviewed user's trust score based on the review
        const ratingDelta = (reviewData.rating - 3) * 3; // -6 to +6
        get().updateTrustScore(
          reviewData.reviewed_user_id,
          'community',
          ratingDelta,
          `Date review: ${reviewData.rating}/5 stars`
        );

        // Update stats
        const trustScore = state.trustScores[reviewData.reviewed_user_id];
        if (trustScore) {
          const reviews = state.dateReviews.filter(
            (r) => r.reviewed_user_id === reviewData.reviewed_user_id
          );
          const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0) + reviewData.rating;
          const avgRating = totalRatings / (reviews.length + 1);

          const updatedScore: TrustScore = {
            ...trustScore,
            stats: {
              ...trustScore.stats,
              reviews_received: trustScore.stats.reviews_received + 1,
              average_rating: avgRating,
              dates_completed: trustScore.stats.dates_completed + (reviewData.met_in_person ? 1 : 0),
            },
          };

          set((state) => ({
            trustScores: { ...state.trustScores, [reviewData.reviewed_user_id]: updatedScore },
          }));
        }

        // Send notification to reviewed user
        const notification: TrustNotification = {
          id: `trust-notif-${Date.now()}`,
          user_id: reviewData.reviewed_user_id,
          type: 'review_received',
          title: 'New Review',
          body: reviewData.is_anonymous
            ? 'Someone left you a review!'
            : `${reviewData.reviewer_name} left you a review`,
          read: false,
          created_at: now,
        };
        set({ trustNotifications: [...state.trustNotifications, notification] });
      },

      getReviewsForUser: (userId) => {
        const state = get();
        return state.dateReviews.filter((r) => r.reviewed_user_id === userId);
      },

      getMyReviews: () => {
        const state = get();
        return state.dateReviews.filter((r) => r.reviewer_id === state.currentUserId);
      },

      // Vouch actions
      submitVouch: (vouchData) => {
        const state = get();
        const now = new Date().toISOString();

        // Get voucher's trust tier
        const voucherTrustScore = state.trustScores[vouchData.voucher_id];
        const voucherTier: TrustTier = voucherTrustScore?.tier ?? 'newcomer';

        const newVouch: CommunityVouch = {
          ...vouchData,
          id: `vouch-${Date.now()}`,
          voucher_trust_tier: voucherTier,
          created_at: now,
        };

        set({ communityVouches: [...state.communityVouches, newVouch] });

        // Update trust score - vouches from higher tier users count more
        const tierMultiplier: Record<TrustTier, number> = {
          newcomer: 1,
          member: 1.5,
          trusted: 2,
          verified: 3,
          ambassador: 4,
        };
        const vouchValue = 3 * tierMultiplier[voucherTier];

        get().updateTrustScore(
          vouchData.vouched_user_id,
          'community',
          vouchValue,
          `Vouched by ${vouchData.voucher_name}`
        );

        // Update stats
        const trustScore = state.trustScores[vouchData.vouched_user_id];
        if (trustScore) {
          const updatedScore: TrustScore = {
            ...trustScore,
            stats: {
              ...trustScore.stats,
              vouches_received: trustScore.stats.vouches_received + 1,
            },
          };
          set((state) => ({
            trustScores: { ...state.trustScores, [vouchData.vouched_user_id]: updatedScore },
          }));
        }

        // Send notification
        const notification: TrustNotification = {
          id: `trust-notif-${Date.now()}`,
          user_id: vouchData.vouched_user_id,
          type: 'vouch_received',
          title: 'New Vouch!',
          body: `${vouchData.voucher_name} vouched for you`,
          read: false,
          created_at: now,
        };
        set({ trustNotifications: [...state.trustNotifications, notification] });
      },

      getVouchesForUser: (userId) => {
        const state = get();
        return state.communityVouches.filter((v) => v.vouched_user_id === userId);
      },

      // Report actions
      submitTrustReport: (reportData) => {
        const state = get();
        const now = new Date().toISOString();

        const newReport: TrustReport = {
          ...reportData,
          id: `report-${Date.now()}`,
          status: 'pending',
          created_at: now,
        };

        set({ trustReports: [...state.trustReports, newReport] });

        // Immediate trust impact for reports
        const severityImpact: Record<string, number> = {
          low: -2,
          medium: -5,
          high: -10,
          critical: -20,
        };

        get().updateTrustScore(
          reportData.reported_user_id,
          'safety',
          severityImpact[reportData.severity] ?? -5,
          `Report received: ${reportData.type}`
        );

        // Update stats
        const trustScore = state.trustScores[reportData.reported_user_id];
        if (trustScore) {
          const updatedScore: TrustScore = {
            ...trustScore,
            stats: {
              ...trustScore.stats,
              reports_received: trustScore.stats.reports_received + 1,
            },
          };
          set((state) => ({
            trustScores: { ...state.trustScores, [reportData.reported_user_id]: updatedScore },
          }));
        }
      },

      // Trust settings actions
      updateTrustSettings: (settings) => {
        const state = get();
        const currentSettings = state.trustSettings ?? {
          user_id: state.currentUserId,
          min_trust_to_message: 'newcomer' as TrustTier,
          show_trust_score: true,
          allow_anonymous_reviews: true,
          notify_on_trust_change: true,
        };

        set({
          trustSettings: { ...currentSettings, ...settings },
        });
      },

      getTrustSettings: () => {
        const state = get();
        return state.trustSettings;
      },

      // Trust notifications
      markTrustNotificationRead: (notificationId) => {
        set((state) => ({
          trustNotifications: state.trustNotifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },

      getUnreadTrustNotifications: () => {
        const state = get();
        return state.trustNotifications.filter(
          (n) => !n.read && n.user_id === state.currentUserId
        );
      },

      // Trust helpers
      canMessageUser: (targetUserId) => {
        const state = get();
        const targetSettings = state.trustSettings; // In real app, would fetch target user's settings
        if (!targetSettings) return true;

        const myTrustScore = state.trustScores[state.currentUserId];
        const myTier = myTrustScore?.tier ?? 'newcomer';

        const tierOrder: TrustTier[] = ['newcomer', 'member', 'trusted', 'verified', 'ambassador'];
        const myTierIndex = tierOrder.indexOf(myTier);
        const requiredTierIndex = tierOrder.indexOf(targetSettings.min_trust_to_message);

        return myTierIndex >= requiredTierIndex;
      },

      calculateTrustTier: (score) => {
        if (score >= 90) return 'ambassador';
        if (score >= 75) return 'verified';
        if (score >= 50) return 'trusted';
        if (score >= 25) return 'member';
        return 'newcomer';
      },

      checkAndAwardBadges: (userId) => {
        const state = get();
        const trustScore = state.trustScores[userId];
        if (!trustScore) return [];

        const newBadges: TrustBadge[] = [];
        const currentBadges = new Set(trustScore.badges);

        // Check for Safe Dater badge (5+ positive reviews)
        const reviews = state.dateReviews.filter((r) => r.reviewed_user_id === userId);
        const positiveReviews = reviews.filter((r) => r.rating >= 4);
        if (positiveReviews.length >= 5 && !currentBadges.has('safe_dater')) {
          newBadges.push('safe_dater');
        }

        // Check for Community Vouched badge (3+ vouches from trusted members)
        const vouches = state.communityVouches.filter((v) => v.vouched_user_id === userId);
        const trustedVouches = vouches.filter((v) =>
          ['trusted', 'verified', 'ambassador'].includes(v.voucher_trust_tier)
        );
        if (trustedVouches.length >= 3 && !currentBadges.has('community_vouched')) {
          newBadges.push('community_vouched');
        }

        // Check for Reliable badge (shows up to 90%+ of dates)
        if (trustScore.stats.dates_completed >= 5 && !currentBadges.has('reliable')) {
          newBadges.push('reliable');
        }

        // Check for Event Host badge
        if (trustScore.stats.events_hosted >= 3 && !currentBadges.has('event_host')) {
          newBadges.push('event_host');
        }

        // Check for Long Term Member (1+ year)
        if (trustScore.stats.days_on_platform >= 365 && !currentBadges.has('long_term_member')) {
          newBadges.push('long_term_member');
        }

        // Check for Great Communicator (high response rate)
        if (trustScore.stats.response_rate >= 0.9 && !currentBadges.has('great_communicator')) {
          newBadges.push('great_communicator');
        }

        // Check for Respectful (no upheld reports)
        if (
          trustScore.stats.reports_upheld === 0 &&
          trustScore.stats.dates_completed >= 3 &&
          !currentBadges.has('respectful')
        ) {
          newBadges.push('respectful');
        }

        // Award new badges
        if (newBadges.length > 0) {
          const updatedScore: TrustScore = {
            ...trustScore,
            badges: [...trustScore.badges, ...newBadges],
          };
          set((state) => ({
            trustScores: { ...state.trustScores, [userId]: updatedScore },
          }));

          // Send notification for each badge
          const now = new Date().toISOString();
          const badgeNotifications: TrustNotification[] = newBadges.map((badge) => ({
            id: `trust-notif-badge-${Date.now()}-${badge}`,
            user_id: userId,
            type: 'badge_earned' as const,
            title: 'Badge Earned!',
            body: `You earned the "${badge.replace(/_/g, ' ')}" badge`,
            read: false,
            created_at: now,
          }));
          set({ trustNotifications: [...state.trustNotifications, ...badgeNotifications] });
        }

        return newBadges;
      },

      // ===== SEARCH ACTIONS =====

      setSearchFilters: (filters) => {
        set({ searchFilters: filters });
      },

      updateSearchFilters: (updates) => {
        set((state) => ({
          searchFilters: { ...state.searchFilters, ...updates },
        }));
      },

      resetSearchFilters: () => {
        set({ searchFilters: DEFAULT_SEARCH_FILTERS });
      },

      toggleQuickFilter: (filter) => {
        set((state) => {
          const current = state.searchFilters.quickFilters;
          const updated = current.includes(filter)
            ? current.filter((f) => f !== filter)
            : [...current, filter];
          return {
            searchFilters: { ...state.searchFilters, quickFilters: updated },
          };
        });
      },

      clearQuickFilters: () => {
        set((state) => ({
          searchFilters: { ...state.searchFilters, quickFilters: [] },
        }));
      },

      setSearchViewMode: (mode) => {
        set({ searchViewMode: mode });
      },

      setSearchSortOption: (option) => {
        set({ searchSortOption: option });
      },

      addRecentSearch: (query) => {
        if (!query.trim()) return;
        const state = get();
        const now = new Date().toISOString();

        // Remove duplicates and add to front
        const filteredRecent = state.recentSearches.filter(
          (q) => q.toLowerCase() !== query.toLowerCase()
        );
        const updatedRecent = [query, ...filteredRecent].slice(0, 10);

        // Add to history
        const historyEntry = { query, timestamp: now };
        const updatedHistory = [historyEntry, ...state.searchHistory].slice(0, 50);

        set({
          recentSearches: updatedRecent,
          searchHistory: updatedHistory,
        });
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      saveSearch: (name, filters, notificationsEnabled = false) => {
        const state = get();
        const now = new Date().toISOString();

        const newSavedSearch: SavedSearch = {
          id: `saved-search-${Date.now()}`,
          user_id: state.currentUserId,
          name,
          filters,
          notificationsEnabled,
          created_at: now,
          last_used_at: now,
        };

        set({ savedSearches: [...state.savedSearches, newSavedSearch] });
        return newSavedSearch;
      },

      updateSavedSearch: (searchId, updates) => {
        set((state) => ({
          savedSearches: state.savedSearches.map((s) =>
            s.id === searchId ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSavedSearch: (searchId) => {
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== searchId),
        }));
      },

      getSavedSearches: () => {
        const state = get();
        return state.savedSearches.filter((s) => s.user_id === state.currentUserId);
      },
    })
);

export default useDatingStore;
