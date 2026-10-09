# Iteration 18 — curate recognition work without restoring latency

October 9, 2026. Baseline: `development` after Iteration 17, with an uncommitted recognition prototype under review. [Shared learning log](LEARNINGS.md).

## Owner direction

Determine whether the unrelated local prototype should be integrated or discarded, then proceed with the evidence-backed split.

## Review finding

The prototype mixed two independent ideas:

- reusable recognition and foreground-work improvements for neutral gradient sections, heading-led linked cards, logo-like marks inside large cards, stable brand backing, and repeated candidate/style reads;
- a broader effect lifecycle with intersection observers, deferred semantic-region scans, and up to 20 settlement polls per effect owner.

The complete prototype passed the browser suite, but the standard five-repeat fixture showed a major performance regression. Median sampled content-engine work rose from the Iteration 17 exact-state baseline of **24.64 / 31.00 / 29.65 ms** to **130.76 / 139.14 / 132.74 ms** for Terminal Vision, Browser Archeology, and Liquid Dream. Median main-thread task totals rose from roughly **249–264 ms** to **376–389 ms**. Frame intervals stayed near 16.7–16.8 ms, so the sampled engine and task totals—not a visible frame-rate claim—were the useful rejection signal.

An isolated build retaining the recognition work while restoring the existing bounded settlement path returned sampled engine medians to the low-to-mid 20 ms range and still passed all browser checks. The expanded effect lifecycle was therefore discarded. The existing lifecycle remains authoritative: preserve uncertain effects immediately, listen for native completion, and make at most six reads including the initial state rather than observing and rescanning arbitrary semantic regions.

## Integrated unified-path changes

- Substantial heading-led linked cards can own a neutral surface instead of being treated as one oversized control.
- A restrained near-white linear gradient can identify a coherent nested surface only when all parsed stops are neutral and at least one stop is effectively opaque. An all-translucent wash remains authored.
- A logo-like descendant inside a large labelled card protects only the compact mark; it does not turn the whole card into a brand region.
- Brand foreground and authored canvas backing are captured stably so incremental rescans do not replace authored brand paint with already-themed ancestor paint.
- Foreground candidates and their color, fill, font size, and weight are snapshotted once per scan. Media hit testing is skipped when an already-uncertain backing makes it irrelevant, and solid controls avoid unnecessary overlap checks.

These are changes inside the one purpose-and-paint renderer. No host selector, correction, renderer branch, or parallel lifecycle was added.

The one-off MDMI review script was not integrated. It embedded a single site's URLs, selectors, scroll stops, and report shape without a reusable harness contract. Its useful observations are retained here and in the learning log instead of turning the exploratory script into product infrastructure.

## Evidence

The neutral-gradient, translucent-gradient, linked-card, nested-mark, stable-brand, and transient-effect cases are covered in the hierarchy fixture across all three themes. The transient panel becomes eligible after its opacity clears through the pre-existing bounded settlement mechanism; the new all-translucent gradient remains unowned.

Before the final code decision, a targeted six-stop MDMI comparison showed why the retained recognition work mattered. Relative to the pushed baseline, recognized content regions increased from **5 to 14** in Terminal Vision, **7 to 21** in Browser Archeology, and **7 to 17** in Liquid Dream. Pale-region counts at later sampled positions fell from **11 to 2**, **29 to 12**, and **20 to 3** respectively at the strongest observed stops. Screenshot review confirmed that formerly pale testimonial regions received coherent treatment. These are targeted live-page observations, not broad compatibility claims; some authored pale regions remained in Browser Archeology and Liquid Dream.

Final local validation passed the build, 12 unit checks, and all 13 isolated Chromium checks. The large-route navigation regression completed in **149.2 ms**, below its 200 ms threshold, and still themed deferred content on entry.

The final five-repeat performance workload produced 20 samples. Median sampled content-engine work was **23.07 ms Terminal Vision, 25.20 ms Browser Archeology, and 22.46 ms Liquid Dream**. Median main-thread task totals were **248.74 ms, 243.68 ms, and 247.69 ms**; median p95 frame intervals were **16.8 ms, 16.7 ms, and 16.7 ms**. This returns the exercised fixture to the Iteration 17 range and rejects the broader polling/observer prototype; it is not a field-performance guarantee.

## Next bounded iteration

Review the remaining authored pale MDMI regions by identifying whether each is an opaque coherent surface or an intentional image/effect composition. Extend only reusable ownership evidence with a regression fixture; do not reintroduce broad region observation or a host appearance correction.
