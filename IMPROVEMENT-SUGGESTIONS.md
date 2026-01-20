# Blend App - Improvement Suggestions

Based on a comprehensive audit of your codebase, here are specific, actionable suggestions organized by priority and category.

---

## 🔴 HIGH PRIORITY (Do First)

### 1. **Add Error Boundaries to Key Screens**
**Current State:** Error boundaries exist in Sentry setup but aren't implemented in screens
**Problem:** App crashes propagate to entire app instead of isolated screens
**Solution:**
```tsx
// Wrap each major screen/tab
import { ErrorBoundary } from '@/lib/sentry';

export default function DiscoverScreen() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {/* Your screen content */}
    </ErrorBoundary>
  );
}

// Create fallback component
function ErrorFallback() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white">Something went wrong</Text>
      <Pressable onPress={() => router.back()}>
        <Text className="text-purple-500">Go Back</Text>
      </Pressable>
    </View>
  );
}
```

**Impact:** Prevents full app crashes, better user experience
**Effort:** 2-3 hours

---

### 2. **Split Large Zustand Store**
**Current State:** `dating-store.ts` is 2,622 lines (!)
**Problem:**
- Hard to maintain
- Slows down imports
- Causes unnecessary re-renders
- Difficult for multiple developers

**Solution:** Split into domain-specific stores:
```
src/lib/state/
├── auth-store.ts          # User auth & session
├── profile-store.ts       # Profile preferences
├── matching-store.ts      # Swipe queue, filters
├── messaging-store.ts     # Draft messages, typing
├── events-store.ts        # Event filters, RSVPs
├── games-store.ts         # Game state
└── ui-store.ts            # UI state (modals, tabs)
```

**Benefits:**
- Faster imports
- Better performance
- Easier to maintain
- Can load stores on-demand

**Impact:** Major performance improvement, better DX
**Effort:** 4-6 hours

---

### 3. **Add Accessibility Labels**
**Current State:** 0 accessibility labels found
**Problem:** App is unusable for visually impaired users
**Solution:**
```tsx
// Add to all interactive elements
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Like profile"
  accessibilityHint="Double tap to like this person"
>
  <Heart size={24} color="red" />
</Pressable>

<Image
  source={photo}
  accessibilityLabel={`Photo of ${name}`}
/>

<TextInput
  accessibilityLabel="Message input"
  accessibilityHint="Type your message here"
/>
```

**Why This Matters:**
- Required for App Store approval
- Legal requirement (ADA compliance)
- Expands your user base
- Shows inclusive values (important for ENM community)

**Impact:** Legal compliance, inclusive design
**Effort:** 6-8 hours (add to all screens)

---

### 4. **Implement Logging Strategy**
**Current State:** 155 console.log statements scattered throughout
**Problem:**
- Hard to filter in production
- No log levels
- Can't disable in production
- No structured logging

**Solution:** Create logging utility:
```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private enabled = __DEV__;

  debug(message: string, data?: any) {
    if (!this.enabled) return;
    console.log(`[DEBUG] ${message}`, data);
  }

  info(message: string, data?: any) {
    console.log(`[INFO] ${message}`, data);
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data);
  }

  error(message: string, error?: Error, context?: any) {
    console.error(`[ERROR] ${message}`, error, context);
    // Send to Sentry in production
    if (!__DEV__) {
      captureException(error, { message, ...context });
    }
  }
}

export const logger = new Logger();

// Usage
logger.debug('User swiped right', { userId, profileId });
logger.error('Failed to load matches', error, { userId });
```

**Benefits:**
- Structured logs
- Can filter by level
- Auto-send errors to Sentry
- Easy to disable in production

**Impact:** Better debugging, cleaner logs
**Effort:** 3-4 hours

---

## 🟡 MEDIUM PRIORITY (Do Soon)

### 5. **Add Analytics Tracking**
**Current State:** No analytics implementation
**Problem:** Can't measure:
- User engagement
- Feature usage
- Conversion funnels
- Drop-off points

**Solution:** Add Mixpanel or PostHog:
```typescript
// src/lib/analytics.ts
import mixpanel from 'mixpanel-react-native';

export const analytics = {
  init() {
    mixpanel.init('YOUR_TOKEN');
  },

  identify(userId: string, traits: Record<string, any>) {
    mixpanel.identify(userId);
    mixpanel.getPeople().set(traits);
  },

  track(event: string, properties?: Record<string, any>) {
    mixpanel.track(event, properties);
  },

  // Predefined events
  profileViewed(profileId: string) {
    this.track('Profile Viewed', { profileId });
  },

  swipeAction(action: 'like' | 'pass', profileId: string) {
    this.track('Swipe Action', { action, profileId });
  },

  matchCreated(matchId: string, otherUserId: string) {
    this.track('Match Created', { matchId, otherUserId });
  },

  messageSent(threadId: string, messageType: 'text' | 'photo' | 'voice') {
    this.track('Message Sent', { threadId, messageType });
  },
};

// Usage in components
analytics.track('Screen Viewed', { screen: 'Discover' });
```

