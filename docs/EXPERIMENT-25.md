# Iteration 25 — shared container and visible-paint boundaries

Date: October 10, 2026

## Owner observations

Terminal Vision still showed horizontal bands beside Wikipedia after scrolling. Browser Archeology on Wikipedia remained the main canary for whether the engine understood visual containers. Monochrome Signal also had visibility failures. The requested direction was a general solution shared by all themes.

## Reproduction

On Wikipedia's Chromium article at 1440 × 1000, a 1,800 px scroll showed narrow horizontal bands beneath both sticky side rails. DOM probes found both rails still classified as navigation, while each rail's short pointer-transparent sticky fade remained rendered. That decorative pseudo-element crossed from the rail surface to the page canvas during scrolling.

The Monochrome Signal capture also showed pale Search and hide button faces with white text. Computed styles on those buttons reported a black background, white foreground, full opacity, and no pseudo paint. The visible native button face therefore differed from the CSS background used by the foreground pairing decision.

The container fixture represented another general gap: a semantic main landmark with seven controls cannot safely become one reading surface, but a substantial neutral editorial card with a real border inside it can still own paint independently. A pale block without an edge is deliberately ambiguous and should remain authored.

## Unified-path changes

- The single surface recognizer accepts heading-led neutral cards within a semantic main landmark when they have a visible border or shadow, substantial geometry and prose, and bounded control density. An existing content owner remains sufficient evidence for composite panels. A substantial labelled SVG or canvas keeps the visualization preservation path.
- The shared stylesheet suppresses recognized short, pointer-transparent sticky fades. Theme definitions no longer carry a fade color because the fade is decorative and its gradient caused the scroll seam.
- Recognized native buttons and button-type inputs use CSS appearance so the visible control face follows the background and ink selected by the shared paint rules.

## Validation and limits

The hierarchy fixture checks all four themes for a bounded card, an unbounded pale block, visualization preservation, CSS button appearance, and suppressed rail fades. A final live Wikipedia scroll capture at 1,800 px showed the side bands gone; both recognized fade pseudos computed to `display: none`. The final Monochrome Signal Wikipedia capture showed legible black Search and hide button faces. The local build, 12 unit tests, and all 15 isolated Chromium checks passed.

The large-route fixture passed at 196.1 ms to the next frame, below its 200 ms guard. The final five-repeat workload completed 2,500 frame callbacks, with zero stalls or recorded long tasks and 16.7–16.8 ms median p95 frame intervals. Median sampled renderer work was 29.18 ms Browser Archeology, 34.27 ms Liquid Dream, 28.89 ms Monochrome Signal, and 28.16 ms Terminal Vision. The fixture itself gained a mixed landmark, seven controls, and two card candidates, so these figures should not be treated as an isolated cost comparison against earlier iterations.

An intermediate fixture run caught a false positive: the broadened bordered-card rule claimed a labelled chart before visualization recognition. The large labelled graphic exclusion corrected it. This is why the boundary is encoded in the regression fixture.

The first candidate loop also inspected geometry and graphic descendants before eliminating unrelated `div`s. That unnecessary work was removed before final validation by testing semantic ancestry, visible edge, and neutral paint first.

MDMI.com's animated expertise cards remain authored during their partial-opacity reveal. This iteration does not infer every card on that page, since forcing opaque theme paint during an author effect would obscure the intended transition. The live screenshots and Chromium checks are targeted evidence, not universal website coverage.
