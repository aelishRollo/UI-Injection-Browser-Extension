# Current project state

> **Authoritative architecture record.** Read this before changing Surface. If an older experiment, finding, screenshot note, or next-step recommendation conflicts with this file, this file wins.

Last confirmed October 9, 2026. Surface is version 0.2.0 and has one product rendering path.

## Current architecture

- One purpose-aware renderer serves Browser Archeology, Liquid Dream, and Terminal Vision.
- Each theme is a validated declarative treatment package over the renderer's stable contexts, purposes, states, icons, responsive rules, and optional packaged assets. `src/styles.js` compiles that contract; it does not select theme-specific renderer branches.
- The renderer recognizes semantic and structural purpose, establishes paint ownership, resolves foreground/background pairs, and preserves uncertain media, brands, visualizations, and effects.
- Substantial neutral, heading-led panels inside known content regions can own paint as composite landing-page panels; sufficiently large neutral ancestors can own the page shell.
- Short pointer-transparent bottom fades attached to recognized sticky navigation rails receive theme-native terminal paint instead of retaining a light-site strip.
- Dynamic updates are batched. Inserted content and relevant class, state, label, and text mutations are reclassified; detached themed nodes are restored and released.
- Full-document navigations keep a compact selected-theme first-paint sheet and the unified renderer resident at `document_start`. The sheet uses the normal theme selectors for core surfaces, typography, hierarchy, and primary motifs while leaving secondary interaction/icon/state rules to the full USER-origin sheet. Top documents bootstrap from the registered theme token and classify parser additions before paint. A short guard lasts only through the first parser-time treatment; USER-origin handoff and the complete document pass do not control first visibility.
- Expressive theme CSS is static. Continuous animation, fixed full-page gradients, and repeated expensive radial paints are not part of the current system.
- Verified host role corrections are automatic and narrowly scoped. There is no user-facing correction mode.
- The settings schema contains only the global enabled state, selected theme, and exact-host exceptions.
- Disable and theme switching restore the author's prior attributes and inline properties without reloading the page.

`src/contextual.js` is the historical internal filename of the unified engine, not an available “contextual” mode. Likewise, the `renderer` key in diagnostics describes engine diagnostics; it is not a selectable renderer setting.

## Superseded architecture

The following were deliberately removed and are not dormant options:

- renderer A/B/C selection;
- the semantic-only renderer path;
- the Dark Reader adapter, dependency, stylesheet bridge, and related cleanup code;
- the correction toggle and corrections-off baseline;
- multi-renderer popup controls, test matrices, and performance modes.

Do not restore these paths, add a second renderer, or resume A/B/C comparisons unless the owner explicitly changes the project direction. Experiments 01–09 and `docs/FINDINGS.md` preserve evidence that led to the unified design; their instructions, recommendations, “current” statements, and next experiments are historical.

## Rules for future work

1. Improve the unified recognition, preservation, contrast, lifecycle, or theme-treatment pipeline from a concrete failure.
2. Prefer reusable semantic or structural evidence over host-specific appearance patches.
3. Add a regression fixture for a generalized failure before or with its fix.
4. Preserve uncertain content rather than broadly repainting arbitrary containers.
5. Keep one production path and one theme matrix. A diagnostic probe is not a new product mode.
6. Record measured behavior, visual review, owner observations, hypotheses, failures, and unresolved limits distinctly in `docs/LEARNINGS.md`.

## Current validation baseline

The unification in [Iteration 10](EXPERIMENT-10.md) passed eight unit tests and 12 isolated Chromium checks. A six-site × three-theme live capture covered Wikipedia, YouTube, GitHub, MDN, IKEA, and Excalidraw. The final five-repeat local workload produced 20 valid samples, 2,000 completed frame callbacks, zero stalls, and median p95 frame intervals of 16.7–16.8 ms. These are regression and review evidence, not universal compatibility or field-performance claims.

Known boundaries remain shadow roots, canvas/WebGL pixels, arbitrary SVG and background media, inline-style-only changes, page-world CSSOM-only updates, geometry-only changes, and complex rendered-pixel compositing. These boundaries should not be answered by silently adding another renderer.

A targeted October 8 Wikipedia main-page iteration removed the remaining large pale Terminal Vision regions by recognizing the composite panel hierarchy and neutral shell. Browser Archeology window artwork is top-anchored on tall title regions. The eight unit checks and 12 isolated Chromium checks continue to pass. A repeated five-run workload produced 2,000 completed callbacks, zero stalls, and 16.7–16.8 ms median p95 frame intervals; this local and targeted evidence is not universal coverage.

