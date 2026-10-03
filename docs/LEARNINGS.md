# Shared theme learning log

Read this before theme/renderer changes; update it as experiments land. This repository file and the linked evidence carry learning between project chats. They do not automatically inject context into unrelated chats or already-running conversations.

## Current understanding — October 3, 2026

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

C carries explicit purpose and evidence attributes, with diagnostic counts. A/B use a smaller CSS-only semantic approximation. This experiment leaves Terminal Vision's appearance and the default renderer unchanged. The purpose pass is currently enabled only for Browser Archeology and Liquid Dream; sharing it with Terminal requires a separate visual comparison.

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
