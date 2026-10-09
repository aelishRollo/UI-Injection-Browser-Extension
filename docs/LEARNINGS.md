# Shared theme learning log

Read [the authoritative project state](PROJECT-STATE.md) and this file before theme or renderer changes. Update this log as iterations land. This repository file and the linked evidence carry learning between project chats. They do not automatically inject context into unrelated chats or already-running conversations.

## Current project state — October 8, 2026

**This section is current. Everything below “Historical experiment log” is retained evidence, not active architecture or an instruction to restore old modes.** Surface has one unified renderer. Experiments 01–09 may describe A/B/C, Dark Reader, correction-off baselines, renderer selection, or next experiments; all of those paths and recommendations are superseded. See [the project-state record](PROJECT-STATE.md) for documentation precedence and future-work rules.

Latest owner direction: **replace the A/B/C experiment suite with one performant, beautiful approach.** Iteration 10 makes the contextual purpose-and-paint pipeline the only renderer and removes the semantic-only path, Dark Reader adapter and dependency, renderer/correction settings, stylesheet bridge, and comparison controls. The retained system combines purpose recognition, paired contrast, media/brand/visualization preservation, static theme motifs, automatic verified corrections, and batched dynamic updates. See [the unification record](EXPERIMENT-10.md).

Latest owner observation: **on Wikipedia's main page, Browser Archeology window controls sat vertically centered in tall title regions, while Terminal Vision left large pale areas.** Iteration 11 traces the dark-coverage failure to a reusable composite landing-page shape: a semantic content region grouped several substantial neutral, heading-led `div` panels inside a neutral page shell. The unified classifier now recognizes those panels and large neutral content ancestors without host selectors. Purpose rescans also accept Surface-owned paint on already-recognized regions, avoiding a class-mutation regression where the renderer could mistake its own background motif for authored imagery. Browser Archeology's decorative title icons and controls are top-anchored at both desktop and narrow sizes. See [the iteration record](EXPERIMENT-11.md).

Latest owner observation: **a full navigation briefly showed the normal, unthemed page before Surface appeared.** Iteration 12 traces this to the asynchronous startup window between `document_start` and completion of settings lookup, renderer import, classification, and USER-origin stylesheet installation. A static pre-paint guard now keeps the new document root transparent through that window and releases it only after the unified path is ready; disabled and error paths release it after authored-state cleanup. The classifier explicitly excludes this one extension-owned root opacity from its authored-effects model. See [the startup record](EXPERIMENT-12.md).

A parser-delayed navigation fixture sampled animation frames during startup. It observed hidden pre-ready frames, no visible pre-ready frame, and a first released frame with page classification and Terminal Vision paint. Eight unit checks and all 13 isolated Chromium checks pass. The five-repeat exact-state workload produced 20 valid samples, 2,000 completed callbacks, zero stalls, and 16.7–16.8 ms median p95 frame intervals. Median load-to-applied time was 120–121 ms for the themes in this warm local fixture; this measures the guarded path but does not promise the same duration on arbitrary pages.

Latest owner follow-up: **the guard removed the flash but made themes take multiple seconds to appear, and Terminal Vision showed delayed white side strips on the Wikipedia article “Students for a Democratic Society.”** Iteration 13 confirms the latency cause: Iteration 12 made visibility wait for `DOMContentLoaded` plus the full document-wide text/contrast pass. On the reported article, the baseline first visible frame was around 3.17 seconds. An initial progressive attempt revealed around 0.15 seconds but exposed Wikipedia's neutral viewport wrapper in white until roughly 1.91 seconds; keep that failed intermediate result because fast root paint alone did not solve the visible canvas. See [the phased startup record](EXPERIMENT-13.md).

The final path runs a fast unified canvas phase: page roots, base theme ink, and a neutral viewport-spanning ancestor identified from semantic or shared edge geometry. It waits at most one guarded layout opportunity, reveals, then performs the full authored-state purpose/contrast pass after a paint. A final isolated live trace on the reported page was hidden at 118 ms and first visible around 309 ms with the root, body, left edge, and right edge all Terminal Vision green. This is a targeted cold-navigation observation, not a universal service-level claim.

Visual review then distinguished the remaining literal bands from the viewport wrapper: Wikipedia's sticky navigation containers painted pointer-transparent `::after` fades from transparent to white. The renderer now recognizes only short bottom-sticky linear-gradient pseudos above an already recognized navigation rail and maps their terminal paint to the theme surface. The hierarchy fixture covers all themes and restoration; the final live diagnostic recognized two navigation fades, and the reviewed Terminal Vision capture no longer contains the white bands. A timing-sensitive figure overlay encountered during repeated validation now prefers its explicit local `figure`/`picture` structure before geometry, preserving authored media ink consistently.

