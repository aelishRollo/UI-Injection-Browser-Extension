# Iteration 35 — bounded navigation work and valid performance controls

Date: October 12, 2026

## Owner direction and landing order

The owner explicitly asked to merge the existing Iteration 34 work first, then fix the observed navigation and performance issues and merge again. Pull request 4 landed the existing `development` snapshot in `main` as merge commit `d81a6535824c61243143d4f42a78035dd4fa5a43` before this iteration began. This record covers only the follow-up work.

## Reproduced failures

The 800-section SPA fixture exceeded its 200 ms next-frame guard in repeated runs at 407.4, 246.7, and 260.1 ms. A later route sample reached 136.7 ms, while the long-scroll fixture then took 1,846.6 ms. Unthemed controls also varied widely, so those frame numbers alone did not identify renderer cost.

Code inspection found a concrete renderer regression from Iteration 34. Every large semantic route called composite-landing recognition, which measured all direct sections before proving that the route contained any media. The 800-section editorial destination contains no media, so this defeated the intended viewport-bounded large-addition path with unnecessary layout reads.

The navigation harness also had four measurement errors:

- enabled and disabled navigations did not wait for the registered startup stylesheet or the renderer's complete `active` state;
- every control ran before its themed sample, introducing fixed ordering bias;
- the disabled long-scroll control did not return to the top or verify the positional class transition;
- a slow unthemed control raised or removed the absolute budget and still printed `PASS`.

The earlier scroll probe also moved the page before the measured scroll and did not restore it, so the timed bottom scroll could become a no-op. Marker-write counts could prove paint stability but could not prove that an idempotent expensive scan had not run.

## Unified renderer and regression changes

Composite-landing recognition now rejects authored paint/effects first, proves the direct semantic-section shape and the presence of section-owned media before reading layout, caches section rectangles, and stops after finding four substantial sections. Its stable-DOM semantics remain the same: the candidate must still be a wide main landmark with at least four substantial direct semantic sections and prominent media inside one of those sections.

The renderer now exposes bounded incremental diagnostics for mutation batches, large additions, large-ancestor scans, and successful positional-root shortcuts. Removal-only batches are included. A positional change counts as a shortcut only when it avoids the conservative full scan. These are diagnostics on the same production path, not a second renderer.

The navigation regression now:

- synchronizes the registered startup stylesheet and waits for `active` or `disabled` content state;
- alternates control/theme order and normalizes both scroll modes to the top;
- keeps the absolute 200 ms route and 300 ms scroll gates, including healthy-control requirements;
- requires the route to exercise a renderer large-addition batch under 100 ms;
- requires scroll state to use exactly one sub-16 ms positional shortcut, schedule no incremental subtree scan, replay no classification stages, and rewrite zero established article markers;
- verifies the bounded large-ancestor class path separately with zero marker rewrites.

The browser is kept foregrounded and background throttling is disabled for these foreground regression measurements. This removed the earlier false `INCONCLUSIVE` success path without weakening the product budgets.

## Repeated workload and paint treatment

The performance harness now uses the same startup-style synchronization, foreground page, and scheduler controls. It prints frame, stall, long-task, and per-mode validity totals. A mode needs a valid majority of its repeated samples, so one transient invalid sample remains visible without destroying the median, while a systematic failure makes the command exit nonzero.

With that harness, the already-merged `d81a653` baseline produced only 2/3 valid original samples, 3/3 Browser Archeology, 0/3 Liquid Dream, 3/3 Monochrome Signal, and 0/3 Terminal Vision: 1,500 completed callbacks, nine watchdog stalls, and one recorded long task. This is a same-machine temporary-copy comparison using the final harness.

Two declarative paint costs then reproduced selectively:

- Liquid Dream was invalid in 5/5 and 4/5 repeated samples before its change. Removing broad outer surface, reading, panel, hover, and control shadows retained the solid violet reading plane, violet/blue gradients, rainbow title edge, cyan links, pink interactions, borders, radii, and an inset control highlight. It subsequently produced 0/3 and 0/5 invalid samples.
- Terminal Vision remained invalid in 2/5 and then 3/5 samples. Its surface treatment now keeps one repeating scanline grid and inset depth while removing the second perpendicular grid and broad outer glow. The page scanline, phosphor palette, typography, borders, and interaction glow remain. The next three-repeat workload had 15/15 valid samples and no stalls or long tasks.

Before/after fixture screenshots were visually reviewed. Both themes retained their hierarchy, identity, contrast, and controls; the differences were limited to the reduced decorative depth and grid density described above.

## Final evidence and limits

The final build and 12 unit checks pass. All 17 isolated browser checks pass. The strict navigation run measured:

- large-route frame median 69.1 ms versus 42.6 ms unthemed control;
- renderer large-addition batches of 67.6, 58.9, and 59.6 ms;
- bounded large-ancestor scan of 11.9 ms with zero article-marker rewrites;
- long-scroll frame median 12.2 ms versus 28.9 ms control;
- positional-root shortcuts of 2.6, 2.3, and 2.4 ms with zero marker rewrites.

The final five-repeat workload produced 25/25 valid samples, 2,500 completed callbacks, zero stalls, and zero recorded long tasks. Median sampled content-engine work was 21.98/18.67/19.65/17.83 ms for Browser Archeology/Liquid Dream/Monochrome Signal/Terminal Vision. Median p95 frame cadence was 16.8 ms for the unthemed control and about 83.3–83.4 ms for all four themes in this final headless run. That shared themed cadence is materially slower than earlier historical runs and remains an unresolved laboratory limitation. The baseline's invalid Liquid and Terminal samples prevent a valid p95 before/after comparison, and the workload still lacks a frozen-style equivalent-output control and compositor trace. Do not present the zero-stall result as a field-performance or universal regression-free claim.

Next bounded iteration: confirm rapid route changes and long-page scrolling in the owner's foreground browser. If the shared themed cadence is visible there, capture a paint/compositor trace with a verified equivalent-output frozen-style control before simplifying more theme identity or changing shared classification.
