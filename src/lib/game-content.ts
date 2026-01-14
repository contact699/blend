// Game content data for interactive group games

import { GameChallenge, HotSeatQuestion, StoryPrompt, TruthOrDareDifficulty } from './types';

// ===== TRUTH OR DARE CHALLENGES =====

export const TRUTH_OR_DARE_CHALLENGES: GameChallenge[] = [
  // PLAYFUL - Singles
  { id: 'tod-p-1', type: 'truth', difficulty: 'playful', content: 'What was your most embarrassing first date moment?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-p-2', type: 'truth', difficulty: 'playful', content: 'What\'s a dating red flag you\'ve ignored in the past?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-p-3', type: 'truth', difficulty: 'playful', content: 'What\'s the worst pickup line you\'ve ever used or received?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-p-4', type: 'truth', difficulty: 'playful', content: 'What\'s your most unpopular dating opinion?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-p-5', type: 'truth', difficulty: 'playful', content: 'What\'s something you pretend to like to impress dates?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-p-6', type: 'dare', difficulty: 'playful', content: 'Do your best impression of someone in this chat', for_couples: false, timer_seconds: 90 },
  { id: 'tod-p-7', type: 'dare', difficulty: 'playful', content: 'Send a voice message saying the cheesiest thing you can think of', for_couples: false, timer_seconds: 60 },
  { id: 'tod-p-8', type: 'dare', difficulty: 'playful', content: 'Share the last photo in your camera roll (if appropriate)', for_couples: false, timer_seconds: 60 },
  { id: 'tod-p-9', type: 'dare', difficulty: 'playful', content: 'Let someone in the group post something to your dating profile bio (you can change it back after)', for_couples: false, timer_seconds: 120 },
  { id: 'tod-p-10', type: 'dare', difficulty: 'playful', content: 'Send a selfie making your best "smoldering" face', for_couples: false, timer_seconds: 60 },

  // PLAYFUL - Couples
  { id: 'tod-p-c1', type: 'truth', difficulty: 'playful', content: 'Share your most embarrassing date story together', for_couples: true, timer_seconds: 90 },
  { id: 'tod-p-c2', type: 'truth', difficulty: 'playful', content: 'What\'s a quirky habit your partner has that secretly annoys you?', for_couples: true, timer_seconds: 60 },
  { id: 'tod-p-c3', type: 'truth', difficulty: 'playful', content: 'What was your first impression of each other (be honest!)', for_couples: true, timer_seconds: 90 },
  { id: 'tod-p-c4', type: 'dare', difficulty: 'playful', content: 'Recreate the photo from your first date together', for_couples: true, timer_seconds: 120 },
  { id: 'tod-p-c5', type: 'dare', difficulty: 'playful', content: 'Each write what you think the other will say is their favorite thing about you, then reveal', for_couples: true, timer_seconds: 120 },

  // FLIRTY - Singles
  { id: 'tod-f-1', type: 'truth', difficulty: 'flirty', content: 'What\'s something that instantly makes someone more attractive to you?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-f-2', type: 'truth', difficulty: 'flirty', content: 'Describe your ideal first kiss scenario', for_couples: false, timer_seconds: 60 },
  { id: 'tod-f-3', type: 'truth', difficulty: 'flirty', content: 'What\'s the most romantic thing someone has ever done for you?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-f-4', type: 'truth', difficulty: 'flirty', content: 'What physical feature do you notice first in someone?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-f-5', type: 'truth', difficulty: 'flirty', content: 'What\'s your biggest turn-on that you don\'t usually admit?', for_couples: false, timer_seconds: 60 },
  { id: 'tod-f-6', type: 'dare', difficulty: 'flirty', content: 'Give someone in this chat a genuine, detailed compliment', for_couples: false, timer_seconds: 90 },
  { id: 'tod-f-7', type: 'dare', difficulty: 'flirty', content: 'Send a flirty message to someone in this chat (they know it\'s a dare)', for_couples: false, timer_seconds: 60 },
  { id: 'tod-f-8', type: 'dare', difficulty: 'flirty', content: 'Rate everyone in the chat on their best quality', for_couples: false, timer_seconds: 120 },
  { id: 'tod-f-9', type: 'dare', difficulty: 'flirty', content: 'Describe your type, but make it sound like a poetry reading', for_couples: false, timer_seconds: 90 },
  { id: 'tod-f-10', type: 'dare', difficulty: 'flirty', content: 'Share a song that puts you "in the mood"', for_couples: false, timer_seconds: 60 },

  // FLIRTY - Couples
  { id: 'tod-f-c1', type: 'truth', difficulty: 'flirty', content: 'Describe what first attracted you to each other', for_couples: true, timer_seconds: 90 },
  { id: 'tod-f-c2', type: 'truth', difficulty: 'flirty', content: 'What\'s something your partner does that always makes you smile?', for_couples: true, timer_seconds: 60 },
  { id: 'tod-f-c3', type: 'truth', difficulty: 'flirty', content: 'Share the story of your first kiss', for_couples: true, timer_seconds: 90 },
  { id: 'tod-f-c4', type: 'dare', difficulty: 'flirty', content: 'Each of you describe your partner using only emojis, then explain', for_couples: true, timer_seconds: 120 },
  { id: 'tod-f-c5', type: 'dare', difficulty: 'flirty', content: 'Share a cute couples photo and the story behind it', for_couples: true, timer_seconds: 120 },

  // INTIMATE - Singles
  { id: 'tod-i-1', type: 'truth', difficulty: 'intimate', content: 'What\'s a relationship boundary you\'ve learned is important to you?', for_couples: false, timer_seconds: 90 },
  { id: 'tod-i-2', type: 'truth', difficulty: 'intimate', content: 'What\'s something you\'re looking for that you rarely find in dating?', for_couples: false, timer_seconds: 90 },
  { id: 'tod-i-3', type: 'truth', difficulty: 'intimate', content: 'What\'s a vulnerability you struggle to share with new partners?', for_couples: false, timer_seconds: 90 },
  { id: 'tod-i-4', type: 'truth', difficulty: 'intimate', content: 'What does intimacy mean to you beyond the physical?', for_couples: false, timer_seconds: 90 },
  { id: 'tod-i-5', type: 'truth', difficulty: 'intimate', content: 'What\'s a fantasy or desire you\'ve been hesitant to explore?', for_couples: false, timer_seconds: 90 },
  { id: 'tod-i-6', type: 'dare', difficulty: 'intimate', content: 'Share a genuine fear you have about relationships', for_couples: false, timer_seconds: 90 },
  { id: 'tod-i-7', type: 'dare', difficulty: 'intimate', content: 'Write a short, honest message to your future self about what you want in love', for_couples: false, timer_seconds: 120 },
  { id: 'tod-i-8', type: 'dare', difficulty: 'intimate', content: 'Share something you\'ve never told anyone in this chat before', for_couples: false, timer_seconds: 120 },

  // INTIMATE - Couples
  { id: 'tod-i-c1', type: 'truth', difficulty: 'intimate', content: 'What\'s one fantasy you\'ve discussed together?', for_couples: true, timer_seconds: 90 },
  { id: 'tod-i-c2', type: 'truth', difficulty: 'intimate', content: 'What\'s something that strengthened your relationship that was hard to go through?', for_couples: true, timer_seconds: 120 },
  { id: 'tod-i-c3', type: 'truth', difficulty: 'intimate', content: 'What\'s something you\'ve learned about yourselves through your relationship?', for_couples: true, timer_seconds: 120 },
  { id: 'tod-i-c4', type: 'dare', difficulty: 'intimate', content: 'Each share one thing you want to work on together and why', for_couples: true, timer_seconds: 120 },
  { id: 'tod-i-c5', type: 'dare', difficulty: 'intimate', content: 'Write a short love note to each other and share with the group', for_couples: true, timer_seconds: 180 },
];

