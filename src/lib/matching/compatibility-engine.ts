/**
 * Compatibility Scoring Engine
 *
 * Multi-dimensional compatibility scoring system that evaluates
 * potential matches across 6 key dimensions:
 * 1. Intent Compatibility (25 points)
 * 2. Quiz Compatibility (20 points)
 * 3. Relationship Structure Fit (15 points)
 * 4. Communication Style Match (15 points)
 * 5. Values Alignment (15 points)
 * 6. Behavioral Compatibility (10 points)
 */

import {
  Profile,
  ExtendedProfile,
  QuizResult,
  RelationshipStructure,
  CompatibilityScore,
  CompatibilityDimension,
  UserTasteProfile,
} from '../types';

// Intent compatibility matrix - some intents are complementary
const INTENT_COMPATIBILITY: Record<string, string[]> = {
  'couples-dating': ['couples-dating', 'third-for-us', 'join-couple', 'polyamory', 'open'],
  'third-for-us': ['join-couple', 'polyamory', 'open', 'swinging'],
  'join-couple': ['third-for-us', 'couples-dating', 'polyamory'],
  polyamory: ['polyamory', 'couples-dating', 'third-for-us', 'join-couple', 'open'],
  open: ['open', 'polyamory', 'couples-dating', 'swinging', 'friends-first'],
  swinging: ['swinging', 'third-for-us', 'open', 'kink'],
  'friends-first': ['friends-first', 'open', 'polyamory'],
  kink: ['kink', 'swinging', 'open'],
};

// Relationship structure compatibility matrix
const STRUCTURE_COMPATIBILITY: Record<RelationshipStructure, RelationshipStructure[]> = {
  hierarchical: ['hierarchical', 'mono_poly', 'vee'],
  non_hierarchical: ['non_hierarchical', 'relationship_anarchy', 'kitchen_table'],
  solo_poly: ['solo_poly', 'non_hierarchical', 'relationship_anarchy', 'parallel'],
  relationship_anarchy: ['relationship_anarchy', 'non_hierarchical', 'solo_poly'],
  kitchen_table: ['kitchen_table', 'non_hierarchical', 'garden_party'],
  parallel: ['parallel', 'solo_poly', 'hierarchical'],
  garden_party: ['garden_party', 'kitchen_table', 'parallel'],
  mono_poly: ['mono_poly', 'hierarchical', 'vee'],
  triad: ['triad', 'kitchen_table', 'non_hierarchical'],
  quad: ['quad', 'kitchen_table', 'triad'],
  vee: ['vee', 'hierarchical', 'mono_poly', 'parallel'],
  swinger: ['swinger', 'open_relationship'],
  open_relationship: ['open_relationship', 'swinger', 'parallel'],
};

// Keywords for values extraction from bios
const VALUE_KEYWORDS = {
  communication: ['communication', 'honest', 'open', 'transparent', 'talk', 'discuss', 'share'],
  adventure: ['adventure', 'travel', 'explore', 'spontaneous', 'new experiences', 'try new'],
  stability: ['stable', 'secure', 'consistent', 'reliable', 'committed', 'long-term'],
  growth: ['growth', 'learn', 'evolve', 'develop', 'improve', 'better'],
  intimacy: ['intimate', 'connection', 'deep', 'meaningful', 'emotional', 'close'],
  independence: ['independent', 'autonomy', 'space', 'freedom', 'self'],
  community: ['community', 'friends', 'social', 'group', 'together', 'collective'],
  creativity: ['creative', 'art', 'music', 'write', 'create', 'express'],
};

/**
 * Calculate overall compatibility between two profiles
 */
export function calculateCompatibility(
  userProfile: ExtendedProfile,
  candidateProfile: ExtendedProfile,
  userTasteProfile?: UserTasteProfile
): CompatibilityScore {
  const dimensions = {
    intent_compatibility: calculateIntentCompatibility(userProfile, candidateProfile),
    quiz_compatibility: calculateQuizCompatibility(userProfile.quiz_result, candidateProfile.quiz_result),
    relationship_structure_fit: calculateStructureFit(userProfile, candidateProfile),
    communication_style_match: calculateCommunicationMatch(userProfile, candidateProfile),
    values_alignment: calculateValuesAlignment(userProfile, candidateProfile),
    behavioral_compatibility: calculateBehavioralCompatibility(userProfile, candidateProfile, userTasteProfile),
  };

  // Calculate weighted overall score
  const overallScore = Object.values(dimensions).reduce(
    (sum, dim) => sum + dim.score * dim.weight,
    0
  );

  // Generate match explanation
  const topDimensions = Object.values(dimensions)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const matchExplanation = generateMatchExplanation(topDimensions, userProfile, candidateProfile);
  const conversationStarters = generateConversationStarters(dimensions, userProfile, candidateProfile);
  const potentialChallenges = identifyPotentialChallenges(dimensions);

  return {
    overall_score: Math.round(overallScore),
    dimensions,
    match_explanation: matchExplanation,
    conversation_starters: conversationStarters,
    potential_challenges: potentialChallenges,
    calculated_at: new Date().toISOString(),
  };
}