**Key Metrics to Track:**
- DAU/MAU (Daily/Monthly Active Users)
- Swipe rate
- Match rate
- Message response rate
- Retention (D1, D7, D30)
- Event attendance
- Feature adoption

**Impact:** Data-driven decisions, growth insights
**Effort:** 4-5 hours
**Cost:** $0-99/mo (PostHog free tier, Mixpanel paid)

---

### 6. **Add Unit Tests for Critical Logic**
**Current State:** Only 2 test files
**Problem:**
- No test coverage for hooks
- No tests for matching algorithm
- No tests for validation logic
- Hard to refactor confidently

**Solution:** Add tests for critical paths:
```typescript
// src/lib/matching/__tests__/compatibility-engine.test.ts
import { calculateCompatibilityScore } from '../compatibility-engine';

describe('Compatibility Engine', () => {
  it('should calculate high score for matching relationship styles', () => {
    const profile1 = {
      relationship_styles: ['polyamory', 'kitchen_table'],
      // ...
    };
    const profile2 = {
      relationship_styles: ['polyamory', 'parallel'],
      // ...
    };

    const score = calculateCompatibilityScore(profile1, profile2);
    expect(score).toBeGreaterThan(70);
  });

  it('should calculate low score for incompatible values', () => {
    // ...
  });
});

// src/lib/__tests__/validation.test.ts (already exists - expand it!)
// src/lib/supabase/__tests__/hooks.test.ts (add this)
// src/components/__tests__/PolyculeMap.test.ts (add this)
```

**Priority Tests:**
1. Validation schemas
2. Compatibility scoring
3. Photo upload/validation
4. Trust score calculation
5. Polycule structure detection

**Tools to Use:**
- Jest (already configured with Expo)
- React Native Testing Library
- Mock Service Worker (for API mocks)

**Impact:** Confidence in refactoring, fewer bugs
**Effort:** 10-15 hours (ongoing)

---

### 7. **Implement Optimistic Updates**
**Current State:** All mutations wait for server response
**Problem:** App feels slow, especially on poor connections
**Solution:**
```typescript
// Before (current)
const likeMutation = useMutation({
  mutationFn: async (profileId) => {
    await supabase.from('likes').insert({ to_user_id: profileId });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['matches']);
  },
});

// After (optimistic)
const likeMutation = useMutation({
  mutationFn: async (profileId) => {
    await supabase.from('likes').insert({ to_user_id: profileId });
  },
  onMutate: async (profileId) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(['matches']);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['matches']);

    // Optimistically update
    queryClient.setQueryData(['matches'], (old) => {
      return [...old, { id: 'temp', to_user_id: profileId }];
    });

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['matches'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['matches']);
  },
});
```

**Apply To:**
- Liking/passing profiles
- Sending messages
- Updating profile
- RSVP to events

**Impact:** App feels instant, better UX
**Effort:** 3-4 hours

---

### 8. **Add Image Optimization**
**Current State:** Images loaded at full resolution
**Problem:**
- Slow loading on cellular
- High bandwidth usage
- Poor performance on older devices

**Solution:**
```typescript
// Use Expo Image with blurhash
import { Image } from 'expo-image';

<Image
  source={{ uri: photo.signedUrl }}
  placeholder={{ blurhash: photo.blurhash }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  style={{ width: 300, height: 400 }}
/>

// Generate thumbnails in Supabase
// Add to photo upload function
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

async function createThumbnail(uri: string) {
  const thumbnail = await manipulateAsync(
    uri,
    [{ resize: { width: 400 } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  return thumbnail.uri;
}

// Store both full and thumbnail URLs
// Load thumbnail first, then full image
```

**Benefits:**
- 10x faster loading
- Less data usage
- Smooth image loading
- Better perceived performance

**Impact:** Major UX improvement
**Effort:** 4-5 hours

---

### 9. **Add Rate Limiting**
**Current State:** No client-side rate limiting
**Problem:**
- Users can spam actions
- Can abuse API
- Bad UX (multiple duplicate requests)

