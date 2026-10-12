# Experiment 24 — resilient outer paint ownership

Date: October 9, 2026

## Owner observation

Wikipedia again showed visibility failures on both sides of a Terminal Vision article. The requested correction had to scale beyond one page or one host.

## Reproduction and evidence

The historical `Students for a Democratic Society` article reproduced two independent lifecycle gaps at 1440 × 1000:

1. A neutral side rail could be created empty and populated later. Incremental scans began at the inserted navigation or settings descendants, so the already-existing pale rail owner was not reconsidered.
2. After the theme was fully active, Wikipedia's post-load shell hydration removed renderer-owned attributes from the document root, body, and outer page container. A frame trace recorded Terminal Vision ownership disappearing around 3.5 seconds, exposing the authored `rgb(248, 249, 250)` body and white page shell, then returning only after a later unrelated mutation.

These are observed lifecycle failures. The first is a late structural-maturity problem; the second is attribute reconciliation by a page runtime. Neither requires a Wikipedia selector or an appearance correction.

## Unified-path change

Utility-panel recognition now includes at most six eligible ancestors of an incremental scan root. This lets a late link or settings insertion mature its existing neutral owner into the shared navigation role without a document scan.

The mutation observer also watches the small set of paint-critical ownership attributes: active theme, USER-style handoff, context, and purpose. If a page removes one from an existing element, the unified recognizer repairs only that affected ownership in the same mutation microtask. Renderer-authored remove-and-reclassify batches are ignored when their final marker is present, so the repair does not form an observer loop.

Page-pair recovery treats a surviving root or body `page` marker as authoritative. This prevents the active theme's own canvas motif from being mistaken for authored background imagery when only the other marker is stripped.

## Regression coverage

The parser-delayed fixture now creates pale left and right rails empty, populates one with links and the other with settings before reveal, and requires both to have navigation ownership and exact theme paint in the first visible frame for every registered theme.

The hierarchy fixture removes root, body, shell, and rail ownership markers while each theme is active. It requires the original roles and computed paint to return, then separately removes only the body page marker to cover one-sided hydration.

## Live and performance validation

The final Wikipedia animation-frame trace retained Terminal Vision ownership on the root, body, outer shell, and side rails from the first visible frame through post-load hydration. The earlier white-side interval did not recur. The run is targeted evidence from a mutable public page, not a universal compatibility claim.

Validation passed 12 unit checks, the build, all 15 isolated Chromium checks, and the large-route regression at 139.9 ms. The five-repeat workload covered the original page plus four themes: 25 valid samples, 2,500 completed frame callbacks, zero stalls, and zero recorded long tasks. Median p95 frame intervals were 16.7–16.8 ms. Median sampled renderer work was 27.19 ms Browser Archeology, 26.47 ms Liquid Dream, 25.22 ms Monochrome Signal, and 22.80 ms Terminal Vision. These are local regression measurements, not field-performance claims.

## Remaining boundary

The repair observes renderer-owned DOM attributes, not arbitrary page-world CSSOM changes, geometry-only changes, shadow-root internals, or rendered pixels. Broad polling remains intentionally out of scope.
