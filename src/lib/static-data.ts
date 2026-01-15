/**
 * Static reference data for the Blend app.
 * This file contains constants and templates that don't change at runtime.
 * All user-generated data should come from Supabase.
 */

import {
  Intent,
  ProfilePrompt,
  FirstMessagePrompt,
  EducationArticle,
  QuizQuestion,
  RelationshipAgreement,
  ConsentItem,
  ENMBadge,
  RelationshipStructure,
  EventCategory,
} from './types';

// ==========================================
// ENM/Lifestyle Intents
// ==========================================
export const INTENTS: Intent[] = [
  { id: 'intent-1', label: 'Couples dating', description: 'Looking for other couples', emoji: '👫', is_active: true },
  { id: 'intent-2', label: 'Third for us', description: 'Couple seeking a third', emoji: '🦄', is_active: true },
  { id: 'intent-3', label: 'Join a couple', description: 'Single looking to join couples', emoji: '✨', is_active: true },
  { id: 'intent-4', label: 'Polyamory', description: 'Open to multiple relationships', emoji: '💜', is_active: true },
  { id: 'intent-5', label: 'Open relationship', description: 'Partnered but dating separately', emoji: '🔓', is_active: true },
  { id: 'intent-6', label: 'Swinging', description: 'Partner swapping & play parties', emoji: '🎭', is_active: true },
  { id: 'intent-7', label: 'Friends first', description: 'Building connection before play', emoji: '🤝', is_active: true },
  { id: 'intent-8', label: 'Kink friendly', description: 'Open to exploring kinks', emoji: '⛓️', is_active: true },
];

// ==========================================
// Profile Prompts
// ==========================================
export const PROFILE_PROMPTS: ProfilePrompt[] = [
  { id: 'pp-1', prompt_text: 'Our ideal Saturday night looks like...', is_active: true },
  { id: 'pp-2', prompt_text: 'We connect best with people who...', is_active: true },
  { id: 'pp-3', prompt_text: 'What ENM means to us...', is_active: true },
  { id: 'pp-4', prompt_text: 'Our boundaries include...', is_active: true },
  { id: 'pp-5', prompt_text: "We're excited to explore...", is_active: true },
  { id: 'pp-6', prompt_text: 'The vibe we bring is...', is_active: true },
];

// ==========================================
// First Message Prompts
// ==========================================
export const FIRST_MESSAGE_PROMPTS: FirstMessagePrompt[] = [
  { id: 'fmp-1', prompt_text: "What drew you to the ENM lifestyle?", category: 'curiosity', is_active: true },
  { id: 'fmp-2', prompt_text: "How long have you been exploring this together?", category: 'curiosity', is_active: true },
  { id: 'fmp-3', prompt_text: "What's been your favorite experience so far?", category: 'playful', is_active: true },
  { id: 'fmp-4', prompt_text: "What does your ideal connection look like?", category: 'playful', is_active: true },
  { id: 'fmp-5', prompt_text: "What are your must-haves in a connection?", category: 'boundary', is_active: true },
  { id: 'fmp-6', prompt_text: "How do you like to communicate boundaries?", category: 'boundary', is_active: true },
];

