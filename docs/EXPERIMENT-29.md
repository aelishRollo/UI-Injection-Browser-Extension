# Iteration 29 — table rows after a local rescan

Date: October 11, 2026

## Owner observation

The owner confirmed the Appearance, preview, caption, and rank-heading visibility issues were fixed, but a screenshot of the bottom of the Aircraft table on [Federal Police (Mexico)](https://en.wikipedia.org/wiki/Federal_Police_(Mexico)) still showed its final two rows with light-gray backing, black text, and blue links under Terminal Vision.

## Evidence and failure mode

The live page uses inline `background:#efefef; color:black` on those two `tr` elements. In an isolated 1956 × 814 Chromium run with Wikipedia's wide layout, the current full-document scan recognized them as table body paint and rendered them dark, both immediately after `DOMContentLoaded` and after scrolling. That run did not reproduce the owner's precise visual state.

Code review exposed a general lifecycle failure: an incremental class or text change can restore an individual row from authored state, then scan only that row. The table-purpose pass previously considered tables inside the scan root, so it could not transfer the restored row's neutral paint back to the theme. Removal of a table-part marker by page code was also not watched for repair. A fixture with inline neutral body rows provides a deterministic reproduction of both paths.

## Shared change

The existing table-formatting recognizer is reused for a scan root inside an already recognized table. It evaluates only the affected row or cell subtree, keeping chromatic, scalar, gradient, and effect-backed cells outside paint ownership. Table-part markers join the narrowly watched paint-critical attributes, so removal on an existing row is repaired in the same mutation microtask. This adds no host selector, theme-specific table logic, or parallel renderer.

The four-theme browser regression changes one inline neutral row's class and removes another row's table-part marker, then requires table-body paint and readable text to survive. A live probe of the exact Aircraft rows repeated those updates after scrolling; both retained Terminal Vision's dark body paint. The specific mutation or timing that produced the owner's screenshot remains unverified until this build is reloaded in that browser.

The build, 12 unit checks, all 15 browser checks, and the large-route regression passed; the route reached the next frame in 198.6 ms under its 200 ms guard. The five-repeat local workload produced 25 valid samples, 2,500 completed frames, zero stalls, and 16.7–16.8 ms median p95 frame intervals. One Liquid Dream sample measured 33.3 ms p95, while its other four samples measured 16.7–16.8 ms. Median sampled renderer work was 38.48/39.84/33.22/37.08 ms for Browser Archeology/Liquid Dream/Monochrome Signal/Terminal Vision, higher than the previous run; this could be fixture or machine variability and is not a field-performance claim.
