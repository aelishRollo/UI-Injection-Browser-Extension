# Iteration 22 — neutral table-part ownership

October 9, 2026. Baseline: `development` after Iteration 21. [Shared learning log](LEARNINGS.md).

## Owner observation

Terminal Vision could theme a Wikipedia table owner while leaving an authored pale header or cell box above it. The result was a white table region inside an otherwise coherent dark surface.

## General cause and correction

The unified renderer already recognized ordinary tables inside a reading region as data and floated bordered key/value tables as panels. That ownership stopped at the `table` element. HTML table formatting boxes such as `thead`, `tbody`, `tr`, `th`, and `td` can paint independently, so an opaque neutral descendant could cover the theme-owned table surface.

Recognized data and fact-panel tables now inspect only their structural formatting descendants. An opaque near-white, low-chroma box can receive a `header` or `body` table-part role. Each theme maps those stable roles to its raised or base surface and line color, and the existing foreground resolver treats the mapped color as owned paint when selecting readable ink.

This is not a Wikipedia class rule or a broad table recolor. Chromatic cells, gradients, effects, explicit `data-level` cells, and `aria-valuenow` cells remain outside neutral table-part ownership. A sortable header may retain one non-repeating URL image over a neutral backing, preserving the source sort indicator while replacing the pale color below it.

## Evidence and useful correction

The first live probe showed why a simple “no background image” eligibility check was incomplete. Wikipedia's sortable header used `rgb(234, 236, 240)` plus a non-repeating SVG arrow aligned at the right edge. That version left the header pale. The final rule recognizes the neutral color and preserves the compact image rather than deleting the affordance.

On the first sortable `wikitable` in the Chromium article, the table was already recognized as `data` and painted `rgb(9, 26, 17)`. After the correction, both sortable `th` boxes carried the `header` table-part role and computed to Terminal Vision's raised `rgb(16, 45, 29)` surface. The original Wikipedia sort-image URL, no-repeat behavior, and right-center position remained. Screenshot review showed a continuous dark table with readable header and body text.

The isolated hierarchy fixture now reproduces independently painted neutral `thead`, `tbody`, `th`, and `td` boxes, a sortable-header image, and a chromatic status cell. For all three themes it requires exact header/body theme colors, at least 4.5:1 text contrast, retained header imagery, unchanged chromatic data paint, and exact restoration after disable.

## Validation

Twelve unit checks, the build, and all 14 isolated Chromium checks pass. The five-repeat performance workload produced 20 valid samples, 2,000 completed frame callbacks, zero stalls, and no recorded long tasks. Median p95 frame intervals were 16.7 ms for original, Terminal Vision, and Browser Archeology, and 16.8 ms for Liquid Dream. Median sampled content-engine time was 19.24 ms Terminal Vision, 22.34 ms Browser Archeology, and 21.99 ms Liquid Dream. These are local regression measurements; the live Wikipedia result is targeted visual and computed-style evidence, not a universal table-compatibility claim.

## Remaining boundary

Tables outside a recognized reading hierarchy remain conservative, and chromatic or effect-backed table parts are intentionally preserved because they may encode data or status. A future concrete failure should distinguish a safe paint-ownership signal before broadening that boundary.
