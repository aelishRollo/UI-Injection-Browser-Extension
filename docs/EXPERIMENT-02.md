# Experiment 02: confidence-gated contextual surfaces

Renderer C tests the smallest architectural change suggested by Experiment 01. A and B remain baselines; C is not a selected production architecture.

## Hypothesis

A theme can improve readability and preserve more identity if it treats foreground/background pairs as one decision, distinguishes content surfaces from media overlays and protected brand marks, and leaves uncertain regions unchanged.

## Implemented boundary

C temporarily annotates page, content, chrome, control, overlay, brand, and text roles. The annotations are namespaced, preserve pre-existing values, and are removed on disable or renderer changes. It does not reparent content or rewrite author classes.

- High confidence: apply a coordinated surface and foreground treatment.
- Medium confidence: preserve a readable authored foreground on a retained surface.
- Low confidence: preserve the author's foreground and media/background relationship.
- Brand marks: preserve pixels and use the nearest original opaque backing color behind the mark.
- Decoration: at most one region receives animation. Other recognized surfaces use static treatments.

The current classifier uses native/ARIA roles, visible computed backgrounds, authored background images, media overlap, protected corrections, and a complexity limit that prevents a large control-dense application region from being treated as one reading surface. The foreground resolver also reads direct text nodes, so labels in `small`, `strong`, custom HTML elements, and other non-semantic wrappers are included.

## Controlled evidence

The fixture adds retained white content, text over a photograph, text over an authored gradient, a transparent dark logo, and dynamic content. The browser suite verifies all three themes under C, preservation of uncertain regions, paired treatment of recognized content, brand backing, a one-region decoration budget, dynamic classification, annotation cleanup, computed-style restoration, and repeated switching.

These checks demonstrate the mechanism, not broad website quality. The public-site matrix from Experiment 01 has not yet been rerun with C.

## Explicit fallbacks

C preserves authored foregrounds when it encounters an authored background image, overlapping media, an original page background image, unsupported color spaces, separate text-fill colors, painted pseudo-elements, or compositing effects it cannot resolve. Protected subtrees are excluded. Unrecognized solid surfaces are now eligible for contrast repair; they do not need a semantic surface role. Partial theme coverage is an accepted result. It does not infer error or success from class names and does not recolor arbitrary image or SVG pixels.

## Foreground/background resolution (October 2 update)

The DOM already distinguishes text color from background paint. The difficult part is identifying the effective background underneath each text run. `getComputedStyle(element).backgroundColor` alone is insufficient: it often returns transparent, and nested alpha layers change the result.

Renderer C now walks the ancestor chain, composites sRGB background colors front to back, and resolves theme-owned surfaces using their intended theme colors. A successful opaque backing is required. On retained surfaces, readable authored text is kept, including distinct status ink. Otherwise, the resolver starts with the theme text/link color and, when necessary, tints or shades it toward white or black by the minimum amount that meets the contrast target. Backgrounds, fonts, decoration, and theme character remain separate decisions. Links keep their semantic color preference even when their text is nested in a span.

The targets are 4.5:1 for normal text and 3:1 for large text (24 CSS px, or at least 18.6667 CSS px at bold weight), based on [WCAG 2.2 contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). This is a base-color model, not a WCAG compliance claim. Theme-generated texture and decoration are not sampled. Authored background images/gradients, filters, opacity groups, masks, blend modes, separate glyph fill, and generated backdrops remain unresolved. Media overlap detection remains heuristic; arbitrary sibling stacking, positioned elements whose backdrop differs from their DOM ancestor, shadow trees, and canvas text require additional work.

Nested labels use their owning control's foreground through hover and selected states; placeholders use the control's ink with full opacity. New element subtrees are classified. Existing-element class/style changes, text-only mutations, stylesheet changes, and geometry changes do not trigger a fresh contrast scan. A theme reapplication performs a fresh classification. A/B and the default renderer remain unchanged.

Diagnostics expose `pairs` counts for themed, control, retained, adjusted, and unresolved reasons, plus an explicit contrast-model description. These count text-bearing elements, not pixels or complete page accessibility coverage. Temporary foreground properties and pair annotations are restored on disable.

Validation covers color parsing, alpha composition, contrast thresholds, foreground adjustment across light/dark gray backgrounds, all three themes in Chromium, retained light/dark surfaces, multiple translucent layers, nested control states, placeholders, uncertainty classification, dynamically inserted content, and cleanup. Local fixture results do not establish public-site quality or performance.

The existing [Dark Reader dynamic engine](https://darkreader.org/help/en/) remains useful as renderer B's stylesheet adaptation baseline. Its analysis of stylesheets, backgrounds, and SVG does not replace the explicit foreground/background pairing required by these expressive themes.

## Performance status

The performance harness now includes C and dispatches trusted Playwright clicks, recording trusted versus untrusted input counts. The full repeated run recorded 50 samples and 663 trusted clicks with no untrusted clicks. All 50 samples—including all five disabled samples—encountered at least one timeout-substituted frame callback, so every frame and interaction percentile remains invalid. The run provides no comparative performance verdict. A foreground run, paint/composite traces, and a verified equivalent-output frozen-style control remain required before making a performance claim.

## Next gate

Rerun the frozen public-site matrix with C and fresh held-out article, commerce, and application pages. Compare readability, recognizable theme hierarchy, preserved media/brand treatment, uncertain-region coverage, and correction-free interaction. Do not add site-specific fixes before recording failures.
