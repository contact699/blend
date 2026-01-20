import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatThread, Message, MessageReaction } from '../types';

interface MessagingStore {
  // State
  threads: ChatThread[];
  messages: Message[];

  // Thread actions
  createThread: (matchId: string) => string;
  unlockThread: (threadId: string, firstMessageType: 'prompt' | 'reaction' | 'voice') => void;
  markAsRead: (threadId: string, currentUserId: string) => void;
  createGroupChat: (currentUserId: string, groupName: string, participantIds: string[]) => string;
  archiveThread: (threadId: string) => void;

  // Message actions
  sendMessage: (
    threadId: string,
    currentUserId: string,
    content: string,
    isFirstMessage: boolean,
    messageType?: 'text' | 'voice' | 'system' | 'image' | 'video' | 'video_call' | 'gif',
    mediaUrl?: string,
    selfDestructSeconds?: number,
    replyTo?: { id: string; content: string; senderId: string }
  ) => void;
  markMessageViewed: (messageId: string) => void;
  expireMessage: (messageId: string) => void;
  addReaction: (messageId: string, currentUserId: string, emoji: string) => void;
  removeReaction: (messageId: string, currentUserId: string, emoji: string) => void;

  // Helpers
  getThreadMessages: (threadId: string) => Message[];
  checkAutoArchive: () => void;

  // Admin
  reset: () => void;
}

const useMessagingStore = create<MessagingStore>()(
  persist(
    (set, get) => ({
      threads: [],
      messages: [],

      createThread: (matchId) => {
        const newThreadId = `thread-${Date.now()}`;
        const newThread: ChatThread = {
          id: newThreadId,
          match_id: matchId,
          unlocked: false,
        };

        set((state) => ({
          threads: [...state.threads, newThread],
        }));

        return newThreadId;
      },

      unlockThread: (threadId, firstMessageType) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId
              ? { ...t, unlocked: true, first_message_type: firstMessageType }
              : t
          ),
        })),

      markAsRead: (threadId, currentUserId) => {
        const now = new Date().toISOString();
        set((state) => ({
          messages: state.messages.map((m) =>
            m.thread_id === threadId && !m.read_at && m.sender_id !== currentUserId
              ? { ...m, read_at: now }
              : m
          ),
        }));
      },

      createGroupChat: (currentUserId, groupName, participantIds) => {
        const newThreadId = `group-${Date.now()}`;

        // Include current user in participants
        const allParticipants = [currentUserId, ...participantIds];

        const newThread: ChatThread = {
          id: newThreadId,
          match_id: `group-match-${Date.now()}`,
          unlocked: true,
          is_group: true,
          group_name: groupName,
          participant_ids: allParticipants,
          created_by: currentUserId,
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

        set((state) => ({
          threads: [...state.threads, newThread],
          messages: [...state.messages, systemMessage],
        }));

        return newThreadId;
      },

      archiveThread: (threadId) =>
        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, archived_at: new Date().toISOString() } : t
          ),
        })),

      sendMessage: (
        threadId,
        currentUserId,
        content,
        isFirstMessage,
        messageType = 'text',
        mediaUrl,
        selfDestructSeconds,
        replyTo
      ) => {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          thread_id: threadId,
          sender_id: currentUserId,
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

        set((state) => ({
          messages: [...state.messages, newMessage],
          threads: state.threads.map((t) =>
            t.id === threadId ? { ...t, last_message_at: new Date().toISOString() } : t
          ),
        }));
      },

      markMessageViewed: (messageId) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId && !m.viewed_at
              ? { ...m, viewed_at: new Date().toISOString() }
              : m
          ),
        }));
      },

      expireMessage: (messageId) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, is_expired: true, media_url: undefined } : m
          ),
        }));
      },

      addReaction: (messageId, currentUserId, emoji) => {
        const newReaction: MessageReaction = {
          emoji,
          user_id: currentUserId,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.id !== messageId) return m;
            const existingReactions = m.reactions || [];
            // Check if user already reacted with this emoji
            const hasReaction = existingReactions.some(
              (r) => r.user_id === currentUserId && r.emoji === emoji
            );
            if (hasReaction) return m;
            return { ...m, reactions: [...existingReactions, newReaction] };
          }),
        }));
      },

      removeReaction: (messageId, currentUserId, emoji) => {
        set((state) => ({
          messages: state.messages.map((m) => {
            if (m.id !== messageId) return m;
            const existingReactions = m.reactions || [];
            return {
              ...m,
              reactions: existingReactions.filter(
                (r) => !(r.user_id === currentUserId && r.emoji === emoji)
              ),
            };
          }),
        }));
      },

      getThreadMessages: (threadId) => {
        const state = get();
        return state.messages
          .filter((m) => m.thread_id === threadId)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      },

      checkAutoArchive: () => {
        const state = get();
        const now = new Date().getTime();
        const seventyTwoHours = 72 * 60 * 60 * 1000;

        const threadsToArchive = state.threads.filter((t) => {
          if (t.archived_at) return false;
          if (!t.last_message_at) return false;

          const lastMessageTime = new Date(t.last_message_at).getTime();
          return now - lastMessageTime > seventyTwoHours;
        });

        if (threadsToArchive.length > 0) {
          set((state) => ({
            threads: state.threads.map((t) => {
              const shouldArchive = threadsToArchive.some((ta) => ta.id === t.id);
              if (shouldArchive) {
                return { ...t, archived_at: new Date().toISOString() };
              }
              return t;
            }),
          }));
        }
      },

      reset: () =>
        set({
          threads: [],
          messages: [],
        }),
    }),
    {
      name: 'blend-messaging-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        threads: state.threads.slice(-50),
        // Only persist text messages (no media URLs)
        messages: state.messages
          .filter((m) => !m.media_url || m.is_expired)
          .slice(-200)
          .map((m) => ({
            ...m,
            media_url: undefined,
          })),
      }),
    }
  )
);

export default useMessagingStore;
