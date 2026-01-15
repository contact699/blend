# Blend - ENM Dating App

A mobile-first dating app for ethically non-monogamous (ENM) individuals and couples. Built with privacy-first features, consent-driven conversations, and unique relationship management tools that set it apart from competitors like Feeld.

## What Makes Blend Unique

### Polycule Map
- **Visual relationship network** - See your entire relationship constellation in an interactive map
- Dynamic nodes showing partners, metamours, and their connections
- Animated connection lines with different strengths (primary, secondary, casual)
- Relationship type labels (nesting partner, dating, meta, comet, anchor)
- Support for 13 different relationship structures (hierarchical, non-hierarchical, solo poly, kitchen table, etc.)

### Relationship Agreement Builder
- **Create custom agreements** with partners covering boundaries, rules, and expectations
- Pre-built templates: Basic ENM Agreement, Swinger Couple Agreement, Polyamory Agreement
- 8 agreement categories: Communication, Boundaries, Intimacy, Time, Safety, Disclosure, Veto, Custom
- Section-by-section editing with partner sign-off tracking
- Export and share agreements

### Date Calendar
- **Multi-partner scheduling** - Track dates with all your partners in one place
- Color-coded by partner for easy visualization
- Overnight indicator for sleepovers
- Location and notes for each date
- Upcoming dates overview

### ENM Education Hub
- **6 comprehensive articles** covering ENM basics, jealousy management, communication, boundaries, relationship structures, and safer sex
- Category filtering (Basics, Communication, Jealousy, Boundaries, Structures, Safety)
- Reading time estimates
- Bookmark articles for later

### Compatibility Quiz
- **8-question ENM compatibility assessment** covering jealousy, communication, hierarchy, disclosure, time management, and boundaries
- Personalized results with ENM profile type (Open Communicator, Independent Explorer, Security Seeker, Flexible Navigator, Community Builder)
- Detailed scores across 6 dimensions
- Share results with potential matches

### STI Safety Tracking
- **Log test dates and results** with visibility controls
- Track which tests were included
- Automatic next-test reminders (every 3 months)
- Share status with matches or keep private
- Safety tips and best practices

### Consent Checklist
- **26 activities across 6 categories**: Touch, Intimacy, Communication, Photos, Social, Kink
- Four-level consent: Yes, Maybe, Discuss, No
- Progress tracking per category
- Share with partners before meeting
- Pre-populate boundaries discussions

### Meet the Partners Section
- **Introduce your relationship network** on your profile
- Partner photos, names, and relationship types
- Involvement levels: Always Present, Sometimes Present, Aware Only, Kitchen Table
- Duration of each relationship
- Direct messaging capability indicators

### Enhanced Profile Cards
- **Visual relationship structure badges** showing poly style
- ENM identity badges (Poly Pioneer, Communication Pro, Safety First, Boundary Master, etc.)
- STI testing status indicator
- Partner count display
- Virtual-only indicators
- **Trust Score display** with tier badge and score

### Trust Score System
Community-driven reputation system that creates a self-regulating community where good behavior is rewarded and bad actors are naturally filtered out.

**Trust Tiers**
- **Newcomer** (0-24) - New to the community
- **Member** (25-49) - Active community member
- **Trusted** (50-74) - Verified through positive interactions
- **Verified** (75-89) - Highly trusted community member
- **Ambassador** (90-100) - Community leader and role model

**Six Trust Dimensions**
- **Behavior** - How you interact on the app (response rate, message quality)
- **Community** - Feedback from other users (reviews, vouches)
- **Reliability** - Showing up and following through on dates
- **Safety** - Respecting boundaries, no reports
- **Engagement** - Contributing to community events
- **Transparency** - Profile completeness, STI updates