/**
 * Calculate intent compatibility (25 points max)
 */
function calculateIntentCompatibility(
  user: Profile,
  candidate: Profile
): CompatibilityDimension {
  const userIntents = user.intent_ids || [];
  const candidateIntents = candidate.intent_ids || [];

  // Direct matches
  const directMatches = userIntents.filter((i) => candidateIntents.includes(i));

  // Complementary matches
  let complementaryMatches = 0;
  userIntents.forEach((intent) => {
    const compatible = INTENT_COMPATIBILITY[intent] || [];
    complementaryMatches += candidateIntents.filter((ci) => compatible.includes(ci)).length;
  });

  // Calculate score (max 25)
  const directScore = Math.min(directMatches.length * 8, 16); // Up to 16 for direct
  const complementaryScore = Math.min(complementaryMatches * 3, 9); // Up to 9 for complementary
  const score = Math.min(directScore + complementaryScore, 25) * 4; // Scale to 100

  const factors: string[] = [];
  if (directMatches.length > 0) {
    factors.push(`${directMatches.length} shared intent${directMatches.length > 1 ? 's' : ''}`);
  }
  if (complementaryMatches > directMatches.length) {
    factors.push('Complementary relationship goals');
  }

  return {
    name: 'Intent Compatibility',
    score: Math.round(score),
    weight: 0.25,
    explanation:
      directMatches.length > 0
        ? `You share ${directMatches.length} relationship intent${directMatches.length > 1 ? 's' : ''}`
        : 'Your relationship goals may complement each other',
    factors,
  };
}

/**
 * Calculate quiz compatibility (20 points max)
 */
function calculateQuizCompatibility(
  userQuiz?: QuizResult,
  candidateQuiz?: QuizResult
): CompatibilityDimension {
  if (!userQuiz || !candidateQuiz) {
    return {
      name: 'Quiz Compatibility',
      score: 50, // Neutral score if no quiz data
      weight: 0.2,
      explanation: 'Complete the compatibility quiz for better matching',
      factors: ['Quiz not completed'],
    };
  }

  const userScores = userQuiz.scores;
  const candidateScores = candidateQuiz.scores;

  // Calculate similarity for each dimension
  const dimensions = [
    { key: 'communication_style', weight: 0.2 },
    { key: 'jealousy_management', weight: 0.2 },
    { key: 'time_management', weight: 0.15 },
    { key: 'hierarchy_preference', weight: 0.15 },
    { key: 'disclosure_level', weight: 0.15 },
    { key: 'boundary_firmness', weight: 0.15 },
  ] as const;

  let totalSimilarity = 0;
  const factors: string[] = [];

  dimensions.forEach(({ key, weight }) => {
    const userVal = userScores[key];
    const candVal = candidateScores[key];
    const diff = Math.abs(userVal - candVal);
    const similarity = 1 - diff / 4; // Max diff is 4 (5-1)
    totalSimilarity += similarity * weight;

    if (similarity > 0.8) {
      factors.push(`Similar ${key.replace(/_/g, ' ')}`);
    }
  });

  const score = totalSimilarity * 100;

  return {
    name: 'Quiz Compatibility',
    score: Math.round(score),
    weight: 0.2,
    explanation:
      score > 70
        ? 'Your ENM styles are well-aligned'
        : score > 50
        ? 'Some areas of alignment in your ENM approaches'
        : 'Different ENM styles - could be complementary or challenging',
    factors: factors.slice(0, 3),
  };
}

/**
 * Calculate relationship structure fit (15 points max)
 */
function calculateStructureFit(
  user: ExtendedProfile,
  candidate: ExtendedProfile
): CompatibilityDimension {
  const userStructure = user.relationship_structure;
  const candidateStructure = candidate.relationship_structure;

  if (!userStructure || !candidateStructure) {
    return {
      name: 'Relationship Structure',
      score: 50,
      weight: 0.15,
      explanation: 'Relationship structure not specified',
      factors: ['Structure not defined'],
    };
  }

  const compatibleStructures = STRUCTURE_COMPATIBILITY[userStructure] || [];
  const isCompatible = compatibleStructures.includes(candidateStructure);
  const isExactMatch = userStructure === candidateStructure;

  let score: number;
  let explanation: string;
  const factors: string[] = [];

  if (isExactMatch) {
    score = 100;
    explanation = `Both practice ${formatStructure(userStructure)}`;
    factors.push('Exact structure match');
  } else if (isCompatible) {
    score = 75;
    explanation = `Compatible structures: ${formatStructure(userStructure)} and ${formatStructure(candidateStructure)}`;
    factors.push('Compatible poly styles');
  } else {
    score = 30;
    explanation = 'Different relationship structures - discuss expectations early';
    factors.push('Structure mismatch - requires conversation');
  }

  return {
    name: 'Relationship Structure',
    score,
    weight: 0.15,
    explanation,
    factors,
  };
}

