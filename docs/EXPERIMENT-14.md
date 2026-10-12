# Iteration 14 — no intermediate theme paint

October 8, 2026. Baseline: `development` after Iteration 13. [Shared learning log](LEARNINGS.md).

## Owner observation

The navigation guard no longer exposed the normal authored page, but a generic dark-mode phase could still appear before Terminal Vision's full hierarchy. The same class of transition must be eliminated for Browser Archeology and Liquid Dream, and the solution must generalize rather than special-case Wikipedia.

## Cause

Iteration 13 made the entire root transparent while settings and renderer work were asynchronous. That exposed the browser's backing canvas instead of an exact theme canvas. It then revealed a small page/base-ink phase before full purpose recognition, so a dark page could be visible without Terminal Vision's content, title, navigation, and text treatment.

The reported Wikipedia article also demonstrated two timing hazards. A complete parsed-document scan before reveal took roughly 3.2 seconds. A bounded first-viewport scan was much cheaper, but the parser could grow a neutral full-width wrapper after the scan and before the next paint, producing one light frame before mutation recognition caught up.

## Generalized change

The build generates one minimal startup stylesheet from each theme's canonical canvas color and color scheme. The service worker keeps the selected stylesheet registered with Chromium at `document_start`, persists it across sessions, and updates its matches for global pause and exact-host exceptions. This stylesheet exists before settings messages, module imports, or USER-origin expressive CSS installation.

The static guard now keeps the root opaque and makes only authored body content transparent. Top documents read normalized settings directly from extension storage rather than waking the service worker merely to recover their own host and theme; cross-origin frames still ask the worker for the top-level host.

Before reveal, the unified renderer runs its existing purpose, preservation, paint-ownership, and contrast recognizers over only the initial viewport. This is not a second renderer: the same `scan` pipeline is bounded by cached viewport membership, and its prose/control evidence counts only in-scope descendants. The normal mutation observer starts immediately, and the complete document scan still runs after parsing.

During parsing, neutral ancestors of a semantic `main`/article landmark can provisionally own startup shell paint before their final geometry exists. Mutation batches refresh that evidence as the parser adds or grows the canvas. The stricter complete-document shell rules remain unchanged, so this does not turn arbitrary containers into permanent page shells.

## Useful failures

- Scanning the entire parsed Wikipedia document before reveal removed the paint transition but reintroduced a roughly 3.2-second wait.
- The first viewport-bounded version measured about 0.23–0.45 seconds in its own scan, yet a late-growing wrapper could still be white for one visible frame.
- Waiting for an additional animation frame removed that wrapper race, but a busy parser delayed the frame; one targeted run revealed at roughly 1.69 seconds.
- Structural landmark-ancestor evidence plus same-batch mutation refresh removed the race without that extra frame wait.

## Evidence

The parser-delay fixture now runs a full navigation for Terminal Vision, Browser Archeology, and Liquid Dream. For each theme it verifies the exact registered startup canvas before reveal, transparent authored content, no visible unclassified frame, page and shell ownership, content and title classification, and the theme-specific title treatment on the first visible frame.

On `https://en.wikipedia.org/wiki/Students_for_a_Democratic_Society`, the final isolated Terminal Vision trace recorded hidden authored frames over the exact green canvas. The first visible sample occurred around 0.86 seconds and already had:

- green root and body paint;
- green left and right viewport-edge shell paint;
- the main region classified as content;
- the level-one heading classified as the page title;
- the previously corrected sticky navigation fades terminating in the Terminal surface.

Visual review of the captured first viewport showed the full Terminal treatment rather than a generic dark page, with no white side bands. Public-page timing varied materially across repeated requests, so the ordering and classification are the durable evidence; the elapsed number is not a service-level claim.

The final validation record is captured in the shared learning log. Remaining platform boundaries from the authoritative project state still apply.
