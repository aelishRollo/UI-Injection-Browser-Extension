# Iteration 10 — one unified renderer

October 8, 2026. Baseline: `development` after Experiment 09. [Shared learning log](LEARNINGS.md).

## Owner direction

The owner rejected the growing A/B/C comparison suite and its human-review bottleneck. The requested direction was to combine what had worked, discard what had not, and leave one performant, beautiful approach across articles, dense sites, commerce, media pages, and applications.

## Architecture decision

Surface now has one renderer. It retains the contextual pipeline's strongest general mechanisms: purpose recognition, explicit paint ownership, paired foreground/background resolution, conservative brand and media preservation, authored visualization units, theme-native scalar grids, semantic icon replacement, and static theme treatments.

The semantic-only renderer, Dark Reader adapter, renderer setting, correction toggle, stylesheet-fetch bridge, A/B/C popup controls, and nine-way test matrix were removed. Dark Reader is no longer a dependency. Verified role corrections apply automatically when a host lacks usable semantics. Historical experiments remain as decision evidence, not product modes.

The settings schema is v2 and contains only enabled state, theme, and exact-host exceptions. The extension and package are version 0.2.0.

## Dynamic and performance behavior

The unified mutation pipeline batches inserted roots, relevant class/state/label/text mutations, and removed roots. An affected connected subtree is restored to authored state before reclassification. Detached themed subtrees are restored and released from the renderer's strong restoration map, preventing indefinite retention during SPA churn.

The observer intentionally does not watch every inline-style or geometry change: doing so would observe the renderer's own custom-property writes or require continuous layout work. Existing CSSOM-only, inline-style-only, and geometry-only changes remain explicit boundaries.

Five repeats of original plus the three themes produced 20 valid samples, 2,000 completed frame callbacks, and zero stalls. Median p95 frame intervals were 16.7 ms for original and Browser Archeology, and 16.8 ms for Terminal Vision and Liquid Dream. Median main-thread task totals were 198.76 ms original, 259.13 ms Terminal Vision, 260.69 ms Browser Archeology, and 264.99 ms Liquid Dream. Median sampled content-engine time was 20.67–27.18 ms across themes. This is local headless fixture evidence, not a field-performance claim.

## Cross-medium review and useful failures

The unified live pass captured Wikipedia, YouTube, GitHub, MDN, IKEA, and Excalidraw under all three themes without application errors or horizontal overflow. Visual review found coherent article, repository, media, and commerce treatments. Excalidraw's canvas remains authored by design, while opaque controls over the canvas can now own a theme treatment.

Two correction-free failures from the live review improved the general model:

- A level-one heading inside an authored colored promotional card could be mistaken for a page title. Purpose recognition now preserves that authored colored heading pair unless its owner is already a recognized theme region.
- A solid control over media could be correctly classified as a control, then downgraded to a media pair during text resolution. Control ownership now remains authoritative, including authored `-webkit-text-fill-color`; the final IKEA probe measured the affected **Ok** action as `rgb(32, 25, 40)` on `rgb(255, 249, 241)`.

The local fixture now covers class-driven recoloring, text mutation, detached-node release, authored colored headings, solid controls over media, text-fill normalization, all three themes, narrow layouts, restoration, interactions, and 20 switches. Eight unit tests, the build, and all 12 isolated Chromium checks pass.

## Remaining boundaries

One renderer removes architecture ambiguity; it does not create universal visual understanding. Open and closed shadow roots, canvas/WebGL pixels, arbitrary SVG/background media, inline-style-only changes, and geometry-only changes remain bounded. Excalidraw demonstrates the intended fallback: preserve the authored canvas and theme only controls with sufficient paint ownership.

Next: use the unified renderer as the only product path. New work should improve general recognition or preservation from a concrete failure, add a regression fixture, and avoid reintroducing renderer choices or broad container recoloring.
