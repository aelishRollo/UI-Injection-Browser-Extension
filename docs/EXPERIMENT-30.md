# Iteration 30 — scroll-time classification stalls

Date: October 11, 2026

## Owner observation

On Federal Police (Mexico), fast upward and downward scrolling could leave the Terminal Vision canvas visible while page content appeared unrendered for roughly a second. The owner asked for a scalable fix that keeps content visible and avoids regressions.

## Measured failure

An isolated 1680 × 900 wide-layout Chromium trace reproduced long main-thread gaps on the reported page. A bottom-scroll screenshot call on the committed build took 5,714 ms; the matching final diagnostic took 551 ms. These calls include browser rendering and are targeted comparisons, not field latency guarantees. Frame and CPU traces located expensive work in the shared renderer: per-text geometry and media hit testing, a whole-body reclassification after Wikipedia's scroll-position class changed, and deferred subtree work replayed after the complete document pass.

One deferred section contained about 1,300 text candidates. After its paint markers were restored, the marker-repair observer treated Surface's own removals as page removals and scanned the entire section again. A full document scan had already classified this parser-era deferred root, so its later intersection callback did redundant work and could discard established paint. The footer's pale category and navigation blocks were also present in a screenshot of the committed build; this iteration did not introduce those colors.

## Shared renderer changes

- Text/media overlap now filters media by rectangle before calling `elementsFromPoint`. Text rectangles are read together after structural annotation and before foreground writes, avoiding repeated layout flushes during text pairing.
- Root class changes consisting only of scroll or positional state near a scroll retain established descendant ownership. The root is restored and rechecked for authored imagery or effects; changes with those paint signals still enter the conservative full scan.
- A complete document scan disconnects parser-era deferred observations because their connected subtrees have already been classified. A deferred root that grows while offscreen is rechecked for size on entry and remains on the viewport-bounded path.
- The observer distinguishes paint markers removed by Surface's own restore operation from markers removed by page code. Page removal still receives the existing repair; internal restoration no longer causes a recursive full scan.

The changes stay in the single renderer and do not add Wikipedia selectors or theme-specific classification.

## Failed alternatives and validation

Diagnostic CSS that removed page/content grid gradients or content shadows did not materially improve the scroll pause. A 250 ms scroll-class window missed Wikipedia's delayed mutation after other main-thread work. Reducing the deferred observer margin to 25% also left a large section scan; the established one-viewport prefetch margin was restored.

A local long-article regression inserts 800 paragraphs before the complete pass, toggles a positional body class on scroll, and checks the next rendered frame plus foreground ownership. It fails on the committed build at 664.6 ms and passes with this change at 8.4 ms in the first measured run. Immediate bottom and return-to-top captures of the reported page show visible content and the selected theme.

The build, 12 unit checks, and all 15 browser checks pass. The standard five-repeat workload completed 25 valid samples and 2,500 frame callbacks, with zero stalls or recorded long tasks and a 16.8 ms median p95 frame interval in every mode. Median sampled renderer work was 29.17/28.49/26.49/26.91 ms for Browser Archeology/Liquid Dream/Monochrome Signal/Terminal Vision. The final navigation run passed its existing large-route guard at 134.3 ms and the new scroll case at 8.1 ms. A preceding route run measured 225.8 ms and failed its 200 ms guard; earlier runs at 165.0 and 185.5 ms plus the successful final repeat indicate local timing variation, but this one outlier remains in the record.
