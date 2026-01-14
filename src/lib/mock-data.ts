import {
  Intent,
  ProfilePrompt,
  FirstMessagePrompt,
  Profile,
  Match,
  ChatThread,
  Message,
  User,
  Like,
  Pind,
  EducationArticle,
  QuizQuestion,
  RelationshipAgreement,
  ConsentItem,
  Polycule,
  ScheduledDate,
  STITestRecord,
  PartnerProfile,
  ENMBadge,
  RelationshipStructure,
} from './types';

// Current user (for demo purposes)
export const CURRENT_USER_ID = 'user-1';

// ENM/Lifestyle Intents
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

// Profile prompts - ENM focused
export const PROFILE_PROMPTS: ProfilePrompt[] = [
  { id: 'pp-1', prompt_text: 'Our ideal Saturday night looks like...', is_active: true },
  { id: 'pp-2', prompt_text: 'We connect best with people who...', is_active: true },
  { id: 'pp-3', prompt_text: 'What ENM means to us...', is_active: true },
  { id: 'pp-4', prompt_text: 'Our boundaries include...', is_active: true },
  { id: 'pp-5', prompt_text: "We're excited to explore...", is_active: true },
  { id: 'pp-6', prompt_text: 'The vibe we bring is...', is_active: true },
];

// First message prompts
export const FIRST_MESSAGE_PROMPTS: FirstMessagePrompt[] = [
  { id: 'fmp-1', prompt_text: "What drew you to the ENM lifestyle?", category: 'curiosity', is_active: true },
  { id: 'fmp-2', prompt_text: "How long have you been exploring this together?", category: 'curiosity', is_active: true },
  { id: 'fmp-3', prompt_text: "What's been your favorite experience so far?", category: 'playful', is_active: true },
  { id: 'fmp-4', prompt_text: "What does your ideal connection look like?", category: 'playful', is_active: true },
  { id: 'fmp-5', prompt_text: "What are your must-haves in a connection?", category: 'boundary', is_active: true },
  { id: 'fmp-6', prompt_text: "How do you like to communicate boundaries?", category: 'boundary', is_active: true },
];

