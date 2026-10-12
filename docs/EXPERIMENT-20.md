# Iteration 20 — continuous in-page theme switching

> **Superseded by [Iteration 21](EXPERIMENT-21.md).** This canvas guard removed the authored flash but produced a themed empty interval. It remains here as failure evidence, not current lifecycle guidance.

October 9, 2026. Baseline: `development` after Iteration 19. [Shared learning log](LEARNINGS.md).

## Owner observation

Changing from one enabled theme to another briefly exposed the website's default styles before the destination theme loaded. The desired behavior is a direct theme-to-theme change with no authored/default frame in between.

## Cause

The switch lifecycle deliberately restored all renderer-owned attributes and removed the current USER-origin stylesheet before inspecting authored paint for the next theme. That ordering is necessary for correct preservation and contrast evidence, but it left the authored page visible while the destination renderer scan and stylesheet request completed. The full-navigation startup guard did not apply because the existing document was already marked ready.

## Unified-path correction

Before an enabled theme-to-theme reset, the content lifecycle now activates a temporary guard using the destination theme's canonical background and color scheme. The body remains transparent behind that exact canvas while the old annotations are restored, old CSS is removed, authored state is inspected, and the same unified renderer performs its bounded viewport recognition. The guard is released only after the destination USER-origin stylesheet and recognition are both ready.

The foreground resolver treats the guard's body opacity as extension-owned rather than authored effect evidence. Authored-canvas capture synchronously removes and restores the guard around its computed-style read, preventing Surface's destination canvas from becoming false author evidence. Original inline values for the namespaced guard properties and attribute are preserved and restored. Disable behavior is unchanged: pausing Surface still restores and reveals the authored page.

This is lifecycle protection around the existing renderer. It adds no alternate renderer, transition animation, broad appearance patch, or host selector.

## Evidence

The isolated Chromium suite now samples animation frames while switching into each of the three themes. A visible sample must retain page ownership under either the source or destination theme; any unclassified visible frame fails. A guarded sample must hide authored content over the exact destination canvas, and the final sample must be visible, classified, and activated for the destination theme.

The build, 12 unit checks, and all 14 isolated Chromium checks pass. The suite also retains its existing 20-switch cleanup check, which finishes with no residual stylesheet nodes and exact authored restoration after disable. This is local lifecycle evidence rather than a claim about every browser scheduler or page composition.