// ==========================================
// Relationship Structures
// ==========================================
export const RELATIONSHIP_STRUCTURES: {
  id: RelationshipStructure;
  label: string;
  description: string;
  emoji: string;
}[] = [
  { id: 'hierarchical', label: 'Hierarchical', description: 'Primary partnership with secondary relationships', emoji: '👑' },
  { id: 'non_hierarchical', label: 'Non-Hierarchical', description: 'All relationships valued equally', emoji: '⚖️' },
  { id: 'solo_poly', label: 'Solo Poly', description: 'Independent polyamory without nesting partners', emoji: '🦋' },
  { id: 'relationship_anarchy', label: 'Relationship Anarchy', description: 'No predefined relationship labels or hierarchy', emoji: '🌈' },
  { id: 'kitchen_table', label: 'Kitchen Table', description: 'All partners interact and know each other well', emoji: '🍳' },
  { id: 'parallel', label: 'Parallel', description: 'Partners have minimal interaction with metas', emoji: '🚂' },
  { id: 'garden_party', label: 'Garden Party', description: 'Comfortable together when needed, not required', emoji: '🌻' },
  { id: 'mono_poly', label: 'Mono-Poly', description: 'One partner is mono, one is poly', emoji: '💫' },
  { id: 'triad', label: 'Triad', description: 'Three people in a closed relationship', emoji: '🔺' },
  { id: 'quad', label: 'Quad', description: 'Four people in a relationship constellation', emoji: '💎' },
  { id: 'vee', label: 'Vee', description: 'One person with two partners who may not date each other', emoji: '✌️' },
  { id: 'swinger', label: 'Swinger', description: 'Recreational play with other couples/singles', emoji: '🎭' },
  { id: 'open_relationship', label: 'Open Relationship', description: 'Partners date separately with agreed boundaries', emoji: '🔓' },
];

// ==========================================
// ENM Badges
// ==========================================
export const ENM_BADGES: {
  id: ENMBadge;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  { id: 'poly_pioneer', label: 'Poly Pioneer', description: '5+ years practicing ENM', icon: '🏆', color: '#FFD700' },
  { id: 'communication_pro', label: 'Communication Pro', description: 'High scores on communication skills', icon: '💬', color: '#4ECDC4' },
  { id: 'safety_first', label: 'Safety First', description: 'Regular STI testing every 3 months', icon: '🛡️', color: '#45B7D1' },
  { id: 'boundary_master', label: 'Boundary Master', description: 'Complete relationship agreement', icon: '📋', color: '#96CEB4' },
  { id: 'community_builder', label: 'Community Builder', description: 'Active in ENM community groups', icon: '🤝', color: '#DDA0DD' },
  { id: 'verified_couple', label: 'Verified Couple', description: 'Both partners verified on app', icon: '✓', color: '#98D8C8' },
  { id: 'solo_journey', label: 'Solo Journey', description: 'Practicing solo polyamory', icon: '🦋', color: '#F7DC6F' },
  { id: 'newbie_friendly', label: 'Newbie Friendly', description: 'Open to ENM newcomers', icon: '🌱', color: '#82E0AA' },
  { id: 'kink_aware', label: 'Kink Aware', description: 'Experienced in kink community', icon: '⛓️', color: '#BB8FCE' },
  { id: 'travel_ready', label: 'Travel Ready', description: 'Open to long distance connections', icon: '✈️', color: '#85C1E9' },
];

