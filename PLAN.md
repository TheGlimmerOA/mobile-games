# Glimmer Learning — Mobile Games (Plan)

**Status:** Built & pushed to GitHub 2026-09-18 (v1.1 QA revisions applied same day) — pending GitHub Pages enable + real-device QA. Recorded 2026-09-17; spec written 2026-09-18.
**Owner:** May Tickner Everest / Glimmer Learning
**Spec:** `build-notes/key_stack_v1_spec.md` · **Plan:** `build-notes/2026-09-18-key-stack-v1-plan.md`.
**Repo:** https://github.com/TheGlimmerOA/mobile-games (public). Local repo git-inited here; 34 logic unit tests pass (`node --test`); browser-verified in Chrome. Commit emails use the GitHub noreply address (172157533+TheGlimmerOA@users.noreply.github.com) because the account blocks private-email pushes.
**Remaining:** (1) enable Pages: Settings → Pages → Deploy from branch → main/root; (2) device QA on iOS Safari + Android Chrome; (3) Squarespace page + home-page button (owner, manual).

## Why

Mobile visitors to glimmerlearning.com currently have nothing to *do* — Keyboard Commander is keyboard-based and doesn't suit touch. This plan starts a **mobile games** line whose job is to give mobile users a free, fun reason to come to the site. More mobile games will be added over time; Key Stack is the first.

## The first game — Mobile Key Stack

- **Function:** a classic Tetris-style falling-block stacker. Pieces fall, fill and clear rows, endless play, score by lines/points.
- **Look:** carry over Keyboard Commander's Key Stack colors and visual design (piece colors, board styling) so it reads as part of the same family.
- **No typing:** remove the lettered pieces and the keyboard/arrow controls entirely. This is *not* a typing game — it's the stacking mechanic on its own.
- **Touch controls** (spec §4/§13):
  - Swipe left / right = move the piece left / right
  - Tap = rotate
  - Swipe down = soft drop (lowers ~6 rows per swipe; v1.1 QA change from hard drop)
- **Leaderboard:** classic 1980s-arcade high-score table (spec §11) — top 10, 3-initial entry + **profile icon** (license-free emoji), **starts empty**, saved **on-device** (localStorage; no backend). Global/shared board is a later upgrade.
- **Audio (v1.1):** synthesized row-clear explosion SFX + a low arcade ambient bed (4-bar Am–F–C–G, bass+arp+sparkle; speeds up during initials entry), with a mute toggle.
- **Idle sleep (v1.1):** after 10 min idle, stops the loop + closes audio + shows "Tap to wake"; any input resumes in place. Audio also pauses when the tab is hidden.
- **Target:** mobile-first (phones and tablets), with the board sized to **fill the screen** and read large/legible on phones and iPads (spec §6). Desktop is not the target for v1; a keyboard/mouse fallback can come later.

## Delivery

- **One public GitHub repo for the whole line** — `mobile-games` (GitHub repo names can't contain spaces). Each game lives in its own subfolder so the line grows without new repos. Decided over per-game repos because these are tiny, single-file, same-owner static games — see spec §9.
  ```
  mobile-games/
    index.html        landing page listing/linking the games
    key-stack/index.html
    README.md
  ```
- **Hosting:** deploy via **GitHub Pages** (`main`, root). Game → `theglimmeroa.github.io/mobile-games/key-stack/`; landing → `theglimmeroa.github.io/mobile-games/`.
- **Site page:** a new Squarespace page at **glimmerlearning.com/mobile-games**.
- **Home page:** add a **"Play Games on Mobile"** button that links to the `mobile-games` page.
- The Squarespace page presents the game hosted on GitHub Pages (link out, or embed via iframe — decide at build time; embedding keeps users on glimmerlearning.com). Manual linking is done by the owner after deploy.

## Build approach (recommended, confirm at build time)

- **Clean standalone build**, not a code-share with KC. KC is a single frozen-ish file with typing/progression logic baked in; the mobile game only needs the stacking mechanic. Reimplement that cleanly and port KC's Key Stack *visual design* (colors, piece shapes, board).
- KC's single-file convention is nice to keep but **not required** here — this repo is not pasted into Squarespace's code block, so it can be multi-file if that's cleaner. Single-file is still fine.

## Open items

**Resolved (now in spec):**
- ~~Single-file vs. multi-file~~ → single self-contained file **per game**; one line-level repo with per-game subfolders + a landing page.
- ~~Exact scoring, speed curve, game-over/restart flow~~ → spec §3–§5 (score = lines cleared; KC speed ramp; game-over → qualify → initials → leaderboard → restart).
- ~~Controls~~ → tap = rotate, swipe L/R = move, swipe down = hard drop (spec §4).
- ~~Repo name~~ → `mobile-games`; Pages URLs above.
- Leaderboard → local per-device, top 10, 3 initials (spec §11).

**Still open (decide at/after build):**
- Embed the game in the Squarespace page (iframe) vs. link straight to the Pages URL — decide after phone testing.
- Whether/when to add a desktop (keyboard) fallback and a global/shared leaderboard.

## Next session — start here

Decisions are locked and the **spec is written** (`build-notes/key_stack_v1_spec.md`). The implementation plan is being produced via the `writing-plans` skill. Build order (from the spec):

1. **Create the repo.** New **public** GitHub repo `mobile-games` (GitHub hyphenates — no spaces). Init, add a README, enable **GitHub Pages** (Settings → Pages → deploy from `main`, root). Use the subfolder layout (landing `index.html` + `key-stack/index.html`).
2. **Find the source to skin from.** KC's Key Stack lives in the deployed single file `games/keyboard-commander-web/index.html` (section ~line 2570). Search it for `KEY_STACK` / `keyStack` / `MG_COLORS` for the piece colors, shapes, and board styling to carry over. Do **not** edit KC — read it for reference only.
3. **Build `key-stack/index.html`, in this order:**
   - Standalone Tetris core (spawn, fall, move, rotate, lock, line-clear, score, game-over/restart) — no letters, no arrow-key gameplay.
   - Apply KC's Key Stack visual design (piece colors, board look).
   - Touch controls: swipe L/R = move, tap = rotate, swipe down = hard drop. Tune thresholds on a real phone.
   - Responsive full-screen layout: board sized to fill the screen, large/legible on phone + iPad, retina-crisp, no page scroll/zoom (spec §6).
   - Score display + next-piece preview + game-over/restart flow.
   - **Leaderboard** (spec §11): local top-10, 3-initial touch entry, localStorage persistence.
   - Developer test hotkey `Ctrl+Shift+F` (spec §8).
4. **Build the landing `index.html`** — small mobile-friendly page listing/linking Key Stack.
5. **Deploy** to GitHub Pages; test on a real phone (iOS Safari + Android Chrome).
6. **Wire up the site (owner, manual):** create the Squarespace page `glimmerlearning.com/mobile-games` (embed via iframe, or link out), then add the **"Play Games on Mobile"** button to the home page pointing at it.

**Process note:** this is an architectural build — spec first (done), then `writing-plans` for the implementation plan, then code.

## Relationship to other work

- **Independent of Keyboard Commander V11.** This is a separate product line with its own repo and page; it does not go in the KC V11 spec.
- Part of the broader Glimmer Learning goal of giving every visitor — including mobile — something to do on the site.
