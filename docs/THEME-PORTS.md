# Theme intent and adaptation record

Source: the three corresponding files under the user's reference project `assets/css/skins/`.
This is internal authoring v1, not an XML/JSON interoperability standard.

| Theme | Recognizable traits carried over | Style-only adaptation |
|---|---|---|
| Browser Archeology | Teal desktop, white document surfaces, gray system chrome, navy accents, blue underlined links, beveled controls, serif body and sans-serif headings | Based on `browser-archaeology.css`. A narrow navy inset rule suggests window chrome without inserting fake toolbars, labels, or title-bar buttons. Existing content and icons stay in place. |
| Liquid Dream | Warm cream, pink/yellow/mint gradients, serif type, rounded surfaces, soft shadows, drifting ripple motif | Ripples animate surface backgrounds rather than new pseudo-elements. Renderer C animates only one prominent content region. Gradients use light stops with dark ink; source photo filters, shape clipping, and layout changes are excluded. |
| Terminal Vision | Green/acid palette, monospace, squared rules, scanlines, grid, glowing type and hover edges, animated grid | Scanlines live on the page background rather than above photos. Hero geometry/cursor text is not copied into arbitrary headings; existing pseudo-elements remain available to the site. |

These substitutions are hypotheses about retaining identity on foreign websites. They are not evidence that full personality has been preserved; source-to-prototype visual review and user evaluation remain required. Configured motion honors the reduced-motion preference. No reduced-effects mode or performance-driven stripping is implemented.

## Semantic rules

- Native/ARIA headings, controls, links, focus, selected/current states, disabled states, and explicit invalid fields receive treatments.
- An `alert` is not automatically an error; a `status` is not automatically success.
- A selector correction may assign an error or success role where meaning is known. It does not modify ARIA attributes or invent content.
- Error uses a double border and wavy underline; success uses a solid underline/rule. Native state text remains essential.
- We do not infer meaning from arbitrary class substrings such as `red`, `danger`, or `green` in v1. Preserving color-only semantics remains an unresolved general-engine problem.
- Icons with explicit SVG fills and image pixels are outside the expressive selector set. B's SVG adaptation and CSS background images need further work.

## Corrections versus appearance overrides

`src/corrections.js` currently contains host matching plus selector-to-role mappings and protected regions. Corrections are off by default so the baseline can be measured. The YouTube mapping uses the same video-overlay role across themes; the fixture mapping verifies reusability with all three themes.

There is no public correction schema, user CSS editor, appearance-override format, or layout representation yet. A future editor can target the renderer's role or appearance boundary without requiring that we freeze today's internal data structures.

## Purpose-based iteration (October 3)

[Experiment 03](EXPERIMENT-03.md) assigns different treatments to documents, panels, navigation, headings, data tables and fields. Browser Archeology uses one document frame and distinct inset fields; Liquid Dream places a six-color rainbow on visible navigation/title accents and contextual panels, leaving prose quieter. C additionally groups chapter headings with small utility links and recognizes prose children of boxless landmarks. This is an experimental interpretation of theme intent; see [the learning log](LEARNINGS.md) before further changes.
