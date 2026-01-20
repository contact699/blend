import { create } from 'zustand';
import {
  GameSession,
  GameType,
  GameParticipant,
  TruthOrDareDifficulty,
  GameChallenge,
  HotSeatQuestion,
  StoryEntry,
  StoryPrompt,
} from '../types';
import {
  getRandomChallenge,
  getRandomQuestion,
  getRandomStoryPrompt,
  STORY_PROMPTS,
} from '../game-content';

interface GamesStore {
  // State
  gameSessions: GameSession[];
  customChallenges: GameChallenge[];
  customQuestions: HotSeatQuestion[];
  customPrompts: StoryPrompt[];

  // Game lifecycle actions
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
  addStoryEntry: (gameId: string, currentUserId: string, content: string) => void;
  voteRedo: (gameId: string, currentUserId: string, entryId: string) => void;
  redoEntry: (gameId: string, entryId: string) => void;

  // Custom content actions
  addCustomChallenge: (currentUserId: string, challenge: Omit<GameChallenge, 'id' | 'is_custom' | 'created_by'>) => void;
  removeCustomChallenge: (challengeId: string) => void;
  addCustomQuestion: (currentUserId: string, question: Omit<HotSeatQuestion, 'id' | 'is_custom' | 'created_by'>) => void;
  removeCustomQuestion: (questionId: string) => void;
  addCustomPrompt: (currentUserId: string, prompt: Omit<StoryPrompt, 'id' | 'is_custom' | 'created_by'>) => void;
  removeCustomPrompt: (promptId: string) => void;

  // Admin
  reset: () => void;
}

const useGamesStore = create<GamesStore>()((set, get) => ({
  gameSessions: [],
  customChallenges: [],
  customQuestions: [],
  customPrompts: [],

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
            seat_duration_seconds: 300,
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
            turn_duration_seconds: 180,
            turn_order: participants.map((p) => p.user_id),
            current_turn_index: 0,
            redo_threshold: Math.ceil(participants.length / 2),
          },
        };
        break;
      default:
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
      created_by: participants[0]?.user_id ?? '',
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
      state.gameSessions.find((g) => g.thread_id === threadId && g.status === 'active') ?? null
    );
  },

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
    const usedChallengeIds: string[] = [];

    const customMatchingChallenges = state.customChallenges.filter(
      (c) =>
        c.difficulty === gameState.difficulty &&
        c.for_couples === forCouples &&
        !usedChallengeIds.includes(c.id)
    );

    const defaultChallenge = getRandomChallenge(gameState.difficulty, forCouples, usedChallengeIds);

    const allChallenges = [
      ...customMatchingChallenges,
      ...customMatchingChallenges,
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
    set((state) => ({
      gameSessions: state.gameSessions.map((g) => {
        if (g.id !== gameId || g.state.type !== 'truth_or_dare') return g;
        const targetIds = g.state.data.current_target_ids;
        return {
          ...g,
          participants: g.participants.map((p) =>
            targetIds.includes(p.user_id) ? { ...p, skips_used: p.skips_used + 1 } : p
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
          (g.state.data.current_rotation_index + 1) % g.state.data.rotation_order.length;
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

  addStoryEntry: (gameId, currentUserId, content) => {
    set((state) => ({
      gameSessions: state.gameSessions.map((g) => {
        if (g.id !== gameId || g.state.type !== 'story_chain') return g;

        const newEntry: StoryEntry = {
          id: `entry-${Date.now()}`,
          author_id: currentUserId,
          content,
          created_at: new Date().toISOString(),
          redo_votes: [],
          is_redone: false,
        };

        const nextIndex =
          (g.state.data.current_turn_index + 1) % g.state.data.turn_order.length;
        const nextAuthorId = g.state.data.turn_order[nextIndex];

        return {
          ...g,
          current_turn_user_id: nextAuthorId,
          participants: g.participants.map((p) =>
            p.user_id === currentUserId ? { ...p, turns_taken: p.turns_taken + 1 } : p
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

  voteRedo: (gameId, currentUserId, entryId) => {
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
                e.id === entryId && !e.redo_votes.includes(currentUserId)
                  ? { ...e, redo_votes: [...e.redo_votes, currentUserId] }
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

        const entryIndex = g.state.data.entries.findIndex((e) => e.id === entryId);
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
                authorIndex !== -1 ? authorIndex : g.state.data.current_turn_index,
            },
          },
        };
      }),
    }));
  },

  addCustomChallenge: (currentUserId, challenge) => {
    const newChallenge: GameChallenge = {
      ...challenge,
      id: `custom-tod-${Date.now()}`,
      is_custom: true,
      created_by: currentUserId,
    };
    set((state) => ({ customChallenges: [...state.customChallenges, newChallenge] }));
  },

  removeCustomChallenge: (challengeId) => {
    set((state) => ({
      customChallenges: state.customChallenges.filter((c) => c.id !== challengeId),
    }));
  },

  addCustomQuestion: (currentUserId, question) => {
    const newQuestion: HotSeatQuestion = {
      ...question,
      id: `custom-hs-${Date.now()}`,
      is_custom: true,
      created_by: currentUserId,
    };
    set((state) => ({ customQuestions: [...state.customQuestions, newQuestion] }));
  },

  removeCustomQuestion: (questionId) => {
    set((state) => ({
      customQuestions: state.customQuestions.filter((q) => q.id !== questionId),
    }));
  },

  addCustomPrompt: (currentUserId, prompt) => {
    const newPrompt: StoryPrompt = {
      ...prompt,
      id: `custom-sp-${Date.now()}`,
      is_custom: true,
      created_by: currentUserId,
    };
    set((state) => ({ customPrompts: [...state.customPrompts, newPrompt] }));
  },

  removeCustomPrompt: (promptId) => {
    set((state) => ({
      customPrompts: state.customPrompts.filter((p) => p.id !== promptId),
    }));
  },

  reset: () =>
    set({
      gameSessions: [],
      customChallenges: [],
      customQuestions: [],
      customPrompts: [],
    }),
}));

export default useGamesStore;
