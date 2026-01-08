
# State Machine Selection - Research Q&A

AI: To recommend state machine libraries that support rewind, replay, and forking, I need a few details:

## Technical Context

### Platform & runtime

#### Q: Browser, Node.js, or both?

The short answer would be "both". Most of the runtime is expected to occur on the server side in node.js, but I need to keep the opportunity to eventually run the game engine completelly in the browser for "single player" versions that would not use server resources.

The need to run on the server is implicit because of the multi-player characteristics of the game and the fact that the client will be as thin and as dumb as possible. The client will be a 100% presentation and io, and a slave to the server and game logic layer that will control everyting.

The only magin left to the client is for cosmetics, smooth animations and device specificity. This means that there should be no need to "synchronise and resolve" any actions by the client that would be of consequence to the game state common to all players.

#### Q: Any specific engine/framework (e.g., Phaser, Three.js, custom)?

At the moment the client is expected to be built with PixiJS.

### State complexity

#### Q: How large/complex is the game state? (e.g., simple flags vs. large object graphs)

Large object graphs, collections and arrays.

#### Q: How many state updates per second?

The rate will vary, but the main many game loop could be synched at 250ms and have up to 8 players connected to the same in memory game instance.

#### Q: Is the state mostly deterministic, or does it include randomness?

No randomness. The game engine is deterministic. Any need for randomness will use seeds that are persisted along with the game instance.

### Replay/rewind requirements

#### Q: How far back do you need to rewind? (seconds, minutes, entire level?)

Entire level, which could have a time limit to help managing memory requirements. 10 to 15 minutes could be a possible limit.

It could also be possible to record a complete replay of a main timeline, and allow multiple timelines to fork for shorter amount of time to respect memory constraints.

#### Q: Do you need to fork at any point, or only at specific checkpoints?

Forking a timeline could be done for multiple reasons:

- Player rewinds after messing up and want to try another approach.
- Another player want to show another player an alternate way to do things.
- Triggered by in-game actions or events.
- Could even be a game mechanic; Meaning that you must create specific superpositions of game states to solve a puzzle.
- During automated Q/A.

#### Q: Should forks share memory or be fully independent?

Some scenarios, such as using forks as a game mechanic or as a undo/redo approach would require the complete graph to be available in-memory.

Others could have the state offloaded elsewhere.

### Performance constraints

#### Q: Real-time gameplay, or can replay be slower?

Both. It could be synced in real-time, and played side-by-side or instead rewound by the user like a video timeline to pick a new resume location. 

#### Q: Memory limits (especially for long replays)?

No specific limits at the moment. But it would be expected to have a hard limit implemented and be part of the game.

#### Q: Do you need to serialize/deserialize state for persistence?

### Integration preferences

#### Q: TypeScript support required?

Yes, the game will be coded mostly in Typescript

#### Q: Prefer a library that handles state management, or one that works with your existing state?

The deterministic and replayable state management is central to the game engine and the architecture. This library could be a central piece.

#### Q: Do you need visual debugging/tools?

Ideally yes. But it should not be a disqualifying caracteristic.

### Multiplayer/network

#### Q: Single-player only, or multiplayer with replay?

Initially in single player, but eventually Multiplayer. As stated earlier, the clients will only provide I/O and will not, by themselves, generate state changes that need sync.

#### Q: Do you need to sync replays across clients?

Yes, as a matter of principle, the thin client can replay a game played on another client.

### Current architecture

#### Q: What state management are you using now (if any)?

None at the moment. This library selection is among the first to be made.

#### Q: Is this for outside-core, outside-client, or outside-server?

Mostly outside-core, but with outside-client reading the state changes to display them.

One advantage of having a predictive state-machine would be the ability to send only state changes between server and client and thus making the game more responsive.

---

## Response: Candidate Libraries & Approaches

### 1. Event Sourcing + Custom State Machine

Approach: Store events/actions, replay to rebuild state

Libraries to consider:

- EventStore (Node.js) or custom event log
- Immer (for immutable updates)
- Custom state machine on top

Pros:

- Natural fit for replay/rewind
- Deterministic by design
- Efficient forking (replay from any point)
- Easy to serialize/deserialize
- Only send events over network

Cons:

- Need to build state machine layer
- Replay cost for large histories
- Memory for event storage

Best for: Core architecture, deterministic replay

### 2. MobX-State-Tree (MST)

Library: mobx-state-tree

Pros:

- Built-in snapshots and time-travel
- TypeScript-first
- Works in Node.js and browser
- Patches for efficient updates
- Can serialize/deserialize
- Visual debugging tools available

Cons:

- Opinionated architecture
- Learning curve
- May need custom forking logic
- Not a pure state machine (reactive)

Best for: If you want snapshots + time-travel out of the box

3. XState + Custom Time-Travel

Library: xstate

Pros:

- Strong state machine features
- TypeScript support
- History states (limited)
- Visual tools (XState Inspector)
- Works everywhere

Cons:

- No built-in time-travel
- Need custom implementation for replay/forking
- May be heavy for game state
- Best for: If you need a formal state machine with custom time-travel

## 4. Immer + Custom State Machine

Libraries: immer + custom implementation

Pros:

- Immutable updates
- Simple API
- TypeScript support
- Small bundle
- Easy to add snapshots/patches

Cons:

- Need to build state machine and time-travel
- No built-in replay
- Manual snapshot management
- Best for: Lightweight base with full control

## 5. Redux + Redux Time Travel

Libraries: redux + redux-time-travel or custom middleware

Pros:

- Time-travel patterns exist
- Large ecosystem
- DevTools
- TypeScript support

Cons:

- Verbose for game state
- May need custom forking
- Not optimized for large object graphs

Best for: If you prefer Redux patterns

## 6. Custom Event Sourcing with Immutable.js

Libraries: immutable + custom event sourcing

Pros:

- Efficient immutable structures
- Structural sharing (memory efficient)
- Deterministic
- Full control

Cons:

- Steeper learning curve
- More boilerplate
- Need to build everything

Best for: Maximum performance and control

## Recommendation

Given your requirements, I recommend a hybrid approach:

- Primary recommendation: Event Sourcing + Immer
- Event Store: Custom event log (simple array or database)
- State Machine: Custom deterministic state machine
- State Updates: Immer for immutable updates
- Forking: Replay events from any point

Why this fits:

- Deterministic by design
- Natural replay/rewind
- Efficient forking (replay from checkpoint)
- Only events need to be sent over network
- Works in Node.js and browser
- TypeScript-friendly
- Can optimize with snapshots for long histories

### Alternative: MobX-State-Tree

If you want more built-in features:

- Snapshots out of the box
- Time-travel support
- Patches for efficient updates
- Good TypeScript support
- Active community

---

### Next Steps

- Create a proof-of-concept with Event Sourcing + Immer
- Evaluate MobX-State-Tree for built-in features
- Compare performance with your expected state size
- Test forking scenarios


---

## Follow-up questions

Q: You list this as a con: "Not a pure state machine (reactive)". What would disqualify it as a pure state machine and Why is it a down side?



