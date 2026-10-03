# Experiment 03 — recognize purpose before applying decoration

October 3, 2026. See [shared learnings](LEARNINGS.md) for the current decision record.

## Question and scope

Can distinct reading, navigation, panel, heading, and field treatments make Browser Archeology more intentional and Liquid Dream more recognizable on Wikipedia, without changing site layout? The owner's unpacked extension uses A by default. A/B therefore receive semantic CSS improvements; C additionally evaluates purpose from page structure. The default remains A. Terminal Vision's motif rules remain unchanged.

## Evidence and visual review

Chromium 153.0.8010.12, isolated temporary profiles, 1440 × 1000, corrections off. Wikipedia's Chromium article and MDN's CSS landing article loaded as content pages. The full A/B/C × three-theme matrix applied on both sites (18 combinations); C was captured again after the MDN correction. No sampled page had horizontal overflow beyond the viewport. Application success is not a visual-quality pass.

The Wikipedia baseline was commit `57cc4cd`. Its default Liquid Dream screenshot shows almost no rainbow above the fold. C's baseline instead painted repeated full section cards. The revised default exposes rainbow color in navigation and the page title; C also makes heading groups and the fact panel distinct. Browser Archeology C now uses one document frame, a separate facts panel, recessed fields, and simple chapter rules. White site wrappers still conceal much of the teal desktop, and inline headings in A/B still receive compact highlights rather than C's group-wide bands.

A held-out MDN comparison initially failed: its main landmark has `display: contents`, with zero box dimensions, so the reading rule skipped it and repeated section cards remained. Inspection showed two direct prose children alongside an auxiliary navigation rail. C now evaluates those prose children independently without changing display or reparenting. The result has two adjacent reading regions, seven sections and two panels. That is an improvement in hierarchy, but the seam between the two reading boxes remains visible; it is not a single reconstructed document.

C on Wikipedia identified one reading region, 20 sections, one auxiliary panel, 42 data tables, 13 navigation regions, one title, nine section heading groups, one field and 26 actions. Counts cover visible boxes across the document, including below the captured viewport; they are not pixel coverage or proof that every classification is correct. Terminal Vision intentionally produces no purpose annotations in this experiment.

Representative screenshots are committed in [evidence/03](evidence/03/). They include the default Liquid Dream before/after and C's two revised Wikipedia themes. Original site content and image rights remain with their respective authors. Captures are debugging evidence, not theme assets. Remote banners, ads, content, and font loading can change between visits; these are visual comparisons, not pixel-diff tests.

Raw local captures and diagnostic role/evidence samples are under `test-results/roles-before`, `roles-final`, and `roles-confirmed`. A compact copy of the run metadata is committed as [results.json](evidence/03/results.json), because ignored test output is not durable memory.

## Validation

- Build and seven unit checks pass.
- Seventeen Chromium browser checks pass, including nine theme/renderer combinations, switching/restoration, protected media and editable content, contrast/state handling, dynamic insertion, popup persistence, and frame disable.
- The added hierarchy fixture uses a boxless main landmark, a floated bordered facts table, an ordinary data table, inline heading with an edit link, authored gradient text, protected content, and inserted section/control. It checks role distinction, absence of repeated chapter frames, full cleanup, and restored computed styles.
- The new rainbow stops support both Liquid Dream text and link palette colors at at least 4.5:1 in the base-color calculation. This does not validate every authored foreground or rendered pixel.
- A short performance smoke run uses disabled plus the three C themes, one sample each, with the existing full-effect workload. This is not a repeated comparative benchmark. All four samples completed 100 frame callbacks without timeout substitutions. Validity and limitations are preserved in the committed metadata; one sample per mode still supports no speed claim.

## Limits and next decision

No Wikipedia- or MDN-specific selectors were added. These rules still depend on semantic markup, prose density, native controls, floats, borders and heading structure. They do not understand all visual purposes. A/B cannot use computed-box evidence. C leaves image-backed/protected content conservative, and the new hierarchy does not resolve the existing dynamic style-only, shadow-root, media-overlap or compositing limitations.

The experiment supports separating purpose from theme appearance. It does not yet justify replacing the default renderer or claiming broad compatibility. Next: owner review of Wikipedia, then narrow-view and unseen application/commerce tests that deliberately challenge false document and panel classifications.
