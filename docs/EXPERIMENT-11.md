# Iteration 11 — composite landing-page ownership

October 8, 2026. Baseline: `development` after the unified renderer in Iteration 10. [Shared learning log](LEARNINGS.md).

## Owner observations

On `https://en.wikipedia.org/wiki/Main_Page`, Browser Archeology placed its decorative close, maximize, and minimize artwork in the vertical middle of `#Welcome_to_Wikipedia` and other tall title regions. On the same page, Terminal Vision left large white or pale regions.

## Reproduction and cause

An isolated Chromium capture at 1440 × 1000 showed the Browser Archeology window-control background layer at `50%` vertically. Terminal Vision left the 1440 × 3870 neutral page container and the large top, left, right, and lower editorial panels authored white or pale.

The page is not a continuous prose article. It uses a semantic section around several substantial, neutral, heading-led `div` panels. The unified renderer recognized the outer section but deliberately did not claim arbitrary nested containers, and shell recognition only followed a reading-document purpose. A later class-driven rescan could also add a context annotation before purpose recognition; with the USER-origin stylesheet already active, the next computed-style read saw Surface's own motif and rejected it as authored image paint.

## Bounded change

- A solid, pale-neutral `div` inside known content can become a content panel only when it is visible, substantial, heading-led, text-bearing, low in controls, and free of uncertain paint. When candidates nest, only the outer recognized boundary is used.
- A large, text-bearing known content region can establish paint ownership for sufficiently wide neutral ancestors, extending the existing document-shell rule to composite landing pages.
- Purpose recognition treats theme-owned paint on an already-recognized page, shell, content, chrome, or control as safe during a rescan. Authored image backgrounds remain excluded.
- Browser Archeology's title icon and decorative window controls use fixed top offsets at desktop and narrow widths instead of vertical centering.

No host selector or parallel renderer was added.

## Evidence

The hierarchy fixture now includes a composite landing region, two neutral heading-led panels, a neutral shell, and a 72px-tall title. It verifies ownership and Terminal Vision colors, exact top anchoring of Browser Archeology's window controls, class-driven purpose retention while theme CSS is active, all three themes, restoration, and the existing narrow-layout behavior.

Eight unit checks and all 12 isolated Chromium checks pass. In a post-change live capture of Wikipedia's main page, the full-page neutral wrapper became the Terminal Vision page color, the four large editorial regions became Terminal Vision content surfaces, and no pale region at least 140 × 40 CSS pixels remained in the first two viewports. `#Welcome_to_Wikipedia` reported its window-control layer at 2px from the top. Visual review confirmed the large white areas were gone and Browser Archeology's control clusters sat at the top edge.

The first post-change five-repeat performance workload had zero stalls but an anomalous 66.7 ms Liquid Dream median p95 frame interval. A same-build repeat completed all 2,000 frame callbacks with zero stalls and returned median p95 intervals of 16.7 ms for Terminal Vision and 16.8 ms for original, Browser Archeology, and Liquid Dream. Median sampled engine time was 32.29–41.42 ms across the themes. The conflicting first run is retained as measurement variability; neither local run is field-performance evidence.

This remains bounded structural evidence. Small preserved brand backings, native fields, and short utility flyouts can remain authored; arbitrary colored cards, image-backed regions, and uncertain effects are not promoted by this rule.
