# Experiment 01: expressive CSS versus adaptation + CSS

Implementation was authorized after the MVP brief. Authorization covers the comparative prototype; it does not select a final renderer, Dark Reader fork, XML/JSON standard, telemetry system, or public release.

## Hypothesis and decision

Renderer A uses recognizable HTML/ARIA roles. Renderer B uses the same theme styling plus Dark Reader for website color adaptation. B is worth keeping only if its coverage/quality benefit exceeds its compatibility and performance costs.

The three themes exercise dark glow/motion, light multicolor texture/decoration, and monochrome typography/state distinctions. All themes keep configured effects enabled. Theme rendering cost and engine overhead must be reported separately.

## Integration gate

1. Own expressive colors survive both initial adaptation and subsequent website mutations.
2. Enabling B, changing theme, and disabling restore the current document, including after navigation and repeated switches.
3. Application does not create an observer feedback loop or accumulating styles.
4. Cross-origin stylesheet loading works through the pinned API in an MV3 content-script context.

**Observed during implementation:** the published Dark Reader API wraps Chromium messaging and discards the Promise return. The adapter preserves native transport for our own messages. The USER-origin expressive stylesheet is outside `document.styleSheets`. These are integration decisions, not a renderer selection.

The API also leaves a shadow-root inversion style after disable; the adapter removes styles created by its own run. The source package is not patched. The current diagnostic key is `stylesheetProxy: false`; older captured reports used the imprecise key `pageWorldProxy: false` for the same CSSOM-proxy setting. The upstream custom-element proxy is not explicitly disabled, and its execution depends on the page context/CSP. This rename changes diagnostics only, not rendering behavior.

## Comparative matrix

Run both variants with all three themes on Wikipedia, YouTube, GitHub, and three unfamiliar sites representing an article, commerce, and an interactive app. Freeze renderer code before the unfamiliar-site pass. Run corrections off first; keep correction-enabled results separate. Record that the API bundle contains no Dark Reader site-fix database.

For each of 18 combinations per renderer:

- Capture source/reference theme traits, original page, and themed page.
- Rate recognizable identity, appeal, readability, and whether enough of the page is actually styled.
- Read content, follow a link, use menus/forms, navigate by keyboard, and inspect selected/error/success states.
- Exercise scrolling, dynamic updates, navigation, and disable/restore.
- Record media/logo changes and content overlap. Do not count a challenge page, blocked login, or failed navigation as a successful site test.
- Record concrete failures before adding a correction. A correction is acceptable evidence of extensibility but cannot retroactively improve the automatic-coverage score.

## Proposed gates from the brief

| Area | Gate |
|---|---|
| Appearance | At least 15/18 combinations attractive, readable, recognizably themed; at least 8/9 unfamiliar-site combinations |
| Meaning and interaction | No critical broken control, obscured content, lost focus indicator, or erased essential state distinction in tested workflows |
| Preservation | No unintended photo/logo changes in sampled cases; ambiguous image cases recorded |
| Lifecycle | 20 switches do not accumulate styles/observers/decorations; disable restores the current page without reload |
| Engine | No recurring engine-attributable tasks >50 ms; provisional p95 interaction regression ≤20 ms on fixed hardware |
| Complexity | Select B only if at least three failing combinations become passes with no loss of passing cases or violations of another gate |

These are research decision gates, not an assertion that the prototype passes them. Browser fixture assertions verify specific behavior only. DOM style-node counts cannot prove absence of every observer or memory leak.

## Performance protocol

Use the same browser version, hardware, viewport, cache state, and scripted workload. Record cold page load separately from warm switching. Use at least five repetitions and keep individual samples, not only averages.

Compare extension disabled, A with full effects, and B with full effects for page load, scroll frame intervals, input-to-next-paint latency, and long tasks. Use traces to attribute scripting, style recalculation, layout, and paint/composite costs. A theme may be expensive even with a cheap engine; report that instead of removing its effects.

On controlled fixtures, compare the running engine with equivalent frozen stylesheet output. Verify equivalent visible/computed output before interpreting that comparison. Frozen styles are a laboratory control, not a product reduced-effects option. Dynamic changes that require engine work need separate traces; a static fixture is insufficient to validate dynamic performance. Application duration from the popup is diagnostic wall time and must not be presented as isolated engine CPU.

## Learning sessions

After technical gates pass, observe five people browsing their own sites. Record choices, disable reasons, and whether at least three voluntarily continue using it. Exported local notes and direct observation are enough; no automated telemetry is required. This agent cannot substitute for those sessions or declare product fit from screenshots.

## Boundaries still unresolved

Style-only portability of source decoration; general recognition of semantic states; CSS background media and inline SVG identity; readable unknown surfaces; shadow-root coverage; CSSOM-only updates; conflicts with other theming tools; cross-origin/authenticated stylesheets; engine costs versus theme costs.

If neither renderer clears the quality gates, choose one targeted follow-up from the observed failure patterns. Do not grow a library of per-site/per-theme styles to conceal weak automatic coverage. The visual editor, layout customization, marketplace, adaptive effect reductions, and public package format remain deferred.
