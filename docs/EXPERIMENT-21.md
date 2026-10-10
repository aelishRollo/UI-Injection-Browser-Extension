# Iteration 21 — direct rendered theme handoff

October 9, 2026. Baseline: `development` after Iteration 20. [Shared learning log](LEARNINGS.md).

## Owner correction

Iteration 20 removed the website-default flash by making authored content transparent over the destination canvas during a theme change. That still un-rendered every page element and left a themed but empty interval. The owner required a direct old-theme-to-new-theme change with as little latency as possible.

## Cause and rejected intermediate

The unified renderer must temporarily recover authored state before it can make preservation and contrast decisions for the destination theme. Making that live reset visible caused the original authored flash; hiding the body caused Iteration 20's empty canvas. A correct handoff therefore needs to preserve the complete rendered source state while the live document performs the reset underneath, rather than choosing a different placeholder.

The first snapshot implementation accidentally held the visual handoff until the later full-document completion promise resolved. Because an async function adopts a returned promise, the preparation callback exceeded Chromium's DOM-update timeout. The bounded preparation now returns that promise as data, completes the visible handoff after viewport recognition, and awaits the comprehensive pass afterward.

Independent View Transitions inside embedded frames were also rejected. The top snapshot already contains their rendered pixels, while frame-level transitions could remain active long enough for a later viewport resize to abort their visual promises and emit page errors. Only the top document owns the snapshot; child frames still run the ordinary unified update underneath it.

## Unified-path correction

For an enabled theme-to-theme change, the top document starts a View Transition before the existing reset. Chromium keeps the full current themed page rendered while the live document restores authored annotations, removes the old USER-origin sheet, starts the same unified renderer, installs the destination sheet, and performs bounded visible-content recognition. Once that update callback completes, Surface skips the browser's default cross-fade and reveals the destination directly.

An existing document is already parsed and laid out, so its bounded switch recognition no longer waits for the startup path's additional animation-frame opportunity. The later full-document scan still runs and supplies authoritative offscreen treatment, but it does not control the visible handoff. Disable behavior remains an authored restoration rather than a theme-to-theme snapshot.

This changes lifecycle scheduling only. It adds no second renderer, CSS transition system, host selector, or alternate recognition path.

## Evidence

The Chromium regression samples animation frames while switching into all three themes. Every sample requires body opacity to remain one. Frames outside the atomic handoff must retain classified source or destination page ownership, and the final sample must be classified and activated for the destination theme.

On the local fixture, measured time from reconciliation start to completed visible handoff was:

- Browser Archeology: **35.6 ms**
- Liquid Dream: **35.4 ms**
- Terminal Vision: **34.2 ms**

The build, 12 unit checks, and all 14 isolated Chromium checks pass. The suite includes embedded frames, later viewport resizing with no page errors, 20 repeated theme switches with no residual stylesheet nodes, and exact authored restoration after disable. The timings are local regression evidence, not universal field latency guarantees.
