# Experiment 04 — icon identity and dark-surface ownership

October 4, 2026. Baseline: `bc9376e`. [Shared learning log](LEARNINGS.md).

## Owner feedback and hypothesis

On Wikipedia, the owner prefers C for Browser Archeology and Liquid Dream, while finding both insufficiently intentional. Browser Archeology needs icons to convey a deliberate recreation rather than simply looking old. For Terminal Vision, only B appeared to supply dark mode.

Hypothesis: hierarchy needs a consistent icon vocabulary and recognizable chrome; dark mode additionally requires ownership of the neutral page shell and utility panels. Body color and native semantic selectors alone cannot cover authored white wrappers.

## Changes

- C recognizes neutral solid ancestor shells around reading regions. A candidate must be a wide div/main ancestor with an opaque near-white, nearly neutral background and no background image or unresolved compositing effect. This reveals Browser Archeology's teal desktop and Terminal Vision's dark page backing.
- C recognizes narrow neutral link/settings rails using link-text density or grouped radio controls and labels. They receive navigation treatment; arbitrary white cards are not all recolored.
- Terminal Vision now consumes the shared reading/section/table hierarchy. A/B also receive the limited semantic main/table treatment, but A still lacks general authored-background adaptation. B retains Dark Reader's broader adaptation mechanism.
- Browser Archeology C uses navy/white title bars, pixel-style document/folder decorations, and a small original menu/search/language/more icon vocabulary. Liquid Dream uses flowing lines, rounded documents and droplet chapter marks with multicolor strokes. Terminal keeps simple phosphor control glyphs without new heading decorations.
- Replacements target small empty masked HTML icon slots whose control label or search-input relationship establishes meaning. Initial label recognition is English-only. Existing dimensions, accessible names and event handlers stay intact. Unknown glyphs, SVG, logos and media are preserved. A checkbox-driven menu's visible label receives the control appearance while the checkbox keeps its behavior.
- Heading glyphs use only unused `::before` slots. They are decorative, add no false window controls, and occupy a small amount of inline space; heading wrapping can change.

## Failures that informed the change

The initial dark capture fixed the central reading background but left white sidebar panels. Recognizing only the main content is not enough for a page-level dark theme.

The title also stayed black: C treated Wikipedia's one-pixel generated separator as an uncertain text backdrop. Its language label had the same problem with an in-flow generated arrow. The foreground resolver now distinguishes normal-flow decoration and nonoverlapping positioned pseudo-paint from actual text overlays. True overlapping or geometrically uncertain backdrops retain the conservative fallback. The fixture includes both a real pseudo-backdrop and a nonoverlapping title rule.

Sharing the document role with Terminal changed dynamic insertion. An article added under an already recognized reading owner was skipped by the old surface pass. Purpose classification now handles inserted articles as well as sections; the regression remains in the browser suite.

## Evidence and limits

The local baseline is `test-results/icons-before/`. The final full matrix is `test-results/icons-final/`: Wikipedia's Chromium article and MDN's CSS article, 1440 × 1000, corrections off, all three renderers and themes. All 18 combinations applied and had no sampled horizontal overflow. These are successful captures, not 18 visual-quality passes.

Reviewed Wikipedia C captures show:

- Browser Archeology: exposed teal desktop, navy/white document title, gray utility rails, pixel icons and folder chapter marks.
- Liquid Dream: rainbow rails/headings/panel, rounded flowing menu glyph, soft document and droplet decorations.
- Terminal Vision: dark page/document/utility rails with readable phosphor title and language-control text. Original image backings, some authored child highlights, and white fade decorations remain. This is substantially improved dark coverage, not complete recoloring of every pixel.

Wikipedia recognized four control glyph slots in each C theme and ten heading glyph slots in each light theme. The title's innermost text and language label resolve to theme/control ink; reading an unannotated outer wrapper's computed color alone would falsely report that the title remained black.

MDN is a held-out warning, not a pass: Terminal C darkens its reading regions but still has low-contrast retained authored text in parts of its navigation and some inline links. The icons rule recognized no control slots there, because it does not guess arbitrary SVG/custom icon semantics. Do not promote C to a universal default from the Wikipedia result. B remains an important comparison. Future work must pair preservation of uncertain text with preservation of its actual backing, including generated icons and inherited surfaces.

Representative Wikipedia screenshots and compact metadata are committed under [evidence/04](evidence/04/). Captured site content/media retain their authors' rights and are not shipped as theme assets. Banners, ads, fonts and dynamic page state can vary between runs.

## Validation

Build and seven unit checks pass. Seventeen Chromium browser checks pass, covering all theme/renderer combinations, existing image/pseudo-icon preservation, contrast on known and retained surfaces, dynamic content, switch/disable restoration, popup settings and frame behavior.

The expanded hierarchy fixture additionally checks all three C themes, a neutral page shell, a link rail, unused versus authored heading pseudo-slots, unknown/brand glyph preservation, original icon-attribute restoration, navy-title contrast, the dark reading/title/rail pairing, actual menu clicks, and label-operated checkbox behavior. The existing overlay fixture still classifies genuine generated backdrops as unresolved.

The isolated performance smoke uses disabled plus three C themes, one sample per mode. Its validity and limitations are recorded in the evidence metadata. It does not establish a performance improvement or broad performance clearance.

## Next experiment

Obtain owner review of the revised Wikipedia character. Test icon state/direction and localization before expanding the vocabulary, and evaluate narrow viewports. Investigate MDN's remaining retained-ink failures before generalizing dark-mode coverage. Keep the owner's current preference (C for the two light themes, B as the proven Terminal comparison) distinct from acceptance of this new iteration.
