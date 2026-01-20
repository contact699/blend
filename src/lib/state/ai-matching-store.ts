import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ProfileView,
  ProfileAction,
  ConversationMetrics,
  UserTasteProfile,
  CompatibilityScore,
  Profile,
  Message,
} from '../types';
import { buildTasteProfile, DEFAULT_TASTE_PROFILE } from '../matching/taste-profile';

interface AIMatchingStore {
  // State
  profileViews: ProfileView[];
  conversationMetrics: ConversationMetrics[];
  tasteProfile: UserTasteProfile | null;
  smartMatchingEnabled: boolean;
  compatibilityCache: Record<string, CompatibilityScore>;

  // Profile view tracking
  trackProfileView: (
    currentUserId: string,
    profileId: string,
    dwellTimeMs: number,
    action: ProfileAction,
    profileSnapshot?: ProfileView['profile_snapshot']
  ) => void;

  // Conversation metrics
  updateConversationMetrics: (
    currentUserId: string,
    threadId: string,
    otherUserId: string,
    messages: Message[]
  ) => void;

  // Taste profile
  refreshTasteProfile: (currentUserId: string, profilesMap?: Map<string, Profile>) => void;
  setSmartMatchingEnabled: (enabled: boolean) => void;

  // Compatibility caching
  cacheCompatibilityScore: (profileId: string, score: CompatibilityScore) => void;
  getCachedCompatibilityScore: (profileId: string) => CompatibilityScore | null;
  clearCompatibilityCache: () => void;

  // Admin
  reset: () => void;
}

const useAIMatchingStore = create<AIMatchingStore>()(
  persist(
    (set, get) => ({
      profileViews: [],
      conversationMetrics: [],
      tasteProfile: null,
      smartMatchingEnabled: true,
      compatibilityCache: {},

      trackProfileView: (currentUserId, profileId, dwellTimeMs, action, profileSnapshot) => {
        const newView: ProfileView = {
          id: `view-${Date.now()}`,
          viewer_id: currentUserId,
          viewed_profile_id: profileId,
          dwell_time_ms: dwellTimeMs,
          action,
          created_at: new Date().toISOString(),
          profile_snapshot: profileSnapshot,
        };

        set((state) => ({
          profileViews: [...state.profileViews.slice(-500), newView], // Keep last 500 views
        }));
      },

      updateConversationMetrics: (currentUserId, threadId, otherUserId, messages) => {
        const state = get();
        const threadMessages = messages.filter((m) => m.thread_id === threadId);
        const myMessages = threadMessages.filter((m) => m.sender_id === currentUserId);
        const theirMessages = threadMessages.filter((m) => m.sender_id === otherUserId);

        // Calculate average response time
        let totalResponseTime = 0;
        let responseCount = 0;
        for (let i = 1; i < threadMessages.length; i++) {
          const prev = threadMessages[i - 1];
          const curr = threadMessages[i];
          if (prev && curr && prev.sender_id !== curr.sender_id && curr.sender_id === currentUserId) {
            const prevTime = new Date(prev.created_at).getTime();
            const currTime = new Date(curr.created_at).getTime();
            totalResponseTime += currTime - prevTime;
            responseCount++;
          }
        }

        const avgResponseTimeMs = responseCount > 0 ? totalResponseTime / responseCount : 0;

        // Calculate average message length
        const avgMessageLength =
          myMessages.length > 0
            ? myMessages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0) / myMessages.length
            : 0;

        const existingMetrics = state.conversationMetrics.find((m) => m.thread_id === threadId);

        const now = new Date();
        const lastMessageDate = threadMessages[threadMessages.length - 1]?.created_at
          ? new Date(threadMessages[threadMessages.length - 1]!.created_at)
          : now;

        // Determine connection quality
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
          user_id: currentUserId,
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

        set((state) => ({
          conversationMetrics: existingMetrics
            ? state.conversationMetrics.map((m) => (m.thread_id === threadId ? newMetrics : m))
            : [...state.conversationMetrics, newMetrics],
        }));
      },

      refreshTasteProfile: (currentUserId, profilesMap = new Map<string, Profile>()) => {
        const state = get();
        if (state.profileViews.length < 5) {
          // Not enough data to build a meaningful profile
          return;
        }

        if (profilesMap.size === 0) {
          console.warn('refreshTasteProfile requires a profilesMap. Fetch profiles via Supabase hooks.');
          return;
        }

        const newTasteProfile = buildTasteProfile(
          currentUserId,
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

      reset: () =>
        set({
          profileViews: [],
          conversationMetrics: [],
          tasteProfile: null,
          smartMatchingEnabled: true,
          compatibilityCache: {},
        }),
    }),
    {
      name: 'blend-ai-matching-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profileViews: state.profileViews.slice(-500),
        conversationMetrics: state.conversationMetrics,
        tasteProfile: state.tasteProfile,
        smartMatchingEnabled: state.smartMatchingEnabled,
        // Don't persist cache - rebuild on load
      }),
    }
  )
);

export default useAIMatchingStore;
