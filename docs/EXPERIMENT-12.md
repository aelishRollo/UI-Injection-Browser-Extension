# Iteration 12 — theme before the first visible frame

October 8, 2026. Baseline: `development` after Iteration 11. [Shared learning log](LEARNINGS.md).

## Owner observation

On a full navigation to another page, the authored view appeared briefly before Surface applied the selected theme. This was a navigation-startup failure, not an SPA mutation or recognition failure.

## Cause and bounded change

The content script already ran at `document_start`, but its first reconciliation still crossed asynchronous boundaries: service-worker settings lookup, dynamic renderer import, DOM classification, and USER-origin CSS insertion. Chromium could paint the ordinary page during that interval.

The manifest now installs a minimal static stylesheet at `document_start`. It makes an unready document root transparent without changing layout or hit testing. The content script marks the root ready only after one of these terminal startup paths:

- Surface is enabled: the unified classifier has completed its initial scan and the selected expressive stylesheet is installed.
- Surface is disabled for the user or host: any Surface stylesheet has been removed.
- Startup fails: renderer annotations and Surface CSS have been cleaned up.

The guard uses root opacity, which the contrast resolver would ordinarily treat as uncertain authored compositing. The resolver therefore ignores exactly the extension-owned zero opacity on an unready root while continuing to preserve authored opacity and effects everywhere else. No second renderer, host correction, or alternate theme path was added.

## Regression and evidence

The isolated server now exposes a page with a 250 ms parser-blocking script. A browser init script samples every animation frame until Surface releases the root. The regression requires all of the following:

- at least one pre-ready frame is observed with root opacity zero;
- no pre-ready frame is visible;
- the final sampled frame is visible, marked ready, and classified as a page;
- Terminal Vision's page color is present when released.

Eight unit checks, the build, and all 13 isolated Chromium checks pass across the three themes, restoration, frames, dynamic DOM, SPA navigation, the in-page picker, repeated switches, and the new full-navigation startup case.

The performance harness also now waits for install-time settings initialization and requires each sample to reach its exact intended active or disabled state. That correction followed a useful failed first run where Chrome's fresh-install default write raced the harness's immediate disabled write, contaminating one supposed original sample.

On the corrected five-repeat run, all 20 samples were valid, all 2,000 requested frame callbacks completed, and no stalls occurred. Median p95 frame intervals were 16.7 ms for Terminal Vision and 16.8 ms for original, Browser Archeology, and Liquid Dream. Median load-to-applied time was 120 ms for Terminal Vision and 121 ms for the other themes. These are warm-cache local headless measurements, not field startup guarantees.

## Remaining boundary

The guard replaces a flash of ordinary content with a transparent interval while Surface prepares the page. Exceptionally slow or stalled parsing can therefore keep a document blank longer than usual. The next bounded lifecycle iteration should measure real navigations with slow markup and service-worker cold starts before choosing any fail-open deadline; a deadline must not silently reintroduce the original flash.
