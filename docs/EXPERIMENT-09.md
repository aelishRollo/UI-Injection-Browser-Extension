# Experiment 09 — static paint, batched scans and visualization pairing

> **Historical evidence only — superseded by Surface 0.2.0.** This record describes the removed multi-renderer architecture. A/B/C, Dark Reader, renderer selection, correction toggles, and multi-renderer test modes are not current product paths. Do not follow this file's instructions or next steps as active work; see [the authoritative project state](PROJECT-STATE.md) and [Iteration 10](EXPERIMENT-10.md).

October 8, 2026. Baseline: `development` after Experiment 08. [Shared learning log](LEARNINGS.md).

## Owner request and audit findings

The owner requested a performance and visibility audit with fixes. No specific new page failure was supplied, so the audit used the repository's isolated Chromium suite, the five-repeat performance workload, the existing GitHub visibility evidence, and visual review of the hierarchy fixture.

Measured baseline behavior identified three performance issues:

- Simple and adaptive Liquid Dream produced 66.7 ms median p95 frame intervals during the scroll/interaction workload. Contextual Terminal Vision and Liquid Dream produced about 50 ms.
- Simple/adaptive themes animated background position on every semantic surface; Liquid Dream also used fixed full-page and repeated multi-radial gradients. These are paint-heavy operations even when content structure is unchanged.
- Contextual mutation handling recomputed document-wide media rectangles separately for every added root, including nested roots in the same observer batch.

The performance profiler also had an evidence failure: its extension URL allow-list included `content.js` and `adaptive.js`, but not `contextual.js`, so contextual sampled engine time was always reported as zero.

The visibility audit reproduced a reusable pairing failure with a labelled SVG chart on a white panel inside a themed reading region. The chart, heading and summary are one authored visual unit; inheriting theme ink without its authored backing can make labels unreadable. Recoloring generic white `div` elements would be too broad.

## Changes

- Removed continuous decorative background animation from all renderers.
- Removed Liquid Dream's fixed/full-page gradient paint and replaced repeated multi-radial surface fills with a single static linear wash. Rainbow heading and navigation bands, rounded forms, typography and soft depth remain.
- Added conservative visualization recognition to C. It requires a large labelled SVG/canvas-style graphic, a visible solid owner with a label or heading, bounded controls, and no interactive/navigation/brand ancestry. The owner receives a `visualization` purpose/context and retains its authored paint and readable text pairing.
- Batched contextual mutation roots, discarded disconnected and nested roots, and shared one document-wide media geometry snapshot across the batch.
- Removed the now-unused prominent-animation scan and annotation.
- Included `contextual.js` in performance CPU-profile attribution.
- Added fixture coverage for authored chart background, HTML labels, SVG text, cleanup and all-theme contrast, plus assertions that simple/adaptive semantic surfaces have no continuous animation.

## Useful failed iterations

Removing continuous animation cut main-thread work substantially but Liquid Dream still produced a 66.7 ms p95 frame interval. Removing `background-attachment: fixed` was also insufficient. A small tiled page wash improved the interval to roughly 50 ms, and removing the page image entirely still left the same result. This isolated the remaining cost to repeated multi-radial fills on several visible surfaces. Replacing those fills with one linear wash restored the exercised frame cadence.

These failures are retained because “static” is not equivalent to “cheap”: large or repeated gradients can still impose meaningful paint cost during scrolling.

## Measured evidence

Five repeats produced 50 valid samples, 5,000 completed frame callbacks, 1,500 trusted clicks, no untrusted clicks and no stalled frame waits both before and after the final change.

| Renderer/theme | Baseline median task | Final median task | Baseline median p95 frame | Final median p95 frame |
|---|---:|---:|---:|---:|
| Simple / Terminal Vision | 363.9 ms | 245.8 ms | 16.8 ms | 16.7 ms |
| Simple / Browser Archeology | 236.0 ms | 228.3 ms | 16.8 ms | 16.7 ms |
| Simple / Liquid Dream | 380.2 ms | 231.0 ms | 66.7 ms | 16.8 ms |
| Adaptive / Terminal Vision | 379.7 ms | 260.3 ms | 16.8 ms | 16.8 ms |
| Adaptive / Browser Archeology | 257.7 ms | 262.4 ms | 16.7 ms | 16.7 ms |
| Adaptive / Liquid Dream | 397.8 ms | 256.1 ms | 66.7 ms | 16.8 ms |
| Contextual / Terminal Vision | 362.2 ms | 257.2 ms | 50.0 ms | 16.8 ms |
| Contextual / Browser Archeology | 244.1 ms | 238.4 ms | 16.7 ms | 16.8 ms |
| Contextual / Liquid Dream | 352.7 ms | 250.5 ms | 50.1 ms | 16.7 ms |

The original/off median task duration was 195.6 ms at baseline and 196.8 ms in the final run. Contextual CPU samples are now non-zero because the profiler sees that module; the old zeros are invalid evidence and are not used as an improvement claim.

All eight unit checks and all 18 isolated Chromium checks pass. Visual review of all three hierarchy captures confirmed the chart panel retained a white background, dark HTML labels and original SVG fills/text while the surrounding document remained themed. A targeted live GitHub repository capture applied all three contextual themes without errors and looked coherent, but that repository page did not expose a qualifying data visualization; it is not evidence for the new chart recognition path.

## Limits and next experiment

The benchmark is a headless local fixture, not a field trace. Removing continuous paint is a measured local improvement, but real hardware, foreground browsing and long pages still need coverage. The visualization recognizer intentionally misses unlabelled, transparent, image-backed, very small or highly interactive charts rather than consuming arbitrary cards.

Next experiment: capture an unseen public dashboard and a second profile-style page with labelled SVG/canvas charts. Verify that chart, legend and summary remain paired, inspect false positives around hero illustrations and maps, and record foreground performance traces on representative hardware.
