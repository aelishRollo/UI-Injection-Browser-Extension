# Iteration 34 — MDMI mixed landing, reveal, and overlay continuity

## Owner observation and prior evidence

The owner reports that the themes do not really work on mdmi.com and asks for a scalable, performant fix that carries forward earlier theme learning. The observation concerns the visible result; it does not itself identify which renderer rule failed. Iteration 18 had already shown that substantial heading-led linked cards and neutral gradients improved MDMI coverage, while its broader effect observer caused excessive sampled work and was rejected. Iteration 25 deliberately left MDMI's animated cards authored during opacity changes. Iteration 33 showed that restoring a large established subtree could erase useful paint. The recent opaque-owner cookie fix showed that media under a notice should not control its text pair.

## Reproduction and root causes

The isolated MDMI review at 1440 × 1000 found a multi-section homepage `main` classified as one `reading` owner. Its individually designed sections then lost useful hierarchy. The awards section places an image across the local section; when classification ran before it entered the viewport, `elementsFromPoint` could not confirm the image, and Browser Archeology gave its light image copy a dark theme heading color. The service cards had a neutral gray authored background and a parent/card opacity reveal. Their light headings could sit over pale paint; after animation settlement, a whole-subtree restore could remove card ownership while the authored background transitioned through another neutral gray. The fixed cookie notice above unrelated hero media could reveal without a DOM mutation; hidden descendants had no `innerText` in the initial scan, and the notice's button could be classified as an image overlay instead of an action on its own opaque panel.

These were shared recognition and lifecycle failures. No site selector or new rendering mode was needed.

## Unified-path changes

- Recognize a wide main with at least four substantial direct sections and prominent media as a mixed landing shell; keep the sections eligible for their own purposes.
- Pair text with an explicitly positioned image that covers nearly all of its local section when that section is offscreen; keep the existing hit-test and preservation behavior elsewhere.
- Recognize substantial medium-gray, heading-led linked cards inside known content through opacity-only reveals. Treat known theme-owned opacity as a valid foreground pairing state.
- Prepaint a bounded neutral fixed or absolute notice while hidden, including its direct text and controls. Use its opaque owner to avoid misreading unrelated lower media as the notice's backing.
- Recheck large class/effect ancestors without discarding established descendant paint. Keep owned cards during their effect settlement, while unowned settling panels still restore and re-enter the bounded recognizer.

The rules are shared by all four declarative theme packages. They preserve unknown effects, arbitrary media, and visualizations instead of painting by host appearance.

## Regression and review evidence

The new `mixed-media-landing.html` fixture exercises all four themes from a disabled-to-enabled startup: composite shell, offscreen image copy, hidden-to-visible notice text/action contrast, nested card opacity at 0/0.5/1, no card ownership removal during large ancestor or card effect settlement, scroll entry, and disable restoration. The existing hierarchy and unowned transient-panel checks remain in the browser suite. Build, 12 unit checks, and all 17 isolated Chromium checks pass.

Targeted live review found dark, readable Monochrome Signal service cards after settlement where an earlier capture had pale cards with white headings. The notice title, paragraph, and controls were paired against its themed opaque panel. A four-theme 390 × 844 six-position probe reported `scrollWidth=390` at each position. The source layout still places some narrow copy over the award graphic; that observed composition needs separate exact-state evidence before changing shared media rules.

The parser-startup browser assertion was adjusted for a headless run where `requestAnimationFrame` arrived after a delayed parser script even though the renderer recorded reveal at 34 ms. It checks the renderer reveal clock when the parser has already completed. The suite ignores only the exact `skipTransition()` page error produced by its intentional View Transition skip, and the transient-panel check waits for its actual ownership marker. These are harness timing corrections, not extra product paths.

## Performance and remaining question

The change keeps work inside existing bounded scans and the six-read effect settlement; it adds no poller, host rule, or per-theme recognition. A five-repeat run before the last hidden-notice/card-settlement refinements produced 25 valid samples and 2,500 completed frames, zero stalls, and 16.7–16.8 ms median p95 frame intervals in the unthemed control and all four themes. Median sampled content-engine work was 21.56 ms Browser Archeology, 23.01 ms Liquid Dream, 21.59 ms Monochrome Signal, and 19.73 ms Terminal Vision. An earlier Liquid Dream run had 33.3 ms median p95, so one favorable run is not a guarantee.

The exact final-state five-repeat workload exited successfully but marked **all 25 samples invalid**: even the unthemed control recorded 104 stalled frame intervals, and the theme modes recorded 119–141 each. Its 250 ms frame cadence and low sampled-engine totals cannot support a theme-cost conclusion. The standard navigation check had passed earlier in this iteration (159.7 ms large route, 13.5 ms long scroll, zero late class marker writes, all deferred tables themed). In final-state repeats, the large route measured 142.8/272.5/394.3 ms against a 200 ms guard, while one long-scroll sample measured 2,452 ms against 300 ms; the first final repeat still wrote zero class markers. A diagnostic copy with only the two frame-time assertions relaxed then verified final-state route continuity, zero late class marker writes, long-article foreground retention, and deferred table/row ownership for all four themes. Its frame times were still 353.9 ms for route and 2,461.3 ms for long scroll. Together with the invalid unthemed control, this is evidence of severe local headless scheduling variability, not proof that the final performance guard passes. Re-measure in a stable session before claiming the exact final-state workload result.

A final standard live capture reached `https://mdmi.com/` and applied all four themes at 1440 × 1000 with no horizontal overflow. Visual review of the top viewport showed distinct Browser Archeology, Liquid Dream, Monochrome Signal, and Terminal Vision treatments; Browser Archeology retained a large light panel by design, and Liquid Dream's large title sits close to the bottom edge of its authored hero frame. These are remaining visual review points, not evidence of a new renderer path.

A passing fixture and targeted screenshots do not prove universal MDMI coverage. Next, review the owner's reloaded MDMI viewport and actual interaction timing, then address any remaining concrete failure in shared recognition, preservation, pairing, or theme treatment. Repeat the navigation and performance checks under stable browser scheduling.