// ===== HOT SEAT QUESTIONS =====

export const HOT_SEAT_QUESTIONS: HotSeatQuestion[] = [
  // Fun
  { id: 'hs-f-1', question: 'What\'s the weirdest date you\'ve ever been on?', category: 'fun', is_custom: false },
  { id: 'hs-f-2', question: 'If you could date any fictional character, who would it be?', category: 'fun', is_custom: false },
  { id: 'hs-f-3', question: 'What\'s your most embarrassing dating app story?', category: 'fun', is_custom: false },
  { id: 'hs-f-4', question: 'What\'s the worst advice you\'ve ever given about relationships?', category: 'fun', is_custom: false },
  { id: 'hs-f-5', question: 'What would be your perfect lazy day with a partner?', category: 'fun', is_custom: false },
  { id: 'hs-f-6', question: 'What\'s a deal-breaker that other people think is silly?', category: 'fun', is_custom: false },
  { id: 'hs-f-7', question: 'What\'s the most spontaneous thing you\'ve done for someone you liked?', category: 'fun', is_custom: false },
  { id: 'hs-f-8', question: 'If your love life was a movie genre, what would it be?', category: 'fun', is_custom: false },

  // Deep
  { id: 'hs-d-1', question: 'What\'s something you\'ve learned about yourself through polyamory/ENM?', category: 'deep', is_custom: false },
  { id: 'hs-d-2', question: 'What\'s your biggest relationship regret?', category: 'deep', is_custom: false },
  { id: 'hs-d-3', question: 'How do you handle jealousy when it comes up?', category: 'deep', is_custom: false },
  { id: 'hs-d-4', question: 'What does commitment look like to you?', category: 'deep', is_custom: false },
  { id: 'hs-d-5', question: 'What\'s a relationship pattern you\'re trying to break?', category: 'deep', is_custom: false },
  { id: 'hs-d-6', question: 'How do you balance multiple relationships without losing yourself?', category: 'deep', is_custom: false },
  { id: 'hs-d-7', question: 'What\'s something you wish people understood about ENM?', category: 'deep', is_custom: false },
  { id: 'hs-d-8', question: 'What does "home" mean to you in a relationship?', category: 'deep', is_custom: false },

  // Spicy
  { id: 'hs-s-1', question: 'What\'s your biggest turn-on that surprises people?', category: 'spicy', is_custom: false },
  { id: 'hs-s-2', question: 'What\'s something on your intimate bucket list?', category: 'spicy', is_custom: false },
  { id: 'hs-s-3', question: 'Describe your ideal romantic evening in detail', category: 'spicy', is_custom: false },
  { id: 'hs-s-4', question: 'What\'s a compliment that never fails to make you blush?', category: 'spicy', is_custom: false },
  { id: 'hs-s-5', question: 'What\'s a fantasy you\'ve never acted on?', category: 'spicy', is_custom: false },
  { id: 'hs-s-6', question: 'What\'s the most attractive thing a partner can do?', category: 'spicy', is_custom: false },
  { id: 'hs-s-7', question: 'How important is physical chemistry vs emotional connection?', category: 'spicy', is_custom: false },
  { id: 'hs-s-8', question: 'What makes you feel most desired?', category: 'spicy', is_custom: false },

  // Relationship
  { id: 'hs-r-1', question: 'What\'s your love language and how did you discover it?', category: 'relationship', is_custom: false },
  { id: 'hs-r-2', question: 'How do you approach communication in your relationships?', category: 'relationship', is_custom: false },
  { id: 'hs-r-3', question: 'What\'s your attachment style and how does it show up?', category: 'relationship', is_custom: false },
  { id: 'hs-r-4', question: 'How do you navigate time management with multiple partners?', category: 'relationship', is_custom: false },
  { id: 'hs-r-5', question: 'What\'s your approach to metamour relationships?', category: 'relationship', is_custom: false },
  { id: 'hs-r-6', question: 'How do you handle conflict in relationships?', category: 'relationship', is_custom: false },
  { id: 'hs-r-7', question: 'What\'s the most important thing in a relationship to you?', category: 'relationship', is_custom: false },
  { id: 'hs-r-8', question: 'How do you know when you\'re falling for someone?', category: 'relationship', is_custom: false },
];

