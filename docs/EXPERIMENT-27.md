# Iteration 27 — neutral media cards, previews, and table paint

Date: October 10, 2026

## Owner observations

The owner confirmed Iteration 26 removed the vertical Wikipedia strips. New Terminal Vision screenshots showed an Appearance panel that initially rendered white before settling, an unthemed article-link preview, a white image caption card with dark text, and pale rank-table heading rows on [Federal Police (Mexico)](https://en.wikipedia.org/wiki/Federal_Police_(Mexico)). The requested direction remains shared recognition and paint, not Wikipedia-specific appearance rules.

## Live evidence before the change

On María Sabina at 1728 × 1000, the settled Appearance rail was themed, but a first-frame flash was not captured in isolated Chromium. The preview consisted of a bounded, absolutely positioned white card and a second white inner paint box. Neither had a semantic dialog or tooltip role; its footer alone was recognized as chrome. A small pointer-transparent white gradient on the text link remained visible over the preview. The captioned image was a neutral `figure` and a separate caption whose text was classified as media-backed.

On Federal Police (Mexico), both rank heading rows used an opaque neutral `#ccc` on a `tr` with transparent `th` cells. The prior table-part threshold admitted only near-white paint, so the rows stayed pale against a dark table. These measurements came from the actual DOM and computed styles, not from the screenshots alone.

## Shared changes

- Captioned images with a neutral frame receive content ownership for the frame and a caption that sits below the image. The renderer reads the caption's authored paint before changing the figure, since inherited backgrounds can change after ownership is applied. The image pixels stay authored. A separately owned caption no longer counts as image-overlaid text.
- A bounded, positioned, neutral text card receives panel ownership even without a semantic overlay role. A large neutral inner paint box follows that owner. Short pointer-transparent generated neutral fades within such cards are suppressed so their white gradient cannot cover themed preview text.
- Labelled neutral navigation panels can acquire chrome ownership with only their initial label present, before settings controls arrive. A parser-delayed fixture checks their paint in the first visible frame for all themes.
- Neutral table formatting boxes now include restrained mid-gray paint, and an all-header `tr` receives header treatment. Chromatic and effect-backed table cells remain outside the transfer rule.
- Foreground pairing uses the theme's declarative purpose background for an owned panel or navigation region. This handles raised panel paint during a theme handoff, when the destination stylesheet may not yet be active in computed style. Links receive at least 4.5:1 contrast.

## Validation and limits

The four-theme fixture checks first-visible Appearance paint, transparent caption ownership and contrast, preserved image source, a dynamically inserted preview with an inner box and generated fade, preview text contrast, and mid-gray table rows. A final live María Sabina capture showed the preview's outer and inner cards at Terminal Vision's dark surface, its text themed and the generated fade hidden; the image caption was dark with green text. Both Federal Police rank heading rows computed to `rgb(16, 45, 29)` with green heading text.

The owner's Appearance flash was not captured in an isolated live timeline, so its elimination in the owner's browser remains to be verified. The first-visible parser fixture covers the identified labelled-panel lifecycle shape. A separate donation campaign banner appeared white in one later live capture; this iteration did not classify that broader announcement surface without a bounded regression case.

The final build, 12 unit checks, all 15 isolated Chromium checks, and the large-route regression pass; the route reached the next frame in 172.5 ms under its 200 ms guard. The five-repeat original-plus-four-theme workload produced 25 valid samples, 2,500 completed frames, zero stalls or recorded long tasks, and 16.7–16.8 ms median p95 frame intervals. Median sampled renderer work was 30.65 ms Browser Archeology, 31.70 ms Liquid Dream, 34.07 ms Monochrome Signal, and 28.48 ms Terminal Vision. These are local fixture measurements, not field performance claims.
