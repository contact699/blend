# Games Migration to Supabase - Status & Next Steps

## ✅ Completed

### Phase 1: Database Schema & Types
- ✅ Added `game_sessions` table to schema.sql with RLS policies
- ✅ Added `game_moves` table to schema.sql with RLS policies
- ✅ Added `custom_game_content` table to schema.sql with RLS policies
- ✅ Created database types in `src/lib/supabase/types.ts`
- ✅ Added game-specific config types (TruthOrDareConfig, HotSeatConfig, StoryChainConfig)

### Phase 2: React Query Hooks
- ✅ Created `useActiveGameSession(threadId)` - Get active game for a thread
- ✅ Created `useGameSession(gameSessionId)` - Get specific game session
- ✅ Created `useStartGame()` - Start a new game session
- ✅ Created `useEndGame()` - End a game (completed/cancelled)
- ✅ Created `usePauseGame()` - Pause an active game
- ✅ Created `useResumeGame()` - Resume a paused game
- ✅ Created `useGameMoves(gameSessionId)` - Get all moves for a game
- ✅ Created `useSubmitMove()` - Submit a game move
- ✅ Created `useAdvanceTurn()` - Move to next player's turn
- ✅ Created `useUpdateGameState()` - Update game state
- ✅ Created `useMyCustomContent(gameType)` - Get user's custom content
- ✅ Created `useCustomContent(gameType)` - Get approved custom content
- ✅ Created `useCreateCustomContent()` - Add custom content
- ✅ Created `useDeleteCustomContent()` - Remove custom content
- ✅ Created `useGameSessionSubscription()` - Real-time subscription hook

### Phase 3: Component Updates
- ✅ Updated `GameLauncher.tsx` to use Supabase hooks
  - Now uses `useStartGame()` mutation
  - Creates game sessions in database
  - Shows loading states during creation
- ✅ Updated `group-chat/[threadId].tsx` to use Supabase
  - Uses `useActiveGameSession()` to get active game
  - Passes `threadId` to GameLauncher
  - Removed dependency on local Zustand store for games
- ✅ Updated `GameOverlay.tsx` to use Supabase
  - Uses `useEndGame()` mutation
  - Handles both DbGameSession and legacy GameSession types
- ✅ Updated `CustomContentManager.tsx` to use Supabase
  - Uses `useMyCustomContent()` for fetching
  - Uses `useCreateCustomContent()` for adding
  - Uses `useDeleteCustomContent()` for removing
  - Shows loading states and handles errors

## 🔄 Remaining Work

### Individual Game Components

The following game components still use the local Zustand store and legacy `GameSession` type. They need to be updated to work with Supabase:

#### 1. `TruthOrDare.tsx`
**Current state:**
- Uses `useDatingStore` for game state management
- Expects `GameSession` with `TruthOrDareState` in `state.data`
- Uses local store actions: `setDifficulty`, `drawChallenge`, `completeChallenge`, `skipChallenge`

**Required changes:**
- Convert to use `DbGameSession` from Supabase
- Replace local store actions with:
  - `useUpdateGameState()` - Update game state
  - `useSubmitMove()` - Record challenge completion/skip
  - `useAdvanceTurn()` - Move to next player
- Integrate `useGameSessionSubscription()` for real-time updates
- Store game state in `DbGameSession.game_state` field
- Use `useCustomContent('truth_or_dare')` for custom challenges

#### 2. `HotSeat.tsx`
**Current state:**
- Uses `useDatingStore` for game state management
- Expects `GameSession` with `HotSeatState` in `state.data`
- Uses local store actions for question management and timing

**Required changes:**
- Convert to use `DbGameSession` from Supabase
- Replace local store with Supabase hooks
- Implement timer management with database sync
- Use `useSubmitMove()` for question answers
- Use `useCustomContent('hot_seat')` for custom questions

#### 3. `StoryChain.tsx`
**Current state:**
- Uses `useDatingStore` for game state management
- Expects `GameSession` with `StoryChainState` in `state.data`
- Uses local store for story entries and voting

**Required changes:**
- Convert to use `DbGameSession` from Supabase
- Replace local store with Supabase hooks
- Use `useSubmitMove()` for story additions and votes
- Sync story state across all participants in real-time

### Game State Structure

The game state needs to be adapted to the new structure:

**Old structure (local store):**
```typescript
interface GameSession {
  id: string;
  thread_id: string;
  game_type: GameType;
  status: GameStatus;
  participants: GameParticipant[];
  state: {
    type: 'truth_or_dare' | 'hot_seat' | 'story_chain';
    data: TruthOrDareState | HotSeatState | StoryChainState;
  };
  // ...
}
```

**New structure (Supabase):**
```typescript
interface DbGameSession {
  id: string;
  thread_id: string;
  game_type: GameType;
  status: GameStatus;
  current_turn_user_id: string | null;
  turn_order: string[]; // Array of profile IDs
  current_round: number;
  max_rounds: number | null;
  config: Record<string, unknown>; // Game configuration (difficulty, timers, etc.)
  game_state: Record<string, unknown>; // Current game state (changes during play)
  // ...
}
```

### Migration Strategy

For each game component:

1. **Update Props:**
   - Change `game: GameSession` to `game: DbGameSession`
   - Add subscription hook: `useGameSessionSubscription(game.id, handleUpdate)`

2. **Replace Store Actions:**
   - Map each Zustand action to appropriate Supabase hook
   - Use `useUpdateGameState()` for state changes
   - Use `useSubmitMove()` for player actions

3. **Adapt State Structure:**
   - Move game-specific config to `game.config`
   - Store current state in `game.game_state`
   - Use `turn_order` and `current_turn_user_id` for turn management

4. **Add Real-time Updates:**
   - Subscribe to game session changes
   - Update UI when other players make moves
   - Handle optimistic updates

5. **Integrate Custom Content:**
   - Use `useCustomContent(gameType)` to fetch custom content
   - Mix with default content from `game-content.ts`

## Testing Checklist

Once individual game components are updated:

- [ ] Test game creation from GameLauncher
- [ ] Test turn progression with multiple participants
- [ ] Test real-time synchronization (multiple devices)
- [ ] Test custom content creation and usage in games
- [ ] Test game ending (completed vs cancelled)
- [ ] Test pause/resume functionality
- [ ] Test RLS policies (can only see games for threads you're in)
- [ ] Test game history (moves are preserved)
- [ ] Verify performance with polling (5s intervals)
- [ ] Consider upgrading to Supabase Realtime channels for better performance

## Future Enhancements

- Implement the remaining games:
  - Mystery Date Planner
  - Compatibility Triangle
  - Group Challenge
- Add game statistics and leaderboards
- Add game replays (view past games)
- Improve real-time sync with Supabase Realtime channels
- Add game notifications
- Add moderation for custom content

## Notes

- Default game content from `game-content.ts` remains unchanged (static content)
- Custom content is now stored in Supabase `custom_game_content` table
- Game sessions use polling (5s intervals) for now - can upgrade to Realtime later
- RLS policies ensure thread participants can only access their own games
- Profile IDs are used in `turn_order` instead of user IDs for consistency
