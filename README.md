# Surface — website theme experiment

A local Chromium MV3 prototype for comparing three ways to apply expressive themes to ordinary websites. **This is an experiment, not a validated universal theme engine.** The name Surface is provisional.

## Try it

The built extension is in `dist/`.

1. Open `chrome://extensions` (or `brave://extensions` / `edge://extensions`).
2. Enable **Developer mode**, choose **Load unpacked**, and select this project's `dist` folder.
3. Visit an ordinary HTTP(S) website and open the extension's toolbar popup.
4. Choose Browser Archeology, Liquid Dream, or Terminal Vision.
5. Expand **Experiment controls** to compare A, B, and C. Keep corrections off for the baseline.

The compact **Themes** control at the bottom right of the page provides quick switching without reopening the toolbar popup. Its panel also pauses or resumes Surface globally. The control appears only in the top-level page and remains available while paused so Surface can be resumed in place.

**Pause all** restores original appearance globally. The website switch remembers an exact-host exception, including on subsequent visits. Preferences apply to embedded HTTP(S) frames based on the top-level site. Already-open tabs can connect from the popup; reload if the browser declines injection.

The prototype starts enabled with Terminal Vision and renderer A. Installing it grants HTTP(S) access so it can theme unfamiliar websites automatically. Settings and exceptions stay in `chrome.storage.local`. There is no analytics, remote theme code, or automatic reporting. Exporting a test note explicitly downloads a local JSON file; it does not send it anywhere. Renderer B may fetch public stylesheets through the extension worker without credentials to overcome cross-origin CSS restrictions.

## Shared learning

Read [the shared learning log](docs/LEARNINGS.md) before theme work and update it after each experiment. [AGENTS.md](AGENTS.md) makes this part of every project chat's workflow. It distinguishes owner feedback, hypotheses, measured evidence, and open questions; representative evidence is committed under `docs/`.

## Develop and test

The project uses only `main` and `development`. Make changes on `development`, validate them, then commit and push without requesting confirmation. Merge `development` into protected `main` through a pull request only when the owner explicitly requests it. Keep both branches after merging and synchronize `development` with `main`. See [AGENTS.md](AGENTS.md) for the standing workflow instructions.

Requires Node 20+ and a Chromium test browser.

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm run test:live
npm run test:performance
npm run fixtures
```

The fixture opens at `http://127.0.0.1:4173`. Its second server at port 4174 exercises cross-origin CSS. The browser suite creates and deletes a temporary browser profile; it never uses your normal profile. `CHROMIUM_PATH` can select an existing Chromium executable. Screenshots and machine-readable results go to `test-results/` (ignored by Git). The live command visits six public websites; use `SURFACE_SITES=github` and `SURFACE_OUTPUT=test-results/live-retry` for a separate targeted retry. Do not run fixture/browser/performance commands concurrently: they use the same local ports. Run performance checks without other browser tests competing for resources.

After rebuilding, reload the unpacked extension and refresh previously themed tabs. Browsers terminate old extension contexts on extension reload; this prototype does not attempt a persistent reinjection/recovery system for that developer-only event.

## What is implemented

- Three internal, versioned theme definitions and expressive CSS adaptations. Browser Archeology gives recognized documents, panels, and substantial navigation rails beveled window frames, icon-bearing title bars, and visibly disabled decorative window furniture without adding fake interactive controls.
- **A:** semantic CSS only; no DOM polling, observers, or per-element writes.
- **B:** pinned Dark Reader 4.9.133 website API under the same expressive CSS.
- **C:** contextual regions with experimental purpose recognition for all three themes (reading documents, sections, panels, tables, labelled data visualizations, navigation, headings, and fields). Its foreground/background resolver composites solid/translucent sRGB surfaces, keeps readable authored pairs, and adjusts failing text using theme ink. It preserves authored foregrounds over unresolved media/effects, keeps solid chart panels and their labels as authored visual units, and gives protected brand marks their original backing color. Select C in Experiment controls to try it.
- Lazy loading of the adaptation library only when B is selected.
- Theme selection, global pause, exact-host disable, and restoration without a page reload.
- A compact, page-level theme picker isolated from website and renderer styles with Shadow DOM.
- Serialized settings changes and per-document application/cleanup.
- An opt-in, shared role correction for YouTube's video overlay controls, plus fixture corrections for unmarked controls and error/success roles.
- Local diagnostics and manual issue-note export.