The strengthened parser-delay regression requires reveal while `document.readyState` is still `loading`, a themed root, and a green viewport shell in the first visible frame. Eight unit checks, the build, and all 13 Chromium checks pass. The final exact-state five-repeat workload produced 20 valid samples, 2,000 completed callbacks, zero stalls, and 16.7–16.8 ms median p95 frame intervals. Median local load-to-applied time was 107 ms Terminal Vision, 109 ms Browser Archeology, and 121 ms Liquid Dream; that status includes the completed full fixture scan, while visible canvas paint occurs earlier on loading documents.

Latest owner observation: **a generic dark-mode phase was still visible before Terminal Vision's full treatment, and startup fixes must generalize across every theme.** Iteration 14 distinguishes two things that Iteration 13 treated together: an exact theme-native loading canvas and the first visible content frame. A generated browser-registered stylesheet now persists Browser Archeology teal, Liquid Dream cream, or Terminal Vision green at `document_start`; authored body content is transparent rather than making the entire root transparent. This avoids exposing the browser's own backing canvas. Registration follows the global enabled state, selected theme, and exact-host exceptions. Top documents read extension storage directly on the critical path; cross-origin frames retain the worker lookup needed for top-host exception semantics. See [the no-intermediate-paint record](EXPERIMENT-14.md).

The first visible content frame now runs a bounded initial-viewport pass through the same unified recognition functions, rather than showing only root/base ink until the complete scan. Membership geometry is cached and prose/control evidence is limited to in-scope descendants during that pass; parser additions continue through the existing mutation pipeline, and `DOMContentLoaded` still receives the complete authoritative rescan. The parser-delay fixture exercises all three themes and requires exact pre-reveal canvas color, hidden authored content, page/shell/content/title recognition, and theme-specific title treatment on the first visible frame.

Keep the failed intermediates. Running the complete parsed-document scan before reveal removed the visual transition but restored an approximately 3.2-second Wikipedia wait. The first viewport-bounded version reduced its measured scan to roughly 0.23–0.45 seconds, but a late-growing full-width wrapper could still produce one white frame. Waiting for another animation frame removed that race but made reveal vulnerable to a busy parser and produced a 1.69-second targeted run. The final general correction instead treats neutral ancestors of a semantic main landmark as provisional startup shells even before useful height/width geometry exists, and refreshes viewport canvas evidence in parser mutation batches. It does not contain a host selector or broaden the final authoritative shell rule.

On the reported Wikipedia article, the final isolated trace observed only hidden authored frames over the exact Terminal canvas before reveal. Its first visible sample was around 0.86 seconds with the body and both viewport edges `rgb(6, 17, 11)`, the main reading region classified as content, and the heading classified as the page title. Visual review showed the complete Terminal treatment and no white sidebar bands. Live parsing, network, and machine timing varied substantially between runs; this is evidence of paint ordering and bounded work, not a latency guarantee.

Latest owner correction: **Iteration 14 still left an unacceptable interval before the actual expressive theme appeared; a correct canvas or hidden body is not the same as loaded theme styles.** Iteration 15 moves a compact real-theme first-paint sheet and the unified renderer into the persisted `document_start` path. The resident sheet contains core surfaces, typography, hierarchy, and primary motifs for each selected theme; the full USER-origin sheet atomically supplies secondary interaction/icon/state rules. Top-document recognition starts from the registered theme token and follows parser mutations before paint. A brief guard lasts only through the first parser-time treatment; USER-origin handoff and the eventual full-document pass no longer control first visibility. See [the resident-theme record](EXPERIMENT-15.md).

Keep the caught activation failure: an `<html>`-rooted parser rescan could restore the renderer-owned theme attribute and leave a resident stylesheet present but inactive. Every document-root scan now reasserts theme activation in the same task. Also keep the performance failure: persisting the entire full theme sheet doubled or quadrupled p95 frame intervals for the more decorative themes even when the startup scope was inactive. The final resident sheets retain first-paint treatment but omit non-visible secondary rules; the five-repeat workload returned all modes to 16.7–16.8 ms median p95 with 2,000 completed frames and zero stalls.

The three-theme navigation regression now requires the selected startup token throughout parsing, active first-paint or USER-origin styles for every visible frame, and no visible unclassified article/title frame. A final first-released-state capture of the reported Wikipedia article showed the complete Terminal hierarchy, phosphor typography, green shell and both green viewport edges, with no white strips or generic dark phase. In that run, bounded viewport recognition consumed 82.6 ms (40.2 ms in text pairing); later full-document completion did not control visibility.