// Mock Users
export const MOCK_USERS: User[] = [
  { id: 'user-1', email_or_phone: 'demo@example.com', is_active: true, last_active_at: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z' },
  { id: 'user-2', email_or_phone: 'couple1@example.com', is_active: true, last_active_at: new Date().toISOString(), created_at: '2024-01-05T00:00:00Z' },
  { id: 'user-3', email_or_phone: 'couple2@example.com', is_active: true, last_active_at: new Date(Date.now() - 86400000).toISOString(), created_at: '2024-01-10T00:00:00Z' },
  { id: 'user-4', email_or_phone: 'single1@example.com', is_active: true, last_active_at: new Date(Date.now() - 172800000).toISOString(), created_at: '2024-01-15T00:00:00Z' },
  { id: 'user-5', email_or_phone: 'couple3@example.com', is_active: true, last_active_at: new Date().toISOString(), created_at: '2024-02-01T00:00:00Z' },
];

// Mock Profiles - Couples and singles in ENM lifestyle
export const MOCK_PROFILES: Profile[] = [
  {
    id: 'profile-1',
    user_id: 'user-1',
    display_name: 'You & Partner',
    age: 28,
    city: 'San Francisco',
    bio: 'Adventurous couple exploring the lifestyle together. Looking for genuine connections.',
    photos: ['https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400'],
    pace_preference: 'medium',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'relaxed',
    intent_ids: ['intent-1', 'intent-6', 'intent-7'],
    prompt_responses: [
      { id: 'pr-1', profile_id: 'profile-1', prompt_id: 'pp-1', prompt_text: 'Our ideal Saturday night looks like...', response_text: 'Good conversation over drinks, maybe a house party with like-minded people.' },
    ],
    latitude: 37.7749,
    longitude: -122.4194,
    show_on_map: true,
  },
  {
    id: 'profile-2',
    user_id: 'user-2',
    display_name: 'Maya & James',
    age: 32,
    city: 'Oakland',
    bio: 'Together 5 years, in the lifestyle for 2. We value communication and chemistry equally.',
    photos: [
      'https://images.unsplash.com/photo-1621452773781-0f992fd1f5cb?w=400',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400',
    ],
    pace_preference: 'slow',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'relaxed',
    intent_ids: ['intent-1', 'intent-6', 'intent-7', 'intent-8'],
    prompt_responses: [
      { id: 'pr-2', profile_id: 'profile-2', prompt_id: 'pp-3', prompt_text: 'What ENM means to us...', response_text: 'Freedom to explore while maintaining our strong foundation. Honesty is everything.' },
      { id: 'pr-3', profile_id: 'profile-2', prompt_id: 'pp-5', prompt_text: "We're excited to explore...", response_text: 'Club nights, house parties, and building a community of friends.' },
    ],
    latitude: 37.8044,
    longitude: -122.2712,
    show_on_map: true,
  },
  {
    id: 'profile-3',
    user_id: 'user-3',
    display_name: 'Alex & Jordan',
    age: 29,
    city: 'Berkeley',
    bio: 'Poly couple with separate dating lives. Looking for connections that could become more.',
    photos: [
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400',
    ],
    pace_preference: 'medium',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'quick',
    intent_ids: ['intent-4', 'intent-5', 'intent-7'],
    prompt_responses: [
      { id: 'pr-4', profile_id: 'profile-3', prompt_id: 'pp-2', prompt_text: 'We connect best with people who...', response_text: "Are emotionally intelligent, communicate openly, and don't play games." },
    ],
    latitude: 37.8715,
    longitude: -122.2730,
    show_on_map: true,
  },
  {
    id: 'profile-4',
    user_id: 'user-4',
    display_name: 'Taylor',
    age: 27,
    city: 'San Francisco',
    bio: 'Ethical unicorn looking for the right couple to vibe with. Quality over quantity.',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    ],
    pace_preference: 'slow',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'relaxed',
    intent_ids: ['intent-3', 'intent-7', 'intent-8'],
    prompt_responses: [
      { id: 'pr-5', profile_id: 'profile-4', prompt_id: 'pp-4', prompt_text: 'Our boundaries include...', response_text: 'Always meeting both partners first, clear communication, and mutual respect.' },
      { id: 'pr-6', profile_id: 'profile-4', prompt_id: 'pp-6', prompt_text: 'The vibe we bring is...', response_text: 'Playful, curious, and always respectful. I love making couples feel comfortable.' },
    ],
    latitude: 37.7599,
    longitude: -122.4350,
    show_on_map: true,
  },
  {
    id: 'profile-5',
    user_id: 'user-5',
    display_name: 'Sam & Riley',
    age: 34,
    city: 'Palo Alto',
    bio: 'Experienced couple seeking genuine connections. We host occasionally.',
    photos: [
      'https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=400',
    ],
    pace_preference: 'fast',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'quick',
    intent_ids: ['intent-1', 'intent-2', 'intent-6', 'intent-8'],
    prompt_responses: [
      { id: 'pr-7', profile_id: 'profile-5', prompt_id: 'pp-1', prompt_text: 'Our ideal Saturday night looks like...', response_text: 'Dinner with new friends that leads to wherever the night takes us.' },
    ],
    latitude: 37.4419,
    longitude: -122.1430,
    show_on_map: true,
  },
  // New profiles in different cities
  {
    id: 'profile-6',
    user_id: 'user-6',
    display_name: 'Mia & Chris',
    age: 30,
    city: 'Los Angeles',
    bio: 'LA couple looking to expand our circle. Love beach days and rooftop parties.',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    ],
    pace_preference: 'medium',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'quick',
    intent_ids: ['intent-1', 'intent-2', 'intent-6'],
    prompt_responses: [
      { id: 'pr-8', profile_id: 'profile-6', prompt_id: 'pp-1', prompt_text: 'Our ideal Saturday night looks like...', response_text: 'Sunset drinks in WeHo, then seeing where the night takes us.' },
    ],
    latitude: 34.0522,
    longitude: -118.2437,
    show_on_map: true,
  },
  {
    id: 'profile-7',
    user_id: 'user-7',
    display_name: 'Kai',
    age: 26,
    city: 'New York',
    bio: 'NYC-based, open to virtual connections anywhere. Traveling often for work.',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    ],
    pace_preference: 'fast',
    no_photos: false,
    open_to_meet: true,
    virtual_only: true,
    response_style: 'quick',
    intent_ids: ['intent-3', 'intent-4', 'intent-7'],
    prompt_responses: [
      { id: 'pr-9', profile_id: 'profile-7', prompt_id: 'pp-6', prompt_text: 'The vibe we bring is...', response_text: 'Fun, flirty, and always down for video dates when distance is a factor.' },
    ],
    latitude: 40.7128,
    longitude: -74.0060,
    show_on_map: false, // Virtual only, may not want to show exact location
  },
  {
    id: 'profile-8',
    user_id: 'user-8',
    display_name: 'River & Sky',
    age: 31,
    city: 'Portland',
    bio: 'PNW couple into nature, art, and meaningful connections. Introverts who love deep conversations.',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    ],
    pace_preference: 'slow',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'relaxed',
    intent_ids: ['intent-4', 'intent-7', 'intent-8'],
    prompt_responses: [
      { id: 'pr-10', profile_id: 'profile-8', prompt_id: 'pp-3', prompt_text: 'What ENM means to us...', response_text: 'Building a chosen family of people who genuinely care for each other.' },
    ],
    latitude: 45.5152,
    longitude: -122.6784,
    show_on_map: true,
  },
  {
    id: 'profile-9',
    user_id: 'user-9',
    display_name: 'Luna',
    age: 25,
    city: 'Virtual Only',
    bio: 'Long distance connections welcome! I love getting to know people through video calls first.',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    ],
    pace_preference: 'slow',
    no_photos: false,
    open_to_meet: false,
    virtual_only: true,
    response_style: 'relaxed',
    intent_ids: ['intent-3', 'intent-7'],
    prompt_responses: [
      { id: 'pr-11', profile_id: 'profile-9', prompt_id: 'pp-2', prompt_text: 'We connect best with people who...', response_text: 'Take time to build emotional intimacy before anything physical.' },
    ],
    // Virtual only - no location
    show_on_map: false,
  },
  {
    id: 'profile-10',
    user_id: 'user-10',
    display_name: 'Drew & Morgan',
    age: 35,
    city: 'Miami',
    bio: 'Miami heat couple. We travel frequently and love meeting people in different cities.',
    photos: [
      'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400',
    ],
    pace_preference: 'fast',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'quick',
    intent_ids: ['intent-1', 'intent-6', 'intent-8'],
    prompt_responses: [
      { id: 'pr-12', profile_id: 'profile-10', prompt_id: 'pp-5', prompt_text: "We're excited to explore...", response_text: 'Hotel takeovers, resort events, and connecting with couples worldwide.' },
    ],
  },
  {
    id: 'profile-11',
    user_id: 'user-11',
    display_name: 'Avery',
    age: 28,
    city: 'Chicago',
    bio: 'Windy city single looking for genuine connections. Open to travel for the right people.',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    ],
    pace_preference: 'medium',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'relaxed',
    intent_ids: ['intent-3', 'intent-4', 'intent-7'],
    prompt_responses: [
      { id: 'pr-13', profile_id: 'profile-11', prompt_id: 'pp-4', prompt_text: 'Our boundaries include...', response_text: 'Getting to know both partners equally, no separate play initially.' },
    ],
  },
  {
    id: 'profile-12',
    user_id: 'user-12',
    display_name: 'Sage & Quinn',
    age: 33,
    city: 'Austin',
    bio: 'Austin weirdos in the best way. Musicians, artists, and lifestyle enthusiasts.',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    ],
    pace_preference: 'medium',
    no_photos: false,
    open_to_meet: true,
    virtual_only: false,
    response_style: 'relaxed',
    intent_ids: ['intent-1', 'intent-4', 'intent-6', 'intent-7'],
    prompt_responses: [
      { id: 'pr-14', profile_id: 'profile-12', prompt_id: 'pp-6', prompt_text: 'The vibe we bring is...', response_text: 'Creative, spontaneous, and always authentic. Life is too short for boring.' },
    ],
  },
];

