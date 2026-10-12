# Iteration 37 — full-area Liquid Dream rainbow

Date: October 12, 2026

## Owner observation and prior failure

The owner reported that the Iteration 36 Liquid Dream change “did basically nothing.” This is direct visual feedback: 4–6 px rainbow edges were present, but the title and heading interiors still read mainly violet, blue, and teal. A passing stylesheet assertion and performance run did not establish that the visual request had been satisfied. Retain this failed intermediate in the record.

## Bounded treatment

The declarative Liquid Dream package now uses five-stop, dark, saturated rainbow gradients over the **full title, section-heading, and navigation surfaces**. The pink, amber, green, cyan, and violet families each occupy a visible part of those regions. The bright narrow edges from Iteration 36 remain for definition, while the long reading plane stays solid and broad outer shadows stay absent. This is static background paint in the existing theme contract; no new renderer path, per-host selector, animation, or scroll-time work was added. The popup and in-page preview swatches use the same dark heading gradient.

The hierarchy regression now checks all five computed title colors as well as the background-layer dimensions and placement. It checks light text and cyan links against every heading and navigation stop. Sampling 100 interpolated colors between each pair of heading stops found minimum contrast of 5.94:1 for light ink and 4.53:1 for cyan links; navigation minima were 7.52:1 and 5.73:1. This checks the CSS color path, not every possible authored overlay.

## Visual review and validation

Local before and after review used the Iteration 36 MDMI and Wikipedia captures against the new captures. The MDMI hero now has a broad, visibly multicolor dark title panel, rather than only a narrow line above the copy. Wikipedia's article title, section headings, navigation, and rails carry the same full-area treatment; ordinary reading regions remain solid. The isolated hierarchy screenshot also shows the five-color heading plane on a long document. These are reviewed screenshots and targeted page states, not universal site coverage.

`npm run build`, `npm test` (12 checks), and `npm run test:browser` (17 checks) pass. Strict `npm run test:navigation` passes the 200 ms route and 300 ms scroll guards: 78.4 ms themed route median against 44.8 ms control, 64.7–72.8 ms renderer route batches, 12.8 ms long-scroll median against 81.3 ms control, 2.3–2.4 ms positional shortcuts, and zero established article-marker rewrites. Deferred table checks also pass.

The first five-repeat performance run had 22/25 valid samples because unchanged Terminal Vision stalled in three of its five samples. Liquid Dream was 5/5 valid with zero stalls and no recorded long tasks, but its median p95 frame interval was 133.2 ms. An immediate unchanged repeat passed 25/25, completed 2,500 frame callbacks with zero stalls and no long tasks, and measured a 66.7 ms Liquid Dream median p95 interval, 21.56 ms sampled engine work, and 258.97 ms task total. Other unchanged themes also had widely different frame cadence across these runs. The earlier thin-edge run measured 16.8 ms Liquid Dream median p95, 22.92 ms engine work, and 268.09 ms task total. These runs support absence of a Liquid Dream stall in this local workload, but they do not isolate a paint-cost change or establish field cadence.

Next bounded iteration: review the owner's foreground MDMI interaction state. If scrolling or frame cadence remains visibly poor, compare equivalent-output compositor traces before changing the solid reading plane or adding decorative effects.
