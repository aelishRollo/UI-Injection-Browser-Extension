# Iteration 32 — a dark Monochrome Signal and narrower brand preservation

Date: October 11, 2026

## Owner observation

The owner reports that Monochrome Signal has broad visibility problems and does not resemble the MDMI reference on Wikipedia. Terminal Vision works substantially better there. The owner wants new themes to reuse the same renderer rather than acquire their own recognition rules.

## Baseline and diagnosis

The current Wikipedia Chromium article was captured in an isolated 1440 × 1000 Chromium profile under both themes. Monochrome Signal declared a light color scheme and painted the article, rails, and fact panel off-white. The current [MDMI homepage](https://mdmi.com/) instead presents a predominantly black canvas, light display type, gray data-like geometry, and red signals. This mismatch was in the declarative package, not a missing second rendering path.

The live Chromium infobox also exposed a shared visibility failure. Its logo image and descriptive caption occupy one table cell whose class contains “logo.” Brand recognition protected the entire cell, leaving the caption's authored `rgb(32, 33, 34)` text over a dark themed panel in both Monochrome Signal and Terminal Vision. This is distinct from the separately owned captioned-image figure path.

## Changes

Monochrome Signal now declares a dark color scheme with near-black page and reading surfaces, light sans article type, charcoal fact panels and table headers, red links, and light pill actions. Monospaced link, navigation, and control accents retain the MDMI-inspired technical character. The theme still uses the same contexts, purposes, contrast pairing, and startup treatment compiler as the other three packages.

The shared brand recognizer now checks whether a media mark has substantial sibling copy. In that case, only the media mark is protected; the adjacent text returns to the normal foreground/background pairing path. This structural rule has no host selector. A four-theme facts-table fixture requires the image to remain protected and its neighboring caption to meet 4.5:1 base-color contrast.

## Review and validation

After the shared fix, the live Chromium caption computed to `rgb(242, 242, 242)` under Monochrome Signal and `rgb(157, 255, 176)` under Terminal Vision, both with `tone=theme` on dark panels. The Monochrome capture shows a dark Wikipedia article and rail hierarchy, a legible fact panel and image caption, and red link accents. On Federal Police (Mexico), the Aircraft table and its final inline-gray rows stayed dark after scrolling. On María Sabina, the Codex image caption computed to light text on a dark frame. The MDMI homepage capture preserved its logo and chart while the themed hero retained the black/light/gray/red visual language. These are targeted captures, not a claim that every Wikipedia or MDMI state is resolved.

The build, 12 unit checks, 15 isolated browser checks, and navigation checks pass. The large route reached the next frame in 139.6 ms; the long-article scroll case measured 18.5 ms. A five-repeat workload completed 25 valid samples and 2,500 frame callbacks with zero stalls or recorded long tasks. Median p95 frame intervals were 16.7–16.8 ms across the unthemed baseline and four themes. Median sampled renderer work was 22.60/19.59/23.41/20.68 ms for Browser Archeology/Liquid Dream/Monochrome Signal/Terminal Vision. These local figures are regression evidence, not field performance guarantees. The fixture and the machine cadence differ from prior runs, so small between-iteration differences are not attributed to this change.

Some intentionally authored light items remain visible inside dark pages, including Wikipedia's selected Contents entry and a linked Wikimedia badge. Their text was legible in the reviewed captures. A next bounded iteration should start from a concrete owner-visible failure in one of those retained regions before changing preservation or selected-state handling.
