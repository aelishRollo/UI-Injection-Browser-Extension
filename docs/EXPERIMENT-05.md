# Experiment 05 — windows, not merely old styling

October 4, 2026. Baseline: `eb44986`. [Shared learning log](LEARNINGS.md).

## Owner feedback and hypothesis

Owner observation: Browser Archeology still was not recognizable and needed icons and other cues that make elements look like actual windows.

Hypothesis: pixel glyphs and a navy heading are insufficient when the surrounding surface still reads as an ordinary web card. A coordinated frame, compact title bar, application icon and familiar window furniture should make the metaphor legible at a glance. Existing semantic titles and captions should supply the label; the theme should not invent window names or interactive behavior.

## Changes

- A/B Browser Archeology titles now use a compact navy-to-blue title bar with white ink, a document icon and one decorative minimize/maximize/close image. The heading remains the page's real heading.
- C marks recognized reading documents, titled auxiliary panels and neutral utility rails as window owners. It reuses an existing purpose title, caption, legend or heading as the title bar and rejects untitled generic panels.
- Window owners use classic light/dark bevels, a black outer outline and a hard offset shadow. Reading title bars use a document glyph; auxiliary title bars use a panel glyph.
- The control strip is a CSS background image. It creates no elements, buttons, focus targets or click handlers. The browser fixture asserts that the control count is unchanged.
- Existing empty masked icon slots may now map strongly labeled home, history, settings and download controls, in addition to menu, search, language and more. Unknown and brand slots remain authored.

## Evidence and failures

The first browser check exposed a title nested in a semantic `<header>`: the header had already acquired navigation purpose, so the document was incorrectly recorded as an untitled frame. Window title ownership now follows the nearest reading/panel owner, allowing a title wrapper without allowing a nested auxiliary panel's title to escape into its parent.

Visual review of the first A/B capture caught black hero text on the new blue bar. Browser Archeology now explicitly sets white ink on the title and common inline text wrappers. Visual review of the final local hierarchy capture shows a flush document title bar, a separate titled facts window, a framed utility rail, and the expanded pixel-icon vocabulary. This is fixture evidence, not proof that every website should resemble a desktop application.

A targeted 1440 × 1000 Wikipedia capture applied all three themes under A and C without horizontal overflow. Browser Archeology A showed the article heading as a compact document title bar. Browser Archeology C showed the article, Contents rail and facts table as distinct framed windows; it reported four window owners, three title bars, four replaced control glyphs and nine section-heading glyphs. Visual review found no title/control overlap in that desktop capture. The promotional banner and Appearance rail still demonstrate that not every authored region becomes a titled window.

Seven unit checks, the build, and all 18 Chromium browser checks pass. The browser matrix covers all themes and renderers, restoration, contrast behavior, dynamic content, interactive controls, the picker, frames and repeated switching. Contextual teardown removes the window annotations, and disable restores the baseline computed-style snapshot.

## Limits and next experiment

The A/B title treatment is intentionally broad because those renderers lack structural annotations. On pages where an `h1` is not visually analogous to a window title, the result may feel forced. C is more selective, but a generic semantic heading can still be a poor panel title. Decorative window furniture is deliberately noninteractive; it must never imply that clicking it will minimize or close website content.

Next: review Browser Archeology on Wikipedia and one application-like site at desktop and narrow widths. Pay particular attention to title wrapping, title-bar control overlap, false titled panels and whether the noninteractive furniture is read as decoration rather than a broken control.