// Mock Matches
export const MOCK_MATCHES: Match[] = [
  {
    id: 'match-1',
    user_1_id: 'user-1',
    user_2_id: 'user-2',
    shared_intent_ids: ['intent-1', 'intent-6', 'intent-7'],
    status: 'active',
    matched_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'match-2',
    user_1_id: 'user-1',
    user_2_id: 'user-4',
    shared_intent_ids: ['intent-7'],
    status: 'pending',
    matched_at: new Date().toISOString(),
  },
];

// Mock Chat Threads
export const MOCK_THREADS: ChatThread[] = [
  {
    id: 'thread-1',
    match_id: 'match-1',
    unlocked: true,
    first_message_type: 'reaction',
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'thread-2',
    match_id: 'match-2',
    unlocked: false,
    last_message_at: undefined,
  },
];

// Mock Messages
export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    thread_id: 'thread-1',
    sender_id: 'user-1',
    message_type: 'text',
    content: "Love that you value communication so highly! How long have you been exploring the lifestyle?",
    is_first_message: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    read_at: new Date(Date.now() - 82800000).toISOString(),
  },
  {
    id: 'msg-2',
    thread_id: 'thread-1',
    sender_id: 'user-2',
    message_type: 'text',
    content: "About 2 years now! Started slow and it's been amazing for us. You?",
    is_first_message: false,
    created_at: new Date(Date.now() - 82800000).toISOString(),
    read_at: new Date(Date.now() - 79200000).toISOString(),
  },
  {
    id: 'msg-3',
    thread_id: 'thread-1',
    sender_id: 'user-1',
    message_type: 'text',
    content: "Similar timeline! We'd love to grab drinks sometime and see if there's a vibe.",
    is_first_message: false,
    created_at: new Date(Date.now() - 79200000).toISOString(),
    read_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-4',
    thread_id: 'thread-1',
    sender_id: 'user-2',
    message_type: 'text',
    content: "That sounds perfect! We're free this weekend if you are?",
    is_first_message: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Mock Likes (people who liked you)
export const MOCK_LIKES: Like[] = [
  {
    id: 'like-1',
    from_user_id: 'user-5',
    to_user_id: 'user-1',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    seen: false,
  },
  {
    id: 'like-2',
    from_user_id: 'user-6',
    to_user_id: 'user-1',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    seen: false,
  },
  {
    id: 'like-3',
    from_user_id: 'user-8',
    to_user_id: 'user-1',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    seen: true,
  },
];

// Mock Pinds (private messages without matching)
export const MOCK_PINDS: Pind[] = [
  {
    id: 'pind-1',
    from_user_id: 'user-7',
    to_user_id: 'user-1',
    message: "Hey! I saw your profile and loved your vibe. I'm based in NYC but travel a lot - would love to connect virtually sometime!",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    read: false,
  },
  {
    id: 'pind-2',
    from_user_id: 'user-10',
    to_user_id: 'user-1',
    message: "We're going to be in SF next month! Would love to grab drinks if you're interested.",
    created_at: new Date(Date.now() - 43200000).toISOString(),
    read: false,
  },
  {
    id: 'pind-3',
    from_user_id: 'user-11',
    to_user_id: 'user-1',
    message: "Your prompt response about communication really resonated with us. That's exactly what we're looking for too!",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    read: true,
  },
];

// ===== UNIQUE BLEND FEATURES MOCK DATA =====

// Relationship Structure Options
export const RELATIONSHIP_STRUCTURES: {
  id: RelationshipStructure;
  label: string;
  description: string;
  emoji: string;
}[] = [
  {
    id: 'hierarchical',
    label: 'Hierarchical',
    description: 'Primary partnership with secondary relationships',
    emoji: '👑',
  },
  {
    id: 'non_hierarchical',
    label: 'Non-Hierarchical',
    description: 'All relationships valued equally',
    emoji: '⚖️',
  },
  {
    id: 'solo_poly',
    label: 'Solo Poly',
    description: 'Independent polyamory without nesting partners',
    emoji: '🦋',
  },
  {
    id: 'relationship_anarchy',
    label: 'Relationship Anarchy',
    description: 'No predefined relationship labels or hierarchy',
    emoji: '🌈',
  },
  {
    id: 'kitchen_table',
    label: 'Kitchen Table',
    description: 'All partners interact and know each other well',
    emoji: '🍳',
  },
  {
    id: 'parallel',
    label: 'Parallel',
    description: 'Partners have minimal interaction with metas',
    emoji: '🚂',
  },
  {
    id: 'garden_party',
    label: 'Garden Party',
    description: 'Comfortable together when needed, not required',
    emoji: '🌻',
  },
  {
    id: 'mono_poly',
    label: 'Mono-Poly',
    description: 'One partner is mono, one is poly',
    emoji: '💫',
  },
  {
    id: 'triad',
    label: 'Triad',
    description: 'Three people in a closed relationship',
    emoji: '🔺',
  },
  {
    id: 'quad',
    label: 'Quad',
    description: 'Four people in a relationship constellation',
    emoji: '💎',
  },
  {
    id: 'vee',
    label: 'Vee',
    description: 'One person with two partners who may not date each other',
    emoji: '✌️',
  },
  {
    id: 'swinger',
    label: 'Swinger',
    description: 'Recreational play with other couples/singles',
    emoji: '🎭',
  },
  {
    id: 'open_relationship',
    label: 'Open Relationship',
    description: 'Partners date separately with agreed boundaries',
    emoji: '🔓',
  },
];

// Education Articles
export const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    id: 'edu-1',
    title: 'ENM 101: Getting Started',
    summary:
      'An introduction to ethical non-monogamy, the different types, and how to know if it might be right for you.',
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
    summary:
      'Practical strategies for understanding and working through jealousy in non-monogamous relationships.',
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

// Compatibility Quiz Questions
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

// Agreement Templates
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
        content:
          'We agree to have weekly check-ins about our relationship and other connections. We will share when we are developing feelings for someone new.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's2',
        category: 'safety',
        title: 'Safer Sex Practices',
        content:
          'We agree to use barrier protection with all partners. We will get tested every 3 months and share results.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's3',
        category: 'disclosure',
        title: 'What We Share',
        content:
          'We agree to inform each other before intimacy with a new partner. We will share basic information about other partners (name, general relationship status).',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's4',
        category: 'time',
        title: 'Time Management',
        content:
          'We commit to at least two date nights per week together. We will give 24-hour notice for dates with others when possible.',
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
        content:
          'We only play together, never separately. Same room only. We can veto any situation that feels uncomfortable.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's6',
        category: 'safety',
        title: 'Safety Rules',
        content:
          'Condoms required for all penetration. We will discuss anyone we want to play with beforehand. Regular STI testing.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's7',
        category: 'communication',
        title: 'During Play',
        content:
          'Check in with each other regularly. Use a safe word if uncomfortable. Debrief after every experience.',
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
        content:
          'We acknowledge NRE and commit to maintaining our existing relationship(s) while exploring new connections. We will discuss concerns about time allocation openly.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's9',
        category: 'boundaries',
        title: 'Relationship Escalator',
        content:
          'We will discuss major milestones (meeting family, vacations, moving in) with existing partners before committing to them with new partners.',
        agreed_by: [],
        last_updated: new Date().toISOString(),
      },
      {
        id: 's10',
        category: 'veto',
        title: 'Veto Policy',
        content:
          'We do not use veto power. If someone has concerns about a partner, we will discuss and try to address the underlying need together.',
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

// Consent Checklist Items Template
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

// Mock Polycule for current user
export const MOCK_POLYCULE: Polycule = {
  id: 'polycule-1',
  user_id: 'user-1',
  members: [
    {
      id: 'me',
      name: 'You',
      photo: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400',
      relationship_type: 'anchor',
      connection_strength: 'primary',
      connected_to: ['partner', 'meta1'],
    },
    {
      id: 'partner',
      name: 'Your Partner',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      relationship_type: 'nesting_partner',
      connection_strength: 'primary',
      connected_to: ['me', 'meta2'],
    },
    {
      id: 'meta1',
      name: 'Alex',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      relationship_type: 'dating',
      connection_strength: 'secondary',
      connected_to: ['me'],
      notes: 'Met at a play party, dating for 3 months',
    },
    {
      id: 'meta2',
      name: 'Jordan',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      relationship_type: 'partner',
      connection_strength: 'secondary',
      connected_to: ['partner'],
      notes: "Partner's other partner",
    },
  ],
  structure: 'kitchen_table',
  visibility: 'matches_only',
  updated_at: new Date().toISOString(),
};

// Mock Scheduled Dates
export const MOCK_SCHEDULED_DATES: ScheduledDate[] = [
  {
    id: 'date-1',
    user_id: 'user-1',
    partner_id: 'meta1',
    partner_name: 'Alex',
    title: 'Dinner date',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    start_time: '19:00',
    end_time: '22:00',
    location: 'Nopa Restaurant',
    notes: 'Try the pork chop!',
    is_overnight: false,
    reminder_sent: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'date-2',
    user_id: 'user-1',
    partner_id: 'partner',
    partner_name: 'Your Partner',
    title: 'Movie night',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    start_time: '20:00',
    location: 'Home',
    is_overnight: true,
    reminder_sent: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'date-3',
    user_id: 'user-1',
    partner_id: 'user-2',
    partner_name: 'Maya & James',
    title: 'Double date drinks',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    start_time: '18:30',
    location: 'The Interval',
    notes: 'Bringing board games',
    is_overnight: false,
    reminder_sent: false,
    created_at: new Date().toISOString(),
  },
];

// Mock STI Test Record
export const MOCK_STI_RECORD: STITestRecord = {
  id: 'sti-1',
  user_id: 'user-1',
  test_date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
  next_test_date: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
  tests_included: ['HIV', 'HSV-1', 'HSV-2', 'Chlamydia', 'Gonorrhea', 'Syphilis', 'HPV'],
  all_negative: true,
  visibility: 'matches_only',
  verified: false,
};

// Mock Partner Profiles for "Meet the Partners"
export const MOCK_PARTNER_PROFILES: PartnerProfile[] = [
  {
    id: 'partner-1',
    name: 'Your Partner',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    relationship_type: 'Nesting Partner',
    relationship_duration: '4 years',
    bio: 'We started our ENM journey together 2 years ago. Always involved in first meetings.',
    involvement_level: 'always_present',
    can_message: true,
  },
  {
    id: 'partner-2',
    name: 'Alex',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    relationship_type: 'Partner',
    relationship_duration: '3 months',
    bio: 'A wonderful connection that developed organically. Kitchen table poly style.',
    involvement_level: 'kitchen_table',
    can_message: true,
  },
];

// ENM Badges Data
export const ENM_BADGES: {
  id: ENMBadge;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    id: 'poly_pioneer',
    label: 'Poly Pioneer',
    description: '5+ years practicing ENM',
    icon: '🏆',
    color: '#FFD700',
  },
  {
    id: 'communication_pro',
    label: 'Communication Pro',
    description: 'High scores on communication skills',
    icon: '💬',
    color: '#4ECDC4',
  },
  {
    id: 'safety_first',
    label: 'Safety First',
    description: 'Regular STI testing every 3 months',
    icon: '🛡️',
    color: '#45B7D1',
  },
  {
    id: 'boundary_master',
    label: 'Boundary Master',
    description: 'Complete relationship agreement',
    icon: '📋',
    color: '#96CEB4',
  },
  {
    id: 'community_builder',
    label: 'Community Builder',
    description: 'Active in ENM community groups',
    icon: '🤝',
    color: '#DDA0DD',
  },
  {
    id: 'verified_couple',
    label: 'Verified Couple',
    description: 'Both partners verified on app',
    icon: '✓',
    color: '#98D8C8',
  },
  {
    id: 'solo_journey',
    label: 'Solo Journey',
    description: 'Practicing solo polyamory',
    icon: '🦋',
    color: '#F7DC6F',
  },
  {
    id: 'newbie_friendly',
    label: 'Newbie Friendly',
    description: 'Open to ENM newcomers',
    icon: '🌱',
    color: '#82E0AA',
  },
  {
    id: 'kink_aware',
    label: 'Kink Aware',
    description: 'Experienced in kink community',
    icon: '⛓️',
    color: '#BB8FCE',
  },
  {
    id: 'travel_ready',
    label: 'Travel Ready',
    description: 'Open to long distance connections',
    icon: '✈️',
    color: '#85C1E9',
  },
];