**Earned Badges**
- Verified Photo - Photo verified as authentic
- Social Verified - Connected social accounts
- Community Vouched - Vouched by 3+ trusted members
- Event Host - Successfully hosted 3+ events
- Safe Dater - 5+ positive date reviews
- Great Communicator - 90%+ response rate
- Reliable - Shows up consistently
- Respectful - No upheld reports
- STI Transparent - Regular STI updates
- Consent Champion - Positive consent feedback
- Long Term Member - 1+ year on platform
- Community Builder - Active in community events

**Date Reviews**
- Rate dates across 4 categories: Communication, Respect, Authenticity, Safety
- Add positive tags: Great conversation, Respectful boundaries, Photos accurate, On time, Felt safe
- Flag concerns: Photos misleading, Pushy behavior, Boundary issues, Ghosted after
- Optional anonymous reviews
- Verified meetup indicator

**Community Vouches**
- Vouch for people you know personally
- Specify relationship type: Dated, Friends, Met at event, Community member
- Duration known: Less than a month, 1-6 months, 6-12 months, Over a year
- Vouches from higher-tier members carry more weight
- Personal messages visible on trust profile

**Trust Settings**
- Set minimum trust tier to message you
- Show/hide trust score on profile
- Allow/block anonymous reviews
- Notify on trust changes
- Auto-block low trust users

## Core Features

### For the ENM Community
- Designed for couples, swingers, poly individuals, and the ethically curious
- Intent options: Couples dating, Third for us, Join a couple, Polyamory, Open relationship, Swinging, Friends first, Kink friendly

### Linked Partners (Feeld-style)
- Link your partner to your profile so others can see you're in a relationship
- Partner photo, name, and age displayed on your profile
- "Has Partner" badge shown on profile cards in Discover
- Each partner can have their own separate profile while being linked

### Partner Linking & Polycule Integration
- **Invite partners by email** - Send invitations to partners to connect their profiles
- **Multiple partners support** - Link multiple partners with different relationship types
- **Relationship type labels**: Anchor Partner, Nesting Partner, Partner, Dating, Comet, Metamour, FWB
- **Link status tracking**: Pending (waiting for confirmation), Confirmed (mutually linked), Declined
- **Polycule Map integration**: Shows all linked partners with visual connections
  - Green checkmark for confirmed Blend users
  - Amber clock for pending link requests
  - Emoji indicators for relationship types
- **Tap-to-view profiles**: Tap any partner node to see their full profile
- **Invite to Blend**: Option to invite partners not yet on the app
- **Meet the Partners section**: Visual distinction between linked Blend users and manual entries
- **Email lookup**: Automatically connects if partner is already on Blend

### Likes - See Who Liked You
- Dedicated tab to see all profiles that have liked you
- View their full profile with photos and bio
- Match instantly by liking them back
- Pass on profiles you're not interested in
- New likes are highlighted with badges

### Pings - Private Messages Without Matching
- Receive direct messages from anyone without needing to match first
- Read their message and view their profile
- Reply to start a full conversation (creates a match)
- Dismiss pings you're not interested in
- Perfect for when someone really wants to connect

### Privacy & Security
- Screenshot protection in chat (prevents screen capture on iOS/Android)
- "Protected chat" badges visible in conversations
- Secure messaging by default
- Video calls with screen recording protection
- **Hidden photos until match** - Profile photos only revealed after both users match
- **Supabase Row Level Security (RLS)** - Database-enforced access control
- **UUID-based IDs** - Prevents IDOR attacks (no guessable sequential IDs)
- **Private photo storage** - Photos served via short-lived signed URLs
- **EXIF stripping** - Removes geolocation from uploaded photos
- **Input validation** - All inputs validated and sanitized using Zod
- **Conversation authorization** - Only participants can read/write messages

### Video Chat
- In-app video calling with screen recording protection
- Mute/unmute audio and video controls
- Camera flip between front/back
- Call duration tracking
- Video call history logged in chat