Final local validation passed eight unit checks, the build, and all 13 isolated Chromium checks. The five-repeat performance workload produced 20 valid samples, 2,000 completed frame callbacks, zero stalls, and 16.8 ms median p95 frame intervals for the original and all themes. Median load-to-applied time was 126 ms Terminal Vision, 123 ms Browser Archeology, and 119 ms Liquid Dream; median sampled content-engine time was 24.92 ms, 29.62 ms, and 31.58 ms respectively.

Targeted live review at 1440 × 1000 found no remaining pale region at least 140 × 40 CSS pixels in the first two viewports of `https://en.wikipedia.org/wiki/Main_Page`; the previously white full-page shell and four main content panels resolved to Terminal Vision page/content colors. The `#Welcome_to_Wikipedia` control artwork computed at 2px from the title top. Eight unit checks and all 12 isolated Chromium checks pass, including composite panels, their outer shell, a tall title, a class-driven rescan, restoration, narrow layout, and all three themes.

The first post-Iteration-11 five-repeat performance run produced zero stalls but an anomalous 66.7 ms Liquid Dream median p95 frame interval. An immediate unchanged-build repeat returned 16.7–16.8 ms median p95 intervals for original and all three themes, with 2,000 completed callbacks and zero stalls. Median sampled content-engine time was 32.29 ms Terminal Vision, 41.42 ms Browser Archeology, and 41.38 ms Liquid Dream. Retain the failed first run as measurement variability rather than claiming the second run proves causality or field performance. The live result remains targeted evidence, not a claim that every landing page is understood.

The unified lifecycle now reclassifies inserted content plus relevant class/state/label/text mutations, restores affected subtrees before rescanning, and restores/releases detached nodes. A live six-site × three-theme capture pass completed without application errors. Review caught two reusable failures: authored colored promo headings must not become theme title bands, and a solid control over media must keep control ownership through foreground resolution. Both are fixed and covered by the fixture.

On the final five-repeat local workload, all 20 original/theme samples completed 2,000 frame callbacks with zero stalls. Median p95 frame intervals were 16.7–16.8 ms. Eight unit checks and 13 isolated Chromium checks pass. Excalidraw remains intentionally conservative: the canvas is authored while sufficiently opaque controls can be themed. Shadow roots, canvas pixels, CSSOM-only updates, inline-style-only updates, and geometry-only changes remain bounded rather than prompting a second renderer.

## Historical experiment log — superseded architecture

The entries below preserve observations, failures, and measurements that informed the current design. Date-relative words such as “latest,” “current,” and “next” apply only within their original experiment context.

Latest owner request: **look for performance and visibility issues and fix them.** Experiment 09 found two independent problems. Continuous/fixed/multi-radial background paints caused repeated missed frame opportunities, especially in Liquid Dream, while a labelled chart on a solid authored panel could inherit theme ink without transferring ownership of its white backing. The renderers now use static, cheaper gradients; C preserves a conservatively recognized chart and its supporting labels as one authored visualization unit. See [the iteration record](EXPERIMENT-09.md).

Measured on the local scroll/interaction fixture over five repeats, every renderer/theme combination finished with a 16.7–16.8 ms median p95 frame interval. Simple Liquid Dream moved from 66.7 ms to 16.8 ms and from 380.2 ms to 231.0 ms median main-thread task duration; contextual Terminal Vision moved from 50.0 ms to 16.8 ms and from 362.2 ms to 257.2 ms. All 18 isolated Chromium checks and eight unit checks pass. This is local headless evidence, not a field-performance claim.

Latest owner observation: **GitHub user profiles have visibility failures in Browser Archeology, and Terminal Vision has a specific failure around the green activity boxes.** Experiment 08 traces these to four reusable cases rather than a GitHub correction: nested authored foregrounds inside themed controls, visually button-like links without button roles, bounding-box-only media overlap, and scalar activity grids whose authored light scale conflicts with a dark theme. Browser Archeology now pairs nested header labels with system-gray controls; Terminal Vision gives semantic `data-level` grid cells a five-step phosphor scale and treats native disclosure rows as controls. See [the iteration record](EXPERIMENT-08.md).

Measured on the public `github.com/aelishRollo` profile at 1440 × 1100, the affected Platform/Search/auth labels and contribution-activity disclosure headings had no remaining base-color contrast failures in simple or contextual Browser Archeology/Terminal Vision. Visual review confirmed the previously dark activity headings and pale calendar cells were legible. This is targeted profile evidence, not a claim that every authored profile card is resolved: Terminal Vision's simple renderer can still place themed foregrounds on unrecognized white README or data-visualization panels.