// ===== STORY PROMPTS =====

export const STORY_PROMPTS: StoryPrompt[] = [
  // Romantic
  { id: 'sp-r-1', category: 'romantic', prompt: 'They matched on the app, but never expected to run into each other at...' },
  { id: 'sp-r-2', category: 'romantic', prompt: 'The first date was going terribly until...' },
  { id: 'sp-r-3', category: 'romantic', prompt: 'At the polycule\'s anniversary dinner, someone stood up and said...' },
  { id: 'sp-r-4', category: 'romantic', prompt: 'The love letter was never meant to be read, but when it was found...' },
  { id: 'sp-r-5', category: 'romantic', prompt: 'Three strangers, one rooftop bar, and a sunset that changed everything...' },

  // Adventurous
  { id: 'sp-a-1', category: 'adventurous', prompt: 'The group trip took an unexpected turn when...' },
  { id: 'sp-a-2', category: 'adventurous', prompt: 'Lost in a foreign city with only each other to rely on...' },
  { id: 'sp-a-3', category: 'adventurous', prompt: 'The road trip was supposed to be three days. It turned into...' },
  { id: 'sp-a-4', category: 'adventurous', prompt: 'Nobody expected the karaoke night to end with...' },
  { id: 'sp-a-5', category: 'adventurous', prompt: 'The escape room was locked, but that\'s when they discovered...' },

  // Fantasy
  { id: 'sp-f-1', category: 'fantasy', prompt: 'In a world where people glow brighter when near their soulmates...' },
  { id: 'sp-f-2', category: 'fantasy', prompt: 'The dating app matched you with someone from a parallel universe...' },
  { id: 'sp-f-3', category: 'fantasy', prompt: 'A potion that shows you all your potential loves at once...' },
  { id: 'sp-f-4', category: 'fantasy', prompt: 'The bookshop appeared only on nights when hearts were searching...' },
  { id: 'sp-f-5', category: 'fantasy', prompt: 'They say the lighthouse keeper knows how every love story ends...' },

  // Funny
  { id: 'sp-fn-1', category: 'funny', prompt: 'The dating profile said "spontaneous" but they didn\'t expect...' },
  { id: 'sp-fn-2', category: 'funny', prompt: 'Meeting your partner\'s other partner\'s pet for the first time was...' },
  { id: 'sp-fn-3', category: 'funny', prompt: 'The group chat was accidentally sent to the wrong group...' },
  { id: 'sp-fn-4', category: 'funny', prompt: 'Explaining polyamory to their grandmother went something like...' },
  { id: 'sp-fn-5', category: 'funny', prompt: 'The costume party mix-up led to the most awkward yet hilarious...' },
];