### Group Chats
- Create group conversations with multiple connections
- Select 2+ people from your active matches
- Custom group names and participant management
- Full media sharing in groups
- Screenshot protection for group privacy

### Interactive Group Games
Play engaging games within group chats to break the ice and deepen connections:

**Truth or Dare**
- Three difficulty tiers: Playful, Flirty, and Intimate
- ENM-specific challenges designed for couples and singles
- Timer-based challenges with Accept/Skip/Complete flow
- Couples can take challenges together
- **Create your own custom challenges** that mix with default content

**Hot Seat**
- One person answers rapid-fire questions for 5 minutes
- 30-second timer per question
- Mix of suggested questions and custom questions from participants
- Categories: Fun, Deep, Spicy, Relationship
- Automatic rotation to the next player
- **Add custom questions** to the question pool

**Story Chain**
- Collaborative storytelling with romantic, adventurous, fantasy, or funny prompts
- Each person adds 1-2 sentences with a 3-minute timer
- Vote to redo entries if they go off track
- Final story viewable at the end
- **Create custom story prompts** for your group

**Custom Game Content**
- Access the Custom Content Manager from the game launcher (pencil icon)
- Add your own Truth or Dare challenges (truth/dare, difficulty, singles/couples)
- Create Hot Seat questions in any category
- Write Story Chain prompts for different themes
- Custom content has higher chance of appearing in games
- Delete custom content anytime

**Coming Soon:**
- Mystery Date Planner - Collaboratively plan dates with anonymous voting
- Compatibility Triangle - Discover what triads have in common
- Group Challenge - Complete fun challenges together as a polycule

### Events System
Comprehensive community events platform for ENM gatherings:

### Search & Discovery System
Powerful search and filtering system to find exactly who you're looking for:

**Unified Search**
- Search across people, events, articles, and messages from one place
- Auto-categorized results with grouped previews
- Real-time search with 300ms debounce
- Search history and recent searches

**Quick Filters**
- Horizontal scrollable filter chips for common searches
- Filters: Nearby, Online Now, Verified, Highly Rated, New Members, Hosting Events, Mutual Connections, Recently Active
- One-tap toggle with haptic feedback
- Clear all button with active count

**Advanced Filters**
- **Location**: Distance radius slider (1-100+ miles), include virtual toggle
- **Basics**: Age range dual slider, gender multi-select (10+ options), pronouns required
- **Relationship**: Seeking types (solo poly, couples, triads), relationship styles, connection types, current situation
- **Trust & Verification**: Minimum trust score slider, verification requirements (photo, ID, social), event hosts only
- **Compatibility**: Values multi-select (12 options), interest tags
- **Activity**: Active within timeframe (1 day to 3 months), minimum response rate
- **Dealbreakers**: Exclude profiles without photos, incomplete profiles, low trust scores, already passed/matched
- Active filter count badge on sections
- Reset to defaults option

**Browse Categories**
- Pre-filtered category cards for quick discovery
- Categories: Nearby, Online Now, New Members, Highly Rated, Event Hosts, Virtual Friendly, Mutual Connections, Recently Active
- Quick access tiles with real-time counts
- Featured profiles carousel

**Result Views**
- **Card View**: Full profile cards with photos, trust score, match reasons
- **List View**: Compact list grouped by result type (People, Events, Articles, Messages)
- **Map View**: Interactive map showing nearby profiles and events with custom markers
  - User location display (with permission)
  - Profile markers with photos, trust scores, and online status
  - Event markers with attendee counts
  - Tap markers to see preview cards
  - Dark theme map styling
  - Privacy-focused fuzzy locations
- Toggle between views with persistent preference

**Sort Options**
- Sort by: Distance, Trust Score, Newest, Most Active, Compatibility
- Persisted across sessions

**Saved Searches**
- Save any search configuration with custom name
- Toggle notifications for new matches on saved searches
- Recent searches history (last 10)
- Quick re-apply saved filters
- Delete saved searches anytime

