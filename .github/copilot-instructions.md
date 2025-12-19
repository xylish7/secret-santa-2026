# Secret Santa: The Hidden Digits - AI Agent Guide

## Project Overview

A mobile web game where players unlock an 8-digit code by solving sensor-based riddles. Each level tests different phone capabilities (motion, orientation, audio, camera, etc.) to reveal one digit.

## Architecture

### Core Structure

- **App class** ([app.js](../app.js)): Main orchestrator managing game state, screen transitions, and level lifecycle
- **GameState class**: Tracks `currentLevel` (1-8), `unlockedDigits` (array), and `isLevelActive` flag
- **SensorManager class**: Handles permission requests for motion, orientation, camera, microphone, and geolocation on iOS 13+
- **Level classes** (8 individual files in `/levels`): Each inherits pattern with `start()`, `handleSensor()`, `complete()`, and `cleanup()` methods

### Data Flow

1. User taps "Begin the Journey" → `SensorManager.requestPermission()`
2. Permissions granted → switch to game screen
3. Current level instance starts → listens to device sensors
4. Win condition met → `revealDigit(digit)` adds to `state.unlockedDigits`
5. UI updates with `updateUnlockedDigitsUI()` → displays in 8-slot header bar
6. Next level button appears → `startNextLevel()` increments `currentLevel`

### Level Pattern (Critical for Adding Levels)

Each level file implements:

```javascript
class LevelN {
  constructor(app) {
    this.app = app /* timers, thresholds */
  }
  start() {
    // Set riddle, show UI container, add event listener
    this.app.state.isLevelActive = true
  }
  handleSensor() {
    // Check win condition against sensor data or timer
  }
  complete() {
    // Cleanup listeners, call this.app.revealDigit(digit)
    this.app.state.isLevelActive = false
  }
  cleanup() {
    // Remove event listeners, cancel animation frames
  }
}
```

### Existing Level Implementations

- **Level 1 (Stillness)**: Listens to `devicemotion`, tracks acceleration delta, 5s stillness = digit
- **Level 2 (Inversion)**: Listens to `deviceorientation`, detects upside-down (beta < -50), 2.2s hold = digit '4'
- **Level 3 (Shake)**: Detects high acceleration variance, shaking motion unlocks
- **Level 4 (Silence)**: Uses Web Audio API analyser for microphone input, requires 5s of low decibel levels
- **Level 5 (Darkness)**: Likely uses camera stream or light sensor to detect darkness
- **Level 6 (Shape)**: Probably face/hand detection or touch patterns
- **Level 7 (Location)**: Uses Geolocation API, tracks position changes or proximity to coordinates
- **Level 8 (Touch Seal)**: Multi-touch sequence or gesture recognition on screen

## UI System

### Screen Management

- Two main screens: `#start-screen` (permissions), `#game-screen` (gameplay)
- CSS classes: `hidden` (display: none), `active` (fade-in animation)
- Method: `switchScreen(screenName)` with 50ms delay for CSS transitions

### Level-Specific UI

Each level has its own container (`#level-N-ui`) toggled via `.hidden` class. Header shows 8 digit slots (`.digit-slot` elements) that fill with gold glow when unlocked.

### Debug Mode

- Enabled by default (`this.debugMode = true`)
- Debug level selector shows buttons to jump to any level
- Real-time sensor stats displayed in `#debug-stats`

## Key Conventions & Patterns

### Event Listener Management

- **Arrow functions** used as handlers to preserve `this` binding
- **Bound listeners** stored as `this.handleOrientationBound` when added/removed dynamically
- **Cleanup critical**: All listeners removed in `cleanup()` to prevent memory leaks and duplicate listeners on next level

### Timers & Animation Frames

- Use `performance.now()` and delta time (`dt`) for frame-rate-independent updates (Level 1)
- Use `requestAnimationFrame()` for smooth 60fps loops
- Store `gameLoopId` to cancel on cleanup: `cancelAnimationFrame(this.gameLoopId)`
- Use `setTimeout()` for debouncing (e.g., shake animation visual feedback)

### Sensor Access Pattern

```javascript
// Async permission flow
async start() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Process stream...
  } catch(error) {
    console.warn('Permission denied:', error)
  }
}
```

### Digit Reveal

- Each level calls `this.app.revealDigit(digitValue)`
- Digit is string (e.g., '4', not 4)
- Auto-appends to `unlockedDigits` array and updates UI

## Common Pitfalls

1. **Forgetting cleanup()**: Previous level listeners fire on new level → incorrect win conditions
2. **Not checking `this.app.state.isLevelActive`**: Handlers execute after level switches → bugs
3. **Not checking `currentLevel` in sensor handler**: Events from old listeners interfere
4. **Memory leaks**: Audio Context, MediaStream tracks, styles not removed
5. **Timing sensitivity**: Thresholds like `stillnessThreshold = 0.3` vary by device; test on actual hardware

## Styling Guidelines

- CSS variables in `:root`: `--accent-gold`, `--bg-dark`, `--text-primary`
- Font: "Cinzel" serif for headings, "Outfit" sans-serif for body
- Responsive: uses viewport units, no fixed widths
- Dark theme with red (#c0392b) and gold (#d4af37) accents
- Animations: `glowPulse`, `fadeIn`, `shake` defined in style.css

## Adding a New Level

1. Create `/levels/level-N-levelname.js` with Level class
2. Add UI container to HTML: `<div id="level-N-ui" class="level-ui hidden">`
3. In `app.js` constructor: `this.levels[N] = new LevelN(this)` and `this.ui.levelN = { container, ... }`
4. Add case in `handleStart()` and `startNextLevel()` to instantiate level
5. Test with debug selector to jump directly to new level
6. Ensure `cleanup()` is bulletproof to prevent state leakage