// ==========================================
// Event Categories
// ==========================================
export const EVENT_CATEGORIES: { id: EventCategory; label: string; emoji: string; color: string }[] = [
  { id: 'social', label: 'Social', emoji: '🎉', color: '#f472b6' },
  { id: 'dating', label: 'Dating', emoji: '💕', color: '#f87171' },
  { id: 'education', label: 'Education', emoji: '📚', color: '#60a5fa' },
  { id: 'party', label: 'Party', emoji: '🎊', color: '#c084fc' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🌳', color: '#4ade80' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘', color: '#2dd4bf' },
  { id: 'meetup', label: 'Meetup', emoji: '👋', color: '#fbbf24' },
  { id: 'virtual', label: 'Virtual', emoji: '💻', color: '#818cf8' },
  { id: 'private', label: 'Private', emoji: '🔒', color: '#94a3b8' },
  { id: 'community', label: 'Community', emoji: '🤝', color: '#fb923c' },
];

// ==========================================
// Event Tags
// ==========================================
export const EVENT_TAGS = [
  'poly-friendly',
  'couples-welcome',
  'singles',
  'lgbtq+',
  'kink-aware',
  'newbie-friendly',
  'discussion',
  'social-mixer',
  'speed-dating',
  'workshop',
  'support-group',
  'game-night',
  'book-club',
  'hiking',
  'dinner-party',
  'brunch',
  'dance',
  'meditation',
  'yoga',
  'art',
];

// ==========================================
// Education Articles
// ==========================================
export const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    id: 'edu-1',
    title: 'ENM 101: Getting Started',
    summary: 'An introduction to ethical non-monogamy, the different types, and how to know if it might be right for you.',
    content: `Ethical Non-Monogamy (ENM) is an umbrella term for relationship structures where all parties knowingly and consensually engage in romantic or sexual relationships with multiple people.

Key principles of ENM:
• Consent: Everyone involved knows about and agrees to the relationship structure
• Communication: Open, honest dialogue about feelings, boundaries, and expectations
• Respect: Treating all partners with dignity and honoring commitments
• Ethics: Acting with integrity and considering everyone's wellbeing

Common types of ENM include polyamory (multiple loving relationships), open relationships (dating separately), swinging (recreational play with others), and relationship anarchy (no predefined rules).

Before starting your ENM journey, ask yourself:
1. Why am I interested in ENM?
2. How do I handle jealousy?
3. What are my non-negotiables?
4. Am I ready for difficult conversations?`,
    category: 'basics',
    read_time: 5,
    image_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600',
  },
  {
    id: 'edu-2',
    title: 'Managing Jealousy in ENM',
    summary: 'Practical strategies for understanding and working through jealousy in non-monogamous relationships.',
    content: `Jealousy is normal in all relationships, including ENM ones. The key difference is how we approach it.

Understanding Jealousy:
Jealousy is often a messenger pointing to underlying fears—fear of abandonment, inadequacy, or loss. Instead of suppressing it, examine what it's telling you.

The RAIN Technique:
• Recognize: Notice the jealousy without judgment
• Accept: Allow the feeling to exist
• Investigate: What triggered this? What am I really afraid of?
• Nurture: Give yourself compassion

Practical Steps:
1. Communicate with your partner(s) about your feelings
2. Identify your needs—are they being met?
3. Build your own fulfilling life outside relationships
4. Practice compersion (joy in your partner's happiness)
5. Set agreements that address your core fears
6. Seek support from ENM-friendly therapists or communities`,
    category: 'jealousy',
    read_time: 7,
    image_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600',
  },
  {
    id: 'edu-3',
    title: 'Communication Frameworks',
    summary: 'Essential communication tools and techniques for healthy ENM relationships.',
    content: `Strong communication is the foundation of successful ENM relationships.

The RADAR Method (Monthly Check-ins):
• Review: How are our relationships going?
• Agree: What's working well?
• Discuss: Any concerns or needs?
• Action: What changes should we make?
• Reconnect: Affirm your commitment

Non-Violent Communication (NVC):
1. Observation: What happened? (facts only)
2. Feeling: How do I feel about it?
3. Need: What need isn't being met?
4. Request: What would help?

Example: "When you came home late without texting (observation), I felt worried and disconnected (feeling). I need to feel considered and in the loop (need). Would you be willing to send a quick text if plans change? (request)"

Active Listening:
• Put away distractions
• Reflect back what you hear
• Ask clarifying questions
• Validate emotions before problem-solving`,
    category: 'communication',
    read_time: 8,
    image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600',
  },
  {
    id: 'edu-4',
    title: 'Setting Healthy Boundaries',
    summary: 'How to identify, communicate, and maintain boundaries in multi-partner relationships.',
    content: `Boundaries aren't walls—they're guidelines that help everyone feel safe and respected.

Types of Boundaries:
• Time: Scheduled date nights, overnight policies
• Physical: Safe sex practices, PDA comfort levels
• Emotional: What's shared with other partners
• Social: Meeting friends/family, social media presence
• Financial: Shared expenses, gifts for partners

Creating Boundaries:
1. Identify what you need to feel secure
2. Distinguish between boundaries and rules
3. Communicate clearly and kindly
4. Be willing to negotiate and compromise
5. Revisit and revise as relationships evolve

Boundary vs. Rule:
Boundary: "I need to practice safer sex with all partners"
Rule: "You can't have sex without a condom"

Both achieve the same goal, but boundaries are about your needs while rules control others' behavior.

When Boundaries Are Crossed:
• Communicate clearly about what happened
• Discuss the impact
• Agree on next steps
• Consider if pattern behavior indicates incompatibility`,
    category: 'boundaries',
    read_time: 6,
    image_url: 'https://images.unsplash.com/photo-1522881193457-37ae97c905bf?w=600',
  },
  {
    id: 'edu-5',
    title: 'Relationship Structures Explained',
    summary: 'A deep dive into different polyamorous and ENM relationship configurations.',
    content: `ENM encompasses many relationship structures. Here's a guide to the most common:

Hierarchical Polyamory:
Partners are ranked (primary, secondary). Primary partners often have more say in decisions and receive more time.
Pros: Clear expectations, stability
Cons: Secondary partners may feel undervalued

Non-Hierarchical Polyamory:
All relationships are valued equally, though they may differ in style or commitment level.
Pros: Equal treatment, flexible
Cons: Can be complex to schedule

Solo Polyamory:
Individual maintains autonomy, doesn't seek a "primary" partner or nesting relationship.
Pros: Independence, self-focus
Cons: May feel isolating to some

Relationship Anarchy:
Rejects all relationship hierarchies and categories. Each connection is defined individually.
Pros: Maximum freedom
Cons: Requires excellent communication

Kitchen Table Polyamory:
All partners (including metamours) socialize together comfortably.
Pros: Community, compersion
Cons: Requires compatible personalities

Parallel Polyamory:
Partners know about each other but don't interact.
Pros: Privacy, simplicity
Cons: Limited support network`,
    category: 'structures',
    read_time: 10,
    image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600',
  },
  {
    id: 'edu-6',
    title: 'Safer Sex in ENM',
    summary: 'Best practices for sexual health when dating multiple partners.',
    content: `Maintaining sexual health is crucial when you have multiple partners.

Testing Recommendations:
• Get a full STI panel every 3-6 months
• Test after new partners (wait for window periods)
• Share results with all partners
• Consider PrEP if appropriate

Barrier Methods:
• Use condoms/dental dams consistently
• Discuss fluid bonding carefully
• Change barriers between partners
• Have supplies readily available

Communication About Safety:
1. Discuss safer sex practices before intimacy
2. Be honest about other partners' testing status
3. Notify partners if exposed to an STI
4. Respect partners' boundaries around risk

Creating a Safety Agreement:
• What barriers will you use?
• How often will you test?
• How will you notify partners of new connections?
• What happens if someone is exposed to an STI?

Remember: Safer sex is about collective responsibility, not shame.`,
    category: 'safety',
    read_time: 6,
    image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600',
  },
];

