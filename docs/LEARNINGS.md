# Shared theme learning log

Read this before theme/renderer changes; update it as experiments land. This repository file and the linked evidence carry learning between project chats. They do not automatically inject context into unrelated chats or already-running conversations.

## Current understanding — October 4, 2026

Latest owner observation: **Browser Archeology still was not recognizable enough and needed icons plus stronger cues that elements are actual windows.** Experiment 05 responds with coordinated beveled frames, compact title bars, document/panel icons and decorative window furniture. A/B receive the title-bar treatment; C additionally binds existing document and panel titles to recognized window owners. See [the iteration record](EXPERIMENT-05.md). This is an implemented hypothesis awaiting owner review, not evidence that the recognizability problem is solved.

Latest owner review of Experiment 03: **C is currently best on Wikipedia for Browser Archeology and Liquid Dream**, but both still lack the intended character. Browser Archeology feels accidentally old rather than like a deliberate desktop recreation; icons are a missing part of that identity. The owner also reports that only B produces dark mode for Terminal Vision on Wikipedia. These preferences describe the reviewed build, not automatic approval of the next iteration.

Experiment 04 tests a themed icon vocabulary, stronger Browser Archeology title bars, shared purpose recognition for Terminal Vision, and conservative page-shell/utility-panel recognition. See [the iteration record](EXPERIMENT-04.md). Keep B available as the broad color-adaptation comparison; do not equate successful injection with dark-mode coverage.

## Theme picker interface — October 4, 2026

Owner observation: theme switching should be available through a small, unobtrusive popup similar to the control on rollison.dev.

Initial implementation: a single fixed **Themes** pill opened a compact three-choice panel above the bottom-right corner. It used the reference interaction pattern without copying the site's theme-specific decoration. The panel closed through its close button, Escape, or an outside pointer action, existed only in the top-level document, and hid whenever Surface was globally paused or disabled for the current host. Theme selection went through a narrowly scoped top-frame message and the existing serialized settings store.

Measured behavior: the local fixture under contextual Terminal Vision opened the panel, exposed exactly three synchronized choices, switched to Liquid Dream, remained absent from the embedded HTTP frame, closed with Escape, fit within 1280 × 960 and 320 × 640 viewports, and hid after global pause. The full 18-check Chromium suite passed across A/B/C and all themes; seven unit checks and the build also passed. The screenshot review showed the closed control occupying only the lower-right corner and the open panel staying clear of the main reading column. This is local-fixture evidence, not evidence that the fixed control avoids important site UI on every website.

Useful correction during visual review: an `all: initial !important` reset on the host also reset inherited typography inside the shadow root. The picker now sets its font explicitly on its internal root rather than relying on host inheritance.

Next experiment: review placement on real sites with their own bottom-right chat, cookie, or accessibility controls. If collisions are common, test a user-selectable corner or temporary edge displacement before adding host-specific placement rules.

Owner follow-up: the first panel had visibility failures in Browser Archeology and Liquid Dream, and pausing Surface removed the only nearby control that could resume it. The shadow root isolated ordinary author CSS, but not Surface's own USER-origin stylesheet; light-theme heading and paragraph rules produced dark text on the picker's fixed dark panel. Renderer B also discovered and transformed the open shadow stylesheet independently. Terminal Vision looked correct only because its transformed text happened to remain light.

Correction: the picker root is now an explicit exclusion in the expressive A/B selectors, and its pre-existing stylesheet is marked so the pinned Dark Reader adapter leaves it unmanaged and preserves it during cleanup. A global Surface switch is part of the panel. Pausing no longer unmounts or hides the picker, the panel stays open through pause/resume, and its collapsed kicker reports the paused state. Theme choices remain available while paused so the next theme can be selected before resuming.

