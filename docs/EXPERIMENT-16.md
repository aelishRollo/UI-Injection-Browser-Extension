# Iteration 16 — declarative theme treatment contract

October 9, 2026. Baseline: `development` after the MDMI foreground/effect settlement iteration. [Authoritative project state](PROJECT-STATE.md). [Shared learning log](LEARNINGS.md).

## Owner direction and reference review

The owner asked to inspect the rollison.dev theme implementations, identify what could transfer to Surface, and integrate the parts that would scale. The public site uses one head bootstrap for selection, persistence, stylesheet readiness, and switching while independently authored stylesheets provide each theme's known-DOM treatment. It also contains theme-specific animation, random selection, view transitions, and direct selectors for site-owned components.

Surface retained the scalable package boundary and rejected the parts that conflict with its architecture. It does not import rollison.dev selectors, layout overrides, animation, randomization, remote assets, or transition snapshots. Surface continues to use one unified purpose-and-paint renderer on arbitrary sites.

## Implementation

`src/themes.js` is now a small registry, while one independent module under `src/theme-definitions/` owns each theme's declarative treatment package:

- required palette, typography, border, and shape tokens;
- icon style and heading-icon capability;
- optional packaged-relative assets;
- context and interaction-state motifs;
- purpose treatments for reading regions, sections, panels, data, titles, navigation, and fields;
- optional scalar data colors, post-treatment chrome, and bounded responsive rules;
- navigation-fade paint consumed by the existing verified recognizer.

`src/styles.js` is now a generic compiler from stable treatment targets to the unified renderer's namespaced attributes. It no longer selects theme behavior by theme id. `src/icons.js` consumes declared icon capabilities rather than inferring them from a theme id.

`src/theme-contract.js` validates definitions before the build removes or recreates `dist/`. It rejects missing tokens, unknown treatment and purpose targets, malformed declarations, remote or absolute asset paths, invalid responsive rules, and malformed scalar grids. This remains an internal authoring contract, not a public plugin or remote theme format.

## Compatibility evidence

Before editing, the startup and full stylesheet for each of the three themes was hashed. After the refactor, all six outputs retained the same byte length and SHA-256 digest. The change therefore preserves the exact generated CSS rather than relying only on screenshot similarity.

New unit checks validate the contract, reject remote assets and unknown treatment targets, verify base text/link/accent contrast, enforce 12 KB startup and 35 KB full stylesheet budgets, and preserve the absence of animation declarations, keyframes, and fixed paint. Twelve unit checks and the build pass.

All 13 isolated Chromium checks pass, covering selected-theme first paint, all themes, purpose hierarchy, contrast, preservation, dynamic updates, correction reuse, frames, the in-page picker, 20 switches, restoration, and popup settings.

The five-repeat local workload produced 20 valid samples and 2,000 completed frame callbacks with zero stalls. Median p95 frame intervals were 16.8 ms original, 16.8 ms Terminal Vision, 16.7 ms Browser Archeology, and 16.8 ms Liquid Dream. Median main-thread task totals were 199.12 ms, 263.97 ms, 277.48 ms, and 274.02 ms respectively. Median sampled content-engine time was 22.55 ms Terminal Vision, 25.64 ms Browser Archeology, and 30.95 ms Liquid Dream. These are local regression results, not field-performance claims.

## Boundaries

This iteration deliberately makes no visual change and adds no theme. A future theme can exercise the contract without adding a renderer path, but it still requires fixture coverage, cross-site visual review, contrast evidence, and performance validation. Theme packaging does not solve recognition failures; those continue to be addressed through the unified semantic, structural, preservation, contrast, and lifecycle pipeline.
