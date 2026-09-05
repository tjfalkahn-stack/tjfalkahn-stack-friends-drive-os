# RAM cockpit upgrade 01 — review handoff

Base: `e3e6ecfc8200badc692db2c6e32cab8776687085`, PR #1, `cursor/display-profile-system-aa3e`. PR #1 was rechecked before writing: open, draft, unmerged, same head. This is a separate review branch; no merge or deployment was performed.

## Changes

- Separate RAM HDMI left-rail and portrait bottom-navigation shells, dark navy/electric-blue styling, larger Home actions and real in-app Back history. At narrow widths, Home / All apps / Settings remain visible; Media and Web stay reachable through Home and All apps.
- Retain physicalMap-derived HDMI padding and every existing display token. Remove the decorative mapping outline and engineering footer from the cockpit. Coverage numbers appear only in Diagnostics and are labeled software geometry.
- Touch calibration extends from 40–72 to 40–96 CSS pixels without replacing saved values. Existing values over 96 remain representable. All four safe-area edges are configurable. Native browser media controls have browser-defined sizes.
- RAM Media now offers actual local-file playback, error feedback and object-URL cleanup. Playback stops when leaving the view. Streaming services are explicitly external links. Web is an actual external-tab launcher, not a universal embedded browser.
- Existing vehicle, tow, camera and Dotty previews remain reachable, marked DEMO ONLY, with inactive controls disabled. RAM Home and its header no longer show fake speed, gear, temperature or playback.
- Copy Display Report waits for success, uses one click handler and offers a selectable manual fallback. The old string-returning copyReport API remains available; copyReportWithStatus adds truthful feedback.

## Preserved source

No edits to `src/display/`, `ShellRouter.tsx`, the existing non-RAM shell files, original module implementations, `src/styles.css`, package/lock files, framework or build configuration. Display matching, event handling, profile overrides, calibration storage, current-fingerprint remember/update/forget, warnings and v1-to-v2 migration are retained. Shared Settings and OsContext changes still require full integration verification.

## Observed verification — not a production sign-off

- Six modified-file baselines were reconstructed from connector source and verified against their Git blob hashes.
- `node offline_checks.cjs`: 20/20 isolated navigation/address assertions passed. Global TypeScript 5.8.3 transpile check: 14 TS/TSX files, zero syntax diagnostics. This is NOT the project typecheck.
- `python browser_checks.py`: 49/49 isolated Chromium component checks passed, zero page errors. Includes Home/Back/Settings reachability, 96px visible navigation height, scrolling to reset, actual local WAV decoding/playback and cleanup, external-link attributes, URL rejection and clipboard pending/success/denial/manual selection. External opening was intercepted; provider playback was not tested.
- Actual component screenshots: HDMI 1555×1081, portrait 720×1280, smaller HDMI 1024×768, smaller portrait 390×844 (96px controls and scale 1.25). Raster DPR 1. Display snapshots are synthetic fixtures. The reference HDMI snapshot uses screen 1728×1117 and DPR 1.8 as source-recorded sample data, NOT physical measurements from this run.
- The offline renderer uses installed React/ReactDOM 18.2, selected source-derived base CSS, real upgraded components and a synthetic display adapter. The before image renders an extraction of the original HDMI Home branch. These are NOT full Vite application screenshots or matcher/storage integration tests.
- `npm ping --fetch-retries=0 --fetch-timeout=5000`: failed with EAI_AGAIN for registry.npmjs.org. Direct Git access also failed DNS; connector source reads/writes worked.
- `npm ci`, `npm test`, `npm run build`, `npm run dev`: NOT RUN. A full local checkout and locked dependencies were unavailable. PR #1's reported 47 passes were not independently reproduced. Four focused Vitest test files were added, but the project suite was not executed.
- Ford/Tesla/generic browser smoke tests, real display recognition/forced-mode transitions, persisted calibration/memory after a browser restart, and storage migration are NOT verified by the component harness. No claim is made that the complete application is regression-free.

## Required project verification before merge or truck use

In a clean checkout of this review branch:

```sh
npm ci
npm test
npm run build
npm run dev
```

Record failures separately from the unmodified base. Run the existing display tests and the added `tests/ram/` tests. Smoke-test all six shells in the complete app, including AUTO, forced modes, low-confidence fallback, resize/orientation/fullscreen, stale mappings, explicit update/forget and reset preserving calibration. Confirm new 96px settings survive a real reload and profile switching.

## Parked-truck checklist

1. Keep the known-working branch and OEM Uconnect access available. While parked, connect the normal MacBook → HDMI → AV-CM01 path. Capture a fresh Display Report and a straight-on photo of the entire panel, borders included.
2. Check physical coverage and each edge in windowed/fullscreen modes; distinguish application padding from host/adapter scaling. Verify actual input delivery and coordinate alignment rather than assuming HDMI carries touch. Check readability and controls at several touch/scale settings, including scroll reachability of Settings and reset.
3. Test reload and reconnect persistence, remember/update/forget warnings, per-profile calibration isolation and reset behavior. Test local media, browser-tab return and clipboard fallback. Confirm recovery by exiting Friends Drive, returning to Uconnect and restoring the original branch if necessary.

No OEM, firmware, CAN-bus or safety-interlock changes. CSS does not establish removal of adapter-generated black bars, touch passthrough or full physical-panel coverage.
