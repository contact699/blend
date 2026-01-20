# Blend - ENM Dating App (AI Assistant Guide)

> **Project:** Blend - Dating app for ethically non-monogamous (ENM) individuals and couples
> **Tech Stack:** Expo SDK 53, React Native 0.79.6, TypeScript (strict), Supabase
> **Package Manager:** Bun (NOT npm/yarn)
> **Development:** Standard Expo development workflow

---

## 📋 Quick Reference

<stack>
  **Core:** Expo SDK 53.0.22, React Native 0.79.6, React 19.0.0, TypeScript 5.8.3 (strict mode)
  **Package Manager:** Bun (not npm) — lock file: bun.lock
  **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
  **Router:** Expo Router ~5.1.8 (file-based, typed routes enabled)
  **State:** @tanstack/react-query 5.90.2 (server state), Zustand 5.0.9 (local state)
  **Styling:** NativeWind ~4.1.23 + Tailwind CSS 3.4.17
  **Animations:** react-native-reanimated 3.17.4 (preferred over Animated)
  **Gestures:** react-native-gesture-handler ~2.24.0
  **Icons:** lucide-react-native ^0.468.0
  **UI:** zeego ^3.0.6 (native context menus), @shopify/flash-list 1.7.6 (performant lists)
  **Media:** expo-camera ~16.1.6, react-native-vision-camera ^4.6.4, expo-av ~15.1.4
  **Chat:** react-native-gifted-chat 2.6.3
  **Maps:** react-native-maps ^1.24.3, expo-location ~18.1.4
  **Graphics:** @shopify/react-native-skia v2.0.3
  **Storage:** @react-native-async-storage/async-storage 2.1.2, react-native-mmkv ^3.2.0
  **Utils:** date-fns ^4.1.0, zod 4.1.11, uuid ^11.1.0

  **Pre-installed packages — DO NOT install new ones** unless they are:
  - @expo-google-fonts/* packages
  - Pure JavaScript helpers (lodash, dayjs, etc.)
</stack>

---

## 🏗️ Project Structure

<structure>
```
/home/user/blend/
├── src/
│   ├── app/                      # Expo Router file-based routes (src/app/_layout.tsx is root)
│   │   ├── _layout.tsx          # Root layout (RootLayoutNav - NEVER delete/refactor)
│   │   ├── index.tsx            # Home screen (matches '/')
│   │   ├── (tabs)/              # Tab navigation
│   │   │   ├── _layout.tsx      # Tab layout (register actual tabs here)
│   │   │   ├── discover.tsx     # Swipe profiles with AI matching
│   │   │   ├── events.tsx       # Browse events
│   │   │   ├── likes.tsx        # See who liked you
│   │   │   ├── pings.tsx        # Pings (DMs without matching)
│   │   │   ├── inbox.tsx        # Messages inbox
│   │   │   └── profile.tsx      # User profile
│   │   ├── onboarding/          # Onboarding flow
│   │   ├── chat/[matchId].tsx   # Direct 1-on-1 chat
│   │   ├── group-chat/[threadId].tsx  # Group chat with interactive games
│   │   ├── event/[id]/          # Event screens
│   │   │   ├── index.tsx        # Event details
│   │   │   ├── chat.tsx         # Event group chat
│   │   │   └── manage.tsx       # Host management
│   │   ├── create-event.tsx     # Event creation wizard
│   │   ├── my-relationships.tsx # Polycule map, calendar, agreements
│   │   ├── education.tsx        # ENM education hub
│   │   ├── quiz.tsx             # Compatibility quiz
│   │   ├── sti-safety.tsx       # STI tracking
│   │   ├── consent-checklist.tsx # Consent preferences
│   │   ├── video-call.tsx       # Video calls
│   │   ├── taste-profile.tsx    # AI-learned preferences
│   │   ├── trust-profile.tsx    # Trust score details
│   │   ├── leave-review.tsx     # Date reviews (modal)
│   │   ├── vouch-user.tsx       # Vouching (modal)
│   │   ├── search.tsx           # Advanced search (modal)
│   │   └── edit-profile.tsx     # Profile editing
│   │
│   ├── components/              # Reusable UI components
│   │   ├── PolyculeMap.tsx      # Relationship network visualization (13 structure types)
│   │   ├── AgreementBuilder.tsx # Relationship agreement builder
│   │   ├── DateCalendar.tsx     # Multi-partner date scheduler
│   │   ├── MeetThePartners.tsx  # Partner introduction section
│   │   ├── EnhancedProfileCard.tsx # Profile cards with trust badges
│   │   ├── TrustBadge.tsx       # Trust tier badge (5 tiers)
│   │   ├── TrustScoreCard.tsx   # Trust score display
│   │   ├── CompatibilityBadge.tsx # Match percentage
│   │   ├── MatchInsights.tsx    # "Why you match" AI insights
│   │   ├── EventCard.tsx        # Event card component
│   │   ├── search/              # Search system components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── QuickFilters.tsx
│   │   │   ├── AdvancedFiltersModal.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   ├── BrowseCategories.tsx
│   │   │   └── SavedSearchesModal.tsx
│   │   └── games/               # Interactive group games (NEW)
│   │       ├── GameLauncher.tsx
│   │       ├── GameOverlay.tsx
│   │       ├── GameTimer.tsx
│   │       ├── TruthOrDare.tsx
│   │       ├── HotSeat.tsx
│   │       └── StoryChain.tsx
│   │
│   └── lib/                     # Utilities, state, types
│       ├── types.ts             # TypeScript interfaces (User, Match, Event, Game types)
│       ├── cn.ts                # className merge utility (tailwind-merge + clsx)
│       ├── game-content.ts      # Game questions/challenges
│       ├── mock-data.ts         # Demo data
│       ├── mock-events.ts       # Mock events
│       ├── example-context.ts   # State pattern example
│       ├── matching/
│       │   ├── compatibility-engine.ts # Scoring algorithms
│       │   ├── ai-analyzer.ts   # Profile analysis
│       │   └── taste-profile.ts # Behavioral analysis
│       ├── state/
│       │   └── dating-store.ts  # Zustand store (user preferences, game state)
│       └── supabase/
│           └── schema.sql       # Database schema
│
├── patches/                     # Package patches (DO NOT EDIT)
├── .env                         # Environment variables (Supabase, API keys)
├── package.json                 # Dependencies (use bun, not npm)
├── bun.lock                     # Lockfile (checked in)
├── tsconfig.json                # TypeScript config (strict mode, path alias: @/*)
├── babel.config.js              # NativeWind, module resolver
├── metro.config.js              # NativeWind, SVG support
├── tailwind.config.js           # Custom font sizes (xs-9xl), dark mode
├── global.css                   # Global Tailwind directives
├── index.ts                     # Entry point
├── README.md                    # Feature documentation
├── PLAN.md                      # Implementation plan (interactive games)
├── SECURITY.md                  # Security implementation guide
└── AGENTS.md                    # Agent instructions reference
```
</structure>

---

## 🎯 Project Context: What is Blend?

**Blend** is a dating app for **ethically non-monogamous (ENM)** individuals and couples. It's designed for:
- Polyamorous individuals
- Swinger couples
- Open relationships
- Relationship anarchists
- People exploring ethical non-monogamy

### Key Features Implemented
✅ **User Auth & Profiles** (Supabase Auth)
✅ **Photo Upload** (EXIF stripping, signed URLs)
✅ **Discover Feed** (swipe profiles)
✅ **Like/Match System**
✅ **1-on-1 Messaging** (real-time via Supabase)
✅ **Group Chat** (multi-person conversations)
✅ **Partner Linking** (polycule mapping)
✅ **Trust Score System** (5 tiers, 6 dimensions, 12+ badges)
✅ **AI Smart Matching** (compatibility scoring, taste profiles)
✅ **Search & Discovery** (advanced filters)

### Features In Progress
⏳ **Interactive Group Games** (Truth or Dare, Hot Seat, Story Chain)
⏳ **Events System** (create/browse ENM meetups)
⏳ **Education Hub** (ENM resources)
⏳ **Compatibility Quiz**

### Unique Differentiators
1. **Polycule Mapping** - Visualize relationship networks (13 structure types)
2. **Relationship Agreements** - Builder tool (8 categories, pre-built templates)
3. **Trust Score** - Community-driven reputation (Newcomer → Ambassador tiers)
4. **Consent Checklist** - 26 activities, 4-level consent system
5. **Partner Introductions** - "Meet the Partners" feature
6. **Interactive Games** - Ice breakers for group chats
7. **STI Safety Tracking** - Test dates, partner disclosure

---

## 📝 TypeScript Guidelines

<typescript>
  **Strict Mode:** Enabled in tsconfig.json

  **Explicit Type Annotations:**
  ```typescript
  // ✅ Correct
  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState<number>(0);

  // ❌ Wrong
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  ```

  **Null/Undefined Handling:**
  ```typescript
  // Use optional chaining and nullish coalescing
  const name = user?.profile?.name ?? 'Anonymous';
  const age = user?.age?.toString() ?? 'Unknown';
  ```

  **Object Creation:**
  Include ALL required properties (strict mode enforced)
  ```typescript
  // ✅ Correct
  const user: User = {
    id: uuid(),
    email: 'test@example.com',
    profile: null,  // Include even if null
    created_at: new Date().toISOString(),
  };

  // ❌ Wrong - missing required properties
  const user: User = {
    id: uuid(),
    email: 'test@example.com',
  };
  ```

  **Path Alias:**
  Use `@/*` instead of relative imports
  ```typescript
  // ✅ Correct
  import { User } from '@/lib/types';
  import { cn } from '@/lib/cn';

  // ❌ Avoid
  import { User } from '../../lib/types';
  ```
</typescript>

---

## 🌐 Development Environment

<environment>
  **Development Setup:**
  - Standard Expo development workflow
  - Dev server runs on port 8081 by default
  - Use Expo Go app or custom dev client to preview
  - Full terminal and code access for the developer

  **Logging:**
  - Check Metro bundler output for runtime errors
  - Use `console.log()` for debugging
  - Expo DevTools for performance monitoring

  **Environment Variables:**
  - Stored in `.env` file (not checked into git)
  - Use `.env.example` as template
  - All public variables must be prefixed with `EXPO_PUBLIC_`

  **Images:**
  - Use URLs from **unsplash.com** for placeholder images
  - Store user-uploaded images in Supabase Storage
  - Use signed URLs for secure photo access
</environment>

---

## 🚫 Forbidden Files (DO NOT EDIT)

<forbidden_files>
  - `patches/` directory (package patches)
  - `babel.config.js`
  - `metro.config.js`
  - `app.json`
  - `tsconfig.json`
  - `nativewind-env.d.ts`
</forbidden_files>

---

## 🧭 Routing & Navigation

<routing>
  **Router:** Expo Router (file-based routing)
  Every file in `src/app/` becomes a route.

  **CRITICAL:** Never delete or refactor `RootLayoutNav` from `src/app/_layout.tsx`

  <stack_router>
    **Stack Navigation:**
    - `src/app/_layout.tsx` (root layout)
    - `src/app/index.tsx` (matches '/')
    - `src/app/chat/[matchId].tsx` (matches '/chat/abc123')

    **Customize Headers:**
    ```tsx
    <Stack.Screen
      options={{
        title: 'Profile',
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
      }}
    />
    ```
  </stack_router>

  <tabs_router>
    **Tab Navigation:**
    - Only files **registered in `src/app/(tabs)/_layout.tsx`** become actual tabs
    - Unregistered files in `(tabs)/` are routes **within** tabs, not separate tabs
    - Nested stacks create **double headers** — remove header from tabs, add stack inside each tab
    - **At least 2 tabs** or don't use tabs at all (single tab looks bad)

    **Example Tab Registration:**
    ```tsx
    // src/app/(tabs)/_layout.tsx
    <Tabs>
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="inbox" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
    ```
  </tabs_router>

  <router_selection>
    **When to Use What:**
    - **Games/Full-Screen Experiences:** Avoid tabs — use full-screen stacks
    - **Modals/Overlays:** Create route in `src/app/` (not `src/app/(tabs)/`),
      then add to root layout:
      ```tsx
      <Stack.Screen
        name="leave-review"
        options={{ presentation: "modal" }}
      />
      ```
  </router_selection>

  <rules>
    **Routing Rules:**
    1. Only **ONE route can map to "/"** — can't have both:
       - `src/app/index.tsx`
       - `src/app/(tabs)/index.tsx`

    2. **Dynamic params:** Use `useLocalSearchParams()` from expo-router
       ```tsx
       import { useLocalSearchParams } from 'expo-router';

       function ChatScreen() {
         const { matchId } = useLocalSearchParams();
         // ...
       }
       ```
  </rules>
</routing>

---

## 🗄️ State Management

<state>
  **Server/Async State: React Query**
  - Version: @tanstack/react-query 5.90.2
  - Always use **object API**: `useQuery({ queryKey, queryFn })`
  - **Provider Setup:** React Query provider must be outermost; nest other providers inside it
  - Never wrap `RootLayoutNav` directly

  ```tsx
  // ✅ Correct
  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
  });

  // ❌ Wrong
  const { data, isLoading } = useQuery(['matches'], fetchMatches);
  ```

  **Mutations:**
  Use `useMutation` for async operations — **no manual `setIsLoading` patterns**
  ```tsx
  const likeProfile = useMutation({
    mutationFn: (userId: string) => supabase.from('likes').insert({ user_id: userId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });
  ```

  **Best Practices:**
  - Wrap third-party lib calls (RevenueCat, etc.) in useQuery/useMutation
  - **Reuse query keys** across components to share cached data
  - Don't create duplicate providers

  ---

  **Local State: Zustand**
  - Version: ^5.0.9
  - Location: `src/lib/state/dating-store.ts`
  - **Always use selectors** to subscribe to specific slices

  ```tsx
  // ✅ Correct - subscribe to specific slice
  const userName = useDatingStore(s => s.user.name);
  const setFilter = useDatingStore(s => s.setFilter);

  // ❌ Wrong - subscribes to entire store
  const store = useDatingStore();
  ```

  **Selector Rules:**
  - Return **primitives** from selectors (not objects)
  - **Don't execute methods** in selectors; select data/functions, compute outside

  ```tsx
  // ✅ Correct
  const count = useStore(s => s.count);
  const increment = useStore(s => s.increment);
  increment(); // Execute outside

  // ❌ Wrong
  const count = useStore(s => s.increment()); // Don't execute in selector
  ```

  ---

  **Persistence:**
  - Use **AsyncStorage** inside context hook providers
  - Only persist **necessary data**
  - **Split ephemeral from persisted state** to avoid hydration bugs
  - MMKV available for high-performance storage
</state>

---

## 🎨 Styling & Design

<styling>
  **Framework:** NativeWind ~4.1.23 + Tailwind CSS 3.4.17

  **Use `cn()` Helper:**
  Merge classNames when conditionally applying styles or passing via props
  ```tsx
  import { cn } from '@/lib/cn';

  <View className={cn(
    'p-4 rounded-lg',
    isActive && 'bg-purple-500',
    className // From props
  )} />
  ```

  **Components That DON'T Support className:**
  These require inline `style` prop:
  - `CameraView` (from expo-camera)
  - `LinearGradient`
  - `Animated` components from react-native-reanimated

  ```tsx
  // ✅ Correct
  <LinearGradient style={{ flex: 1 }} colors={['#1a1a2e', '#16213e']} />

  // ❌ Wrong
  <LinearGradient className="flex-1" colors={['#1a1a2e', '#16213e']} />
  ```

  **Horizontal ScrollViews:**
  Will expand vertically to fill flex containers. Add `style={{ flexGrow: 0 }}` to constrain height.
  ```tsx
  <ScrollView
    horizontal
    style={{ flexGrow: 0 }}
    className="py-4"
  >
    {/* Content */}
  </ScrollView>
  ```
</styling>

<design>
  **Design Philosophy:**
  Don't hold back. This is **mobile-first** — design for touch, thumb zones, glanceability.

  **Inspiration:**
  iOS HIG, Instagram, Airbnb, Coinbase, polished habit trackers, dating apps (Hinge, Feeld)

  <avoid>
    ❌ Purple gradients on white backgrounds
    ❌ Generic centered layouts
    ❌ Predictable/template-like patterns
    ❌ Web-like designs on mobile
    ❌ Overused fonts (Space Grotesk, Inter)
  </avoid>

  <do>
    ✅ **Cohesive themes** with dominant colors and sharp accents
    ✅ **High-impact animations:** Progress bars, button feedback, haptics
    ✅ **Depth via gradients and patterns** (not flat solids)
    ✅ **Dark theme default** with purple/pink accents for dating app vibe
    ✅ **Custom fonts:** Install `@expo-google-fonts/{font-name}` (e.g., `@expo-google-fonts/poppins`)
    ✅ **Native context menus:** Use zeego for dropdowns (zeego.dev docs)
    ✅ **Performant lists:** Use @shopify/flash-list for long lists
  </do>

  **Color Palette (from tailwind.config.js):**
  - Primary: Purple/Pink gradients
  - Background: Dark (#1a1a2e, #16213e)
  - Accents: Pink (#e94560), Purple (#9d4edd)

  **Typography:**
  Custom font sizes in tailwind.config.js: xs (10px) → 9xl (80px)
</design>

---

## 🛡️ SafeAreaView Usage

<safearea>
  **Import:** Always from `react-native-safe-area-context`, **NOT** `react-native`

  ```tsx
  // ✅ Correct
  import { SafeAreaView } from 'react-native-safe-area-context';

  // ❌ Wrong
  import { SafeAreaView } from 'react-native';
  ```

  **When to Skip SafeAreaView:**
  - Inside tab stacks **with navigation headers**
  - When using **native headers** from Stack/Tab navigator

  **When to Add SafeAreaView:**
  - When using **custom/hidden headers**
  - Full-screen experiences without native headers

  **For Games:**
  Use `useSafeAreaInsets()` hook instead of SafeAreaView
  ```tsx
  import { useSafeAreaInsets } from 'react-native-safe-area-context';

  const insets = useSafeAreaInsets();
  <View style={{ paddingTop: insets.top }}>
  ```
</safearea>

---

## ⚠️ Common Mistakes & Solutions

<mistakes>
  <camera>
    **Use CameraView from expo-camera** (NOT deprecated Camera)
    ```tsx
    // ✅ Correct
    import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

    <CameraView style={{ flex: 1 }} facing="back">
      {/* Overlay UI must be absolute positioned */}
      <View style={{ position: 'absolute', bottom: 20 }}>
        <Button />
      </View>
    </CameraView>

    // ❌ Wrong
    import { Camera } from 'expo-camera'; // Deprecated
    ```
  </camera>

  <react_native>
    **No Node.js buffer in React Native**
    Don't import from 'buffer' — React Native doesn't support Node.js APIs
  </react_native>

  <ux>
    **UX Best Practices:**
    - Use **Pressable** over TouchableOpacity
    - Use **custom modals**, not Alert.alert()
    - **Keyboard handling:** Use react-native-keyboard-controller package
      (lookup docs before implementing — it's tricky)
  </ux>

  <outdated_knowledge>
    **Your training data may be outdated for:**
    - react-native-reanimated (now v3.17.4)
    - react-native-gesture-handler (now ~2.24.0)

    **Always lookup current docs** before implementing animations/gestures
  </outdated_knowledge>
</mistakes>

---

## 🔐 Backend & Security

<backend>
  **Supabase Integration:**
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication (email/password, OAuth)
  - Storage (private bucket with signed URLs)
  - Realtime (live messaging)

  **Environment Variables (.env):**
  ```env
  EXPO_PUBLIC_SUPABASE_URL=https://nccvxovjkemlbpbojony.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
  ```

  **Security Best Practices:**
  1. **UUID IDs:** All IDs are UUID v4 (prevents IDOR attacks)
  2. **RLS Enabled:** All tables have Row Level Security
  3. **Photo Processing:**
     - EXIF stripping (remove metadata)
     - Geolocation removal
     - Image re-encoding
     - Signed URLs (5-minute expiry)
  4. **Private Storage Bucket:** All photos require authentication

  **Database Schema Location:**
  `src/lib/supabase/schema.sql`

  **Key Tables:**
  - `users` - User accounts
  - `profiles` - User profiles (1-to-1 with users)
  - `photos` - User photos
  - `likes` - Like interactions
  - `matches` - Mutual likes
  - `messages` - Direct messages
  - `group_messages` - Group chat messages
  - `partner_links` - Polycule connections
  - `trust_scores` - Trust system data
  - `reviews` - Date reviews
  - `vouches` - User vouches
  - `events` - ENM meetups/events
</backend>

<security>
  **Dating App-Specific Security:**

  1. **User Privacy:**
     - No real names required
     - Optional location sharing
     - Block/report functionality
     - Photo privacy controls

  2. **Content Moderation:**
     - Report abuse mechanism
     - Community guidelines enforcement
     - Trust score impacts visibility

  3. **Data Protection:**
     - Minimal data collection
     - GDPR compliance (data export/deletion)
     - Encrypted storage for sensitive data

  4. **Safety Features:**
     - STI disclosure tracking
     - Consent checklist
     - Safety tips in Education Hub
     - Emergency contact sharing (future)
</security>

---

## 🎮 Key Features Documentation

<features>
  ### 1. Trust Score System

  **5 Tiers:**
  - Newcomer (0-24 points)
  - Member (25-49 points)
  - Trusted (50-74 points)
  - Verified (75-89 points)
  - Ambassador (90-100 points)

  **6 Dimensions:**
  - Behavior (reviews, reports)
  - Community (vouches, engagement)
  - Reliability (response rate, show-up rate)
  - Safety (STI disclosure, consent clarity)
  - Engagement (app usage, event participation)
  - Transparency (profile completeness, partner links)

  **12+ Earned Badges:**
  - Verified Profile, Event Host, Respected Educator, etc.

  ---

  ### 2. Polycule Map

  **13 Relationship Structures:**
  - Vee, Triad, Quad, Chain, Parallel, Kitchen Table, Star, etc.

  **Node Types:**
  - Partners (primary, secondary, casual)
  - Metamours (partner's partners)

  **Visualization:**
  - Interactive graph using @shopify/react-native-skia
  - Color-coded by relationship type
  - Tap nodes for details

  ---

  ### 3. Relationship Agreements

  **8 Categories:**
  - Communication, Boundaries, Intimacy, Time, Safety, Disclosure, Veto, Custom

  **Pre-built Templates:**
  - Basic ENM
  - Swinger Couple
  - Polyamory

  **Builder UI:**
  - Add/edit rules
  - Share with partners
  - Version history

  ---

  ### 4. Consent Checklist

  **26 Activities:**
  Organized into 6 categories:
  - Touch (hugging, kissing, etc.)
  - Intimacy (sexual activities)
  - Communication (texting, calling)
  - Photos (sharing, posting)
  - Social (meeting friends, public dates)
  - Kink (specific practices)

  **4-Level Consent:**
  - Yes (enthusiastic consent)
  - Maybe (discuss first)
  - Discuss (needs conversation)
  - No (hard boundary)

  ---

  ### 5. Interactive Group Games

  **Truth or Dare:**
  - 3 difficulty tiers: Warm-up, Spicy, Bold
  - 60+ questions, 60+ dares
  - Timer: 90 seconds

  **Hot Seat:**
  - 5-minute rotations
  - Group asks one person questions
  - Skip button (max 3 skips)

  **Story Chain:**
  - Collaborative storytelling
  - 2-sentence contributions
  - AI prompt suggestions

  **Usage:**
  Launch from group chat via GameLauncher component

  ---

  ### 6. AI Smart Matching

  **Compatibility Scoring:**
  - Multi-dimensional algorithm (0-100 score)
  - Factors: Relationship style, kinks, values, communication, demographics

  **Taste Profiling:**
  - Learns from swipe behavior
  - Analyzes messaging patterns
  - Refines recommendations over time

  **Match Insights:**
  - "Why you match" explanations
  - Shared interests highlights
  - Conversation starters
</features>

---

## 📚 Data & Mock Data

<data>
  **Mock Data Files:**
  - `src/lib/mock-data.ts` - User profiles, matches, messages
  - `src/lib/mock-events.ts` - Event listings
  - `src/lib/game-content.ts` - Game questions/challenges

  **When to Use Mock Data:**
  - During development when Supabase features aren't implemented
  - For UI/UX testing
  - For demos

  **When to Use Real Data:**
  - **Always for image analysis** (send to actual LLM, don't mock)
  - When Supabase backend is available
  - For production builds

  **Creating Realistic Mock Data:**
  - Use diverse names, ages, locations
  - Vary relationship styles (poly, ENM, swinger, etc.)
  - Include edge cases (no photos, incomplete profiles)
</data>

---

## 📱 App Store & Submission

<appstore>
  **App Store Submission:**
  Use Expo Application Services (EAS) for building and submitting:

  ```bash
  # Configure EAS
  eas build:configure

  # Build for iOS
  eas build --platform ios

  # Build for Android
  eas build --platform android

  # Submit to stores
  eas submit --platform ios
  eas submit --platform android
  ```

  **Resources:**
  - [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
  - [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
  - [Google Play Guidelines](https://play.google.com/about/developer-content-policy/)
</appstore>

---

## 🧰 Available Skills

<skills>
  You have access to skills in the `.claude/skills` folder:

  - **ai-apis-like-chatgpt:** Use when the user asks for AI API integration
  - **expo-docs:** Use when you need Expo SDK module documentation
  - **frontend-app-design:** Use when designing UI components or screens

  **How to Use:**
  Invoke skills proactively when they're relevant to the task.
</skills>

---

## 🔧 Development Workflows

<workflows>
  **Package Manager: Bun**
  ```bash
  # Install dependencies
  bun install

  # Start dev server
  bun start

  # Type checking
  bun typecheck

  # Linting
  bun lint
  ```

  **Hot Reload:**
  - Code changes trigger automatic reload
  - Check `expo.log` for errors

  **Debugging:**
  1. Check Metro bundler terminal output
  2. View React Native debugger logs
  3. Add console.log statements (visible in terminal)
  4. Use React DevTools for component inspection
  5. Use Expo DevTools for network/performance monitoring

  **Environment Variables:**
  - Edit `.env` file directly (not checked into git)
  - Use `.env.example` as template for required variables
  - Prefix with `EXPO_PUBLIC_` for client-side access
</workflows>

---

## 📖 Additional Documentation

<docs>
  - **README.md** - Comprehensive feature documentation (25KB)
  - **PLAN.md** - Implementation plan for interactive games
  - **SECURITY.md** - Security implementation guide
  - **AGENTS.md** - Agent instructions reference
  - **changelog.txt** - Change history
</docs>

---

## 🎯 Quick Command Reference

```bash
# Start development
bun start