Measured behavior after correction: every heading, helper line, power label/state, theme name, and theme description met at least 4.5:1 base-color contrast in the full A/B/C × three-theme fixture matrix. Browser screenshots were reviewed for all three themes. The switch paused and resumed the contextual Liquid Dream run while the panel and top-level launcher remained visible; the picker was still absent from the embedded frame and fit within 1280 × 960 and 320 × 640 viewports. The full 18-check Chromium suite, seven unit checks, and build passed. These checks cover extension-owned base colors, not rendered-pixel contrast or collisions with unrelated fixed website controls.

## Prior understanding — October 3, 2026

The owner reports that Terminal Vision looks good on Wikipedia, Browser Archeology feels unordered, and Liquid Dream barely registers. The owner uses the unpacked extension and has not identified an experimental renderer; the default is A, so treat default-mode behavior as the primary experience. These are visual observations, not performance or accessibility results.

**Working model:** identify purpose → identify paint ownership → map purpose to theme treatment → resolve readable foregrounds → preserve uncertain content. A theme palette alone does not establish hierarchy. Recognition and decoration must remain separate so the same role can have different visual treatments across themes.

| Purpose | Evidence available | Browser Archeology | Liquid Dream |
|---|---|---|---|
| Reading document | Prose-rich main/article, bounded control density | White document with one outer frame | Quiet pastel document |
| Article section | Heading-bearing section inside that document | No repeated window frame | No repeated rainbow card |
| Auxiliary panel | Semantic panel, or floated bordered table with header and data cells | Beveled, navy-accented panel | Visible full-spectrum rainbow and subtle ripples |
| Data table | Ordinary table inside reading area | Plain ruled surface | Quiet readable surface |
| Navigation | Native/ARIA chrome | Gray system chrome | Rainbow band |
| Title / section heading | Heading level; small heading-and-utilities group | Navy title rule, restrained section rules | Rainbow heading band |
| Input / action | Native control semantics | Recessed field / raised button | Quiet field / rounded action |

C carries explicit purpose and evidence attributes, with diagnostic counts. A/B use a smaller CSS-only semantic approximation. Experiment 03 left Terminal Vision and the default renderer unchanged. Experiment 04 extends the purpose pass to Terminal Vision after the owner identified its dark-surface gap. The default renderer remains A.

## Experiment 03 — purpose before decoration

Baseline: `https://en.wikipedia.org/wiki/Chromium_(web_browser)`, desktop Chromium, 1440 × 1000, corrections off, all three themes × A/B/C. The source baseline was development before this experiment. Local raw captures: `test-results/roles-before/`.

Observed in captures:

- A/Liquid Dream: the strongest rainbow was confined to semantic surfaces Wikipedia rarely exposes above the fold. Much of the page remained visually ordinary.
- C/Liquid Dream: stronger color appeared, but every recognized article section became the same rounded rainbow card. More coverage alone was not better organization.
- C/Browser Archeology: section frames repeated down the reading column while the auxiliary facts table retained an unrelated treatment.

Hypothesis: a document should have one reading surface, with its chapters expressed through headings; navigation, supporting facts, and controls should receive distinct treatments. Strong rainbow color should appear in meaningful visible regions, not depend solely on finding an `article`/`aside`.

Implementation: prose landmarks require at least three paragraphs, 300 text characters and a control-count limit. Descendant sections share that reading region. A landmark with `display: contents` has no paintable box, so C evaluates its direct heading-bearing prose children instead. Float + border + header/data-cell structure identifies a supporting facts panel without a Wikipedia selector. A short heading group can own decoration while preserving its existing edit link. Native inputs receive separate field styling. Authored image backgrounds and protected content remain conservative fallbacks. All annotations restore on disable.

Useful failed experiment on MDN: its main landmark uses `display: contents`, so the first rule rejected it as invisible despite strong prose semantics. The bounded fallback to direct prose children is now exercised by the hierarchy fixture. This does not merge those separate boxes or alter layout.