The reference website at `/Users/alecrollison/Code/personal sites/html5up-read-only` is not modified or used as the extension destination.

## How the layers cooperate

The worker inserts expressive CSS using `chrome.scripting.insertCSS` with USER origin. These rules do not appear in the website's `document.styleSheets`; Dark Reader cannot discover and transform that sheet. Rules are removed by the exact CSS string and document ID, so navigation cannot make an old cleanup operation remove a new document's theme. Theme properties use `!important` to remain effective against author rules, making overly broad selectors a real quality risk to measure.

Dark Reader's API bundle wraps `chrome.runtime.sendMessage` without preserving the Promise return. The content script captures the native transport before importing the adapter; the stylesheet bridge also uses that captured transport. The pinned API also leaves a shadow-root inversion stylesheet on disable; the adapter cleans up styles created during its own run. The package is unmodified. Its website API is not equivalent to its extension: no built-in site-fix database is bundled, and page-world CSSOM proxying is disabled. See [docs/EXPERIMENT.md](docs/EXPERIMENT.md) for the decision gates and known coverage limits.

The theme layer changes typography, colors, borders, shadows, decoration, and recognized icon artwork. It does not reparent site content or replace site layout systems. C adds small decorative heading glyphs only in unused `::before` slots; those inline glyphs occupy space and can change wrapping. Existing pseudo-icons stay intact. Borders and fonts can also change geometry. Small recognized masked HTML icon slots retain their existing dimensions, controls, and accessible names. C temporarily adds namespaced classification attributes and custom properties; disable restores their prior values. Decorative theme treatments are static; continuous background animation was removed after repeated local measurements showed missed frame opportunities.

## Known limitations

- Expressive rules stop at shadow-root boundaries. Dark Reader may adapt some accessible shadow-root colors; that does not constitute full theme support.
- Closed roots, canvas/WebGL content, browser-owned pages, extension stores, PDFs, and non-HTTP frames are outside demonstrated coverage.
- Unlabelled/custom surfaces can retain conflicting backgrounds. Semantic inference is intentionally limited. Color-only errors and successes can lose distinction; corrections are not a substitute for fixing the general approach.
- C is deliberately conservative and heuristic. Its classifications can miss or misclassify unfamiliar composite interfaces, offscreen overlays, late style-only changes, and media relationships. Unresolved regions preserve authored foregrounds, so coverage can be partial by design. Contrast checks model base colors, not decorative textures or rendered pixels; existing-element style/text changes do not trigger a fresh scan.
- Ordinary `<img>` media is not filtered, and Dark Reader image analysis is disabled. Inline SVG colors and content-bearing CSS background images remain ambiguous; theme backgrounds can replace a background image on a recognized surface. The current implementation does not claim universal photo/logo preservation.
- Dark Reader may adapt SVG paints. Competing Dark Reader instances and recognized WP dark-mode engines are reported as conflicts instead of knowingly disabling them.
- Updates made only through page-world CSSOM APIs may be missed by B because its proxy is disabled. Late shadow-root detection is similarly incomplete. The fixture exposes both cases.
- Some authenticated stylesheets cannot be fetched by the credential-free bridge. Fetch failures appear in diagnostics. No fallback silently changes renderer B into A.
- Overall rendering cost still requires measurement on representative hardware and real websites. The reported application duration includes worker/import scheduling, not just engine CPU; local frame and task measurements are regression evidence, not field performance claims.

See [asset provenance](docs/ASSETS.md), [theme adaptations](docs/THEME-PORTS.md), the [A/B experiment protocol](docs/EXPERIMENT.md), and the [contextual renderer experiment](docs/EXPERIMENT-02.md), [purpose recognition](docs/EXPERIMENT-03.md), and [icons and dark surfaces](docs/EXPERIMENT-04.md).