// ===== HELPER FUNCTIONS =====

export function getRandomChallenge(
  difficulty: TruthOrDareDifficulty,
  forCouples: boolean,
  excludeIds: string[] = []
): GameChallenge | null {
  const filtered = TRUTH_OR_DARE_CHALLENGES.filter(
    (c) =>
      c.difficulty === difficulty &&
      c.for_couples === forCouples &&
      !excludeIds.includes(c.id)
  );

  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomQuestion(
  category?: HotSeatQuestion['category'],
  excludeIds: string[] = []
): HotSeatQuestion | null {
  let filtered = HOT_SEAT_QUESTIONS.filter((q) => !excludeIds.includes(q.id));

  if (category) {
    filtered = filtered.filter((q) => q.category === category);
  }

  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomStoryPrompt(
  category?: StoryPrompt['category'],
  excludeIds: string[] = []
): StoryPrompt | null {
  let filtered = STORY_PROMPTS.filter((p) => !excludeIds.includes(p.id));

  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Game descriptions for the launcher
export const GAME_INFO = {
  truth_or_dare: {
    name: 'Truth or Dare',
    description: 'Classic game with ENM-friendly challenges',
    icon: 'Flame',
    minPlayers: 2,
    maxPlayers: 6,
    supportsCouples: true,
    estimatedTime: '15-30 min',
  },
  hot_seat: {
    name: 'Hot Seat',
    description: 'Take turns answering rapid-fire questions',
    icon: 'Target',
    minPlayers: 3,
    maxPlayers: 6,
    supportsCouples: false,
    estimatedTime: '20-40 min',
  },
  story_chain: {
    name: 'Story Chain',
    description: 'Build a story together, one sentence at a time',
    icon: 'BookOpen',
    minPlayers: 3,
    maxPlayers: 6,
    supportsCouples: false,
    estimatedTime: '15-25 min',
  },
  mystery_date_planner: {
    name: 'Mystery Date',
    description: 'Collaboratively plan the perfect date',
    icon: 'Sparkles',
    minPlayers: 3,
    maxPlayers: 6,
    supportsCouples: true,
    estimatedTime: '10-15 min',
  },
  compatibility_triangle: {
    name: 'Compatibility Triangle',
    description: 'Discover what you have in common',
    icon: 'Triangle',
    minPlayers: 3,
    maxPlayers: 3,
    supportsCouples: false,
    estimatedTime: '15-20 min',
  },
  group_challenge: {
    name: 'Group Challenge',
    description: 'Complete fun challenges together as a group',
    icon: 'Trophy',
    minPlayers: 3,
    maxPlayers: 6,
    supportsCouples: false,
    estimatedTime: '30+ min',
  },
} as const;