// ==========================================
// Compatibility Quiz Questions
// ==========================================
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'When your partner goes on a date with someone else, you typically feel...',
    category: 'jealousy',
    options: [
      { id: 'q1-1', text: 'Very anxious and insecure', value: 1 },
      { id: 'q1-2', text: 'Somewhat uncomfortable but managing', value: 2 },
      { id: 'q1-3', text: 'Neutral, focused on my own activities', value: 3 },
      { id: 'q1-4', text: 'Happy for them, mild excitement', value: 4 },
      { id: 'q1-5', text: 'Genuinely joyful (compersion)', value: 5 },
    ],
  },
  {
    id: 'q2',
    question: 'How do you prefer to handle relationship discussions?',
    category: 'communication',
    options: [
      { id: 'q2-1', text: 'Avoid them until absolutely necessary', value: 1 },
      { id: 'q2-2', text: 'Address issues when they become problems', value: 2 },
      { id: 'q2-3', text: 'Regular check-ins with partners', value: 3 },
      { id: 'q2-4', text: 'Frequent open dialogue about everything', value: 4 },
      { id: 'q2-5', text: 'Structured relationship meetings with agendas', value: 5 },
    ],
  },
  {
    id: 'q3',
    question: "How do you feel about your partner's other partners (metamours)?",
    category: 'hierarchy',
    options: [
      { id: 'q3-1', text: "I don't want to know they exist", value: 1 },
      { id: 'q3-2', text: "I prefer minimal information about them", value: 2 },
      { id: 'q3-3', text: "I'd like to meet them briefly", value: 3 },
      { id: 'q3-4', text: "I'd like to be friendly with them", value: 4 },
      { id: 'q3-5', text: 'I want them to be part of my life too', value: 5 },
    ],
  },
  {
    id: 'q4',
    question: 'How much detail do you want about your partners\' other relationships?',
    category: 'disclosure',
    options: [
      { id: 'q4-1', text: 'Just that they exist, nothing more', value: 1 },
      { id: 'q4-2', text: 'Basic info: name, how often they meet', value: 2 },
      { id: 'q4-3', text: 'General updates on the relationship', value: 3 },
      { id: 'q4-4', text: 'Most details except intimate specifics', value: 4 },
      { id: 'q4-5', text: 'Complete transparency including intimacy', value: 5 },
    ],
  },
  {
    id: 'q5',
    question: 'How do you prefer to divide your time among partners?',
    category: 'time',
    options: [
      { id: 'q5-1', text: 'One primary gets most of my time', value: 1 },
      { id: 'q5-2', text: 'Primary gets priority, others get remaining time', value: 2 },
      { id: 'q5-3', text: 'Flexible scheduling based on needs', value: 3 },
      { id: 'q5-4', text: 'Roughly equal time with all partners', value: 4 },
      { id: 'q5-5', text: 'Spontaneous, no set schedule needed', value: 5 },
    ],
  },
  {
    id: 'q6',
    question: 'How firm are your boundaries around relationship rules?',
    category: 'boundaries',
    options: [
      { id: 'q6-1', text: 'Very strict, non-negotiable', value: 1 },
      { id: 'q6-2', text: 'Mostly firm with rare exceptions', value: 2 },
      { id: 'q6-3', text: 'Guidelines that evolve with discussion', value: 3 },
      { id: 'q6-4', text: 'Flexible, trusting partners to decide', value: 4 },
      { id: 'q6-5', text: 'Minimal rules, maximum autonomy', value: 5 },
    ],
  },
  {
    id: 'q7',
    question: 'What triggers jealousy most for you?',
    category: 'jealousy',
    options: [
      { id: 'q7-1', text: 'Any attention given to others', value: 1 },
      { id: 'q7-2', text: 'Physical intimacy with others', value: 2 },
      { id: 'q7-3', text: 'Emotional connection with others', value: 3 },
      { id: 'q7-4', text: 'Only if I feel neglected', value: 4 },
      { id: 'q7-5', text: 'Very rarely feel jealous', value: 5 },
    ],
  },
  {
    id: 'q8',
    question: 'How do you handle conflict in relationships?',
    category: 'communication',
    options: [
      { id: 'q8-1', text: 'Avoid it as much as possible', value: 1 },
      { id: 'q8-2', text: 'Address it but get defensive', value: 2 },
      { id: 'q8-3', text: 'Try to find compromise', value: 3 },
      { id: 'q8-4', text: 'See it as growth opportunity', value: 4 },
      { id: 'q8-5', text: 'Embrace it with curiosity', value: 5 },
    ],
  },
];

