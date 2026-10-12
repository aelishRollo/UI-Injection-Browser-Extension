# Iteration 33 — retain established paint during large hydration batches

Date: October 11, 2026

## Owner observation

After Monochrome Signal became a dark theme, Wikipedia again showed vertical side strips and elements cycling through themed, unthemed, and themed states. The owner requested one shared lifecycle fix that future themes inherit.

## Reproduction and cause

An isolated Chromium probe on [María Sabina](https://en.wikipedia.org/wiki/Mar%C3%ADa_Sabina) at 1440 × 900, after the page's ready marker and before scrolling, found both `html` and `body` without page ownership. The body exposed Wikipedia's `rgb(248, 249, 250)` background in Monochrome Signal and Terminal Vision. Scrolling restored both roots to the selected dark canvas. This establishes a theme-independent ownership gap; the exact owner-visible strip pixels were not captured in isolation.

A four-theme fixture reproduced the mechanism. A class mutation on an already themed body and a large inserted section in one batch made the old code restore the entire body subtree. The large-addition walker then classified only viewport-relevant content and did not rebuild page ownership or offscreen table markers. The fixture failed before the fix with `body` context `null` in Terminal Vision. Its prior offscreen table expectation also encoded the paint loss and has been strengthened to require continuous ownership.

## Unified-path change

Large addition batches retain existing descendant paint ownership while the shared large-addition walker classifies new content. When the batch includes an existing `html` or `body` root, the renderer restores that root alone and re-evaluates its canvas. This still detects a genuine authored background image introduced by the same class mutation. Small updates continue to restore and reclassify their affected subtree. No theme or Wikipedia selector was added.

## Validation and limits

The four-theme browser fixture now requires continuous body, shell, and table ownership after a combined class change and large insertion. It also requires an actual authored body gradient to enter preservation during a large batch and return to page ownership when removed. The navigation fixture now requires an offscreen Aircraft table and last row to remain themed through route growth, then checks them again on scroll entry.

The same isolated María Sabina probe after the fix held root and body `page` ownership and the correct dark computed canvas color before and through eight alternating scroll positions in both dark themes. This is a structural and computed-paint check, not a pixel-level confirmation in the owner's browser. An owner-browser review of Monochrome Signal's exact side strips and transient elements remains the next bounded check. If a visible flicker persists, capture the affected element's ownership and computed paint at the transition; do not add a theme-local patch.

The build, 12 unit checks, 15 browser checks, and navigation suite pass. The long article navigation check reached the next scroll frame in 20.2 ms in its final run. The five-repeat local workload produced 2,500 completed callbacks, zero stalls or recorded long tasks, and median p95 frame intervals of 16.7–16.8 ms across original and all four themes. These isolated timings vary by run and do not establish field smoothness.
