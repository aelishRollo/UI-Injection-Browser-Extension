# Surface — website themes

Surface is a local Chromium MV3 extension that applies expressive, readable themes to ordinary websites. It has one rendering approach and four visual identities: Browser Archeology, Liquid Dream, Monochrome Signal, and Terminal Vision.

Surface recognizes page purpose before decorating it. Reading regions, sections, panels, navigation, tables, labelled visualizations, controls, headings, and fields receive coordinated treatments. Text and its effective solid background are resolved as a pair; uncertain media, effects, brand marks, and authored visualizations are preserved rather than guessed.

> **Current project state:** Surface 0.2.0 has one unified renderer. The former A/B/C suite, Dark Reader integration, correction toggle, and renderer setting were deliberately removed. [The authoritative architecture record](docs/PROJECT-STATE.md) takes precedence over Experiments 01–09, which are retained only as historical evidence.

## Try it

The built extension is in `dist/`.

1. Open `chrome://extensions` (or `brave://extensions` / `edge://extensions`).
2. Enable **Developer mode**, choose **Load unpacked**, and select this project's `dist` folder.
3. Visit an ordinary HTTP(S) website and choose a theme from the toolbar popup or the compact **Themes** control at the bottom right of the page.

**Pause all** restores original appearance globally. The website switch remembers an exact-host exception. Preferences apply to embedded HTTP(S) frames based on the top-level site. Settings stay in `chrome.storage.local`; there is no analytics, remote theme code, or automatic reporting. Exporting a note explicitly downloads a local JSON file.

## Develop and test

The project uses only `main` and `development`. Make changes on `development`, validate them, then commit and push. Merge into protected `main` through a pull request only when explicitly requested. See [AGENTS.md](AGENTS.md).

Requires Node 20+ and a Chromium test browser.

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm run test:navigation
npm run test:live
npm run test:performance
npm run fixtures
```

The isolated fixture uses ports 4173 and 4174. Browser, navigation, and performance commands create temporary profiles and never use the normal browser profile. Do not run fixture, browser, navigation, or performance commands concurrently because they share ports. Screenshots and machine-readable results go to ignored `test-results/`.

`npm run test:live` captures the four themes on seven public websites for review. `SURFACE_SITES=github` and `SURFACE_OUTPUT=test-results/live-retry` select a targeted run. Public pages can change, so a successful capture is not automatically a quality pass.

## Rendering model

- A single purpose-aware renderer handles every theme.
- Theme identity is authored as a validated declarative treatment package over the renderer's stable contexts, purposes, states, icons, responsive rules, and optional packaged assets. Adding a theme does not add a renderer path.
- Structural and semantic evidence establish paint ownership before visual decoration is applied, including substantial neutral, heading-led panels on composite landing pages.
- A mixed main landmark can expose individually bounded neutral editorial cards without turning the whole control-heavy region into one surface. Recognized native buttons use CSS paint so their visible face matches the paired theme ink.
- Solid and translucent sRGB layers are composited to resolve readable text; authored pairs that already pass are retained.
- Recognized tables map only neutral structural header/body paint to theme surfaces; chromatic and scalar cells stay authored, while compact sort indicators remain intact.
- Brand marks, media relationships, background images, complex effects, and labelled chart units use conservative preservation paths.
- New subtrees and relevant class, state, label, and text mutations are batched and reclassified. Late-populated neutral owners receive a bounded ancestor recheck, and page runtimes that strip paint-critical ownership markers are repaired in the same mutation microtask. Large SPA reading routes keep direct semantic child paint continuous while offscreen foreground work remains deferred; detached themed nodes are restored and released.
- Recognized pointer-transparent sticky navigation fades are removed; their generated gradients otherwise leave horizontal bands when a rail scrolls across a different canvas.
- On full navigation, a compact selected-theme first-paint sheet and the unified renderer are already resident at `document_start`. It contains the real theme's surfaces, typography, hierarchy, and primary motifs; interaction and secondary state rules arrive in the full USER-origin sheet. The renderer follows parser mutations before paint, and a short guard releases after the first parser-time treatment. USER-origin handoff and the final document pass do not control first visibility.
- Expressive CSS is static. Continuous animation, fixed full-page gradients, and repeated expensive radial paints were removed after measured frame stalls.
- Verified role corrections apply automatically only where general semantics are unavailable.
- Disable and theme switching restore the author's prior attributes, inline properties, and computed appearance without a reload. During an enabled theme-to-theme change, the current themed pixels remain rendered while the destination stylesheet and bounded recognition prepare; Chromium then swaps directly to the completed theme without an empty canvas or cross-fade.

The worker inserts generated CSS with USER origin and removes the exact prior sheet by document ID. Theme rules use `!important`, so recognition remains deliberately conservative. The renderer does not reparent content or replace site layout systems.

## Known boundaries

- Expressive rules stop at shadow-root boundaries. Closed roots, browser-owned pages, extension stores, PDFs, and non-HTTP frames are outside demonstrated coverage.
- Canvas/WebGL content and arbitrary inline SVG or CSS background media do not expose enough structure for universal recoloring.
- Existing inline-style changes, page-world CSSOM-only updates, and geometry-only changes are not all observable without expensive whole-document polling.
- Contrast checks model base colors, not rendered decorative pixels. Unknown color spaces and complex compositing remain authored.
- Semantic inference can miss or misclassify unfamiliar composite interfaces. Partial coverage is preferred to repainting arbitrary containers.
- Local headless performance results are regression evidence, not a field-performance claim.

## Shared learning

[docs/PROJECT-STATE.md](docs/PROJECT-STATE.md) is the authoritative architecture record, and [docs/LEARNINGS.md](docs/LEARNINGS.md) is the ongoing evidence log. Experiments 01–09 remain as historical evidence for why the previous A/B/C renderer suite was replaced; their recommendations and next steps are not current work. See [asset provenance](docs/ASSETS.md) and [theme adaptations](docs/THEME-PORTS.md) for visual-source details.
