# Theme intent and adaptation record

> **Current architecture note:** These themes now run only through the unified renderer described in [the authoritative project state](PROJECT-STATE.md). References below to A/B/C, Dark Reader, optional corrections, or renderer comparisons are historical theme-development context, not available product modes.

Source: three corresponding files under the user's reference project `assets/css/skins/`, plus an original Monochrome Signal treatment informed by visual review of `mdmi.com`.
This is internal authoring v1, not an XML/JSON interoperability standard.

The current adaptation boundary is a validated declarative treatment contract. `src/themes.js` is the registry, and each definition lives independently under `src/theme-definitions/`. A theme supplies palette and typography tokens, icon style, optional packaged assets, stable context/state treatments, purpose treatments, a compact startup-compatible subset, and bounded responsive rules. `src/styles.js` compiles those declarations against the unified renderer's annotations. Theme definitions do not classify the page, contain host selectors, or create another renderer path. The build rejects incomplete tokens, unknown treatment targets, remote asset paths, missing declared assets, and malformed responsive or scalar-grid definitions; unit checks also enforce base-pair contrast, stylesheet size budgets, and the absence of keyframes, animation declarations, and fixed paint.

| Theme | Recognizable traits carried over | Style-only adaptation |
|---|---|---|
| Browser Archeology | Teal desktop, white document surfaces, gray system chrome, navy accents, blue underlined links, beveled controls, serif body and sans-serif headings | Based on `browser-archaeology.css`. A narrow navy inset rule suggests window chrome without inserting fake toolbars, labels, or title-bar buttons. Existing content and icons stay in place. |
| Liquid Dream | Warm cream, pink/yellow/mint gradients, serif type, rounded surfaces, soft shadows, fluid color bands | Surface fills and hierarchy bands are static. Repeated multi-radial and full-page gradient paints were replaced after they produced missed frame opportunities in the local scroll workload. Gradients use light stops with dark ink; source photo filters, shape clipping, and layout changes are excluded. |
| Monochrome Signal | Near-black canvas, engineered off-white surfaces, coral signals, large sans headings, monospaced labels, thin linework, pill controls, grayscale depth | Informed by visual review of `mdmi.com`. The treatment uses system fonts and original static CSS only; it does not contain host selectors or import the site's code, fonts, logos, landscape artwork, layout, or motion system. |
| Terminal Vision | Green/acid palette, monospace, squared rules, scanlines, grid, glowing type and hover edges | Static scanlines live on the page background rather than above photos. Hero geometry/cursor text is not copied into arbitrary headings; existing pseudo-elements remain available to the site. |

These substitutions are hypotheses about retaining identity on foreign websites. They are not evidence that full personality has been preserved; source-to-prototype visual review and user evaluation remain required. Current theme treatments contain no continuous decorative motion; interactive state changes remain immediate.

## Semantic rules

- Native/ARIA headings, controls, links, focus, selected/current states, disabled states, and explicit invalid fields receive treatments.
- An `alert` is not automatically an error; a `status` is not automatically success.
- A selector correction may assign an error or success role where meaning is known. It does not modify ARIA attributes or invent content.
- Error uses a double border and wavy underline; success uses a solid underline/rule. Native state text remains essential.
- We do not infer meaning from arbitrary class substrings such as `red`, `danger`, or `green` in v1. Preserving color-only semantics remains an unresolved general-engine problem.
- Icons with explicit SVG fills and image pixels are outside the expressive selector set. The unified renderer preserves uncertain SVG and CSS background media rather than passing them to a second adaptation engine.

## Corrections versus appearance overrides

`src/corrections.js` contains host matching plus selector-to-role mappings and protected regions. Verified corrections apply automatically; there is no settings toggle or corrections-off product mode. The YouTube mapping uses the same video-overlay role across themes, while the fixture mapping verifies that roles remain reusable across all themes.

There is no public correction schema, user CSS editor, appearance-override format, or layout representation yet. A future editor can target the renderer's role or appearance boundary without requiring that we freeze today's internal data structures.

## Historical theme-development record (Experiments 03–07)

The sections below explain how retained motifs evolved before unification. Their renderer comparisons and proposed next steps are superseded.

### Purpose-based iteration (October 3)

[Experiment 03](EXPERIMENT-03.md) assigns different treatments to documents, panels, navigation, headings, data tables and fields. Browser Archeology uses one document frame and distinct inset fields; Liquid Dream places a six-color rainbow on visible navigation/title accents and contextual panels, leaving prose quieter. C additionally groups chapter headings with small utility links and recognizes prose children of boxless landmarks. This is an experimental interpretation of theme intent; see [the learning log](LEARNINGS.md) before further changes.

### Icon identity and dark backing (October 4)

[Experiment 04](EXPERIMENT-04.md) adds original contextual icon glyphs and a navy/white title treatment for Browser Archeology. Liquid Dream uses rounded flowing glyphs and droplet section marks. C now recognizes neutral document shells and utility rails, and Terminal Vision participates in the same purpose hierarchy. This improves Wikipedia dark coverage; the MDN capture still exposes retained-ink failures. The owner prefers C for the two light themes on Wikipedia, not necessarily on every site.

[Experiment 05](EXPERIMENT-05.md) strengthens Browser Archeology's window metaphor across renderers. A/B titles use document icons, compact navy gradient title bars and decorative minimize/maximize/close furniture; C additionally frames recognized documents, titled auxiliary panels and neutral utility rails, and promotes existing captions/headings instead of inventing labels. The controls are one background image, not DOM or interactive affordances. Existing labeled icon slots now recognize home, history, settings and download alongside the earlier vocabulary.

[Experiment 07](EXPERIMENT-07.md) makes the minimize, maximize and close furniture consistent across substantial Browser Archeology regions and mutes it with disabled system colors. Titled regions reuse one real heading; untitled panels and standalone navigation rails receive a thin inactive strip. Nested rails collapse to one outer window, and narrow layouts retain a smaller control cluster. Appropriate details from the original skin now include purple visited links, red hover/focus links, yellow notes, grooved separators, inset field focus and embossed disabled controls.

### Coherent motif system (October 4)

[Experiment 06](EXPERIMENT-06.md) applies Terminal Vision's restrained, repeated motif strategy to the light themes. Browser Archeology gains a subtle desktop/chrome texture, navy hierarchy and selection-like interaction states; Liquid Dream moves full-spectrum color toward navigation, headings and interaction while reading surfaces use quiet fluid washes. A/B also gain a bounded direct-document fallback for boxless landmarks. This is a visual hypothesis under review, not a claim that the themes now generalize across websites.
