# Iteration 23 — Monochrome Signal

October 9, 2026. Baseline: `development` after Iteration 22. [Shared learning log](LEARNINGS.md).

## Owner direction

Add a fourth theme that looks like `mdmi.com` while preserving Surface's one-renderer architecture.

## Reference observation and boundary

The public MDMI homepage was reviewed at desktop size before implementation. Its transferable visual language was:

- near-black and engineered off-white surfaces with grayscale depth;
- a single coral-red signal color;
- large neutral sans-serif display headings;
- monospaced labels, navigation, and controls;
- thin rules and vertical technical linework;
- oversized pill actions; and
- grayscale landscape/data-like geometry.

Monochrome Signal translates those traits into a declarative treatment package over Surface's existing contexts and purposes. It uses system sans/monospace stacks, original static CSS, and the existing line-icon vocabulary. It does not contain an MDMI host selector, remote font, copied code, logo, image, landscape asset, layout, or motion system.

## Implementation

`src/theme-definitions/monochrome-signal.js` supplies the fourth validated palette and treatment package. A black page canvas with low-contrast vertical rules frames off-white reading surfaces; headings use a restrained sans hierarchy; supporting copy and controls use monospace; controls are black pills with coral hover/selected states; panels and table headers use neutral grayscale depth. Fields explicitly return to dark ink on white so the black control vocabulary does not leak into inputs.

Both user interfaces enumerate the registry. The in-page picker reports the theme count dynamically, and the toolbar popup adds an original Monochrome Signal preview. Live and performance harnesses now consume `THEME_IDS`, keeping future package additions inside one matrix.

The first four-card popup kept the old full-width list and pushed Feedback below the required initial 600 px viewport. The final popup uses a compact two-column chooser with smaller previews and two-line descriptions; Feedback is visible again without removing an option or its descriptive copy.

## Evidence

Visual review covered the editorial fixture, hierarchy/data fixture, open in-page picker, and toolbar popup. The editorial result retained authored media while presenting black canvas edges, an off-white reading plane, coral links and selected state, black pill controls, monospaced supporting copy, a large sans title, thin rules, and a gray supporting panel. Narrow picker bounds and popup visibility remained inside their tested viewports.

A targeted `mdmi.com` live capture at 1440 × 1000 applied Browser Archeology, Liquid Dream, Monochrome Signal, and Terminal Vision without application errors or horizontal overflow. The result preserved the logo and authored landscape relationship. This is source-reference review, not a host correction or a claim that MDMI must reproduce its authored pixels after theming.

The final build and 12 unit checks pass. All 15 isolated Chromium checks pass across the four-theme startup, contrast, table, dynamic-content, restoration, role-correction, picker, and switching matrices. The 800-region SPA regression reached the next frame in 189.2 ms and classified deferred foregrounds on entry.

The five-repeat performance workload covered original plus four themes: 25 valid samples, 2,500 completed callbacks, zero stalls, no recorded long tasks, and 16.7–16.8 ms median p95 frame intervals. Median main-thread task time / sampled content-engine time was 190.10/0 ms original, 246.16/25.14 ms Browser Archeology, 258.88/26.53 ms Liquid Dream, 258.31/26.24 ms Monochrome Signal, and 256.74/23.14 ms Terminal Vision. These are local fixture measurements, not field-performance claims.

One post-popup Chromium run reached `document.readyState === "complete"` before the parser-delay assertion sampled Terminal Vision. An immediate unchanged-build rerun passed that startup check and all remaining checks. Preserve this as timing-sensitive harness variability; it neither demonstrates a product regression nor supports a startup latency guarantee.

## Next bounded iteration

Review Monochrome Signal on one article, commerce page, media page, and interactive application. Prefer declarative treatment adjustments. Change renderer recognition only when a concrete failure generalizes across themes and has fixture evidence.