**Solution:**
```typescript
// src/lib/utils/rate-limit.ts
export function useRateLimitedAction(
  action: () => Promise<void>,
  cooldownMs: number = 1000
) {
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  const execute = useCallback(async () => {
    if (isOnCooldown) {
      Alert.alert('Too Fast', 'Please wait a moment');
      return;
    }

    setIsOnCooldown(true);
    await action();

    setTimeout(() => setIsOnCooldown(false), cooldownMs);
  }, [action, cooldownMs, isOnCooldown]);

  return { execute, isOnCooldown };
}

// Usage
const { execute: sendLike, isOnCooldown } = useRateLimitedAction(
  () => likeMutation.mutateAsync(profileId),
  2000 // 2 second cooldown
);
```

**Apply To:**
- Swipe actions (prevent double-swipe)
- Message sending
- Photo uploads
- Event creation

**Impact:** Prevents abuse, better UX
**Effort:** 2-3 hours

---

## 🟢 LOW PRIORITY (Nice to Have)

### 10. **Add In-App Feature Tutorials**
**Current State:** No onboarding for features
**Problem:** Users don't discover features like:
- Interactive games
- Polycule mapping
- Trust score system
- Consent checklist

**Solution:** Use `react-native-onboarding-swiper` or custom tooltips:
```typescript
import { useOnboarding } from '@/lib/hooks/useOnboarding';

function DiscoverScreen() {
  const { showTooltip, markComplete } = useOnboarding();

  useEffect(() => {
    if (!showTooltip('discover_swipe')) return;

    // Show tooltip overlay
    setTimeout(() => {
      markComplete('discover_swipe');
    }, 3000);
  }, []);

  return (
    <View>
      {/* Screen content */}
      {showTooltip('discover_swipe') && (
        <Tooltip text="Swipe right to like!" position="bottom" />
      )}
    </View>
  );
}
```

**Tutorials Needed:**
- First swipe
- First match
- How to start games in group chat
- How to link partners
- How to add STI test

**Impact:** Better feature discovery
**Effort:** 6-8 hours

---

### 11. **Add Dark/Light Mode Toggle**
**Current State:** Hardcoded dark mode
**Problem:** Some users prefer light mode
**Solution:**
```typescript
// Already using NativeWind - just add theme toggle
import { useColorScheme } from 'nativewind';

function Settings() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <Pressable
      onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
    >
      <Text>Theme: {colorScheme}</Text>
    </Pressable>
  );
}
```

**Impact:** User preference support
**Effort:** 4-5 hours (update all colors)

---

### 12. **Add Skeleton Loaders**
**Current State:** ActivityIndicators for loading
**Problem:** Feels generic, doesn't show structure
**Solution:**
```tsx
function ProfileCardSkeleton() {
  return (
    <View className="w-full h-96 bg-zinc-800 rounded-3xl">
      <View className="w-full h-3/4 bg-zinc-700 animate-pulse" />
      <View className="p-4">
        <View className="w-1/2 h-6 bg-zinc-700 rounded animate-pulse mb-2" />
        <View className="w-3/4 h-4 bg-zinc-700 rounded animate-pulse" />
      </View>
    </View>
  );
}
```

**Apply To:**
- Profile cards while loading
- Message list
- Events list
- Photos grid

**Impact:** Better perceived performance
**Effort:** 3-4 hours

---

### 13. **Add Offline Queue for Actions**
**Current State:** Actions fail when offline
**Problem:**
- Lost actions when connection drops
- Bad UX in poor signal areas
- Users have to retry manually

**Solution:** Use offline persistence:
```typescript
// Queue actions when offline
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class OfflineQueue {
  private queue: QueuedAction[] = [];

  async enqueue(action: QueuedAction) {
    this.queue.push(action);
    await this.save();
  }

  async processQueue() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    for (const action of this.queue) {
      try {
        await this.execute(action);
        this.queue = this.queue.filter(a => a.id !== action.id);
      } catch (error) {
        // Keep in queue, try again later
      }
    }

    await this.save();
  }

  private async save() {
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }
}

// Usage
if (!isConnected) {
  await offlineQueue.enqueue({
    type: 'like',
    profileId,
    timestamp: Date.now(),
  });
  Alert.alert('Queued', 'Will send when back online');
}
```

**Impact:** Works offline, no lost actions
**Effort:** 6-8 hours

---

