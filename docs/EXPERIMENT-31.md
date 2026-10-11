# Iteration 31 — table ownership during deferred scroll entry

Date: October 11, 2026

## Owner observation

The owner reports that the preceding fast-scroll fix made Federal Police (Mexico) much more usable. Some table visibility regressed. The owner also asked that readable visibility, scrolling performance, scalability, and regression checks become standing requirements in `AGENTS.md`.

## Reproduced failure

An isolated 1680 × 900 Terminal Vision run on the reported page, with Wikipedia's wide layout, reproduced the Aircraft table turning light after scrolling to its bottom. Before entry, the table had `purpose=data`, `context=content`, and a dark `rgb(9, 26, 17)` background. After the deferred section entered the viewport, the table lost its purpose and context; its background reverted to authored `rgb(248, 249, 250)`, and its last two inline-gray rows reverted to `rgb(239, 239, 239)`. This was broader than the earlier row-only mutation addressed in Iteration 29.

The section was restored to authored state during a large mutation. The viewport-bounded large-addition walker then classified the section and some rows, but not the table itself. Those row scans could not transfer neutral paint because their table ancestor no longer had a data purpose. This is a shared lifecycle gap, not evidence that the theme packages need separate table rules.

## Shared change and regression

The unified table-purpose and structural-paint decisions are reusable for a single element. When the large-addition walker reaches a visible table, it establishes the same semantic data or fact-panel ownership used by a normal scan. When it reaches a visible structural table part, it maps only the existing safe neutral paint to the theme's header or body role. Offscreen descendants stay deferred. No Wikipedia selector, theme-specific branch, or document-wide scroll scan was added.

A new long-article fixture restores an already themed table while offscreen, then scrolls its inline-gray final row back into view. It checks recovered data purpose, content ownership, and removal of the authored light table and row paint in all four themes. The existing navigation fixture still checks a large route and scroll-state frame. The reported live table retained dark paint on first and repeated entry in the final production build; its last two rows were dark in the reviewed screenshot.

## Validation and limits

The build, 12 unit checks, 15 browser checks, and four-theme deferred table navigation check pass. The navigation run measured 142.8 ms to the next frame for the existing large route and 43.6 ms for its long-article scroll case. A five-repeat isolated workload completed 25 samples and 2,500 frame callbacks with zero stalls or recorded long tasks. Median sampled renderer work was 21.37/17.51/21.28/23.37 ms for Browser Archeology/Liquid Dream/Monochrome Signal/Terminal Vision. Every mode, including the unthemed baseline, measured 33.4 ms median p95 frame intervals in this run, so that cadence is likely an environment limit and cannot be read as a theme-specific slowdown or compared directly with the prior 16.8 ms run. Live page timing and the owner's browser configuration may differ.

The remaining performance polish the owner mentioned has not been measured or changed in this iteration. A next bounded iteration can profile any remaining scroll roughness on the reported page after the owner exercises this build.
