# Experiment 01 — initial findings

> Historical results: these measurements used Terminal Vision, Psychedelic Scrapbook, and Nutrition Facts. The active lineup is now Browser Archeology, Liquid Dream, and Terminal Vision; the older public-site and performance findings do not validate the replacement themes.


**The comparative prototype is loadable. Neither renderer has cleared the broad visual-quality gate.** Color adaptation is useful, but it does not solve safe surface treatment, text-over-media contrast, or brand preservation by itself.

The source portfolio is unchanged. This experiment does not select a final architecture or commit to a Dark Reader fork.

## Verified behavior

On Chromium 151.0.7922.34 in an isolated temporary profile:

- Three settings tests passed.
- Eleven browser checks passed: both renderers with all three themes; sampled image/filter preservation and existing pseudo-element icons; selected/invalid/focus treatments; dynamic insertion and SPA navigation; basic form/dialog interactions; a shared role correction across all themes; site disable including HTTP frames and navigation; 20 switches followed by computed-style restoration and no leftover style nodes; popup selection persistence.
- The exact expressive accent survived later adaptation. The USER-origin theme sheet is outside the site's stylesheet enumeration.
- The cross-origin stylesheet fixture and tested public-site captures reported no stylesheet-bridge fetch failures.

These are specific fixture checks, not a claim of universal semantic preservation, memory-leak freedom, or real-site workflow completion. Closed roots, all late CSSOM updates, trusted-input performance, and long browsing sessions are not covered.

Two integration defects were found and contained in the adapter without modifying the dependency: the published API's Promise-dropping Chromium messaging wrapper, and an inversion stylesheet left in open shadow roots after disable.

## Live-site pass

The renderer build was frozen before the unfamiliar-site pass; corrections were off throughout. No website-specific tuning was added in response to these captures.

| Site | Captures obtained | Preliminary visual observations |
|---|---:|---|
| Wikipedia | 6/6 | Terminal A places pale text on a retained white content surface. B corrects the surface mismatch. The black wordmark is difficult to see against the themed dark header. Scrapbook's body texture is mostly concealed by the site's own surface, reducing identity. |
| YouTube | 6/6 | Theme colors and control treatments apply; sampled video/thumbnail imagery remains recognizable. The short video advances during capture, so screenshots do not show an identical player state. Playback/menu/keyboard workflows are not certified by this pass. |
| GitHub | 5/6 after retry | Terminal B shows coherent broad color adaptation. Scrapbook B leaves dense text directly over cork, and some controls remain low contrast. A/Scrapbook capture timed out even on retry. |
| MDN — unfamiliar article | 6/6 | Nutrition Facts visibly carries its strong heading/rule treatment. Scrapbook puts cork directly behind long-form text, compromising the intended paper-on-cork hierarchy. B also exposes low-contrast text in an ad control. |
| IKEA — unfamiliar commerce | 5/6 | Terminal B shows theme identity while retaining sampled photography. Nutrition A makes some image-overlay headlines black over dark imagery. A/Terminal screenshot timed out. A later retry was interrupted before this site's combinations completed. |
| Excalidraw — unfamiliar app | 6/6 | The canvas stays white. Terminal A/B leave poor-contrast text/icons in places; B also recolors the SVG wordmark. This is not a quality pass, despite successful injection. |

There are **34 of 36 planned themed captures**, not 34 passing combinations. Initial GitHub capture failed before comparison; a separate retry recovered five combinations. Timeouts are unresolved measurements, not visual passes or proof of an engine defect.

Public-site screenshots and raw status records are in `test-results/live/` and `test-results/live-retry/`. The original browser-fixture screenshots and results are in `test-results/`. These artifacts are local and Git-ignored. Live content, ads, consent banners, network timing, and video progression limit exact comparisons.

## Performance measurements

The local harness recorded **35 samples**: five repetitions each of disabled, A with three themes, and B with three themes. Full effects stayed enabled. Order was rotated between repetitions, and no other test browser was left running during the measurement.

Only **4/35 samples** completed the workload without a stalled frame callback: four disabled samples. Every themed sample and one disabled sample encountered timeout-substituted callbacks; several did not finish the intended 100-frame workload within the eight-second bound. Their p95 frame/interaction values are explicitly `null`, not timing evidence. Raw intervals and stalled counts are retained in `test-results/performance/results.json`.

During the measured workloads, the sampler observed no content-engine CPU samples for A and roughly 0–6.7 ms per sample for B. This is sampled page-side scripting only; it excludes worker CPU and does not isolate CSS matching, style/layout/paint, GPU/compositor work, initial application, or theme cost. Incomplete workloads are not comparable CPU budgets, and no samples does not mean literally zero CPU.

**The performance gate is not cleared.** These results indicate a frame-delivery problem in this full-effect/headless setup; they do not identify whether the cause is rendering cost, the browser environment, or their interaction. Even nonanimated Nutrition Facts encountered stalls. Reproduce in a foreground browser and inspect rendering traces before attributing the cause or quoting real-world latency. A verified equivalent-output frozen-style control and trusted-input/live-site traces remain outstanding.

## What the experiment currently establishes

1. **Simple element CSS is insufficient as the sole general engine.** Wikipedia and canvas-app foreground/background mismatches are direct counterexamples to treating HTML roles alone as enough.
2. **Transformation earns further investigation, not automatic selection.** It fixes the Wikipedia dark-surface mismatch but does not guarantee readable text over images or correct SVG/logo treatment. The three-additional-passes criterion has not been established.
3. **Surface recognition matters for expressive themes.** Scrapbook needs text-bearing paper surfaces distinct from the textured page background. A universal background texture plus generic card selectors does not preserve that composition on unfamiliar markup.
4. **Semantic and media preservation need stronger handling.** The controlled role correction works, but unmarked error/success colors, logos, and foregrounds over media remain open problems. Adding per-site CSS would hide rather than resolve this evidence.

## Recommended next bounded experiment

Keep both current renderers as baselines. Test a small, general layer that treats foreground/background pairs together and distinguishes readable content surfaces, text over media, and controls from protected brand/media content. Evaluate the same failures plus fresh held-out pages. Specifically:

- Prevent a theme foreground override unless its underlying surface is known to support it, or derive an appropriate foreground for that surface.
- Apply paper/texture treatments to suitable roles without repainting image-bearing backgrounds indiscriminately.
- Separate UI SVG icons from protected brand/media before allowing paint transformation.

This is a recommendation informed by the captures, not an approved new architecture or an implemented third renderer. Broad deployment and the five-person learning sessions should wait until the readability/meaning failures are addressed. No telemetry was added.

## Reproduce or inspect

- Load the `dist/` folder as an unpacked extension using the steps in [README](../README.md).
- Run `npm test` and `npm run test:browser` for regression checks.
- Run `npm run test:live` for a separate, read-only public-site capture pass.
- Run `npm run test:performance` with no other browser test running for repeated local measurements. The harness bounds frame waits and marks stalled/incomplete samples invalid; it does not reduce theme effects.
- Read [the experiment protocol](EXPERIMENT.md) and [the theme-port record](THEME-PORTS.md) before treating an adaptation as full theme fidelity.

The final UI-only size adjustment and diagnostics-key rename occurred after the frozen live run; neither changes website rendering. The raw live report records SHA-256 hashes of its tested renderer build.