### 14. **Add Haptic Feedback Throughout**
**Current State:** Minimal haptic feedback
**Problem:** Interactions feel flat
**Solution:**
```typescript
import * as Haptics from 'expo-haptics';

// On like
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// On match
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// On pass
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On error
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

// On long press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

**Add To:**
- Every swipe
- Every button press
- Match notifications
- Message sent
- Photo upload complete

**Impact:** More premium feel
**Effort:** 2-3 hours

---

### 15. **Add Deep Linking**
**Current State:** No deep link support
**Problem:** Can't link to specific profiles, events, matches from:
- Push notifications
- Share links
- External marketing

**Solution:**
```typescript
// app.json
{
  "expo": {
    "scheme": "blend",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            { "scheme": "https", "host": "blend.app" }
          ]
        }
      ]
    }
  }
}

// Handle links
import { useURL } from 'expo-linking';

function useLinkHandler() {
  const url = useURL();

  useEffect(() => {
    if (!url) return;

    // blend://profile/123
    // blend://event/456
    // blend://match/789

    const { hostname, path } = Linking.parse(url);

    if (hostname === 'profile') {
      router.push(`/profile/${path}`);
    } else if (hostname === 'event') {
      router.push(`/event/${path}`);
    }
  }, [url]);
}
```

**Use Cases:**
- Share profile links
- Share event invites
- Push notification → specific screen
- "View Profile" from email

**Impact:** Better sharing, better notifications
**Effort:** 4-5 hours

---

## 🎨 FEATURE SUGGESTIONS

### 16. **Add Voice Messages**
**Why:** More personal than text, important for ENM communication
**Implementation:** Use `expo-av` for recording
**Effort:** 8-10 hours

---

### 17. **Add Video Profiles**
**Why:** Shows personality better than photos
**Implementation:** 15-second intro videos
**Effort:** 12-15 hours

---

### 18. **Add "Date Ideas" Feature**
**Why:** Help users plan dates (especially polycules)
**Features:**
- Suggest activities based on preferences
- Budget filters
- Location-based suggestions
- Group activity ideas

**Effort:** 15-20 hours

---

### 19. **Add Relationship Milestones**
**Why:** Track polyamory journey
**Features:**
- First date logged
- Anniversary tracker
- Milestone photos
- Shareable with partner(s)

**Effort:** 10-12 hours

---

### 20. **Add "Ask the Community" Forum**
**Why:** ENM education and support
**Features:**
- Anonymous questions
- Community answers
- Upvoting
- Expert verified answers
- Categories (jealousy, communication, boundaries, etc.)

**Effort:** 20-25 hours

---

## 📊 SUMMARY BY EFFORT

### Quick Wins (< 4 hours)
1. Haptic feedback
2. Rate limiting
3. Logging utility
4. Skeleton loaders

### Medium Effort (4-8 hours)
5. Error boundaries
6. Image optimization
7. Accessibility labels
8. Split Zustand store
9. Offline queue

### Large Projects (8+ hours)
10. Analytics integration
11. Unit test coverage
12. Feature tutorials
13. Deep linking
14. New features (voice, video, etc.)

---

## 🎯 RECOMMENDED ROADMAP

### Phase 1 (Week 1) - Critical Fixes
- [ ] Error boundaries
- [ ] Logging utility
- [ ] Rate limiting
- [ ] Haptic feedback

### Phase 2 (Week 2) - Performance
- [ ] Split Zustand store
- [ ] Image optimization
- [ ] Optimistic updates
- [ ] Skeleton loaders

### Phase 3 (Week 3) - Polish
- [ ] Accessibility labels
- [ ] Analytics tracking
- [ ] Deep linking
- [ ] Feature tutorials

### Phase 4 (Week 4+) - Growth
- [ ] Unit tests
- [ ] Offline support
- [ ] Dark/light mode
- [ ] New features

---

## 💡 BONUS: PERFORMANCE MONITORING

Add performance tracking to see real metrics:

```typescript
// src/lib/performance.ts
import { startTransaction } from '@/lib/sentry';

export function measureScreenLoad(screenName: string) {
  const finish = startTransaction(`screen.${screenName}`, 'navigation');

  return {
    markReady: () => {
      finish();
    },
  };
}

// Usage in screens
function DiscoverScreen() {
  const { markReady } = measureScreenLoad('Discover');

  useEffect(() => {
    if (profiles && !isLoading) {
      markReady();
    }
  }, [profiles, isLoading]);
}
```

Track:
- Screen load times
- API response times
- Image load times
- Swipe gesture responsiveness

---

## 🔗 RESOURCES

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Performance](https://docs.expo.dev/guides/performance/)
- [Accessibility Guide](https://reactnative.dev/docs/accessibility)
- [Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Sentry Best Practices](https://docs.sentry.io/platforms/react-native/best-practices/)

---

**Questions or want help implementing any of these?** Let me know which priority you'd like to tackle first!
