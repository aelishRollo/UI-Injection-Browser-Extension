# Iteration 38 visual evidence

MDMI mission-region captures before and after the Browser Archeology treatment change. Captures follow a reveal traversal at 1440 × 1000 and 390 × 844; the same scroll offset is used, but text reflow and live animations change scene geometry. See [the experiment record](../../EXPERIMENT-38.md) for scope, failures, and validation.

| Viewport | Before | After |
| --- | --- | --- |
| Desktop | [Before](mdmi-1440-before.png) | [After](mdmi-1440-after.png) |
| Mobile | [Before](mdmi-390-before.png) | [After](mdmi-390-after.png) |

[Layout samples](layout.json) contain measured title geometry and one live handoff timing per state. They are not first-navigation performance estimates. Full diagnostic captures remain in ignored `test-results/`.

[Performance summary](performance.json) retains all three runs and their invalid samples. Medians use valid samples only; even-sized sets use the mean of the two central values. Failed samples must not be dropped from interpretation.
