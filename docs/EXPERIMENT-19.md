# Iteration 19 — coherent paint across deferred route regions

October 9, 2026. Baseline: `development` after Iteration 18. [Shared learning log](LEARNINGS.md).

## Owner observation

When navigating between pages, large chunks of the destination alternated between one color, another color, and the first color again.

## Reproduction and cause

The deterministic 800-region SPA fixture reproduced the lifecycle behind the bands. Iteration 17 correctly bounded expensive foreground and descendant classification to the viewport, but its offscreen semantic sections retained their authored white background until the intersection observer admitted them to the unified scan. The recognized reading owner was already theme-colored, so a long destination could alternate between the theme surface and authored child surfaces as deferred regions approached the viewport.

This was a paint-continuity failure in the bounded scheduler, not a second renderer or a theme-definition problem.

## Unified-path correction

A large insertion that is already recognized as a reading route now receives one temporary paint-continuity marker. The generated theme sheets use that marker to make direct semantic article, section, and region children inherit the reading canvas while their expensive offscreen foreground work remains deferred. The provisional rule changes only the fallback background color; it does not remove authored background images. When a deferred region approaches the viewport, it still enters the ordinary unified classifier and receives complete purpose, foreground, contrast, icon, and state treatment.

The marker is recorded through the existing restoration map, so route removal, disable, and theme switching retain the normal cleanup behavior.

## Useful rejected attempts

Assigning complete provisional context and purpose attributes to every deferred section removed the bands but made the navigation frame take **700.7 ms**, which recreated much of the latency problem Iteration 17 removed. A single owner marker with a broad descendant selector avoided per-node annotation but produced one **214.0 ms** failure in five runs. Restricting the provisional selector to direct semantic route children kept the same fixture visually continuous and restored the established scheduling bound.

## Evidence

The navigation regression now requires all of the following before scrolling to the last region:

- the near-viewport section is fully classified;
- the route owner carries provisional paint continuity;
- the last offscreen section has not undergone context, purpose, or foreground classification;
- the last section nevertheless computes a transparent fallback rather than its authored white band.

After scrolling, the last heading must receive normal foreground classification. Five final repeated runs measured **138.5–198.2 ms** click-to-frame, all below the existing 200 ms guard.

The build, 12 unit checks, and all 13 isolated Chromium checks pass. The standard five-repeat workload completed 2,000 callbacks with zero stalls and no recorded long tasks. Median p95 frame intervals were **16.8 ms** for the original page and every theme. Median sampled content-engine work was **26.41 ms Terminal Vision, 25.57 ms Browser Archeology, and 25.60 ms Liquid Dream**; median main-thread task totals were **246.29 ms, 247.62 ms, and 244.70 ms** respectively. These are local fixture measurements, not universal field claims.

## Next bounded iteration

Review a real application whose route owner uses one non-semantic wrapper between the reading region and its large content blocks. Extend continuity only with structural evidence that preserves authored media; do not annotate every deferred descendant or relax the viewport-bounded foreground schedule.
