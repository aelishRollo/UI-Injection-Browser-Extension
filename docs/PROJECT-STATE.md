# Current project state

> **Authoritative architecture record.** Read this before changing Surface. If an older experiment, finding, screenshot note, or next-step recommendation conflicts with this file, this file wins.

Last confirmed October 8, 2026. Surface is version 0.2.0 and has one product rendering path.

## Current architecture

- One purpose-aware renderer serves Browser Archeology, Liquid Dream, and Terminal Vision.
- The renderer recognizes semantic and structural purpose, establishes paint ownership, resolves foreground/background pairs, and preserves uncertain media, brands, visualizations, and effects.
- Substantial neutral, heading-led panels inside known content regions can own paint as composite landing-page panels; sufficiently large neutral ancestors can own the page shell.
- Dynamic updates are batched. Inserted content and relevant class, state, label, and text mutations are reclassified; detached themed nodes are restored and released.
- Full-document navigations use a pre-paint root guard. The authored page remains transparent until settings resolve, the unified classifier has run, and the selected USER-origin theme stylesheet is installed; disabled and error paths release the guard after restoring the authored page.
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

## Documentation precedence

Use documentation in this order:

1. `AGENTS.md` for workflow and non-negotiable project direction.
2. This file and the current `README.md` for active architecture and operation.
3. The top “Current project state” section of `docs/LEARNINGS.md` for the latest evidence and owner direction.
4. `docs/EXPERIMENT-10.md` for the unification decision and its measured evidence.
5. Experiments 01–09, `docs/FINDINGS.md`, and their evidence folders only as historical research records.
