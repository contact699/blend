/**
 * AI-Enhanced Profile Analyzer
 *
 * Uses pattern matching and keyword extraction to analyze profile text
 * and generate match insights. Can be extended with AI API calls for
 * deeper analysis.
 */

import { Profile, CompatibilityScore } from '../types';

// Personality trait keywords
const PERSONALITY_TRAITS = {
  adventurous: ['adventure', 'travel', 'explore', 'spontaneous', 'thrill', 'hiking', 'camping', 'road trip'],
  creative: ['art', 'music', 'write', 'create', 'design', 'photography', 'paint', 'craft'],
  intellectual: ['read', 'learn', 'philosophy', 'science', 'discuss', 'debate', 'curious', 'knowledge'],
  social: ['party', 'friends', 'meetup', 'community', 'social', 'gathering', 'event', 'network'],
  homebody: ['cozy', 'home', 'netflix', 'quiet', 'relax', 'cook', 'garden', 'peaceful'],
  fitness: ['gym', 'workout', 'run', 'yoga', 'health', 'fitness', 'active', 'sports'],
  foodie: ['food', 'restaurant', 'cook', 'cuisine', 'taste', 'wine', 'coffee', 'brunch'],
  spiritual: ['meditation', 'mindful', 'spiritual', 'growth', 'healing', 'energy', 'soul', 'universe'],
};

// Values keywords
const VALUE_KEYWORDS = {
  communication: ['honest', 'open', 'communication', 'transparent', 'talk', 'express', 'listen'],
  authenticity: ['authentic', 'genuine', 'real', 'true', 'myself', 'honest', 'sincere'],
  growth: ['grow', 'learn', 'evolve', 'improve', 'better', 'develop', 'progress'],
  freedom: ['freedom', 'independent', 'autonomy', 'space', 'individual', 'respect'],
  connection: ['deep', 'meaningful', 'connect', 'intimate', 'bond', 'relationship', 'partner'],
  fun: ['fun', 'laugh', 'joy', 'play', 'enjoy', 'adventure', 'spontaneous'],
  stability: ['stable', 'secure', 'reliable', 'consistent', 'trust', 'safe', 'committed'],
  passion: ['passion', 'intense', 'fire', 'chemistry', 'spark', 'desire', 'attraction'],
};

// ENM-specific keywords
const ENM_KEYWORDS = {
  kitchen_table: ['kitchen table', 'metamour', 'family', 'community', 'all together', 'group'],
  parallel: ['parallel', 'separate', 'privacy', 'boundaries', 'independent relationships'],
  hierarchical: ['primary', 'secondary', 'anchor', 'nesting partner', 'hierarchy'],
  non_hierarchical: ['non-hierarchical', 'equal', 'relationship anarchy', 'no hierarchy'],
  solo_poly: ['solo poly', 'autonomous', 'independent', 'own space', 'self-partnered'],
};

export interface ProfileAnalysis {
  personalityTraits: { trait: string; confidence: number }[];
  values: { value: string; confidence: number }[];
  enmStyle: { style: string; confidence: number }[];
  interests: string[];
  communicationStyle: 'direct' | 'thoughtful' | 'playful' | 'warm';
  bioTone: 'casual' | 'serious' | 'witty' | 'romantic' | 'professional';
  redFlags: string[];
  greenFlags: string[];
}

export interface MatchAnalysis {
  personalityMatch: number; // 0-100
  valuesAlignment: string[];
  sharedInterests: string[];
  complementaryTraits: string[];
  potentialChallenges: string[];
  conversationStarters: string[];
  matchExplanation: string;
}

/**
 * Extract text content from a profile for analysis
 */
function getProfileText(profile: Profile): string {
  const texts: string[] = [];

  if (profile.bio) {
    texts.push(profile.bio);
  }

  if (profile.prompt_responses && profile.prompt_responses.length > 0) {
    profile.prompt_responses.forEach((pr) => {
      texts.push(pr.response_text);
    });
  }

  return texts.join(' ').toLowerCase();
}

/**
 * Count keyword matches in text
 */
function countKeywordMatches(text: string, keywords: string[]): number {
  let count = 0;
  keywords.forEach((keyword) => {
    if (text.includes(keyword.toLowerCase())) {
      count++;
    }
  });
  return count;
}

/**
 * Analyze a single profile for personality traits, values, etc.
 */
