# Support for PixelArt Visuals

## Motivation

To improve the development experience, prepare for level design features, the command architecture could be used to allow time travelling to rewind and fast-forward the game state.

## Solution

The command pattern allows for granual control of the game state by moving along the event history and changing the current game state accordingly.

Adding the typical controls found in video playback would offer intuitive ways to control time in the game.

## Inclusions

* New controls for:
  * Pause, Play, Rewind
  * Step Forward, Step Backward
  * GoTo End, GoTo Start
* Resume from here
* Move on the timeline without erasing the event history
* Add Global keystrokes for each commands
* Add buttons in the debug menu for Play/Pause.
* Add a Keystroke menu when pressing "?"

## Exclusions

* Nothing specific

## Implementation details & Review Questions

### 1. Timeline Scope & Performance

* Q: Should there be any limit to how far back the timeline can go? (e.g., last 1000 steps, unlimited?)
  * A: Add a configurable 10000 step limit. After which you can collapse each block of 480 log events into single change sets.

* Q: Performance: For long sessions with thousands of events, should we implement state snapshot caching (every N steps) to speed up rewind, or rely on event replay?
  * Q: Without worrying too much about performance, we will simply include in the event data, the original value being changed for each event. Thus moving backward can be done with local and proximal information.

* Q: What's the acceptable rewind time delay before it feels sluggish?
  * A: No benchmark targets yet

### 2. "Resume from Here" Behavior

* Q: When user navigates to a past step and takes an action, what happens to the future event history?
Option A: Truncate everything after current step (destructive branching)
Option B: Keep future history as an alternate branch (non-destructive)
Option C: Create a new parallel timeline

  * A: For now we will truncate the history. Having multiple timelines would create too much downstream work at the moment.

* Q: The pitch mentions "Move on the timeline without erasing the event history" - does this mean navigation doesn't delete history, but actions do?

  * A: This phrase means that as the user starts playing with time, the current state used to render the game will change as we process the event history backward, but this should not remove the events from the history. This also means that the system has a virtual "pointer in time".
  * Follow up: It would also be ideal if the "end state" expressed in the event history was kept in cache before starting the rewind. This would allow the game to very quickly snap back once the player stops rewinding or jogging with a UI.

### 3. UI/UX Details

* Q: Where should the timeline controls appear? Options:
Existing debug menu (add more buttons)

  * A: Keep the UI to a minimum for now, it will be adressed in a later pitch. Simply add a playback status in the debug info panel, and a thick green timeline bar with black opaque padding.

### 4. Keystroke Conflicts

* Q: Proposed shortcuts: Space (play/pause), [, ] (step), Home/End (jump), ← → (scrub)
Some conflict with existing bot movement arrows when bot is selected - should these work only when debug menu is open, or override movement controls?
Any preference for keystroke combinations (e.g., Shift+Space for play/pause)?

  * A: Use the option key on mac and the alt key on windows to enable advanced keystrokes without interfering with the browser shortcuts.
  * A: For stepping backward and forward step by step, use the up and down arrow keys.
  * A: For jumping at the beginning and end, use the home and end keys.
  * A: For scrub, use the left and right arrow keys.
  * A: For play/pause, use the space bar.

### 5. Network Synchronization

* Q: When host navigates timeline, should clients:
  1. See the same historical state immediately?
  2. Get a "rewinding..." notification?
  3. Continue autonomously and sync when host resumes?

  * A: Clients should be force to follow the host's timeline using their own stored history. The host will be the only one to control the timeline and can send where his "time pointer" is at any given time.
  * A: The client's viewport should have a faint black overlay (20%), a small "Time travelling..." notice at the center of the viewport and also see the same timeline bar.

* Q: Should host controls be broadcast to clients, or should each client have independent timeline controls?

  * A: Host should be broadcast changes to the timeline pointer to clients, and each client is responsible to reach that state.

### 6. Autonomous Bot Behavior

* Q: During rewind, should bot autonomy:
  1. Pause completely (recommended)
  2. Continue generating commands that get discarded
  3. Continue and commands are queued for when we resume?

  * A: When playing with the timeline, the game logic loop stops and no new events can be added to the event queue. Therefore, the bot should pause completely.
  * Follow up: When jumping to the end, the game loop should not resume unless the host presses play.

* Q: During playback (fast-forward), should autonomy be disabled or accelerated?

  * A: Bots autonomy is always dependent on the game loop running. This implies that unless the game is in normal play mode (adding events to the history) bots should simply not move. (they can only act when asked to contribute to the game loop)


### 7. Keystroke Help Menu

* Q: Should the "?" menu show all keystrokes or just timeline-related ones?

  * A: All keystrokes should be shown in the "?" menu.

* Q: Should it be a separate feature or part of this implementation?

  * A: It should be part of this implementation and actually be one of the first features to be implemented. This implies that existing debug keystrokes should be added to the "?" menu and also mapped to the same modifier key as the timeline keystrokes.