Useful failed experiment: a newly inserted section had no purpose because the earlier surface pass intentionally skipped descendants of an existing content region. The purpose pass now recognizes a heading-bearing section under an existing reading owner; the browser suite exercises this insertion and cleanup. Theme-owned rainbow paint is also distinguished from authored imagery so newly inserted buttons keep their control role.

Validation and final visual review are recorded in [Experiment 03](EXPERIMENT-03.md). Historical evidence remains in [Experiment 01](FINDINGS.md) and [Experiment 02](EXPERIMENT-02.md); those records do not validate later changes.

## What remains open

- This is heuristic recognition, not general visual understanding. Main landmarks may include settings rails; prose/control counts can misread mixed interfaces. Class names and color alone are insufficient evidence of purpose.
- Reading wrappers can hide the teal desktop; unrecognized white wrappers still reduce theme coverage. Do not indiscriminately recolor every `div` to fix that.
- A/B cannot infer a fact panel or a heading group from computed geometry. C should be used to evaluate purpose recognition explicitly.
- Author-painted child cells and labels can interrupt a theme region. Preserve them until evidence justifies transferring paint ownership.
- The foreground model still excludes decorative pixels. New rainbow stops are checked against theme text and link ink, but this is not a rendered-pixel contrast audit.
- Existing style/class/geometry changes do not trigger a rescan. New subtree handling is not a complete dynamic page model.
- Capture full article bodies, narrow viewports, forms, commerce, and application pages before generalizing. Track role false positives as carefully as missing decoration.

Next experiment: test document-vs-application classification and heading-group boundaries on unseen pages, then decide whether semantic A/B should remain independent baselines or consume a shared purpose model. Get owner feedback on the visible hierarchy before treating the new mappings as settled.


## Experiment 04 lessons

- A white ancestor wrapper can hide the page theme even when `body` is correctly dark. B transforms authored CSS; C needs paint ownership for the shell as well as the reading region. A remains a semantic baseline with partial coverage.
- Icon style is part of theme identity. Pixel geometry, document/folder glyphs, teal desktop and navy title bars work together for Browser Archeology. Liquid Dream uses rounded, flowing glyphs rather than simply recoloring the same pixel silhouettes.
- Prefer an existing icon slot with semantic evidence. C replaces only small, empty, masked HTML slots with recognized menu/search/language/more meaning; unknown icons, SVG/media and logos are preserved. Initial name recognition is English-only. Newly added heading decorations use unused `::before` slots and are never fake buttons.
- A generated separator or in-flow arrow is not necessarily a backdrop behind text. The first dark capture left the title black because the resolver treated a one-pixel separator as uncertain backdrop paint. Bound the pseudo-element check by normal flow and overlap, retaining the conservative fallback for true overlays.
- Painted link/settings rails are different from arbitrary white cards. Recognition now requires a narrow neutral panel with predominantly links or grouped radios and labels. Inspect false positives on additional sites before broadening that rule.
- Enabling a document owner changes dynamic insertion: a new article beneath it must inherit section treatment. A regression test caught the previous scan skipping that article; classification now covers both articles and sections.

## Experiment 05 lessons

- A theme reads as a desktop window only when icon, title bar, frame bevel and window furniture agree. Adding isolated pixel icons did not establish the metaphor by itself.
- Reuse real headings and captions as labels. C requires an existing title before promoting an auxiliary panel to a window; it does not manufacture window names.
- Semantic wrappers can overlap: a document title may sit inside a `<header>` already classified as navigation. Window ownership should follow the nearest document/panel owner rather than treating that wrapper as a competing window.
- Decorative controls must stay decoration. The title-bar control cluster is one background image and adds no DOM or interaction; tests compare control counts before and after theming.
- A newly painted title bar owns its text pairing. The first A/B capture exposed black heading text on navy, so title ink and common inline wrappers now explicitly use the white accent ink.
- On the targeted desktop Wikipedia capture, A made the article title visibly window-like while C separated the article, Contents rail and facts table into framed windows without horizontal overflow. This is one desktop viewport; narrow title wrapping and false window ownership remain open.
