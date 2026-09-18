# Mobile Key Stack — v1 Spec

**Status:** Approved design — ready to implement.
**Date:** 2026-09-18
**Owner:** May Tickner Everest / Glimmer Learning
**Product line:** Mobile Games (first title). See `../PLAN.md` for the line's rationale and delivery plan.

---

## 1. Purpose & scope

Mobile Key Stack is a touch-controlled, Tetris-style falling-block stacker for mobile
visitors to glimmerlearning.com. It carries over the *visual family* of Keyboard
Commander's "Key Stack" mini-game (piece colors, board look, clear fanfare) but is a
**clean standalone build** — no shared code with KC, no letters, no keyboard progression.

**In scope (v1):**
- Full 7-piece Tetris core: spawn, gravity, move, rotate, lock, line-clear, top-out.
- Touch controls: swipe = move, tap = rotate, swipe-down = hard drop.
- Next-piece preview.
- Score by lines cleared; game-over → restart.
- **Retro high-score leaderboard** (classic arcade style): top-10 table, 3-initial entry,
  saved on-device. See §11.
- Responsive, full-screen layout that reads **large and clear on phones and iPads**.
- Hidden desktop test hotkey (speed multiplier) for the developer.

**Explicitly out of scope (v1):**
- Lettered pieces and the KC auto-place "optimality solver" (removed entirely).
- Keyboard/arrow gameplay controls (touch-only; desktop is not a v1 target).
- Hold-piece, level UI.
- A **global/shared** leaderboard (v1 is local per-device only; global needs a backend +
  moderation — a possible later upgrade).
- Squarespace page, home-page button, embed-vs-link decision (separate later step).

---

## 2. Source of truth

Reimplement cleanly. Read — do **not** edit — KC's deployed single file
`games/keyboard-commander-web/index.html` (Key Stack section begins ~line 2570) only
to carry the *visual constants* forward:

| Constant | Value (from KC `MG_COLORS`) |
|---|---|
| Piece I | `#5aa0b8` |
| Piece O | `#b8a05a` |
| Piece T | `#8a7aa8` |
| Piece S | `#6a9a6a` |
| Piece Z | `#a86a6a` |
| Piece J | `#6a7aa8` |
| Piece L | `#a8855a` |
| Board background | `#10101a` |
| Grid lines | `#1f1f2e` |
| Accent (UI text/cyan) | `#64c8ff` |
| Primary text | `#dcdcdc` |

Board dimensions carried over: **10 columns × 18 rows**. (Cell *pixel* size is NOT
carried over — v1 computes it responsively; see §6.)

---

## 3. Core mechanic

### 3.1 Pieces
The 7 standard tetrominoes, defined as in KC:

```
I: [[1,1,1,1]]
O: [[1,1],[1,1]]
T: [[1,1,1],[0,1,0]]
S: [[0,1,1],[1,1,0]]
Z: [[1,1,0],[0,1,1]]
J: [[1,0,0],[1,1,1]]
L: [[0,0,1],[1,1,1]]
```

