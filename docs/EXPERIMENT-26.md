# Iteration 26 — page canvas ownership during parser growth

Date: October 10, 2026

## Owner observation

On [María Sabina](https://en.wikipedia.org/wiki/Mar%C3%ADa_Sabina) in Terminal Vision at full laptop browser width, white vertical strips appear only after scrolling. The owner located them to the right of `div.mw-content-container` and left of `div.vector-column-start`, running from near the page top to about `#mwBQ` in that load. The owner could not provide a screenshot. This is distinct from the short horizontal sticky-rail fades found in Iteration 25.

## Reproduction and cause

Isolated Chromium captures at 1440 × 1000 and 1728 × 1000, including wheel scrolling and a delayed 1728 × 1000 capture, did not show the exact white pixels. The delayed live-page probe did expose a related ownership failure: the root remained `page` and the outer shell remained `shell`, but the body changed from `page` to `preserve` after parser and hydration work.

The shared `markPage()` check interpreted any computed body/root background image as authored paint. Terminal Vision itself installs a canvas image on a body already classified as `page`. An incremental parser pass therefore read its own prior paint as authored evidence and withdrew body ownership. A parser-delay fixture reproduced this deterministically: appending one body child after the first visible frame changed the Terminal Vision body marker to `preserve` before the fix. That makes exposed authored canvas paint at layout gaps plausible, but the exact strips remain unverified visually.

## Unified-path change

`markPage()` treats a computed background image on an already owned `page` root/body as theme paint during an incremental pass. An unowned image still counts as authored evidence. Full scans first restore authored state, so their image check remains conservative. No Wikipedia selector or theme-specific classifier branch was added.

## Validation and limits

The parser-delay regression failed before the change and now requires body `page` ownership both after parser growth and after load for every theme. A separate four-theme hierarchy check adds an actual authored body gradient, verifies `preserve`, removes it, and verifies return to `page`. On the exact María Sabina page after the fix, delayed post-scroll markers stayed root `page`, body `page`, shell `shell` at 1728 × 1000; before the fix the delayed body marker was `preserve`.

The exact owner-visible white strips were not reproduced in isolated screenshots. The confirmed fix closes one general canvas-ownership failure on that page, while removal of those particular pixels still needs review in the owner's browser. If they remain, the next bounded investigation is a post-scroll paint and geometry probe of the two adjacent column gaps in the affected browser state, retaining the shared recognition/preservation approach.

The final build, 12 unit checks, all 15 isolated Chromium checks, and the large-route regression passed. The large route reached the next frame in 165.4 ms against its 200 ms guard.
