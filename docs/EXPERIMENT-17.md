# Iteration 17 — bounded route transitions

October 9, 2026. Baseline: `development` after Iteration 16, with preserved local work in progress. [Shared learning log](LEARNINGS.md).

## Owner observation

Navigating between pages had significant latency.

## Reproduction and cause

A deterministic single-page navigation fixture replaces one semantic route owner with 800 heading-led editorial regions and records the delay from the trusted navigation click to the next animation frame. Before this iteration, the themed route blocked that frame for **1,244.4 ms** on the local Chromium 153 run.

The route did not trigger a network wait. The delay came from the unified mutation batch: every inserted root was restored and fully classified synchronously before Chromium could paint the destination. This work was correct but scaled with the entire new page rather than with the content that could appear in the next frame.

## Unified-path correction

Large insertion batches stay in the existing purpose-and-paint pipeline, but their scheduling is now viewport-bounded:

- semantic route owners receive the same content, reading, panel, section, or navigation ownership evidence immediately;
- only child regions within one viewport margin are fully classified before the next paint;
- offscreen roots are observed without polling and enter the normal incremental scan when they approach the viewport;
- large deferred roots retain the same bounded treatment when they later enter view;
- detached deferred roots are unobserved and released during the existing removal lifecycle.

This does not add a renderer, a theme-specific branch, a host correction, or an alternate appearance. It changes when already-understood incremental work runs.

## Regression evidence

The dedicated navigation check requires the first destination region to be themed by the next frame, the 800th region to become themed after scrolling into view, and the click-to-frame interval to remain below 200 ms. Repeated final and exact-snapshot runs measured **132.4–137.9 ms**. Relative to the reproduced 1,244.4 ms case, the observed delay fell by about 89%. These are local regression measurements, not a field latency guarantee.

The full 13-check browser suite passed, including first-paint navigation, dynamic DOM, SPA navigation, restoration, frames, theme switching, and the extension controls. Twelve unit checks and the build passed.

The exact-snapshot five-repeat standard workload produced 20 valid samples and 2,000 completed frame callbacks with zero stalls and no recorded long tasks. Median p95 frame intervals were 16.8 ms for the original page and all three themes. Median sampled engine time was 24.64 ms Terminal Vision, 31.00 ms Browser Archeology, and 29.65 ms Liquid Dream. This fixture evidence checks for regression under the existing workload; it does not isolate all page or browser costs.

## Next bounded iteration

Review the route-transition measurement on a real application that replaces one deeply nested page container. If latency remains, measure the route's own DOM construction separately from Surface before changing classification thresholds or broadening deferred work.