export function analyzeProfile(profile: Profile): ProfileAnalysis {
  const text = getProfileText(profile);

  // Analyze personality traits
  const personalityTraits: { trait: string; confidence: number }[] = [];
  Object.entries(PERSONALITY_TRAITS).forEach(([trait, keywords]) => {
    const matches = countKeywordMatches(text, keywords);
    if (matches > 0) {
      personalityTraits.push({
        trait,
        confidence: Math.min(matches / keywords.length * 2, 1),
      });
    }
  });

  // Sort by confidence
  personalityTraits.sort((a, b) => b.confidence - a.confidence);

  // Analyze values
  const values: { value: string; confidence: number }[] = [];
  Object.entries(VALUE_KEYWORDS).forEach(([value, keywords]) => {
    const matches = countKeywordMatches(text, keywords);
    if (matches > 0) {
      values.push({
        value,
        confidence: Math.min(matches / keywords.length * 2, 1),
      });
    }
  });
  values.sort((a, b) => b.confidence - a.confidence);

  // Analyze ENM style
  const enmStyle: { style: string; confidence: number }[] = [];
  Object.entries(ENM_KEYWORDS).forEach(([style, keywords]) => {
    const matches = countKeywordMatches(text, keywords);
    if (matches > 0) {
      enmStyle.push({
        style,
        confidence: Math.min(matches / keywords.length * 2, 1),
      });
    }
  });
  enmStyle.sort((a, b) => b.confidence - a.confidence);

  // Extract interests (simple word extraction)
  const interestWords = ['hiking', 'travel', 'music', 'art', 'cooking', 'reading',
    'gaming', 'yoga', 'dancing', 'photography', 'movies', 'concerts', 'beach',
    'mountains', 'coffee', 'wine', 'dogs', 'cats', 'fitness', 'meditation'];
  const interests = interestWords.filter((word) => text.includes(word));

  // Determine communication style
  let communicationStyle: 'direct' | 'thoughtful' | 'playful' | 'warm' = 'thoughtful';
  if (text.includes('lol') || text.includes('haha') || text.includes('😂') || text.includes('joke')) {
    communicationStyle = 'playful';
  } else if (text.includes('honest') || text.includes('direct') || text.includes('straightforward')) {
    communicationStyle = 'direct';
  } else if (text.includes('caring') || text.includes('love') || text.includes('heart')) {
    communicationStyle = 'warm';
  }

  // Determine bio tone
  let bioTone: 'casual' | 'serious' | 'witty' | 'romantic' | 'professional' = 'casual';
  if (text.includes('looking for') && text.includes('serious')) {
    bioTone = 'serious';
  } else if (text.includes('love') || text.includes('romance') || text.includes('heart')) {
    bioTone = 'romantic';
  } else if (text.includes('professional') || text.includes('career') || text.includes('work')) {
    bioTone = 'professional';
  }

  // Check for green flags
  const greenFlags: string[] = [];
  if (text.includes('communication')) greenFlags.push('Values communication');
  if (text.includes('consent')) greenFlags.push('Emphasizes consent');
  if (text.includes('boundaries')) greenFlags.push('Respects boundaries');
  if (text.includes('growth')) greenFlags.push('Growth-oriented');
  if (text.includes('therapy') || text.includes('self-work')) greenFlags.push('Does personal work');

  // Check for potential red flags
  const redFlags: string[] = [];
  if (text.includes('drama')) redFlags.push('Mentions drama');
  if (text.includes('no [')) redFlags.push('Has many restrictions');
  if (text.includes('unicorn hunter') || (text.includes('couple') && text.includes('single woman'))) {
    redFlags.push('Possible unicorn hunting');
  }

  return {
    personalityTraits: personalityTraits.slice(0, 5),
    values: values.slice(0, 5),
    enmStyle: enmStyle.slice(0, 3),
    interests,
    communicationStyle,
    bioTone,
    greenFlags,
    redFlags,
  };
}

/**
 * Analyze compatibility between two profiles
 */