A later October 8 startup iteration removed the visible authored-page flash on full navigation. A deliberately parser-delayed fixture recorded at least one hidden startup frame and no visible pre-ready frame; the released frame was already classified and painted with Terminal Vision. Eight unit checks and all 13 isolated Chromium checks pass. The exact-state five-repeat workload produced 2,000 completed callbacks, zero stalls, and 16.7–16.8 ms median p95 frame intervals. This verifies the exercised Chromium path, not every browser or failure mode.

The follow-up [Iteration 13](EXPERIMENT-13.md) corrects Iteration 12's unacceptable wait for `DOMContentLoaded` and the full scan. On the reported Wikipedia article, the baseline first visible frame occurred around 3.17 seconds. The final isolated live trace revealed Terminal Vision around 0.31 seconds with the page root, body, and both viewport edges already green; full classification completed later without controlling visibility. A separate narrow recognition maps the article skin's two sticky navigation fade pseudos from white to the Terminal Vision surface. The 13 Chromium checks pass, and a five-repeat workload again completed 2,000 callbacks with zero stalls and 16.7–16.8 ms median p95 frame intervals. Live timings are targeted observations, not universal latency guarantees.

[Iteration 14](EXPERIMENT-14.md) removes the remaining generic dark/base-theme phase before expressive theme classification. The selected canvas is now a persisted, generated `document_start` stylesheet for all three themes, and top documents read settings directly rather than waking the worker for startup state. The same unified recognizers perform a viewport-bounded first pass before content reveal, with cached geometry membership and bounded text/count evidence; parser mutation batches refresh neutral landmark ancestors that become viewport shells. The three-theme parser-delay regression requires exact guarded canvas colors and complete content/title classification in the first visible frame. On the reported Wikipedia article, the final trace hid authored content over the exact Terminal canvas, then revealed around 0.86 seconds with the reading region, title purpose, body, and both viewport edges already themed. This targeted run is variable live evidence, not a universal timing guarantee.

Iteration 14 passes eight unit checks, the build, and all 13 isolated Chromium checks. Its five-repeat workload completed 2,000 frame callbacks with zero stalls and 16.8 ms median p95 frame intervals for the original and every theme.

[Iteration 15](EXPERIMENT-15.md) corrects the remaining distinction between an exact loading canvas and the actual expressive theme. A compact theme-native first-paint sheet and the single renderer are now resident at `document_start`; parser mutations receive unified recognition before their rendering opportunity, and the root theme activation is reasserted by every document-root scan. The three-theme startup regression rejects visible unclassified content, not merely the wrong canvas. A final first-released-state capture of the reported Wikipedia article showed the full Terminal treatment and green viewport edges with no white or generic-dark intermediate state; its viewport fallback took 82.6 ms. The final repeated workload completed 2,000 frames with zero stalls and 16.7–16.8 ms median p95 intervals across original and all themes.

[Iteration 16](EXPERIMENT-16.md) integrates the scalable theme-package lesson from the rollison.dev implementations without importing their known-DOM selectors, animation, randomization, or transition system. Theme-specific treatment branches moved from the stylesheet compiler into validated theme definitions. The compiler output for all three full sheets and all three startup sheets remained byte-for-byte identical across the refactor. Twelve unit checks, the build, and all 13 isolated Chromium checks pass. The five-repeat workload again completed 2,000 frames with zero stalls and 16.7–16.8 ms median p95 intervals.

[Iteration 17](EXPERIMENT-17.md) bounds large incremental route insertions to content near the viewport before the next paint, then sends offscreen roots through the same unified classifier as they approach view. A deterministic 800-region SPA transition fell from 1,244.4 ms to 132.4–137.9 ms click-to-frame in repeated local Chromium runs while the final region was still classified after scrolling into view. Twelve unit checks, the build, and all 13 browser checks pass. The five-repeat workload completed 2,000 frames with zero stalls, no recorded long tasks, and 16.7–16.8 ms median p95 frame intervals.

## Documentation precedence

Use documentation in this order:

1. `AGENTS.md` for workflow and non-negotiable project direction.
2. This file and the current `README.md` for active architecture and operation.
3. The top “Current project state” section of `docs/LEARNINGS.md` for the latest evidence and owner direction.
4. `docs/EXPERIMENT-10.md` for the unification decision and its measured evidence.
5. Experiments 01–09, `docs/FINDINGS.md`, and their evidence folders only as historical research records.
