# Iteration 39 — stable window ownership on revealing landing pages

Date: October 13, 2026

## Owner observations and reproduction

The owner reports missing treatment on MDMI's top container, CTA, industries wrapper, and footer; window icons appearing inconsistently on expertise and client cards; misplaced icons on the full-width photo's inset content; and duplicate close controls on the cookie notice. These are visual and interaction observations, not measured performance claims.

Correction-free Chromium captures reproduce multiple mechanisms. Hidden expertise cards acquire surface paint but no purpose/window annotations because the previous reveal exception rejects `visibility:hidden`. The site animates that property alongside opacity and transforms without guaranteed observed DOM mutations. The neutral industries lining similarly covers its recognized parent with authored paint. A padded, solid black CTA without a border fails the button-like-link recognizer. Nested semantic navigation retains black paint because recognition stops at the outer header. The photo's heading owns window furniture instead of its enclosing media region. Carousel wrappers and cards lack a stable ownership boundary. The cookie notice has decorative close artwork and a separate real close button.

The starting commit also reproduces the failures on the new general fixture: no CTA control, hidden linked panel purpose, industries lining, or testimonial frame; a titled photo instead of outer media chrome; no header frame; and no reusable close annotation. [Baseline fixture annotations](evidence/39/baseline-fixture.json) retain that comparison.

## Unified recognition and treatment

- Recognized neutral panels, linked cards, structural linings, and explicit carousel cards can receive purpose and foreground paint while visibility/opacity reveals are hidden. Their authored animation remains intact. No perpetual observation or polling is added.
- Short, padded, opaque linked actions can own control paint without an authored border. Media-backed transparent links continue to preserve their authored pairing.
- A substantial neutral inner wrapper covering its content parent is a lining of that region, not another independent window. Geometry evidence is collected before writing the panel annotations.
- Explicit carousel/slide semantics identify neutral heading-led leaf cards. Tracks and slide containers remain structural; incremental scans starting inside a slide recover the same card boundary.
- Repeated sibling linked panels inside one parent panel use Browser Archeology's inset white content treatment. The parent keeps its window furniture. An isolated editorial card remains eligible for a window.
- Nested semantic navigation receives theme paint. Substantial wide header/footer landmarks can own an outer frame, while nested navigation does not acquire duplicate frames.
- A positioned image covering its region keeps its pixels and paired copy. Browser Archeology paints one pointer-transparent chrome strip in an unused outer pseudo slot, above the image. Rescans recognize this extension-owned artwork. Carousel cards place their strip at the outer top edge, not on a centered label.
- An unambiguously labelled existing close button inside an untitled positioned panel occupies the classic close slot. Its original DOM node, accessible name, handler, and focus behavior remain. The other two icons remain decoration; only the real close is interactive. Other themes retain their original close presentation.
- Replacing text nodes through `textContent` now queues the local text owner. This re-arms the existing bounded effect-settlement checks when useful content changes after the earlier checks expire.

All recognition remains shared across the four themes. Browser Archeology consumes declarative inset/media/close targets. There are no MDMI appearance selectors, alternate renderers, inserted controls, or continuous scroll work.

## Useful failures during validation

The first candidate misidentified an incrementally scanned carousel card as a generic titled panel because the scan root was inside its slide. A second candidate mistook its own media chrome pseudo for occupied authored decoration on a later scan and returned furniture to the caption. Focused checks caught both.

The existing effect-settlement check then exposed that `textContent` replacement emitted child-list text nodes which the observer ignored. Its prior success depended on initial polling still being active. The strengthened regression waits for the bounded reads to expire before replacing text, then requires recovery.

The first strict navigation run was invalidated by a 786.0 ms unthemed large-route median against the 200 ms control limit. This is retained as an invalid comparison, not a renderer performance verdict.

## Validation and boundaries

The build and 12 unit checks pass. The complete browser suite passed all 18 checks. A final audit also applied the same carousel exclusion to the viewport-bounded large-insertion walker; its focused all-theme regression inserts 85 nodes and changes the carousel class, requiring the track to remain unpainted. Both final focused browser checks passed. The final navigation audit passed the large route at 90.5 ms and the bounded ancestor check at 12.6 ms, then was invalidated by a 492.0 ms unthemed long-scroll median against its 300 ms limit. The earlier complete navigation pass and both invalid attempts are preserved with the evidence.

The strict navigation repeat passed at 78.8 ms median for the large route (44.0 ms control), with 65.5–70.1 ms renderer batches and coherent deferred paint. Long scrolling measured 12.2 ms median (100.3 ms control), with 2.4–2.7 ms positional shortcuts and no established marker writes. These timings are targeted local observations, not field latency guarantees.

Both five-repeat rotating performance runs failed the valid-majority requirement for every mode, including original. The starting commit completed 1,453 callbacks with 417 reported stalls and 0/25 valid samples. The candidate run completed 1,415 callbacks with 458 reported stalls and 0/25 valid samples; compact per-sample results are retained separately. No valid frame medians or causal before/after performance comparison can be reported. Task totals from incomplete callback workloads are not comparable workloads either. The candidate performance run precedes the final large-carousel guard; that final bounded-path change is checked by the focused all-theme regression and the passing large-route portion of the navigation audit instead of repeating an invalid benchmark until it happens to pass.

Live MDMI traversal covers all four themes at 1440 × 1000 and Browser Archeology at 390 × 844. Every run retained matching viewport/document widths. Reviewed Browser Archeology captures show gray nested navigation, inset expertise items, themed industries/footer surfaces, outer photo chrome, and one real cookie close slot. The desktop close reaches opacity zero and hidden visibility; the mobile close drops below .01 opacity during dismissal. The fixture separately verifies pointer and keyboard activation of the unchanged handler. [Durable captures, role samples, and validation logs](evidence/39/README.md) preserve this evidence.

The site's reveal animation still controls visibility. In the final desktop traversal, the carousel wrapper remained authored-hidden through scroll position 3000 and revealed by 3250; the individual cards retained their frame annotations throughout. That distinction is a remaining limitation of the visible experience, not evidence that Surface disables the original reveals. Media and logos retain their authored pixels, and the photo's transparent Learn More action retains its media pairing. These targeted captures do not establish universal compatibility or regression-free performance.

Next bounded iteration: review the owner's reloaded page, distinguishing missing theme ownership from MDMI's authored animation timing. Changing that animation would be a separate behavioral decision; further performance work needs reliable unthemed controls before attributing frame stalls to renderer changes.
