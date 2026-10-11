# Iteration 28 — first visible panel and preview paint

Date: October 11, 2026

## Owner observation and measured failure

The owner reported that the four Terminal Vision screenshot issues from Iteration 27 still occurred. A new isolated Chromium trace at 1366 × 768 on María Sabina and Federal Police (Mexico) reproduced the Appearance flash and article-link preview flash. The appearance panel first rendered as a 196 × 31 px white box containing only its label and hide control. The prior labelled-navigation rule required at least 100 px of height, so it did not recognize that initial state. It later gained settings and became themed. The preview first appeared at opacity zero and faded through visible intermediate opacity values while its bounded white backing remained unrecognized; the previous rule rejected all opacity below one as uncertain paint.

The same trace found the María Sabina image caption and both Federal Police rank headings themed in the settled and scrolled states. Their owner-visible failures remain unresolved; the isolated result must not be taken as evidence that they cannot recur in the owner's browser.

## Shared change

The existing utility-panel recognizer accepts a short neutral panel inside labelled navigation only when it has a real button and at least 24 px of height. The usual 100 px threshold still applies elsewhere. The existing bounded positioned overlay recognizer permits an opacity-only reveal, including at opacity zero, and retains that opacity. Other uncertain effects still exclude the card. Foreground pairing treats the recognized overlay backing as known during its opacity reveal. No site selector or parallel renderer was added.

The parser-delay fixture now starts with a 31 px labelled panel, and the dynamic preview regression inserts the card at opacity zero, checks ownership, then checks its authored half-opacity and text contrast. These cases exercise the lifecycle gap that the previous taller and fully opaque fixtures missed.

## Evidence and limits

After the change, a frame-by-frame live trace on both pages recorded zero ready frames with a white Appearance panel. On María Sabina, the preview had Terminal Vision's dark surface at opacity zero and at every sampled visible fade frame. The trace used an isolated extension profile and does not verify the owner's existing browser installation. The owner's confirmation remains useful after reloading the unpacked extension. If caption or rank headings still appear light there, the next probe should inspect that exact state rather than broadening paint ownership on speculation.

The build, 12 unit checks, 15 isolated browser checks, and large-route navigation regression passed. Performance results are recorded in the shared learning log.
