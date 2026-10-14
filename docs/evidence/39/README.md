# Iteration 39 evidence

The starting commit was `c93a4f35790847ef247cef0512741cb211ea661b`. All live probes use isolated Chromium profiles on the public MDMI home page; none use the owner's normal browser profile.

- `baseline-fixture.json`: starting-build annotations for the new general reproduction.
- `browser-final.log`: complete 18-check browser run before the final large-carousel insertion guard.
- `browser-focused.log`: final all-theme hidden-reveal/window and mixed-media regressions, including a large carousel insertion, actual pointer/keyboard close activation, and restoration.
- `navigation-final.log`: successful complete navigation repeat before the final carousel guard.
- `navigation-invalid.log` and `navigation-final-audit.log`: invalidated unthemed control runs, retained rather than discarded.
- `performance-baseline.json` and `performance-candidate.json`: five repeats per mode; both runs have no valid mode majority. Invalid sample task totals are not equivalent completed workloads and should not be used to claim a speedup.
- `live-summary.json`: final built-file hashes, desktop four-theme and Browser Archeology mobile layout/role samples. Early desktop close samples were taken during the site's dismissal animation and are not settled dismissal assertions; the separate desktop verification and the mobile opacity-below-.01 sample check the completed interaction.
- `header-before.png` / `header-after.png`: 1440 px Browser Archeology header comparison. The logo remains authored, while nested navigation receives theme paint.
- `inset-cards-after.png`: repeated linked expertise items inside one parent window.
- `footer-after.png`: industry lining and footer treatment with one real cookie close slot.
- `desktop-photo-after.png` and `desktop-close.json`: outer photo chrome and the real close action reaching opacity zero / hidden visibility.
- `mobile-photo-and-notice.png`: outer media chrome and the notice at 390 px. The site's theme launcher can overlap the notice's lower-right whitespace; its close remains clear.

These are sampled scroll states, not a claim that every authored animation is disabled or every MDMI state was reviewed. In the desktop Browser Archeology traversal, the carousel retained frame annotations while MDMI kept its wrapper at opacity zero through scroll position 3000; the wrapper revealed by position 3250. Surface does not override that site-authored visibility. Screenshots can therefore show a blank carousel interval even when its theme ownership is correct. Live capture timing varied; the intended distinction is stable theme annotations versus authored visibility, not identical scene pixels.
