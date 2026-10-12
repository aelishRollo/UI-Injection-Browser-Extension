# Iteration 13 — canvas-first progressive startup

October 8, 2026. Baseline: `development` after Iteration 12. [Shared learning log](LEARNINGS.md).

## Owner observations

Iteration 12 fixed the unthemed navigation flash, but a theme could take multiple seconds to appear. Under Terminal Vision, the Wikipedia article [Students for a Democratic Society](https://en.wikipedia.org/wiki/Students_for_a_Democratic_Society) also showed white strips at the sides after the central page had started turning green.

These are lifecycle and canvas-ownership failures in the unified path, not reasons to add a renderer or a Wikipedia appearance correction.

## Measured cause

The Iteration 12 guard was released only after `renderer.start()` returned. On a loading document, that method waited for `DOMContentLoaded` and then ran every purpose, geometry, media, foreground, and contrast classification before resolving.

An isolated extension-enabled Chromium trace on the reported article observed:

- authored content hidden during startup;
- the first visible frame around 3.17 seconds;
- 1.71 seconds reported inside the apply interval in the baseline run;
- Wikipedia's viewport-wide neutral `.mw-page-container` becoming a recognized shell only during the late full scan.

The initial correction separated reveal from the full scan and produced a visible frame around 0.15 seconds. It was incomplete: the root and body were green, but the viewport wrapper remained white until about 1.91 seconds. This failure showed that base root paint does not cover a site-owned full-viewport canvas.

Visual review of the resulting live capture isolated another, persistent source of literal white strips. Each sticky side-navigation container used a 16 px, pointer-transparent `::after` pseudo-element positioned at the bottom, with an authored `linear-gradient(transparent, white)`. The surrounding navigation had been recognized and themed, but the generated scroll affordance retained its light-site terminal color.

## Bounded unified change

Startup now has two phases inside the same purpose-and-paint renderer.

The fast canvas phase:

- waits for `body`, not `DOMContentLoaded`;
- marks the document roots as page canvas;
- applies temporary theme background, base ink, link ink, type, and color scheme;
- recognizes large neutral ancestors around a semantic content landmark;
- also recognizes a large neutral element shared by the left and right viewport-edge hit-test chains;
- allows one guarded layout opportunity, bounded by a 50 ms fallback for throttled background tabs;
- installs the normal generated theme stylesheet and releases the pre-paint guard.

The authoritative phase runs after the first themed paint. It restores the temporary annotations to authored state, performs the existing complete purpose/media/contrast scan, removes the temporary startup treatment, and begins normal mutation observation. Theme switching on an already loaded document is protected from a race where a late canvas preparation could reinterpret Surface's own background motif as authored imagery.

The complete purpose pass also recognizes one narrow navigation-fade shape: a short bottom-sticky, pointer-transparent linear-gradient pseudo on an ancestor of a recognized navigation region. Only the matching `::before` or `::after` paint is mapped to the active theme's chrome/surface color. Arbitrary gradients and pseudos remain authored. This removed the two white Wikipedia bands without a host selector.

Repeated lifecycle validation exposed an independent timing-sensitive preservation case: an absolutely positioned caption inside a `figure` could miss its media relationship when geometry was sampled between paints. Explicit local `figure`/`picture` structure now takes precedence for positioned overlays and captions, retaining authored media foregrounds without broadening arbitrary overlap detection.

This is phased initialization of one renderer. The final attributes, preservation rules, generated stylesheet, restoration map, and dynamic lifecycle remain the existing unified path.

## Regression evidence

The parser-delay fixture now places its blocking script after a neutral viewport shell and delays it by 750 ms. Its frame sampler requires:

- at least one hidden pre-ready frame;
- no visible pre-ready frame;
- reveal while `document.readyState` is still `loading`;
- page context on the first visible frame;
- shell context and the Terminal Vision canvas color on that same frame;
- a theme-native generated fade on a recognized sticky navigation rail in every theme;
- complete full classification afterward.

Eight unit checks, the build, and all 13 isolated Chromium checks pass across startup, all themes, restore/switch cycles, hierarchy, media preservation, contrast, dynamic DOM, frames, the picker, and the popup.

The final isolated live trace on the reported Wikipedia page observed a hidden frame at 118 ms and the first visible frame around 309 ms. The root, body, `.mw-page-container` left edge, and `.mw-page-container` right edge were all `rgb(6, 17, 11)` in that frame. Full classification continued afterward and retained the green shell. Its diagnostics recognized two navigation fades, and visual review confirmed that the prior white sidebar bands now fade into the Terminal Vision surface. Network, machine, cache, and page changes make this targeted evidence rather than a general latency guarantee.

The final five-repeat local workload produced 20 valid samples and 2,000 completed frame callbacks with zero stalls. Median p95 frame intervals were 16.7 ms original and 16.8 ms for all three themes. Median load-to-applied time was 107 ms Terminal Vision, 109 ms Browser Archeology, and 121 ms Liquid Dream; median sampled content-engine time was 26.06 ms, 31.15 ms, and 33.23 ms respectively.

## Remaining boundary

The fast phase deliberately recognizes only the page canvas and a strongly evidenced viewport shell. Complex authored cards, media, application canvases, and detailed text pairs still wait for the authoritative pass. New startup failures should improve this bounded canvas evidence or reduce full-scan cost; they should not broaden the temporary phase into a second renderer.