**Event Discovery**
- Browse upcoming events with search and filters
- Featured events carousel with gorgeous card designs
- Filter by category: Social, Dating, Education, Party, Outdoor, Wellness, Meetup, Virtual, Private, Community
- Search by event name, tags, or location
- Quick filters for "Near Me" and "This Week"

**Event Creation**
- Step-by-step event creation wizard
- Upload cover photos
- 10 event categories with emoji icons
- Add custom tags (poly-friendly, couples-welcome, lgbtq+, etc.)
- Set location (physical or virtual with meeting link)
- Configure date, time, and timezone
- Set max attendees (optional)
- Visibility options: Public, Friends Only, Invite Only
- Optional RSVP approval requirement

**RSVP System**
- One-tap RSVP: Going, Maybe, or Join Waitlist
- Automatic waitlist when events are full
- Auto-promote from waitlist when spots open
- Approval workflow for private events
- Cancel RSVP anytime
- Host notifications for new RSVPs

**Event Management (For Hosts)**
- Dedicated management dashboard
- View attendees by status (Going, Pending, Waitlist, Maybe)
- Approve or decline pending RSVPs
- Check-in attendees at the door
- Remove attendees if needed
- Quick stats: going count, pending requests, views
- Duplicate events for recurring gatherings
- Cancel events with attendee notifications

**Event Chat**
- Auto-created group chat for each event
- Only "Going" attendees can access
- Share photos and memories
- Continue conversation after the event
- Perfect for coordinating and post-event discussions

**Safety & Trust**
- Host reputation system (star ratings)
- Events hosted count displayed
- Report inappropriate events
- Approval-required badge for private events
- Virtual event indicator for online gatherings

### Location Filtering
- **Nearby** - Find people in your area
- **Everywhere** - Browse all users regardless of location
- **Virtual Only** - Connect with users open to online-only connections
- **Browse by City** - Filter by specific cities (San Francisco, LA, NYC, etc.)

### AI-Powered Smart Matching
Intelligent matching system that learns your preferences and surfaces compatible profiles:

**Compatibility Scoring Engine**
- Multi-dimensional scoring (0-100 scale) across 6 dimensions:
  - Intent Compatibility (25 pts) - Shared relationship goals
  - Quiz Compatibility (20 pts) - Personality alignment from quiz answers
  - Relationship Structure Fit (15 pts) - Compatible poly styles
  - Communication Style Match (15 pts) - Pace and style alignment
  - Values Alignment (15 pts) - Shared values from bio analysis
  - Behavioral Compatibility (10 pts) - Similar activity patterns

**Behavioral Learning**
- Tracks profile views, dwell time, and like/pass actions
- Learns your attraction patterns over time
- Identifies preferred age ranges, bio styles, and relationship structures
- Analyzes communication preferences from conversation patterns

**Smart Discovery Mode**
- Toggle "Smart Matching" in Discover to sort profiles by compatibility
- Compatibility badges show match percentage on profile cards
- Match insights explain WHY two profiles are compatible
- Conversation starters based on shared interests

**Taste Profile**
- Dedicated screen showing your learned preferences
- View your attraction patterns (age range, bio preferences, photo count)
- See your browsing style (session duration, decision speed)
- Communication style analysis (verbose vs concise, response speed)
- Activity stats (likes, passes, total profiles viewed)

**Profile Analysis**
- Extracts personality traits from bio and prompt responses
- Identifies values (communication, authenticity, growth, etc.)
- Detects ENM style preferences (kitchen table, parallel, hierarchical)
- Generates match explanations and potential challenges

### Intent-Based Matching
- Users select their relationship intents during onboarding
- Matches can only occur between users who share at least one intent
- Shared intents are displayed on profile cards and in matches

### Thoughtful First Messages
Chat is locked until a structured first message is sent. Options include:
1. **Guided prompts** - Choose from curated conversation starters
2. **Profile reactions** - Comment on the other person's prompt responses
3. **Voice notes** - Coming soon