Latest owner observation: **each substantial Browser Archeology element should carry minimize, maximize and close furniture, greyed out so it does not look clickable, with other suitable cues from the original skin.** Experiment 07 applies one muted cluster per recognized document, panel, or substantial navigation rail; untitled regions receive an inactive strip, narrow layouts keep a smaller cluster, and nested rails collapse to one window. It also restores selected original-skin states and inset surfaces. See [the iteration record](EXPERIMENT-07.md). This is implemented and locally/live validated, but still awaits owner judgment on whether the controls look sufficiently inert.

Latest owner observation: **Terminal Vision looks good on most websites, but Browser Archeology and Liquid Dream do not.** Experiment 06 treats Terminal Vision's success as a coherence lesson rather than a dark-mode-only effect: quiet base surfaces, a repeated low-contrast texture, one strong accent, and consistent interaction states survive imperfect recognition better than isolated high-intensity decoration. Browser Archeology now carries a system-wide desktop/chrome vocabulary and a conservative CSS-only document fallback; Liquid Dream uses quieter fluid surfaces with rainbow reserved for hierarchy. See [the iteration record](EXPERIMENT-06.md). This is an implemented hypothesis awaiting owner review, not evidence of broad website quality.

The bounded failure matters: A still cannot reliably recover every prose child of a computed `display: contents` landmark. An `h2`-and-paragraph selector missed MDN's nested structure, while broadening it would recreate repeated document cards. Keep C as the structural comparison rather than hiding this limitation with a broad `div` rule.

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

## Experiment 06 lessons

- Terminal Vision's transferable advantage is coherence: a restrained canvas, repeated texture, clear accent hierarchy and related states continue to read as one theme even when the classifier misses a region.
- Strong identity does not require maximum area. Liquid Dream is clearer when warm reading surfaces dominate and the rainbow marks navigation, headings and interaction instead of filling every recognized panel equally.
- A CSS-only prose fallback can safely use a direct `h1` plus content evidence. An arbitrary `h2` plus descendant prose is not a safe substitute for computed structure; keep the visible failure rather than reintroducing repeated cards.
- Decorative window controls are expendable at narrow widths. The actual site title must keep the available space; the furniture is not functionality.

## Experiment 07 lessons

- Repetition needs one ownership boundary. A panel with several headings gets one title bar; a neutral wrapper and nested navigation rail get one outer window.
- Disabled-looking furniture should differ at the asset level, not merely through opacity. Muted gray glyphs with embossed highlights remain crisp while avoiding the active black control treatment.
- An untitled substantial region can carry a thin inactive strip without inventing a false name. Its control cluster stays CSS background artwork with no DOM, hit target, cursor or accessibility role.
- Narrow layouts now retain a smaller furniture cluster because the owner's newer requirement supersedes Experiment 06's omission rule. Reserved title padding prevents overlap in the exercised fixture.
- The most reusable details from the original skin are state and depth cues: visited purple, red hover/focus, yellow notes, grooved separators, inset fields and embossed disabled controls. Fake browser menus and address text remain inappropriate for arbitrary sites.

## Experiment 08 lessons

- A design-system class containing “Brand” is not evidence that the element is a protected brand mark. Require a whole `brand` token or stronger logo/wordmark/branding evidence.
- Bounding boxes alone over-report media overlap when clipped or inactive responsive content still has geometry. Hit-test the media and keep the explicit local `figure`/`picture` relationship for genuine overlays.
- Nested labels in a recognized control should consume the control's foreground/background pair even when the author adds harmless filter or compositing effects. Visually button-like links can be recognized from border, padding and display without relying on host classes.
- A gridcell `data-level` sequence carries scalar meaning independent of its original green hue. A theme-native monotonic scale preserves that meaning more coherently than retaining a light-site palette on Terminal Vision.

## Experiment 09 lessons

- Static paint can still be expensive during scrolling. Removing continuous motion did not fix Liquid Dream until its full-page and repeated multi-radial gradients were simplified as well.
- Theme identity survived the cheaper treatment: keep rainbow hierarchy bands, restrained linear surface washes, typography and control shape; motion is not required to communicate the theme.
- A large labelled SVG or canvas inside a solid, labelled owner is useful structural evidence for an authored visualization. Preserve that foreground/background unit instead of repainting arbitrary white cards or forcing theme ink onto them.
- Mutation processing should share document-wide media geometry across a batch and discard nested added roots. Repeating the same full-document query for every added node is avoidable work.
- A profiler allow-list is part of the measurement system. Excluding `contextual.js` made its sampled engine time incorrectly appear as zero; measurement blind spots must be fixed alongside product cost.
