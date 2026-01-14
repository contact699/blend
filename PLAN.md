# Interactive Games for Group Chat - Implementation Plan

## Overview
Add interactive games to the group chat feature in Blend. Due to the scope, this will be implemented in phases.

## Phase 1: Core Infrastructure (This Session)

### 1.1 Game Types & State Management
Create new types in `src/lib/types.ts`:
- `GameSession` - tracks active game in a thread
- `GameMove` - individual game actions
- `GameType` - enum of available games
- `GameState` - current state of each game

### 1.2 Game Store Extension
Add to `dating-store.ts`:
- `activeGames: GameSession[]`
- `startGame(threadId, gameType, config)`
- `submitGameMove(gameId, move)`
- `endGame(gameId)`
- `skipTurn(gameId)`

### 1.3 Game Launcher Component
Create `src/components/games/GameLauncher.tsx`:
- Modal overlay to select and start games
- Shows available games based on group composition
- Configures game settings (difficulty, rounds)

### 1.4 Game Message Type
Add `'game'` to message types to display game events in chat

## Phase 2: Games to Implement (Prioritized)

### Priority 1: Truth or Dare (Most Value)
File: `src/components/games/TruthOrDare.tsx`
- Three difficulty tiers with curated challenges
- Timer system for challenges
- Accept/Skip/Complete flow
- Works for couples + singles

### Priority 2: Hot Seat
File: `src/components/games/HotSeat.tsx`
- 5-minute rotation timer
- Question queue system
- 30-second answer timer
- Works for any group size

### Priority 3: Story Chain
File: `src/components/games/StoryChain.tsx`
- Collaborative storytelling
- Turn-based sentence adding
- 3-minute timer per turn
- Voting system for redos

### Priority 4: Mystery Date Planner
File: `src/components/games/MysteryDatePlanner.tsx`
- Poll-style interface
- Anonymous voting
- Category suggestions
- Date reveal animation

### Priority 5: Compatibility Triangle
File: `src/components/games/CompatibilityTriangle.tsx`
- 10-question quiz
- Visual Venn diagram
- Percentage matching
- Triad-specific

### Priority 6: Group Challenge
File: `src/components/games/GroupChallenge.tsx`
- Task list with checkboxes
- Progress tracking
- Collaborative completion

## Phase 3: UI Integration

### 3.1 Chat Toolbar Addition
Add game button (🎮) to group chat input toolbar in `[threadId].tsx`

### 3.2 Game Overlay System
Create `src/components/games/GameOverlay.tsx`:
- Full-screen modal when game is active
- Shows current game state
- Participant indicators
- Timer displays

### 3.3 Game Message Bubbles
Create `src/components/games/GameMessage.tsx`:
- Special message rendering for game events
- "Game started", "Turn completed", etc.

## Implementation Order (This Session)

1. **Game types and interfaces** (types.ts)
2. **Store extension** (dating-store.ts)
3. **GameLauncher component** (select game)
4. **GameOverlay wrapper** (displays active game)
5. **Truth or Dare game** (first complete game)
6. **Hot Seat game** (second game)
7. **Story Chain game** (third game)
8. **Integration in group-chat** (toolbar button)

## File Structure

```
src/
├── components/
│   └── games/
│       ├── GameLauncher.tsx      # Game selection modal
│       ├── GameOverlay.tsx       # Active game container
│       ├── GameMessage.tsx       # Game event in chat
│       ├── GameTimer.tsx         # Reusable timer
│       ├── TruthOrDare.tsx       # Game 1
│       ├── HotSeat.tsx           # Game 2
│       ├── StoryChain.tsx        # Game 3
│       ├── MysteryDatePlanner.tsx # Game 4
│       ├── CompatibilityTriangle.tsx # Game 5
│       └── GroupChallenge.tsx    # Game 6
├── lib/
│   ├── types.ts                  # +Game types
│   ├── state/
│   │   └── dating-store.ts       # +Game state
│   └── game-content.ts           # Questions/challenges content
└── app/
    └── group-chat/
        └── [threadId].tsx        # +Game launcher button
```

## Safety Features
- Skip option for all challenges
- Report inappropriate content option
- No persistent storage of sensitive game answers
- Moderation-friendly content

## Technical Notes
- Real-time: Using existing polling (5s), acceptable for turn-based games
- State: Local Zustand for game sessions
- Animations: Reanimated for game transitions
- No new package dependencies required