/**
 * Calculate communication style match (15 points max)
 */
function calculateCommunicationMatch(
  user: Profile,
  candidate: Profile
): CompatibilityDimension {
  let score = 50; // Base score
  const factors: string[] = [];

  // Pace preference match
  if (user.pace_preference === candidate.pace_preference) {
    score += 25;
    factors.push(`Both prefer ${user.pace_preference} pace`);
  } else if (
    (user.pace_preference === 'medium' || candidate.pace_preference === 'medium')
  ) {
    score += 10;
    factors.push('Pace preferences are compatible');
  }

  // Response style match
  if (user.response_style === candidate.response_style) {
    score += 25;
    factors.push(`Both have ${user.response_style} response style`);
  } else {
    score += 5;
  }

  return {
    name: 'Communication Style',
    score: Math.min(score, 100),
    weight: 0.15,
    explanation:
      score > 80
        ? 'Your communication styles are well-matched'
        : score > 60
        ? 'Compatible communication approaches'
        : 'Different communication styles - be patient with each other',
    factors,
  };
}

/**
 * Calculate values alignment (15 points max)
 */
function calculateValuesAlignment(
  user: Profile,
  candidate: Profile
): CompatibilityDimension {
  const userText = `${user.bio} ${user.prompt_responses?.map((p) => p.response_text).join(' ') || ''}`.toLowerCase();
  const candidateText = `${candidate.bio} ${candidate.prompt_responses?.map((p) => p.response_text).join(' ') || ''}`.toLowerCase();

  const userValues = extractValues(userText);
  const candidateValues = extractValues(candidateText);

  // Find shared values
  const sharedValues = userValues.filter((v) => candidateValues.includes(v));
  const factors = sharedValues.map((v) => `Shared value: ${v}`);

  // Calculate score based on overlap
  const overlapRatio =
    sharedValues.length / Math.max(userValues.length, candidateValues.length, 1);
  const score = Math.min(overlapRatio * 150, 100); // Boost score for matches

  return {
    name: 'Values Alignment',
    score: Math.round(score),
    weight: 0.15,
    explanation:
      sharedValues.length > 2
        ? `You both value ${sharedValues.slice(0, 2).join(' and ')}`
        : sharedValues.length > 0
        ? `Shared interest in ${sharedValues[0]}`
        : 'Explore each other\'s values through conversation',
    factors: factors.slice(0, 3),
  };
}

/**
 * Calculate behavioral compatibility (10 points max)
 */
function calculateBehavioralCompatibility(
  user: ExtendedProfile,
  candidate: ExtendedProfile,
  userTaste?: UserTasteProfile
): CompatibilityDimension {
  let score = 50; // Base score
  const factors: string[] = [];

  // If we have taste profile data, use it
  if (userTaste?.attraction_patterns) {
    const patterns = userTaste.attraction_patterns;

    // Check if candidate matches preferred age range
    const candidateAge = candidate.age;
    if (
      candidateAge >= patterns.preferred_age_range[0] &&
      candidateAge <= patterns.preferred_age_range[1]
    ) {
      score += 15;
      factors.push('Matches your typical age preference');
    }

    // Check pace preference alignment
    if (patterns.preferred_pace === candidate.pace_preference) {
      score += 15;
      factors.push('Matches your preferred dating pace');
    }

    // Check if intents match preferences
    const matchedIntents = candidate.intent_ids.filter((i) =>
      patterns.preferred_intents.includes(i)
    );
    if (matchedIntents.length > 0) {
      score += 10;
      factors.push('Has intents you typically like');
    }
  } else {
    // Without taste data, use general heuristics
    // Location compatibility (virtual_only matching)
    if (user.virtual_only === candidate.virtual_only) {
      score += 15;
      factors.push(user.virtual_only ? 'Both open to virtual' : 'Both open to meeting');
    }

    // Open to meet compatibility
    if (user.open_to_meet === candidate.open_to_meet) {
      score += 15;
      factors.push('Same openness to meeting');
    }
  }

  return {
    name: 'Behavioral Match',
    score: Math.min(score, 100),
    weight: 0.1,
    explanation:
      score > 70
        ? 'Based on your patterns, this could be a great match'
        : 'Get more matches to improve behavioral predictions',
    factors,
  };
}

