# Iteration 15 — resident theme, parser-time recognition

October 9, 2026. Baseline: `development` after Iteration 14. [Shared learning log](LEARNINGS.md).

## Owner observation

The guarded startup still left a long interval in which the selected expressive theme was not visible. Terminal Vision could look like a generic dark treatment before its actual hierarchy appeared. The owner required the fix to eliminate that transition for every theme and to generalize beyond one Wikipedia page.

## Cause

Iteration 14 persisted only the selected theme's canvas color. The complete theme stylesheet was still installed later through the service worker, and the unified renderer was still loaded through a dynamic import. Visibility then waited for a bounded but synchronous viewport scan. On the reported Wikipedia article that scan varied by hundreds of milliseconds, while the later full-document pass took several seconds.

A first resident-stylesheet implementation exposed a second lifecycle race. Parser mutation handling can restore an `<html>`-rooted tracked subtree before reclassifying it. That restoration also removed the renderer's theme-activation attribute, making both the resident and USER-origin stylesheets inert until another root pass. A first-state screenshot caught the page in that mostly authored state even though the selected CSS file was present.

## Generalized change

The build now puts a compact generated first-paint stylesheet for each theme in its persisted browser-registered `document_start` file. It uses the same theme builder and selectors as the authoritative sheet for core surfaces, typography, hierarchy, and primary motifs. Secondary interaction states, error/success treatment, scalar grids, replacement icons, and additional window details remain in the full USER-origin sheet. The unified renderer is statically bundled into `content.js`; navigation no longer waits for a module import. Every startup sheet is gated by a renderer-owned `data-surface-theme-v2` root value and becomes inactive at the atomic USER-origin handoff.

Top documents bootstrap the unified renderer synchronously from the selected theme token in the registered stylesheet. The existing mutation pipeline observes the parser and classifies additions before their rendering opportunity. A short opacity guard remains only until the first parser-time treatment is ready. The bounded viewport scan is now a fallback for already-loaded documents or a parser pass that has not established page, visible landmark, and title treatment. USER-origin CSS remains as later cascade reinforcement, but it is no longer the source of the theme at first visibility.

Root activation is now an invariant of every document-root scan. If an `<html>`-rooted parser mutation restores the tracked subtree, the same scan reasserts `data-surface-theme-v2` before computing or painting roles. This fixes the race without a host selector, semantic-only fallback, or second renderer.

## Evidence

The parser-delay regression runs full navigations for Terminal Vision, Browser Archeology, and Liquid Dream. It requires the selected startup token throughout parsing, active first-paint or USER-origin styles for every visible frame, and no visible frame containing an unclassified article/title. The rest of the 13-check Chromium suite continues to cover preservation, contrast, hierarchy, mutation, restoration, frames, settings, and repeated switching.

On `https://en.wikipedia.org/wiki/Students_for_a_Democratic_Society`, the final first-released-state capture showed Terminal Vision's green outer shell and both viewport edges, grid-painted reading region, phosphor text and links, themed navigation, title, fact panel, and controls. No white side strips or generic dark intermediate treatment were visible. In that sampled run the fallback viewport work itself was 82.6 ms; its largest measured stage was text pairing at 40.2 ms. The full authoritative pass still completed later, but parser additions were already handled by the same mutation pipeline and the final rescan replaces attributes synchronously rather than controlling visibility.

Persisting the entire full stylesheet was a useful failed intermediate. Although root gating made it visually inactive after USER-origin handoff, Chromium still paid enough matching cost for Browser Archeology and Liquid Dream to miss frames in the repeated workload. Attempts to detach registered CSS through the scripting API or replace it with a constructed sheet were not viable in the exercised browser path. Reducing the persistent copy to actual first-paint rules restored steady-state performance without changing the first released visual treatment.

The final five-repeat workload completed 2,000 frame callbacks with zero stalls. Median p95 frame intervals were 16.7 ms for original and Browser Archeology, and 16.8 ms for Terminal Vision and Liquid Dream. Median local load-to-active time was 107 ms Terminal Vision, 119 ms Browser Archeology, and 106 ms Liquid Dream. These remain laboratory measurements, not field guarantees.

Live network, parser, machine, and automation scheduling varied substantially. These observations establish paint ordering and first-state treatment, not a universal elapsed-time guarantee.