### Media Messaging
- Send photos and videos in chat
- Full-screen image viewer with tap to dismiss
- Secure media sharing with screenshot protection
- **Self-destructing photos** - Set a timer (5s, 10s, 30s) for photos to auto-delete after viewing
- Blurred preview for timed photos until recipient taps to view
- Countdown timer shows remaining time while viewing
- **Photo editor** - Blur faces for privacy before sending
- **GIF support** - Search and send GIFs from GIPHY

### Message Interactions
- **Reply to messages** - Long-press any message to reply, shows quoted preview
- **Emoji reactions** - React to messages with quick reactions or full emoji picker
- **Quick reactions** - Tap to add or remove reactions (heart, laugh, wow, thumbs up, fire)
- Works in both direct and group chats

### Conversation Quality
- 72-hour auto-archive if no response (keeps inbox clean)
- Active and archived chat tabs for organization
- Read receipts and timestamps

## App Structure

```
src/
├── app/
│   ├── (tabs)/              # Main app tabs
│   │   ├── discover.tsx     # Discover screen (swipe profiles with smart matching)
│   │   ├── events.tsx       # Events discovery and listing
│   │   ├── likes.tsx        # See who liked you
│   │   ├── pings.tsx        # Pings - private messages without matching
│   │   ├── inbox.tsx        # Messages inbox (direct + group chats)
│   │   └── profile.tsx      # User profile (with linked partner display)
│   ├── onboarding/          # Onboarding flow
│   ├── chat/[matchId].tsx   # Direct chat
│   ├── group-chat/[threadId].tsx # Group chat
│   ├── event/[id]/          # Event screens
│   │   ├── index.tsx        # Event details with RSVP
│   │   ├── chat.tsx         # Event group chat
│   │   └── manage.tsx       # Host management dashboard
│   ├── create-event.tsx     # Event creation wizard
│   ├── my-relationships.tsx # Relationship hub (polycule, calendar, agreements)
│   ├── education.tsx        # ENM education articles
│   ├── quiz.tsx             # Compatibility quiz
│   ├── sti-safety.tsx       # STI safety tracking
│   ├── consent-checklist.tsx # Consent preferences
│   ├── video-call.tsx       # Video call screen
│   ├── taste-profile.tsx    # AI-learned taste preferences screen
│   ├── trust-profile.tsx    # Trust Score detailed view
│   ├── leave-review.tsx     # Leave date review modal
│   ├── vouch-user.tsx       # Vouch for user modal
│   ├── search.tsx           # Advanced search modal
│   └── edit-profile.tsx     # Profile editing
├── components/
│   ├── PolyculeMap.tsx      # Interactive relationship network visualization
│   ├── AgreementBuilder.tsx # Relationship agreement builder
│   ├── DateCalendar.tsx     # Multi-partner date scheduler
│   ├── MeetThePartners.tsx  # Partner introduction section
│   ├── EnhancedProfileCard.tsx # Profile card with badges, trust score
│   ├── TrustBadge.tsx       # Trust tier badge component
│   ├── TrustScoreCard.tsx   # Trust Score display card
│   ├── CompatibilityBadge.tsx # Match percentage display components
│   ├── MatchInsights.tsx    # "Why you match" insights component
│   ├── EventCard.tsx        # Event card with multiple variants
│   ├── search/              # Search system components
│   │   ├── SearchBar.tsx    # Unified search input with preview
│   │   ├── QuickFilters.tsx # Horizontal filter chips
│   │   ├── AdvancedFiltersModal.tsx # Full filter options modal
│   │   ├── SearchResults.tsx # Card/List/Map view results
│   │   ├── BrowseCategories.tsx # Category cards and featured
│   │   └── SavedSearchesModal.tsx # Saved and recent searches
│   ├── games/               # Interactive group games
│   │   ├── GameLauncher.tsx # Game selection modal
│   │   ├── GameOverlay.tsx  # Active game container
│   │   ├── GameTimer.tsx    # Reusable countdown timer
│   │   ├── TruthOrDare.tsx  # Truth or Dare game
│   │   ├── HotSeat.tsx      # Hot Seat game
│   │   └── StoryChain.tsx   # Story Chain game
│   └── ...                  # Other components
└── lib/
    ├── types.ts             # TypeScript types (includes events, AI matching, trust score, search)
    ├── game-content.ts      # Game challenges, questions, and prompts
    ├── mock-data.ts         # Demo data (education, quiz, agreements, polycule)
    ├── mock-events.ts       # Mock event data for development
    ├── matching/            # AI matching system
    │   ├── compatibility-engine.ts # Multi-dimensional scoring algorithms
    │   ├── ai-analyzer.ts   # Profile text analysis for personality/values
    │   └── taste-profile.ts # Behavioral pattern analysis
    └── state/dating-store.ts # Zustand store (includes events, AI matching, trust score, search)
```