// Helper functions

function extractValues(text: string): string[] {
  const foundValues: string[] = [];

  Object.entries(VALUE_KEYWORDS).forEach(([value, keywords]) => {
    if (keywords.some((keyword) => text.includes(keyword))) {
      foundValues.push(value);
    }
  });

  return foundValues;
}

function formatStructure(structure: RelationshipStructure): string {
  return structure
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function generateMatchExplanation(
  topDimensions: CompatibilityDimension[],
  user: Profile,
  candidate: Profile
): string {
  const highScores = topDimensions.filter((d) => d.score >= 70);

  if (highScores.length >= 2) {
    return `Strong compatibility in ${highScores[0].name.toLowerCase()} and ${highScores[1].name.toLowerCase()}. ${highScores[0].explanation}`;
  } else if (highScores.length === 1) {
    return `Good match for ${highScores[0].name.toLowerCase()}. ${highScores[0].explanation}`;
  } else {
    return `Potential connection worth exploring. Different perspectives can lead to growth.`;
  }
}

function generateConversationStarters(
  dimensions: CompatibilityScore['dimensions'],
  user: Profile,
  candidate: Profile
): string[] {
  const starters: string[] = [];

  // Based on high-scoring dimensions
  if (dimensions.values_alignment.score > 60) {
    const sharedValue = dimensions.values_alignment.factors[0]?.replace('Shared value: ', '');
    if (sharedValue) {
      starters.push(`Ask about their thoughts on ${sharedValue} in relationships`);
    }
  }

  if (dimensions.quiz_compatibility.score > 70) {
    starters.push('Compare your ENM journeys and what you\'ve learned');
  }

  if (dimensions.relationship_structure_fit.score > 70) {
    starters.push('Discuss how your relationship structures have evolved');
  }

  // Add prompt-based starters if available
  if (candidate.prompt_responses && candidate.prompt_responses.length > 0) {
    const prompt = candidate.prompt_responses[0];
    starters.push(`Ask about their response to "${prompt.prompt_text}"`);
  }

  // Add generic starters if needed
  if (starters.length < 3) {
    starters.push('Ask about their ideal first date scenario');
    starters.push('Share what brought you to ENM');
  }

  return starters.slice(0, 4);
}

function identifyPotentialChallenges(
  dimensions: CompatibilityScore['dimensions']
): string[] {
  const challenges: string[] = [];

  if (dimensions.communication_style_match.score < 50) {
    challenges.push('Different communication paces - discuss expectations early');
  }

  if (dimensions.relationship_structure_fit.score < 50) {
    challenges.push('Different relationship structures - clarify boundaries');
  }

  if (dimensions.quiz_compatibility.score < 50) {
    challenges.push('Different ENM approaches - be open about your needs');
  }

  return challenges;
}

/**
 * Quick compatibility check (for sorting/filtering)
 * Returns a simple 0-100 score without full dimension breakdown
 */
export function quickCompatibilityScore(
  user: ExtendedProfile,
  candidate: ExtendedProfile
): number {
  // Fast checks for dealbreakers
  const sharedIntents = user.intent_ids.filter((i) => candidate.intent_ids.includes(i));
  if (sharedIntents.length === 0) {
    // Check for complementary intents
    const hasComplementary = user.intent_ids.some((intent) => {
      const compatible = INTENT_COMPATIBILITY[intent] || [];
      return candidate.intent_ids.some((ci) => compatible.includes(ci));
    });
    if (!hasComplementary) return 20; // Very low if no intent overlap
  }

  // Quick score calculation
  let score = 40; // Base

  // Intent bonus
  score += Math.min(sharedIntents.length * 10, 20);

  // Pace match
  if (user.pace_preference === candidate.pace_preference) score += 10;

  // Response style match
  if (user.response_style === candidate.response_style) score += 10;

  // Structure match
  if (user.relationship_structure && candidate.relationship_structure) {
    if (user.relationship_structure === candidate.relationship_structure) {
      score += 15;
    } else if (
      STRUCTURE_COMPATIBILITY[user.relationship_structure]?.includes(
        candidate.relationship_structure
      )
    ) {
      score += 8;
    }
  }

  return Math.min(score, 100);
}

/**
 * Rank profiles by compatibility
 */
export function rankProfilesByCompatibility(
  user: ExtendedProfile,
  candidates: ExtendedProfile[],
  userTaste?: UserTasteProfile
): Array<{ profile: ExtendedProfile; score: number }> {
  return candidates
    .map((candidate) => ({
      profile: candidate,
      score: quickCompatibilityScore(user, candidate),
    }))
    .sort((a, b) => b.score - a.score);
}
