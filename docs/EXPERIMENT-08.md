# Experiment 08 — GitHub profile visibility and scalar activity

> **Historical evidence only — superseded by Surface 0.2.0.** This record describes the removed multi-renderer architecture. A/B/C, Dark Reader, renderer selection, correction toggles, and multi-renderer test modes are not current product paths. Do not follow this file's instructions or next steps as active work; see [the authoritative project state](PROJECT-STATE.md) and [Iteration 10](EXPERIMENT-10.md).

October 5, 2026. Baseline: `development` after Experiment 07. [Shared learning log](LEARNINGS.md).

## Owner observation and hypothesis

Owner observation: GitHub user profiles have visibility issues in Browser Archeology. Terminal Vision has a specific visibility problem around the green activity boxes.

The working hypothesis was that these were paired-treatment failures rather than a need for a GitHub host correction. A live profile showed Browser Archeology retaining white authored header labels after repainting the header gray. Terminal Vision retained GitHub's near-white contribution level zero on a dark canvas, while authored dark text inside native activity disclosure rows remained nearly invisible.

## Correction-free failures

The first contextual probe found ordinary GitHub navigation text classified as a protected brand because its generated design-system class contained `Brand`. Tightening that match fixed the fixture but not the live Platform control: a clipped responsive avatar still had a bounding box over the button and caused a false media-overlay classification.

Requiring painted hit-test evidence removed that false overlap, but initially stopped recognizing the fixture's genuine image-backed `figcaption`. The final rule combines painted hit testing with the explicit local `figure`/`picture` relationship. It preserves the known overlay while ignoring clipped media that is not painted at the sampled point.

## Changes

- Brand recognition now treats logo and wordmark names as strong evidence and accepts `brand` only as a whole class token, exact id, or stronger branding/brand-logo name.
- Media overlap now checks painted hit-test evidence, retaining an explicit local exception for semantic figures and pictures.
- Native `summary` elements participate in the control model. Nested inline labels in simple links and controls inherit the paired foreground; contextual control descendants keep the control tone even when harmless author effects make their independent backdrop uncertain.
- Anchors that visibly behave as buttons—bordered, padded, and box-like—receive the action/control treatment without a host class or correction.
- Terminal Vision maps semantic grid cells with `role="gridcell"` and `data-level="0"` through `"4"` to a monotonic dark-green-to-phosphor scale. Browser Archeology and Liquid Dream retain the authored scale.

## Evidence and visual review

The public `https://github.com/aelishRollo` profile was captured at 1440 × 1100 with corrections off in simple and contextual Browser Archeology and Terminal Vision. The affected Platform, Search, Sign in, Sign up, and contribution-activity disclosure labels had no remaining base-color contrast failures in the targeted probe. Terminal Vision rendered the five activity levels as `#102d1d`, `#176244`, `#2f9e55`, `#7eea94`, and `#d7ff4e` in both renderers.

Visual review found Browser Archeology's global header controls readable and consistent with its system chrome. Terminal Vision's previously pale contribution cells now form a visible intensity scale on the dark graph, and the activity disclosure headings are light on dark instead of dark on dark. The changes add no host correction and preserve the original contribution ordering.

## Validation and limits

The build, all eight unit checks, and all 18 isolated Chromium checks pass. The hierarchy fixture now covers a generated design-system `Brand` substring, a filtered nested control label, a visually button-like link, a native disclosure row, and all five semantic grid levels. Existing overlay preservation still passes.

The five-repeat local performance smoke produced 50 valid samples, 5,000 completed frame callbacks, 1,500 trusted clicks, no untrusted clicks and no stalled frame waits. Contextual application times on the fixture ranged from 23.0–40.3 ms across the three themes. This headless local fixture is a regression smoke check, not a field performance claim.

This iteration is targeted to the reported profile failures. The simple renderer can still place themed foregrounds on unrecognized authored white profile cards, README content, or the white activity-overview visualization. Fixing those requires a broader structural surface category and should not be approximated by recoloring arbitrary `div` elements.

## Next experiment

Test a general data-visualization region owner on an unseen dashboard and a second profile-style page. The candidate should pair a graph, its legend and its summary panel without consuming unrelated sibling cards or relying on host class names.