## Security Setup

See [SECURITY.md](./SECURITY.md) for detailed security implementation guide.

### Database Setup (Required for TestFlight Testing)

For TestFlight users to see each other's real profiles (instead of demo data), you need to set up the Supabase database:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**:
   - Go to your Supabase Dashboard > SQL Editor
   - Copy the contents of `src/lib/supabase/schema.sql` and run it
   - This creates all the tables with Row Level Security enabled

3. **Create the photos storage bucket**:
   - Go to Supabase Dashboard > Storage
   - Click "Create a new bucket"
   - Name it `photos`
   - Set it to **Private** (not public)

4. **Configure storage policies** (in SQL Editor):
   ```sql
   -- Allow users to upload their own photos
   CREATE POLICY "Users can upload own photos"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'photos'
     AND (storage.foldername(name))[1] = auth.uid()::text
   );

   -- Allow reading photos via signed URLs
   CREATE POLICY "Users can view photos"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'photos');

   -- Allow users to delete their own photos
   CREATE POLICY "Users can delete own photos"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'photos'
     AND (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

5. **Get your API keys**:
   - Go to Settings > API
   - Copy the "Project URL" and "anon public" key

6. **Add environment variables** in the ENV tab:
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your anon public key

7. **Enable email auth** (optional but recommended):
   - Go to Authentication > Providers
   - Make sure Email is enabled
   - For testing, you can disable "Confirm email" in Authentication > Settings

Once set up, TestFlight users will:
- Create accounts with email/password
- See each other's real profiles in Discover
- Be able to like and match with each other

## Database Integration Status

The app is being migrated from mock data to a real Supabase database. Here's the current status:

### Fully Working with Supabase
- **User Authentication** - Email/password auth with Supabase Auth
- **Profile Management** - Create, view, and edit profiles stored in Supabase
- **Photo Upload** - Photos stored in Supabase Storage with signed URLs
- **Discover Feed** - Browse real profiles from the database
- **Like System** - Send likes stored in Supabase
- **Match System** - Matches created when both users like each other
- **Chat/Messaging** - Real-time messages stored in Supabase
- **Inbox** - View all matches and conversations from database
- **Partner Links** - Link partners by email with invitation system
- **Trust Score** - Community reputation tracking with reviews and vouches
- **Smart Matching AI** - Profile views tracked, taste profiles calculated from behavior

### Using Local/Mock Data (for demo purposes)
- **Events System** - Complex event data structure still using mock data
- **Education Hub** - Static educational content
- **Quiz** - ENM compatibility quiz
- **Games** - Interactive group games (Truth or Dare, Hot Seat, Story Chain)

## Design

- Dark theme with purple/pink gradient accents
- Mobile-native design following iOS HIG
- Smooth animations using Reanimated
- Clean, minimal interface focused on content