export function analyzeProfileCompatibility(
  userProfile: Profile,
  candidateProfile: Profile
): MatchAnalysis {
  const userAnalysis = analyzeProfile(userProfile);
  const candidateAnalysis = analyzeProfile(candidateProfile);

  // Calculate personality match
  let personalityMatch = 50; // Base score

  // Similar traits boost score
  const sharedTraits = userAnalysis.personalityTraits.filter((ut) =>
    candidateAnalysis.personalityTraits.some((ct) => ct.trait === ut.trait)
  );
  personalityMatch += sharedTraits.length * 10;

  // Similar values boost score more
  const sharedValues = userAnalysis.values.filter((uv) =>
    candidateAnalysis.values.some((cv) => cv.value === uv.value)
  );
  personalityMatch += sharedValues.length * 8;

  // Cap at 100
  personalityMatch = Math.min(personalityMatch, 100);

  // Find shared interests
  const sharedInterests = userAnalysis.interests.filter((i) =>
    candidateAnalysis.interests.includes(i)
  );

  // Find complementary traits (opposite but compatible)
  const complementaryTraits: string[] = [];
  if (
    userAnalysis.personalityTraits.some((t) => t.trait === 'adventurous') &&
    candidateAnalysis.personalityTraits.some((t) => t.trait === 'homebody')
  ) {
    complementaryTraits.push('Balance of adventure and stability');
  }
  if (
    userAnalysis.personalityTraits.some((t) => t.trait === 'social') &&
    candidateAnalysis.personalityTraits.some((t) => t.trait === 'intellectual')
  ) {
    complementaryTraits.push('Social energy meets depth');
  }

  // Identify potential challenges
  const potentialChallenges: string[] = [];
  if (userAnalysis.communicationStyle !== candidateAnalysis.communicationStyle) {
    potentialChallenges.push('Different communication styles');
  }
  if (
    userAnalysis.enmStyle.length > 0 &&
    candidateAnalysis.enmStyle.length > 0 &&
    userAnalysis.enmStyle[0]?.style !== candidateAnalysis.enmStyle[0]?.style
  ) {
    potentialChallenges.push('Different polyamory styles');
  }

  // Generate conversation starters
  const conversationStarters: string[] = [];
  if (sharedInterests.length > 0) {
    conversationStarters.push(
      `Ask about their favorite ${sharedInterests[0]} experience`
    );
  }
  if (sharedValues.length > 0) {
    conversationStarters.push(
      `Discuss what ${sharedValues[0]?.value} means to them in relationships`
    );
  }
  if (candidateAnalysis.greenFlags.length > 0) {
    conversationStarters.push(
      `They value ${candidateAnalysis.greenFlags[0]?.toLowerCase()} - explore this`
    );
  }

  // Generate match explanation
  const explanationParts: string[] = [];
  if (sharedValues.length > 0) {
    explanationParts.push(
      `You both value ${sharedValues.map((v) => v.value).join(' and ')}`
    );
  }
  if (sharedInterests.length > 0) {
    explanationParts.push(
      `Shared interests in ${sharedInterests.slice(0, 3).join(', ')}`
    );
  }
  if (complementaryTraits.length > 0) {
    explanationParts.push(complementaryTraits[0] ?? '');
  }

  const matchExplanation =
    explanationParts.length > 0
      ? explanationParts.join('. ') + '.'
      : 'Potential for an interesting connection based on your profiles.';

  return {
    personalityMatch,
    valuesAlignment: sharedValues.map((v) => v.value),
    sharedInterests,
    complementaryTraits,
    potentialChallenges,
    conversationStarters,
    matchExplanation,
  };
}

/**
 * Generate match insights from a compatibility score
 */
export function generateMatchInsights(
  score: CompatibilityScore,
  userProfile: Profile,
  candidateProfile: Profile
): {
  headline: string;
  highlights: string[];
  tips: string[];
} {
  const analysis = analyzeProfileCompatibility(userProfile, candidateProfile);

  // Generate headline based on score
  let headline = '';
  if (score.overall_score >= 85) {
    headline = 'Exceptional match potential';
  } else if (score.overall_score >= 70) {
    headline = 'Strong compatibility signals';
  } else if (score.overall_score >= 55) {
    headline = 'Good foundation for connection';
  } else {
    headline = 'Worth exploring';
  }

  // Generate highlights
  const highlights: string[] = [];

  const dimensions = score.dimensions;
  if (dimensions.intent_compatibility.score >= 20) {
    highlights.push('Aligned relationship goals');
  }
  if (dimensions.communication_style_match.score >= 12) {
    highlights.push('Compatible communication styles');
  }
  if (dimensions.values_alignment.score >= 12) {
    highlights.push('Shared core values');
  }
  if (analysis.sharedInterests.length >= 2) {
    highlights.push(`Common interests: ${analysis.sharedInterests.slice(0, 2).join(', ')}`);
  }

  // Generate tips
  const tips: string[] = [];
  if (analysis.conversationStarters.length > 0) {
    tips.push(analysis.conversationStarters[0] ?? '');
  }
  if (analysis.potentialChallenges.length > 0) {
    tips.push(`Be aware: ${analysis.potentialChallenges[0]}`);
  }
  if (analysis.complementaryTraits.length > 0) {
    tips.push(`Strength: ${analysis.complementaryTraits[0]}`);
  }

  return {
    headline,
    highlights: highlights.slice(0, 4),
    tips: tips.slice(0, 3),
  };
}

/**
 * Get a human-readable match reason
 */
export function getMatchReason(score: CompatibilityScore): string {
  const reasons: string[] = [];
  const dims = score.dimensions;

  // Find strongest dimensions
  const dimEntries = [
    { name: 'shared intentions', score: dims.intent_compatibility.score, max: 25 },
    { name: 'personality compatibility', score: dims.quiz_compatibility.score, max: 20 },
    { name: 'relationship style', score: dims.relationship_structure_fit.score, max: 15 },
    { name: 'communication fit', score: dims.communication_style_match.score, max: 15 },
    { name: 'value alignment', score: dims.values_alignment.score, max: 15 },
    { name: 'lifestyle compatibility', score: dims.behavioral_compatibility.score, max: 10 },
  ];

  // Sort by percentage of max achieved
  dimEntries.sort((a, b) => (b.score / b.max) - (a.score / a.max));

  // Take top 2 dimensions that are above 60%
  dimEntries.slice(0, 2).forEach((dim) => {
    if (dim.score / dim.max >= 0.6) {
      reasons.push(dim.name);
    }
  });

  if (reasons.length === 0) {
    return 'Potential for connection';
  } else if (reasons.length === 1) {
    return `Strong ${reasons[0]}`;
  } else {
    return `${reasons[0]} & ${reasons[1]}`;
  }
}