# Type checking
bun typecheck

# Linting
bun lint

# Check logs
cat expo.log
```

---

## 💡 Key Principles

1. **Mobile-First:** Design for touch, thumb zones, glanceability
2. **Privacy-First:** User safety and data protection are paramount
3. **ENM-Aware:** Respect diverse relationship styles and configurations
4. **TypeScript Strict:** All types must be explicit
5. **Standard Workflow:** Use standard Expo development practices
6. **User-Friendly:** Write clean, maintainable code
7. **Best Practices:** Follow React Native and Expo conventions
8. **Performance:** Use FlashList, optimize re-renders, lazy load
9. **Accessibility:** Support screen readers, high contrast, large text
10. **Security:** RLS, UUIDs, signed URLs, EXIF stripping

---

## 🚀 Getting Started Checklist

When starting a new task:

- [ ] Read the user's request carefully
- [ ] Check if mock data or real Supabase integration is needed
- [ ] Determine which routes/components need to be created/modified
- [ ] Review existing types in `src/lib/types.ts`
- [ ] Check for existing components in `src/components/`
- [ ] Use TypeScript strict mode (explicit types)
- [ ] Test in Expo Go or custom dev client
- [ ] Check Metro bundler output for errors
- [ ] Verify changes work on both iOS and Android
- [ ] Scope down if request is too broad

---

**Remember:** You're building a dating app for ENM individuals. Respect privacy, prioritize safety, and create delightful mobile-first experiences. 💜
