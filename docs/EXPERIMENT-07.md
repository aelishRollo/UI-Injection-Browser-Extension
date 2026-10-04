# Experiment 07 — consistent inactive window furniture

October 4, 2026. Baseline: `f6e3dfc`. [Shared learning log](LEARNINGS.md).

## Owner observation and hypothesis

Owner observation: every substantial Browser Archeology element should have minimize, maximize and close buttons, but they should be greyed out so they do not seem clickable. Other UI details from the original Browser Archaeology skin should be reused where appropriate.

Hypothesis: repeated window furniture can unify the theme if each substantial region receives exactly one cluster and the cluster reads as unavailable decoration. A real existing heading remains the best title; an untitled region can still use a thin inactive strip without inventing a label. Reusing a few state and inset cues from the original skin should strengthen the system without inserting fake browser text or site-specific structure.

## Changes

- The title-bar SVG now uses muted `#808080`/`#a0a0a0` glyphs with pale embossed highlights instead of active black symbols. A unit check guards the disabled palette.
- A/B treat semantic documents, panels, dialogs, menus, listboxes, fieldsets and standalone navigation rails as substantial windows. The first eligible panel heading becomes its only title bar; later headings remain ordinary in-window hierarchy.
- C gives every recognized reading region and panel a window owner. Untitled panels and qualifying standalone navigation rails receive a 25-pixel inactive strip with the greyed control cluster.
- Compact header navigation is excluded. When a neutral utility wrapper and nested semantic navigation describe the same rail, C retains one outer window rather than producing a window inside a window.
- The previous narrow-width removal is replaced with a smaller 42 × 14 control cluster. The real title keeps reserved space, while all substantial windows retain the requested furniture.
- Appropriate original-skin details now include purple visited links, red hover/focus links, yellow note surfaces, grooved horizontal rules, recessed dotted field focus and embossed gray disabled controls. Fake menu labels, fake addresses and host-specific window names were not ported.

## Evidence and failures

The first semantic capture promoted both direct headings in one aside into title bars. The selector now chooses only the first eligible heading, preventing a single panel from acquiring multiple control clusters.

The first expanded Wikipedia capture framed both a neutral Contents wrapper and its nested semantic navigation. Recognition now treats ancestor/descendant neutral rails as one region; the fixture includes the same nested structure and asserts that only the outer contextual rail becomes a window.

The final 1440 × 1000 Wikipedia pass applied A and C across all three themes without horizontal overflow. Browser Archeology A shows inactive furniture on the article and standalone Contents rail. Browser Archeology C reports four window owners and three real title bars: the article, facts window, and the two large utility rails resolve without nested double frames. Visual review found the gray controls consistently legible as inactive furniture.

Eight unit checks, the build, and all 18 isolated Chromium checks pass. Browser coverage verifies the muted control colors, unchanged DOM control count, one panel title bar, untitled panel furniture, nested-rail suppression, narrow furniture retention, interactions, contrast handling, restoration and repeated theme switching.

## Limits and next experiment

“Substantial” remains bounded to semantic or strongly recognized regions, not every `div`, chapter, or data row. A/B cannot recover arbitrary class-only cards without risking widespread false windows. The gray strip still resembles familiar window controls, so it must remain noninteractive and visually muted; no tooltip, cursor or accessibility role should imply otherwise.

Next: review one commerce page and one application page for false standalone rails and over-framed dialogs. If the furniture still reads as clickable, test a lower-contrast monochrome cluster before changing interaction semantics.
