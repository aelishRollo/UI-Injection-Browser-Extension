# Experiment 06 — coherence before intensity

> **Historical evidence only — superseded by Surface 0.2.0.** This record describes the removed multi-renderer architecture. A/B/C, Dark Reader, renderer selection, correction toggles, and multi-renderer test modes are not current product paths. Do not follow this file's instructions or next steps as active work; see [the authoritative project state](PROJECT-STATE.md) and [Iteration 10](EXPERIMENT-10.md).

October 4, 2026. Baseline: `5e70b56`. [Shared learning log](LEARNINGS.md).

## Owner observation and hypothesis

Owner observation: Terminal Vision looks good on most websites, while Browser Archeology and Liquid Dream do not yet hold together as reliably.

The working hypothesis is that Terminal Vision succeeds less because it is dark and more because its identity is systemic: a quiet base palette, one low-contrast repeated texture, consistent typography, one bright accent, and related interaction states. Browser Archeology and Liquid Dream instead concentrated their strongest cues in isolated title bars, panels, or full rainbow fills. When a page supplied unfamiliar structure, Browser Archeology could expose a teal desktop directly behind prose and Liquid Dream could read as unrelated rainbow blocks.

## Changes

- Browser Archeology now carries a subtle four-pixel desktop dither, restrained system-chrome texture, navy heading hierarchy, selection-colored link hover, and matching text selection. Generic content surfaces keep a classic client-area bevel rather than an unexplained navy stripe.
- A/B recognize a conservative document canvas when a `main` landmark's direct article, section, or div has its own `h1` (including a nested header) and prose/content children. This covers boxless-main document wrappers without repainting every `div`.
- Liquid Dream now uses a warm, nearly solid base with low-opacity pink, yellow, mint, blue, and violet washes. Strong rainbow color remains on navigation and heading hierarchy, while reading and panel surfaces use quieter edge glows and ripples. Links, controls, selection, and headings share the plum/pink/mint interaction vocabulary.
- Browser Archeology's decorative window furniture is omitted below 520 CSS pixels in both semantic and contextual renderers, leaving the real title and document/panel icon room to wrap. No DOM controls are added or removed.

The changes preserve the existing purpose model and do not add host-specific corrections.

## Evidence and visual review

The before/after live matrix used GitHub's Dark Reader repository and MDN's CSS article at 1440 × 1000, corrections off, with A and C across all three themes. All 12 combinations applied and none reported horizontal overflow. Raw captures and diagnostics are local under `test-results/system-before/` and `test-results/system-after/`; successful injection is not a visual-quality verdict.

Visual review found:

- On GitHub, Browser Archeology keeps the site's dense information layout legible while its header, navigation, controls, headings, and desktop now share one system vocabulary. Liquid Dream retains the site's hierarchy with quieter warm surfaces and rainbow accents rather than treating most regions as equally prominent.
- On MDN, C gives Browser Archeology two white document regions on the teal desktop and gives Liquid Dream quiet reading surfaces between more colorful navigation rails. Images and ads remain authored.
- On the local hierarchy fixture, Browser Archeology's desktop texture remains subordinate to the white document and titled facts window. Liquid Dream's document and fact panel are distinct without repeating the previous full-spectrum slab on every surface.

## Validation

The build and all seven unit checks pass. All 18 isolated Chromium checks pass across A/B/C and the three themes, including the new A document-canvas regression, role/contrast handling, dynamic content, interactions, restoration, frames and the theme picker.

A one-repeat smoke run exercised disabled, A and C across the three themes with 210 trusted clicks and no untrusted clicks. Six of seven samples completed 100 frame callbacks without substitutions. A/Liquid Dream completed 100 callbacks but recorded two timeout substitutions, so that sample's frame and interaction percentiles are invalid. One sample per mode supports no speed or regression claim; raw results remain local under `test-results/system-performance/`.

## Useful failure and limits

A CSS-only attempt to recognize MDN's second prose child by requiring an `h2` plus several paragraphs did not match its nested structure. Broadening the selector to any heading-bearing prose `div` would repeat the earlier mistake of turning ordinary chapters into independent cards or windows. The selector was not kept. Renderer A therefore still exposes teal behind part of this particular boxless landmark; C's measured prose and geometry pass remains the bounded structural solution.

The live pass covers two desktop pages, not “most websites,” and visual review is qualitative. Base-color contrast checks do not sample decorative pixels. The narrow rule prevents title/control overlap by removing decorative furniture, but a dedicated narrow live-site matrix is still needed. The Liquid Dream animation remains limited to the existing decoration budget under C and respects reduced motion; this iteration does not establish a performance improvement.

## Next experiment

Obtain owner review on an article, a dense application page, and a commerce page. If the calmer Liquid Dream hierarchy is accepted, test whether one additional semantic surface category can improve A without repainting generic wrappers. For Browser Archeology, inspect narrow title wrapping and distinguish desktop-visible gaps from genuinely unrecognized reading canvases before broadening recognition.