- Rotation: clockwise, matrix-transpose method (as KC's `arrowRotate`).
- Randomizer: uniform random per spawn is acceptable for v1 (KC uses uniform).
  A 7-bag randomizer is a nice-to-have but not required.
- Spawn: horizontally centered, at the top row. If the spawned piece cannot fit → **top-out**.
- Wall/floor/stack collision on move and rotate (KC's `arrowCanFit`). Reject moves/rotations
  that don't fit (no wall-kick required for v1; a simple 1-cell kick on rotate is a nice-to-have).

### 3.2 Gravity & speed
- Piece falls one row every `fallInterval` seconds.
- Speed ramps over the round, carried from KC: start `0.9s`, decrease toward `~0.25s`
  as play continues (KC ramps over ~12s of the round). Keep the ramp gentle enough that
  a new player has time to react early on.
- When the piece cannot move down, it **locks** (a short lock-delay of ~0.2s so a last
  slide/rotate is possible is a nice-to-have, not required for v1).

### 3.3 Line clear
- After a lock, detect any full rows.
- Play the **clear fanfare** (family feel, ported from KC): brief blink of the completed
  row(s) followed by a particle burst, then remove the rows and shift everything above down.
- Input is locked during the fanfare (as in KC).
- Multi-row clears handled in one fanfare.

### 3.4 Scoring
- v1 score = **cumulative lines cleared** (matches KC's `cleared`).
- Display current score prominently. The persistent record of results is the leaderboard
  (§11); the top score on it doubles as the "best" shown on the start screen.

### 3.5 Game over
- Triggered by top-out.
- Show final score + best-this-session and a clear "Tap to play again" affordance.
- Restart resets the board, score, and speed ramp to a fresh round.

---

## 4. Controls (touch)

All gameplay input is touch. Gestures are classified on `touchend` by net displacement
from `touchstart`, using a dead-zone so an intended tap is never read as a swipe:

| Gesture | Action |
|---|---|
| **Tap** (net movement < dead-zone, ~10px) | Rotate clockwise |
| **Swipe left / right** (dominant horizontal) | Move piece one column; on a continued slide, repeat per ~1 cell-width of travel (KC threshold pattern) |
| **Swipe down** (dominant vertical, downward) | Soft drop — lowers the piece ~6 rows per swipe (≈3 swipes to the floor); a swipe when already resting locks it. *(v1.1 QA change — was hard drop; see §13)* |

Rules:
- Classify by dominant axis: compare `|dx|` vs `|dy|`; the larger axis wins.
- Horizontal move uses a per-cell threshold so a long slide moves multiple columns,
  matching KC's continuous-slide feel.
- **Optional stretch (only if it tests well):** distinguish soft drop (short downward
  swipe = advance a few rows) from hard drop (long/fast downward swipe = lock).
  Baseline v1 ships hard-drop-only on swipe-down.
- No on-screen d-pad/buttons in v1 (cleaner than KC's mobile UI).
- Prevent default touch behaviors during play: no page scroll, no pinch-zoom, no
  double-tap-to-zoom, no pull-to-refresh interfering with gameplay.

---

## 5. Game flow / screens

1. **Start screen** — title ("Key Stack"), Glimmer-family styling, "Tap to play".
   May also show the current top scores (or a "View high scores" affordance).
2. **Play** — board, falling piece, next-piece preview, live score.
3. **Game over** — "Game Over", final score.
   - If the score **qualifies** for the top 10 → go to **Initials entry** (§11.3), then to
     the leaderboard screen with the new entry highlighted.
   - If it does **not** qualify → show final score and the leaderboard, then "Tap to play again".
4. **Leaderboard screen** — the top-10 high-score table (§11), with "Tap to play again".

Transitions are tap-driven. Keep transitions readable (don't auto-restart instantly on
the tap that ended the round — require a fresh deliberate tap, or a short guard delay,
so the player sees their final score). The tap that ends a round must not be the same tap
that starts initials entry or restarts.

---

## 6. Responsive full-screen layout (KEY REQUIREMENT)

The game must feel **big and easy to see** on both a phone and an iPad — the board should
fill the available screen, not sit small in the middle. This is a first-class requirement,
not polish.

- **Canvas fills the viewport.** Use `100vw`/`100dvh` (dynamic viewport height so mobile
  browser chrome doesn't clip it), `viewport-fit=cover`, and honor `env(safe-area-inset-*)`.
- **Compute cell size from available space, every resize/orientation change:**
  `cell = floor( min( (usableWidth) / 10, (usableHeight - uiBands) / 18 ) )`,
  where `uiBands` reserves room for the score/next-piece header. The board then measures
  `10*cell × 18*cell` and is centered in the remaining space.
  - On a phone (portrait) this makes the 10×18 board as tall as the screen allows — cells
    are large and finger-friendly.
  - On an iPad the board scales up proportionally to fill the larger screen (with a sensible
    `maxCell` cap, e.g. ~64px, so it doesn't become comically blocky on very large tablets;
    center any leftover space).
- **Retina-crisp:** back the canvas with `devicePixelRatio` (set canvas pixel buffer to
  `logicalSize * dpr`, scale the 2D context by `dpr`), so pieces and text are sharp.
- **Readable UI text:** score/next/labels sized relative to cell size (e.g. score ≈ 1.5–2×
  cell height), high-contrast against the dark board, never smaller than legible on a phone.
- **Orientation:** portrait is primary. On landscape, recompute so the board still fits
  fully on screen (place the header/next-piece to the side rather than stacking if that
  yields a bigger board). Landscape must not clip the board.
- **Next-piece preview** scales with the board and stays clearly visible.
- No layout should require the user to scroll or zoom to see the whole board.

---

## 7. Rendering

- Single `<canvas>`, 2D context, redrawn each animation frame (`requestAnimationFrame`).
- Draw order: board background → grid lines → locked cells → active piece → fanfare
  particles → UI header (score, next-piece) → screen overlays (start / game-over).
- Piece cells drawn with the ported colors; a subtle inset/border per cell (as KC) reads
  well at large sizes.
- Particles: lightweight (KC-style burst on clear and on hard-drop lock is optional flair).

---

## 8. Developer test hotkey

Carry over KC's hidden speed test: **`Ctrl+Shift+F`** (`Cmd+Shift+F` on Mac) toggles a
`TEST_MULTIPLIER` (5×) that speeds the fall interval, for fast desktop testing. Keyboard-only,
invisible to touch users. This is the **only** keyboard input in v1 and does not affect
gameplay controls.

---

## 9. Delivery (v1 code only)

- **One repo for the whole mobile-games line** — a **new public GitHub repo** (`mobile-games`),
  deployed via **GitHub Pages** (`main`, root). Each game lives in its own subfolder so the
  line can grow without new repos/Pages setups.
- **Repo layout:**
  ```
  mobile-games/
    index.html          landing page: lists/links the games in the line
    key-stack/
      index.html        the game — single self-contained file (HTML + inlined CSS + inlined JS)
    README.md
  ```
- **Live URLs:** the game at `theglimmeroa.github.io/mobile-games/key-stack/`; the landing
  page at `theglimmeroa.github.io/mobile-games/`.
- **Single file per game:** Key Stack remains one self-contained `key-stack/index.html`
  (the single-file convention is kept per game, though not strictly required here).
- The **landing `index.html`** is a small, mobile-friendly page in the Glimmer family that
  lists the games and links into each game's folder. v1 lists just Key Stack; it's the stable
  target the Squarespace page links/iframes as the line grows.
- Standard PWA/offline niceties are **not** required for v1 (can follow later).
- Internal code organized with labeled section banners (KC style): `CONFIG`, `STATE`,
  `PIECES`, `LOGIC`, `INPUT`, `RENDER`, `LOOP`.

**Not in this spec (separate later step):** creating the Squarespace `mobile-games` page,
the "Play Games on Mobile" home-page button, and the iframe-embed-vs-link decision — all
made after the game is deployed and tested on a real phone.

---

## 10. Acceptance criteria

The build is done when, on a real iOS Safari device and a real Android Chrome device:

1. Pieces spawn, fall, and speed up over the round; the board is 10×18.
2. **Tap rotates; swipe L/R moves; swipe-down hard-drops** — each reliably, with taps never
   misread as swipes.
3. Completed rows clear with the fanfare and the stack shifts down correctly (incl. multi-row).
4. Score increments by lines cleared and is clearly visible during play.
5. Top-out ends the round; game-over shows the score; a fresh tap restarts cleanly.
6. Next-piece preview is visible and correct.
7. **The board fills the screen and is large/legible** on both a phone (portrait) and an iPad;
   no scrolling or zooming is needed to see the whole board; landscape does not clip it.
8. No page scroll/zoom/pull-to-refresh leaks through during play; rendering is retina-crisp.
9. `Ctrl+Shift+F` toggles the speed multiplier on desktop; touch play is unaffected.
10. **Leaderboard:** a qualifying score (top 10) prompts 3-initial entry; entry works by both
    swipe and on-screen buttons; the new entry lands at the correct rank; the top-10 table
    displays correctly and **persists across reloads** on the same device. A non-qualifying
    score does not prompt entry. Clearing/blocking storage never crashes the game.
11. Deployed to GitHub Pages and reachable at its public URL.

---

## 11. Leaderboard (retro high-score table)

A classic 1980s-arcade high-score table, saved on the player's device. This is the
persistent record of play in v1.

### 11.1 Standards followed
- **Top 10** entries: rank (1–10), initials, score. Ranked high → low.
- **3-character initials** per entry (the authentic arcade standard; `AAA` is the default).
- **Local per-device** persistence via `localStorage` — matches how real arcade machines
  kept scores (each machine its own table). No backend, no network, no moderation surface.
- A score **qualifies** when the table has fewer than 10 entries, or the score is **strictly
  greater than the lowest** score currently on the table. (A score equal to the lowest, when
  the table is full, does not bump it — standard arcade behavior.)

### 11.2 Data & storage
- Stored under a single `localStorage` key (e.g. `keystack.highscores`), as JSON:
  an array of `{ initials: "AAA", score: <int> }`, sorted descending, max length 10.
- **Tie-breaking:** if a new score ties an existing score, the **new** entry is placed
  **below** the existing one (older score keeps the higher rank). If the tie is for the
  last slot on a full table, the new score does not qualify (per §11.1).
- **Seeding:** on first run (no saved data), seed a default table so the board isn't empty —
  e.g. descending placeholder scores with default initials (classic "AAA / ACE / GLM …"
  style). Seed values should be modest so early real plays can place. This is cosmetic; if
  preferred, an empty "NO SCORES YET — BE THE FIRST" table is an acceptable alternative
  (pick one; default: seeded).
- **Corruption/absence tolerance:** if the key is missing, unparseable, or the browser
  blocks storage (private mode), fall back to an in-memory table for the session and never
  throw — the game must remain fully playable without persistence.

### 11.3 Initials entry (touch)
Shown only when the score qualifies. Because this is a menu (not gameplay), on-screen
controls are allowed here for discoverability, and the game's swipe/tap vocabulary is mirrored.

- Three character slots, the active one highlighted; all default to `A`.
- **Character set:** `A–Z`, plus space and `.` (space/`.` let a player leave a slot blank
  or add a period, as many classic tables allowed). Wraps around at the ends.
- **Controls (both provided):**
  - **Swipe up / down** on the active slot cycles its character; **tap** confirms the slot and
    advances to the next; after the third slot, entry is submitted.
  - On-screen **▲ / ▼** buttons change the active slot's character and **◀ / ▶ / OK** move
    between slots / submit — a reliable fallback that doesn't rely on gesture precision.
- A large **DONE** / **OK** affordance submits at any point (remaining slots keep their
  current value; default `A`).
- Entered initials are upper-cased; the result is inserted into the table at the correct rank.
- Text and controls must be **large and legible** on phone and iPad (§6 sizing rules apply).

### 11.4 Display
- The leaderboard screen lists all 10 rows: `rank  initials  score`, monospaced, high-contrast,
  in the Glimmer/KC color family. The just-entered row (if any) is highlighted briefly.
- The start screen surfaces at least the top entry (or the full table) so returning players
  see the target to beat.

### 11.5 Reset (optional, cheap)
- A small, unobtrusive "Reset high scores" affordance (e.g. on the leaderboard screen, behind
  a confirm) is a nice-to-have so a device owner can clear the table. Not required for v1.

---

## 12. Nice-to-haves (defer unless cheap)

- 7-bag randomizer; lock-delay; simple rotation wall-kick.
- Global/shared leaderboard (requires backend + profanity filter + anti-cheat).
- PWA/offline support.
- Haptic feedback (`navigator.vibrate`) on line clear / lock / qualifying score.

---

## 13. v1.1 changes (QA feedback, 2026-09-18)

Applied after the first deployed build, per tester feedback. These **supersede** the
conflicting original text above where noted.

- **Swipe down = soft drop** (not hard drop). Lowers the piece `SOFT_DROP_ROWS` (=6) rows per
  swipe; if the piece is already resting, a downward swipe locks it. Gives reaction time.
  *(Supersedes §4 swipe-down row.)*
- **Slower speed curve.** `fallInterval` ramps **1.3s → 0.5s over ~20s** (was 0.9→0.25 / 12s),
  for more time to react and place. *(Supersedes §3.2 numbers.)*
- **Leaderboard starts empty.** No seeded scores — a new device shows "NO SCORES YET / BE THE
  FIRST!" and the first qualifying play (any score > 0) enters initials. *(Supersedes §11.2
  seeding; the empty-table alternative is now the chosen behavior.)*
- **Profile icons.** After initials, the player picks a **profile icon** from a fixed set of
  license-free **Unicode emoji** (`ICONS` in `logic.js`: cat, fox, robot, dog, frog, owl,
  alien, star, game pad, turtle). The icon is stored with the entry and shown as a **column**
  in the leaderboard (`rank · icon · initials · score`). No third-party character artwork is
  used (copyright/trademark) — emoji are system-rendered glyphs. Entry flow is now
  initials (**NEXT**) → icon picker (**DONE**) → board.
- **Audio (synthesized, no asset files).** Row-clear **explosion** SFX (noise burst + low sine
  thump) and a **low-volume 1980s-arcade ambient bed**. A **mute toggle** (🔊/🔇, top-left)
  persists to `localStorage` (`keystack.muted`); audio initializes on first user gesture
  (browser autoplay policy). On by default (low volume).
  - **Sound bed (revised):** a 4-bar original progression (A-minor: Am–F–C–G) with a bass line,
    an arpeggio that alternates pattern per bar, and an occasional sparkle + slight detune —
    less repetitive than the first loop. **Tempo speeds up during initials entry** (`setFast`)
    for a "hurry-up" feel, back to normal on the leaderboard / new round.
- **Idle sleep (10 min).** After 10 minutes with no input (any screen), the game **stops the
  animation loop, closes the AudioContext, and cancels timers**, then shows a "💤 Sleeping /
  Tap to wake" screen — releasing CPU/audio resources on an abandoned tab. Any tap/key **wakes
  it in place** (the wake tap is consumed, not played); audio re-initializes on that gesture and
  fall timers reset so there's no instant multi-drop. Audio also **pauses when the tab is
  hidden** (Page Visibility) and resumes when visible (unless muted).
- **iPad styling + contrast.** Vertical background gradient, a playfield panel with an accent
  (`#64c8ff`) glow border, and **brighter grid lines** (`#3b3b5e`) so they read behind pieces;
  pieces gained a top highlight + bottom shade for depth. Start screen adds the GLIMMER
  LEARNING wordmark.

All pure-logic changes are covered by `logic.test.js` (36 tests). Browser-verified for the
DOM/canvas/audio behavior.
