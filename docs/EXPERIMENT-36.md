# Iteration 36 — visible, bounded Liquid Dream rainbow

Date: October 12, 2026

## Owner observation and prior lessons

The owner asks for Liquid Dream to visibly regain rainbow color while staying attractive and performant. The request is visual feedback, not evidence of a specific frame-rate regression. The current package had a static five-stop rainbow on a 3 px title edge and control hover. Its later section-heading rule replaced the shared title/heading background image with a single dark gradient, so ordinary headings lost the rainbow layer. The current hierarchy capture made the effect clear: a quiet violet reading plane with only a hairline of rainbow near the main title.

Earlier Liquid Dream experiments established two useful limits. A gradient over a long reading plane increased scroll cost; a solid reading plane retained better cadence. Iteration 35 found broad outer shadows made Liquid Dream samples invalid in the stabilized workload, so those shadows remain removed. The rainbow already used static gradients and safe dark ink on hover controls; the goal here was more visible hierarchy without spreading costly paint across the document body.

## Declarative treatment

The same theme package now puts a 6 px static rainbow edge at the **top** of titles, a 4 px edge below section headings and navigation, and a 4 px edge atop bounded panels. Each edge is one small, nonrepeating gradient layer over the existing dark violet/blue gradient. The long reading plane remains solid, and no animation, full-page gradient, large shadow, site selector, or renderer branch was added. The top title placement followed a live MDMI review: the prior bottom edge sat close to the last line in its fixed-height hero, while the top edge reads clearly without touching the copy. The popup and in-page picker previews show the thicker edge.

The hierarchy regression checks the title, section heading, navigation, and panel paint stacks, sizes, positions, and no-repeat behavior. It also keeps the previous contrast checks for the dark heading planes and rainbow control hover. Other themes use the same renderer and were not changed.

## Evidence and limits

Build and 12 unit checks pass. All 17 isolated Chromium checks pass, including theme switching, restoration, media preservation, and the strengthened Liquid Dream hierarchy checks. Live Wikipedia and MDMI captures applied all four themes. Visual review of Liquid Dream shows rainbow across the Wikipedia top navigation, article title, section headings, and fact-panel edge while ordinary prose stays on the solid violet reading surface. The final MDMI hero shows the title rainbow above its large white copy and a second bounded panel edge near the viewport bottom. These are targeted screenshots, not universal visual coverage.

The strict navigation run passed: a 92.9 ms themed route median against 40.3 ms control, 71.8–84.5 ms renderer route batches, a 13.1 ms long-scroll median against 28.6 ms control, 2.4–2.5 ms positional shortcuts, and zero established article-marker rewrites. The five-repeat performance workload produced 25/25 valid samples, 2,500 completed frame callbacks, zero stalls, and zero recorded long tasks. Liquid Dream's median sampled content-engine work was 22.92 ms and median p95 frame interval was 16.8 ms; its median task total was 268.09 ms. The preceding valid run recorded 18.67 ms, 83.3 ms, and 254.05 ms respectively, while several *unchanged* themes also shifted in the new run. That cross-theme variability rules out treating the apparent frame-cadence improvement or small sampled-work increase as a causal effect of the rainbow. The new run supports the narrower conclusion that this local workload found no stalled-frame or invalid-sample regression.

Next bounded iteration: review the owner-visible result on a long article and an MDMI interaction state. If rainbow density or cadence is still unsatisfactory, compare equivalent-output paint/compositor traces before changing the solid reading plane or restoring broad effects.
