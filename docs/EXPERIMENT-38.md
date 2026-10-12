# Iteration 38 — Browser Archeology window proportions

Date: October 12, 2026

## Observation and reproduction

The owner reports that Browser Archeology does not feel like itself on MDMI and suspects its unusually large boxes. This is visual feedback, not a reported timing failure. The correction-free live baseline shows recognized, edge-to-edge landing panels painted white, with small beveled edges and oversized blue heading blocks. Recognition already owns these regions; adding more recognition or an MDMI appearance patch would not address the treatment mismatch.

After a reveal traversal at 1440 px, the mission window heading used the authored 45.184 px font and occupied 216.875 px in height. At 390 px it used 26.704 px type and occupied 384.563 px. The renderer had correctly identified it as a panel window title in both states. Untitled frames also explicitly overrode their purpose background with white, hiding the intended difference between a reading document and window chrome.

## Change

Only Browser Archeology's treatment changes; the shared declarative contract gains a selector for content-window titles (reading and panel owners). Recognized panels use the existing warm system gray, while reading documents, data cells, and fields retain white. Untitled window furniture no longer overrides its owner's background. Reading and panel window titles use 18–24 px responsive type, a readable line height, top padding, start alignment, and word wrapping. Layout systems, media, title text, accessibility semantics, and the shared renderer remain untouched.

At small sizes, the old bright gradient endpoint gave white text only 4.01:1 contrast. The blue endpoint is now `#0874ba`, giving 4.98:1; the darker navy end also exceeds 4.5:1. The navy-to-blue motif, disabled decorative controls, bevels, teal canvas, and classic links remain. No new gradient layer, animation, shadow, observer, geometry measurement, or theme-specific renderer branch is added.

## Regression and visual evidence

The mixed landing fixture now includes a 64 px authored card heading. On the committed baseline the new regression fails because its panel remains white. The final assertions cover gray panel paint, compact title sizing, normal-text gradient contrast, narrow wrapping, unchanged authored heading size in the other three themes, and restoration. Existing checks continue to cover opacity reveals, media preservation, foreground pairing, first-visible startup paint, switches, and long/deferred pages. Browser Archeology's expected first-visible navigation color now matches its existing gray navigation treatment because the later frame override no longer turns it white.

Before/after MDMI probes cover 1440 × 1000 and 390 × 844 after reveal traversal, with five sampled scroll positions per width. The final mission title measured 21.6 px / 64.281 px high on desktop and 18 px / 176.078 px high on mobile. Both widths retained matching document/viewport widths. Visual review shows a gray window body, compact blue title bars, and retained site graphics and copy. Large authored whitespace, the black brand header, and preserved media remain; this does not claim every MDMI component becomes desktop chrome. Dynamic site imagery and reveal timing differ between captures, so screenshots compare treatment, not identical scene pixels.

An initial candidate applied the size rule to all window titles. Wikipedia visual review caught its 21.6 px “Contents” label wrapping inside a narrow navigation rail, despite the passing suite. The final rule uses the content-window selector; navigation retains its authored size. A new 14 px navigation-title fixture covers this boundary. This useful failure is why the visual check remains separate from an automated pass.

The other themes' full and startup generated CSS were compared byte-for-byte with baseline and are unchanged. The renderer source is unchanged. All eight live captures on MDMI and Wikipedia applied successfully with no horizontal overflow at 1440 px. Review confirmed the corrected compact navigation label on Wikipedia and the other themes' existing visual identities. [Durable MDMI before/after captures and layout samples](evidence/38/README.md) preserve the targeted evidence; live review is not universal compatibility proof.

## Validation

The build, 12 unit checks, all 17 isolated Chromium checks, and the strict navigation suite pass on the final implementation. The route median was 78.3 ms against 43.8 ms unthemed, with 60.3–71.5 ms renderer batches; the long-scroll median was 13.7 ms against 46.7 ms unthemed, with 2.3–2.4 ms positional shortcuts and zero established marker rewrites. All four themes retained deferred table paint. The parser-delay check still releases already-themed content before its blocking script finishes. One MDMI theme handoff measured 62.1 ms before and 57.2 ms after; these single live samples do not establish a speedup.

Three five-repeat, rotating-order workloads preserve the timing uncertainty. The baseline completed 25/25 valid samples, 2,500 callbacks, no stalls, and no long tasks. The first final-build run had 22/25 valid samples, 2,500 callbacks, six stalls, and no long tasks; its invalid samples were original, Browser Archeology, and unchanged Terminal Vision. The unchanged repeat had 22/25 valid samples, 2,450 callbacks, 28 stalls, and no long tasks. Its final three samples (Browser Archeology, Liquid Dream, Monochrome Signal) were invalid; earlier samples were mostly 16.7–16.8 ms. Each mode retained the harness-required valid majority, so both commands exited successfully, but neither is a clean stalled-frame result.

| Browser Archeology, valid-sample medians | Baseline | Final | Unchanged repeat |
| --- | ---: | ---: | ---: |
| p95 frame interval (ms) | 66.6 | 75.0 | 25.0 |
| Sampled renderer work (ms) | 21.06 | 22.01 | 22.80 |
| Main-thread task total (ms) | 259.15 | 253.63 | 253.85 |

[Compact results for every mode, including invalid samples](evidence/38/performance.json) retain the evidence. Frame cadence also shifted markedly in the unchanged themes (Liquid Dream 33.4 → 116.7 → 16.7 ms; Monochrome Signal 33.4 → 100.1 → 16.8 ms). This prevents attributing the timing changes to the new CSS or claiming a speedup. The modest task/work medians and passing navigation guards support the bounded implementation, but repeated stalls remain unresolved; this is not a regression-free or field-performance claim. Do not repeat unchanged workloads until one happens to be clean. If foreground scrolling is visibly poor, the next performance investigation needs a verified equivalent-output control and compositor trace.

Next bounded iteration: review the owner's reloaded MDMI state. If remaining large regions still obscure the theme's identity, inspect their actual purpose and authored effects before changing geometry, adding decoration, or broadening recognition.
