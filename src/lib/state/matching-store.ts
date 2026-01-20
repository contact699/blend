import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match, Like, Ping, Intent } from '../types';
import { INTENTS } from '../static-data';

interface MatchingStore {
  // State
  matches: Match[];
  likes: Like[];
  pings: Ping[];
  discoveredProfiles: string[]; // Profile IDs user has seen

  // Match actions
  createMatch: (currentUserId: string, currentProfileIntentIds: string[], otherUserId: string, otherProfileIntentIds?: string[]) => { matchId: string; threadId: string };
  archiveMatch: (matchId: string) => void;

  // Like actions
  markLikeSeen: (likeId: string) => void;
  likeBack: (likeId: string, currentUserId: string, currentProfileIntentIds: string[], otherProfileIntentIds?: string[]) => { matchId: string; threadId: string } | null;
  dismissLike: (likeId: string) => void;

  // Ping actions
  markPingRead: (pingId: string) => void;
  replyToPing: (pingId: string, currentUserId: string, currentProfileIntentIds: string[], otherProfileIntentIds?: string[]) => { matchId: string; threadId: string; initialMessage: any } | null;
  dismissPing: (pingId: string) => void;
  sendPing: (currentUserId: string, toUserId: string, message: string) => void;

  // Discover actions
  markProfileSeen: (profileId: string) => void;

  // Helpers
  getUnseenLikesCount: (currentUserId: string) => number;
  getUnreadPingsCount: (currentUserId: string) => number;
  getSharedIntents: (currentProfileIntentIds: string[], profileIntentIds: string[]) => Intent[];

  // Admin
  reset: () => void;
}

const useMatchingStore = create<MatchingStore>()(
  persist(
    (set, get) => ({
      matches: [],
      likes: [],
      pings: [],
      discoveredProfiles: [],

      createMatch: (currentUserId, currentProfileIntentIds, otherUserId, otherProfileIntentIds = []) => {
        // Find shared intents
        const sharedIntentIds = currentProfileIntentIds.filter((id: string) =>
          otherProfileIntentIds.includes(id)
        );
        const finalSharedIntents = sharedIntentIds.length > 0 ? sharedIntentIds : currentProfileIntentIds.slice(0, 1);

        const newMatchId = `match-${Date.now()}`;
        const newThreadId = `thread-${Date.now()}`;

        const newMatch: Match = {
          id: newMatchId,
          user_1_id: currentUserId,
          user_2_id: otherUserId,
          shared_intent_ids: finalSharedIntents,
          status: 'pending',
          matched_at: new Date().toISOString(),
        };

        set((state) => ({
          matches: [...state.matches, newMatch],
        }));

        return { matchId: newMatchId, threadId: newThreadId };
      },

      archiveMatch: (matchId) =>
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId ? { ...m, status: 'archived' as const } : m
          ),
        })),

      markLikeSeen: (likeId) =>
        set((state) => ({
          likes: state.likes.map((l) => (l.id === likeId ? { ...l, seen: true } : l)),
        })),

      likeBack: (likeId, currentUserId, currentProfileIntentIds, otherProfileIntentIds = []) => {
        const state = get();
        const like = state.likes.find((l) => l.id === likeId);
        if (!like) return null;

        const otherUserId = like.from_user_id;

        // Find shared intents
        const sharedIntentIds = currentProfileIntentIds.filter((id: string) =>
          otherProfileIntentIds.includes(id)
        );
        const finalSharedIntents = sharedIntentIds.length > 0 ? sharedIntentIds : currentProfileIntentIds.slice(0, 1);

        const newMatchId = `match-${Date.now()}`;
        const newThreadId = `thread-${Date.now()}`;

        const newMatch: Match = {
          id: newMatchId,
          user_1_id: currentUserId,
          user_2_id: otherUserId,
          shared_intent_ids: finalSharedIntents,
          status: 'pending',
          matched_at: new Date().toISOString(),
        };

        set((state) => ({
          matches: [...state.matches, newMatch],
          likes: state.likes.filter((l) => l.id !== likeId),
        }));

        return { matchId: newMatchId, threadId: newThreadId };
      },

      dismissLike: (likeId) =>
        set((state) => ({
          likes: state.likes.filter((l) => l.id !== likeId),
        })),

      markPingRead: (pingId) =>
        set((state) => ({
          pings: state.pings.map((p) => (p.id === pingId ? { ...p, read: true } : p)),
        })),

      replyToPing: (pingId, currentUserId, currentProfileIntentIds, otherProfileIntentIds = []) => {
        const state = get();
        const ping = state.pings.find((p) => p.id === pingId);
        if (!ping) return null;

        const otherUserId = ping.from_user_id;

        // Find shared intents
        const sharedIntentIds = currentProfileIntentIds.filter((id: string) =>
          otherProfileIntentIds.includes(id)
        );
        const finalSharedIntents = sharedIntentIds.length > 0 ? sharedIntentIds : currentProfileIntentIds.slice(0, 1);

        const newMatchId = `match-${Date.now()}`;
        const newThreadId = `thread-${Date.now()}`;

        const newMatch: Match = {
          id: newMatchId,
          user_1_id: currentUserId,
          user_2_id: otherUserId,
          shared_intent_ids: finalSharedIntents,
          status: 'active',
          matched_at: new Date().toISOString(),
        };

        // Create initial message data
        const initialMessage = {
          id: `msg-${Date.now()}`,
          thread_id: newThreadId,
          sender_id: otherUserId,
          message_type: 'text',
          content: ping.message,
          is_first_message: true,
          created_at: ping.created_at,
        };

        set((state) => ({
          matches: [...state.matches, newMatch],
          pings: state.pings.filter((p) => p.id !== pingId),
        }));

        return { matchId: newMatchId, threadId: newThreadId, initialMessage };
      },

      dismissPing: (pingId) =>
        set((state) => ({
          pings: state.pings.filter((p) => p.id !== pingId),
        })),

      sendPing: (currentUserId, toUserId, message) => {
        const newPing: Ping = {
          id: `ping-${Date.now()}`,
          from_user_id: currentUserId,
          to_user_id: toUserId,
          message,
          created_at: new Date().toISOString(),
          read: false,
        };

        set((state) => ({
          pings: [...state.pings, newPing],
        }));
      },

      markProfileSeen: (profileId) =>
        set((state) => ({
          discoveredProfiles: [...state.discoveredProfiles, profileId],
        })),

      getUnseenLikesCount: (currentUserId) => {
        const state = get();
        return state.likes.filter((l) => !l.seen && l.to_user_id === currentUserId).length;
      },

      getUnreadPingsCount: (currentUserId) => {
        const state = get();
        return state.pings.filter((p) => !p.read && p.to_user_id === currentUserId).length;
      },

      getSharedIntents: (currentProfileIntentIds, profileIntentIds) => {
        return INTENTS.filter(
          (intent: Intent) =>
            currentProfileIntentIds.includes(intent.id) && profileIntentIds.includes(intent.id)
        );
      },

      reset: () =>
        set({
          matches: [],
          likes: [],
          pings: [],
          discoveredProfiles: [],
        }),
    }),
    {
      name: 'blend-matching-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        matches: state.matches.slice(-50),
        likes: state.likes.slice(-50),
        pings: state.pings.slice(-50),
        discoveredProfiles: state.discoveredProfiles,
      }),
    }
  )
);

export default useMatchingStore;