// ==========================================
// Agreement Templates
// ==========================================
export const AGREEMENT_TEMPLATES: RelationshipAgreement[] = [
  {
    id: 'template-1',
    user_id: 'system',
    title: 'Basic ENM Agreement',
    sections: [
      {
        id: 's1',
        category: 'communication',
        title: 'Communication Expectations',
        content: 'We agree to have weekly check-ins about our relationship and other connections. We will share when we are developing feelings for someone new.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's2',
        category: 'safety',
        title: 'Safer Sex Practices',
        content: 'We agree to use barrier protection with all partners. We will get tested every 3 months and share results.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's3',
        category: 'disclosure',
        title: 'What We Share',
        content: 'We agree to inform each other before intimacy with a new partner. We will share basic information about other partners (name, general relationship status).',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's4',
        category: 'time',
        title: 'Time Management',
        content: 'We commit to at least two date nights per week together. We will give 24-hour notice for dates with others when possible.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
    ],
    partner_ids: [],
    is_template: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-2',
    user_id: 'system',
    title: 'Swinger Couple Agreement',
    sections: [
      {
        id: 's5',
        category: 'boundaries',
        title: 'Play Boundaries',
        content: 'We only play together, never separately. Same room only. We can veto any situation that feels uncomfortable.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's6',
        category: 'safety',
        title: 'Safety Rules',
        content: 'Condoms required for all penetration. We will discuss anyone we want to play with beforehand. Regular STI testing.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's7',
        category: 'communication',
        title: 'During Play',
        content: 'Check in with each other regularly. Use a safe word if uncomfortable. Debrief after every experience.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
    ],
    partner_ids: [],
    is_template: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-3',
    user_id: 'system',
    title: 'Polyamory Agreement',
    sections: [
      {
        id: 's8',
        category: 'disclosure',
        title: 'New Relationship Energy',
        content: 'We acknowledge NRE and commit to maintaining our existing relationship(s) while exploring new connections. We will discuss concerns about time allocation openly.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's9',
        category: 'boundaries',
        title: 'Relationship Escalator',
        content: 'We will discuss major milestones (meeting family, vacations, moving in) with existing partners before committing to them with new partners.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's10',
        category: 'veto',
        title: 'Veto Policy',
        content: 'We do not use veto power. If someone has concerns about a partner, we will discuss and try to address the underlying need together.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
    ],
    partner_ids: [],
    is_template: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ==========================================
// Consent Checklist Template
// ==========================================
export const CONSENT_ITEMS_TEMPLATE: Omit<ConsentItem, 'id'>[] = [
  // Touch
  { activity: 'Holding hands', category: 'touch', user_consent: null },
  { activity: 'Hugging', category: 'touch', user_consent: null },
  { activity: 'Kissing (lips)', category: 'touch', user_consent: null },
  { activity: 'Kissing (body)', category: 'touch', user_consent: null },
  { activity: 'Massage', category: 'touch', user_consent: null },

  // Intimacy
  { activity: 'Oral sex (giving)', category: 'intimacy', user_consent: null },
  { activity: 'Oral sex (receiving)', category: 'intimacy', user_consent: null },
  { activity: 'Penetrative sex (with barriers)', category: 'intimacy', user_consent: null },
  { activity: 'Penetrative sex (without barriers)', category: 'intimacy', user_consent: null },
  { activity: 'Toys', category: 'intimacy', user_consent: null },

  // Communication
  { activity: 'Sexting', category: 'communication', user_consent: null },
  { activity: 'Video calls', category: 'communication', user_consent: null },
  { activity: 'Daily check-ins', category: 'communication', user_consent: null },
  { activity: 'Sharing feelings about others', category: 'communication', user_consent: null },

  // Photos
  { activity: 'Taking intimate photos', category: 'photos', user_consent: null },
  { activity: 'Sharing photos with each other', category: 'photos', user_consent: null },
  { activity: 'Photos on social media together', category: 'photos', user_consent: null },

  // Social
  { activity: 'Meeting friends', category: 'social', user_consent: null },
  { activity: 'Meeting family', category: 'social', user_consent: null },
  { activity: 'Public affection', category: 'social', user_consent: null },
  { activity: 'Attending events together', category: 'social', user_consent: null },

  // Kink
  { activity: 'Light bondage', category: 'kink', user_consent: null },
  { activity: 'Dominant/submissive dynamics', category: 'kink', user_consent: null },
  { activity: 'Impact play', category: 'kink', user_consent: null },
  { activity: 'Role play', category: 'kink', user_consent: null },
];
