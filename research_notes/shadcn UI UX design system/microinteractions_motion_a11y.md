# Micro-interactions, Motion, Interaction States, Responsive/Touch and Accessibility for a shadcn/ui (Base UI) Business App (2025-2026)

Scope: Metal Scrap Management System (Vite + React 19.3 SPA, shadcn/ui on Base UI + Tailwind v4, tw-animate-css, React `<ViewTransition>`, optional Motion via LazyMotion). Users: non-technical owners/staff, office desktops plus low-to-mid Android phones/tablets outdoors on weak data.

Source-age flags: several canonical sources are older but still the standard references: NN/g "Animation duration" (Feb 2020), NN/g "Animation purpose" (Jan 2020), NN/g "Microinteractions" (Oct 2018), NN/g "Touch target size" (May 2019), web.dev "Animations guide" (last updated Oct 2020). WCAG 2.2 (W3C Rec, Oct 2023; Understanding docs current), React 19.3 (Sept 9 2026), shadcn/ui base-nova registry, Base UI docs, Tailwind v4 docs, Carbon `motion.json` (current main branch) and Motion docs are current.

---

## Micro-interactions: Saffer's model and which ones are worth it for this app

### Takeaway
A micro-interaction is a trigger-feedback pair (Saffer: trigger, rules, feedback, loops/modes); animation earns its place only when it gives feedback, explains a state change, or reinforces spatial/navigation structure, and should be "subtle, unobtrusive, and brief". For this app the high-value set is: instant press feedback, button-level loading and success confirmation, progress/limit meters, "copied" feedback, "just added/edited" row highlight, and the default shadcn overlay/accordion/tab motion; count-up KPI numbers, validation shake and decorative motion are low-value or harmful.

### Cited Findings
- NN/g definition: "Microinteractions are trigger-feedback pairs in which (1) the trigger can be a user action or an alteration in the system's state; (2) the feedback is a narrowly targeted response to the trigger and is communicated through small, highly contextual (usually visual) changes in the user interface." (Alita Kendrick, Oct 21 2018) — [NN/g Microinteractions](https://www.nngroup.com/articles/microinteractions/)
- NN/g lists where micro-interactions help: displaying system status and progress, supporting undo and error prevention, communicating brand tone, encouraging continuation; they hurt when permanent or overly aggressive animations distract from the primary task, or when poorly designed replacements for standard micro-interactions confuse users. Feedback should be placed near the trigger (context). — [NN/g Microinteractions](https://www.nngroup.com/articles/microinteractions/)
- Saffer's four components: Trigger (manual, e.g. button press, or system, e.g. condition met), Rules (sequence and conditions of what happens), Feedback (visual/auditory/haptic communication of outcome), Loops and Modes (how it repeats or changes over time/conditions). The NN/g article itself does not treat loops/modes as separate components. — [Prototypr/ZURB: The 4 components of a microinteraction](https://blog.prototypr.io/the-4-components-of-a-microinteraction-836732173c7c); [NN/g Microinteractions](https://www.nngroup.com/articles/microinteractions/)
- NN/g legitimate purposes of UI animation: (1) feedback that the system recognised an action, (2) communicating state change (e.g. pencil icon morphing to a disk for Edit→Save), (3) navigation and spatial metaphors (zoom for hierarchy, slide for forward/back), (4) reinforcing signifiers. Motion "attracts user attention" via peripheral vision; animations should be "subtle, unobtrusive, and brief"; decorative animations that fill transition time "often frustrate participants in usability testing"; flashing countdowns are called out as a dark pattern. (Jan 12 2020) — [NN/g The Role of Animation and Motion in UX](https://www.nngroup.com/articles/animation-purpose-ux/)
- NN/g: more frequent animations should be "more subtle and shorter"; simple feedback such as checkboxes/toggles ~100 ms. — [NN/g Animation Duration](https://www.nngroup.com/articles/animation-duration/)
- web.dev (INP): provide "visual feedback in the next frame that it paints"; delayed feedback makes users think the page is broken and click repeatedly. INP good ≤200 ms, needs improvement 201–500 ms, poor >500 ms, at the 75th percentile. — [web.dev INP](https://web.dev/articles/inp)
- Validation shake: rapid horizontal shakes are a strong vestibular trigger; shake must never be the only error signal (a reduced-motion user sees nothing); reduced-motion fallback should use colour, border and message changes without lateral movement; text plus `aria-describedby` must explain the fix. — [animationpatterns.art: Error shake feedback](https://animationpatterns.art/animations/error-shake-feedback/); [Pope Tech: Design accessible animation (Dec 2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) (secondary sources; note that one search summary overstated WCAG 2.3.3 as "requiring" prefers-reduced-motion — see Accessibility section for the actual SC text)
- Shake guidance from a practitioner catalogue: "Large shake motion feels punitive and can be uncomfortable". — [animationpatterns.art](https://animationpatterns.art/animations/error-shake-feedback/)
- Carbon assigns `fast-01` (70 ms) to "Micro-interactions such as button and toggle. Instant response to user action." and `moderate-02` (240 ms) to "Expansion, system communication, toast." — [Carbon motion.json](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/motion/src/dtcg/motion.json)

### Inferences
Catalogue for this app, applying the model (Trigger → Rules → Feedback → Loop/Mode) and NN/g purpose test. "Keep" = worth it; "Default" = already provided by shadcn; "Avoid" = gimmick or harmful.

| Micro-interaction | Verdict | Spec (recommendation) |
|---|---|---|
| Button press feedback | Keep (Default) | shadcn base-nova button already has `active:not-aria-[haspopup]:translate-y-px` (1px press-down) and hover colour change. Colour/transform change within 1 frame; no ripple. |
| Save → loading → success | Keep | Trigger: click Save. Rules: disable double-submit (keep button focusable, set `aria-busy`, swap label to "Saving…" with spinner, keep width stable). Feedback: on success, toast (sonner) and/or a check icon in the button for ~1–1.5 s then revert; on error, inline message near the field plus toast. Spinner only if request exceeds ~300–400 ms to avoid flicker (inference; no source gives an exact threshold). |
| KPI number count-up | Avoid (or once per session at most) | Fails NN/g "purpose" test on a dashboard viewed many times a day, delays reading the real value, and is noisy for screen readers if the DOM text changes each frame. If kept for owner appeal: only on first dashboard load, ≤400–600 ms, final value rendered in DOM/aria immediately, disabled under reduced motion. No source found that measured count-up effects. |
| PO delivered % progress bar fill | Keep | State-change feedback. Animate `transform: scaleX()` on the fill (not `width`), 300–400 ms ease-out on value change only, with the numeric % always shown as text (colour/motion not the only signal). Use `role="progressbar"`/Base UI Progress/Meter with `aria-valuenow`. |
| Limit meter (tons vs max) turning amber/red | Keep | Use Base UI Meter semantics; thresholds e.g. <80% neutral/brand, 80–99% warning, ≥100% danger, plus icon and text ("92% of 50 t limit"). Colour transition 150–200 ms; no pulsing/flashing (NN/g warns against flashing attention hijacks). |
| Inline "Copied" feedback | Keep | Icon swap copy→check plus text "Copied" for ~1.5–2 s, announced via polite live region (WCAG 4.1.3 Status Messages). Opacity/scale ≤150 ms. |
| "Just added/edited" row highlight | Keep | System-triggered feedback so the user finds the new row. Background tint (e.g. `bg-primary/10` or success tint) that fades out over ~1–2 s; scroll row into view; also move focus or announce "Supplier added". Pure colour fade is not "motion animation" under WCAG 2.3.3, so it may remain under reduced motion (shortened). |
| Sidebar collapse | Default | shadcn sidebar animates width; acceptable because infrequent, but keep ≤200 ms. Prefer no animation under reduced motion. |
| Dialog / sheet enter-exit | Default | base-nova: fade + zoom-95, `duration-100`. Sheet slides from edge. Keep. |
| Toast enter-exit | Default | Sonner slide/fade; Carbon puts toasts at 240 ms. Keep; ensure polite live region and that success toasts don't steal focus. |
| Tab indicator slide | Keep if cheap | Animate an indicator with `transform` (Base UI Tabs exposes indicator CSS vars); 150–200 ms. Otherwise static underline is fine. |
| Accordion expand | Default | tw-animate-css `accordion-down/up` height animation driven by a CSS var; ~200 ms. Height animation is layout-triggering but acceptable for small, infrequent panels. |
| Validation shake | Avoid (or tiny, optional) | Use red border + icon + error text + focus to first invalid field. If the owner insists: ≤2 oscillations, ≤4px amplitude, ≤300 ms, disabled under reduced motion, never the sole signal. |
| Skeletons / loading | Keep | For weak data: skeleton rows for tables/cards instead of spinners for loads >~300 ms; shimmer is decorative — use static or slow pulse and stop under reduced motion. |
| Pull-to-refresh, confetti, parallax, animated illustrations | Avoid | Decorative; costs battery/CPU on low-end Android. |

- Loops/modes worth designing: first-run hints that disappear after the user has done the action once; "Saving…" auto-save mode; offline mode banner when connection drops (important on weak yard data).

### Gaps
- No source found that measured user benefit or harm of KPI count-up animations specifically; recommendation is inferred from NN/g general guidance.
- No authoritative source gives an exact "delay before showing spinner" threshold; 300–400 ms is a common practitioner value, not verified here.
- Did not access Saffer's book directly; the four-component summary comes from secondary sources.

---

## Motion system: durations, easing, reduced motion, performance, View Transitions and shadcn defaults

### Takeaway
Use a small "productive" motion scale (roughly 100/150/200/300 ms, never >400–500 ms for UI), ease-out (decelerate) for entering, ease-in (accelerate) for exiting, and exits slightly faster than entrances; animate only `transform` and `opacity`; honour `prefers-reduced-motion`. shadcn base-nova already animates overlays with tw-animate-css `data-open/data-closed` classes at `duration-100`. React 19.3 made `<ViewTransition>` stable (Sept 9 2026); it only animates updates inside Transitions/Suspense/useDeferredValue and needs explicit reduced-motion CSS.

### Cited Findings
**Duration guidance**
- NN/g: most UI animations should be 100–500 ms; simple feedback (checkbox, toggle) ~100 ms; substantial changes (modals) 200–300 ms; large movements up to 400 ms; "At 500ms, animations start to feel like a real drag". Entering should be slightly longer than exiting: "a popup window may take 300ms to appear, but only 200 or 250ms to disappear." Ease-out for entering, ease-in for exiting; avoid linear. (Feb 2020) — [NN/g Animation Duration](https://www.nngroup.com/articles/animation-duration/)
- Fluent 2: "Give larger elements more time to animate than smaller elements. Aim for a fast and smooth motion without making people wait." Linear only for constant-rate motion such as rotations; top-level (page) transitions use a "quick fade". Also: include a "no motion" setting and "keep motion constrained to the element in focus". (Exact Fluent ms/cubic-bezier tokens were not exposed on the fetched page.) — [Fluent 2 Motion](https://fluent2.microsoft.design/motion)

**IBM Carbon tokens (current `motion.json`)**
- Durations: `fast-01` 70 ms (button, toggle), `fast-02` 110 ms (fade in, small elements), `moderate-01` 150 ms ("small expansion, short distance movements. Default transition speed."), `moderate-02` 240 ms (expansion, system communication, toast), `slow-01` 400 ms (large expansion, important notifications), `slow-02` 700 ms (background dimming, hero). — [Carbon motion.json](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/motion/src/dtcg/motion.json)
- Easing (productive / expressive): standard `cubic-bezier(0.2, 0, 0.38, 0.9)` / `(0.4, 0.14, 0.3, 1)`; entrance `(0, 0, 0.38, 0.9)` / `(0, 0, 0.3, 1)`; exit `(0.2, 0, 1, 0.9)` / `(0.4, 0.14, 1, 1)`. Productive motion is "significantly faster" than expressive and intended for task-focused UI. — [Carbon motion.json](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/motion/src/dtcg/motion.json); [@carbon/motion on GitHub](https://github.com/carbon-design-system/carbon/tree/main/packages/motion)

**Material 3 tokens** (from a Compose reference mirroring `MotionTokens`; the m3.material.io page could not be fetched)
- Durations: short1 50, short2 100, short3 150, short4 200, medium1 250, medium2 300, medium3 350, medium4 400, long1 450, long2 500, long3 550, long4 600, extraLong1–4 700/800/900/1000 ms. — [compose-skill material3-motion.md](https://raw.githubusercontent.com/aldefy/compose-skill/master/skills/compose-expert/references/material3-motion.md)
- Easing: emphasized-decelerate `(0.05, 0.7, 0.1, 1.0)` (entering), emphasized-accelerate `(0.3, 0.0, 0.8, 0.15)` (exiting), standard `(0.2, 0.0, 0.0, 1.0)`, standard-decelerate `(0, 0, 0, 1)`, standard-accelerate `(0.3, 0, 1, 1)`, legacy `(0.4, 0, 0.2, 1)`, linear `(0,0,1,1)`. — [compose-skill material3-motion.md](https://raw.githubusercontent.com/aldefy/compose-skill/master/skills/compose-expert/references/material3-motion.md); emphasized-decelerate + medium2 = 300 ms confirmed by [material-rs motion.rs](https://docs.rs/material-rs/latest/src/material_rs/theme/motion.rs.html)
- M3 Expressive uses spring physics ("bouncier, more energetic springs"); numeric spring values were not found. — [compose-skill material3-motion.md](https://raw.githubusercontent.com/aldefy/compose-skill/master/skills/compose-expert/references/material3-motion.md)

**Performance**
- Animate only `transform` and `opacity` (composite stage); avoid properties that trigger layout or paint (`top`, `left`, `width`, `height`, and blur effects). Use `will-change` "only if you notice graphics issues" and remove it afterwards. Example: optimized transform animation dropped ~1% frames vs ~50% for a layout-animating version. (Last updated Oct 2020) — [web.dev Animations guide](https://web.dev/articles/animations-guide)

**Reduced motion**
- WCAG 2.3.3 Animation from Interactions (AAA): "Motion animation triggered by interaction can be disabled, unless the animation is essential…". Motion animation = "addition of steps between conditions to create the illusion of movement"; colour, blur or opacity changes that don't alter perceived size, shape or position don't count. Sufficient technique C39: use the CSS `prefers-reduced-motion` query. — [W3C Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- React does not automatically disable ViewTransition animations for reduced motion; recommended CSS: `@media (prefers-reduced-motion) { ::view-transition-old, ::view-transition-new { animation: none !important; } }`. — [react.dev ViewTransition reference](https://react.dev/reference/react/ViewTransition)

**React `<ViewTransition>`**
- React 19.3 shipped Sept 9 2026, making View Transitions and Fragment Refs stable. — [React 19.3 blog](https://react.dev/blog/2026/09/09/react-19-3); [DevX](https://www.devx.com/coding/19-3-view-transitions-fragment-refs/)
- Note: the react.dev *reference* page's sandbox examples still pin a `19.3.0-canary` build; the 19.3 blog is the authoritative stability statement. — [react.dev reference](https://react.dev/reference/react/ViewTransition) vs [React 19.3 blog](https://react.dev/blog/2026/09/09/react-19-3)
- "Updates not marked as Transitions don't trigger animations"; only `startTransition`, `<Suspense>` reveals and `useDeferredValue` updates animate. Animation types: enter, exit, update, share (named). Props: `enter`, `exit`, `update`, `share`, `default` (`"auto"`, `"none"` or a class), `name`; event props `onEnter/onExit/onShare/onUpdate`; `addTransitionType` for direction-specific animations. — [React 19.3 blog](https://react.dev/blog/2026/09/09/react-19-3); [react.dev reference](https://react.dev/reference/react/ViewTransition)
- Recommended Suspense pattern: `<ViewTransition update="auto" default="none"><Suspense fallback=…>` so fallbacks appear immediately without animation and only fallback→content animates. — [React 19.3 blog](https://react.dev/blog/2026/09/09/react-19-3)
- Caveats: must be placed before any DOM node to trigger enter/exit; list reordering requires each item wrapped directly in `<ViewTransition key={id}>` with no intermediate DOM wrapper; names must be globally unique; shared pairs outside the viewport don't animate; concurrent updates are batched; it animates snapshots (images), so internal elements don't move independently; DOM only. — [react.dev reference](https://react.dev/reference/react/ViewTransition)

**shadcn/ui + tw-animate-css + Base UI defaults**
- tw-animate-css provides `animate-in`/`animate-out` plus `fade-in/out`, `zoom-in/out`, `spin-in/out`, `slide-in-from-*`/`slide-out-to-*` (top/bottom/left/right/start/end), `blur-in/out`; parameter utilities `duration-*`, `ease-*`, `delay-*`, `repeat-*`, `direction-*`, `fill-mode-*`, `running/paused`; ready animations `accordion-down/up`, `collapsible-down/up` (height via CSS variable) and `caret-blink`. A v2.0.0 with breaking changes is announced. — [tw-animate-css README](https://github.com/Wombosvideo/tw-animate-css)
- shadcn base-nova Dialog verbatim: overlay `fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0`; popup `… duration-100 … data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95`. — [shadcn registry base-nova/dialog.json](https://ui.shadcn.com/r/styles/base-nova/dialog.json)
- Base UI animation hooks: `[data-starting-style]` / `[data-ending-style]` for CSS transitions (recommended because they "can be smoothly cancelled midway"), `[data-open]` / `[data-closed]` for CSS keyframe animations; Base UI waits for animations (detected via `element.getAnimations()`) before unmounting. Motion integration via the `render` prop, `keepMounted`, and `AnimatePresence`. Example: `transition: transform 150ms, opacity 150ms; &[data-starting-style],&[data-ending-style]{opacity:0; transform:scale(0.9)}`. — [Base UI Animation handbook](https://base-ui.com/react/handbook/animation)
- shadcn Drawer now uses Base UI instead of Vaul; supports snap points (fractions 0–1 or px/rem), `snapPoint`/`onSnapPointChange`, and `data-expanded` at full snap. — [shadcn Drawer (Base)](https://ui.shadcn.com/docs/components/base/drawer)

**Motion (Framer Motion) bundle**
- `motion` component ≈34 kB; `LazyMotion` + `m` ≈4.6 kB initial; `domAnimation` +15 kB (animations, variants, exit, tap/hover/focus); `domMax` +25 kB (adds pan/drag and layout animations); `useAnimate` mini 2.3 kB; `strict` prop throws if full `motion` is imported; features can be lazy-loaded with dynamic import. — [Motion: Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size)

### Inferences
Proposed motion tokens for this app (productive, derived from Carbon + M3 + NN/g):

```css
@theme {
  --duration-instant: 0ms;      /* reduced-motion target */
  --duration-fast: 100ms;       /* hover/press colour, toggles, checkbox (NN/g ~100, Carbon 70-110) */
  --duration-base: 150ms;       /* default: dropdowns, popovers, tooltips, tab indicator (Carbon moderate-01) */
  --duration-moderate: 200ms;   /* dialogs, accordion, sidebar, exits of sheets (M3 short4) */
  --duration-slow: 300ms;       /* sheets/drawers entering, progress fill, toasts (M3 medium2, NN/g 200-300) */
  --duration-max: 400ms;        /* hard ceiling for any UI motion */
  --ease-standard: cubic-bezier(0.2, 0, 0.38, 0.9);  /* Carbon productive standard: moves within view */
  --ease-enter:    cubic-bezier(0, 0, 0.38, 0.9);    /* Carbon productive entrance (decelerate) */
  --ease-exit:     cubic-bezier(0.2, 0, 1, 0.9);     /* Carbon productive exit (accelerate) */
  --ease-emphasized-enter: cubic-bezier(0.05, 0.7, 0.1, 1); /* M3, for sheets/drawers only */
}
```
- Rules: exits ≈ 0.7–0.8× entrance duration; larger distance → longer (tooltip 100–150 ms, dialog 150–200 ms, full-height sheet 250–300 ms); anything triggered many times per minute (row hover, cell edit, filter chips, table sort) gets colour-only change at ≤100 ms or no motion; no motion on typing/keyboard navigation.
- Global reduced-motion rule: under `@media (prefers-reduced-motion: reduce)` set transform animations to none and keep only ≤100 ms opacity/colour fades (opacity is not "motion" per WCAG 2.3.3). Also offer an in-app "Reduce animations" toggle (Fluent recommends a no-motion setting; low-end Android users benefit). With Motion, `MotionConfig reducedMotion="user"` is the standard switch (not verified in fetched docs).
- The base-nova dialog overlay uses `backdrop-blur-xs`; blur triggers paint and is expensive on low-end Android per web.dev — consider removing `supports-backdrop-filter:backdrop-blur-xs` or gating it to `md:` and up.
- The base-nova button uses `transition-all`; prefer `transition-[color,background-color,border-color,box-shadow,transform]` to avoid animating layout properties accidentally.
- Motion library: keep it optional; CSS + tw-animate-css + Base UI data attributes cover almost everything. If used (e.g. layout/reorder animations), `LazyMotion` + `domAnimation`, `strict`, lazy-loaded.
- ViewTransition usage: wrap route outlet content in `<ViewTransition default="none" enter="fade-in" exit="fade-out">` with a quick cross-fade ≤150–200 ms (matches Fluent "top-level quick fade"); navigation must go through `startTransition` (e.g. React Router v7 `viewTransition`/transition-based navigation — verify router integration). Use keyed `<ViewTransition key={id}>` for list reorder (e.g. sorting a small card list); avoid on large data tables (snapshotting hundreds of rows is costly). Use Suspense pattern `update="auto" default="none"` for skeleton → content.

### Gaps
- Fluent 2 exact duration/easing token values (e.g. `durationFast` 150 ms, `curveDecelerateMid`) not retrieved; the fetched page only had principles.
- Material 3 tokens were taken from a secondary Compose reference and material-rs, not m3.material.io (page is JS-rendered and unfetchable). The M3 web "emphasized" easing is a path curve; the `(0.2,0,0,1)` value is the Compose approximation.
- Apple HIG motion guidance was not retrieved.
- Browser support levels of the View Transition API in Firefox/Samsung Internet (relevant for Android) were not verified in this pass; React docs say only "DOM".
- Router integration of `<ViewTransition>` (React Router / TanStack Router) was not documented on the React 19.3 blog.
- Whether tw-animate-css itself applies any `prefers-reduced-motion` handling was not stated in its README; assume the app must add it (Tailwind `motion-reduce:` / `motion-safe:` variants).

---

## Interaction states: hover, focus-visible, active, disabled, selected, loading, read-only, invalid

### Takeaway
Every interactive component needs a consistent state set expressed through shadcn tokens: hover (`bg-muted`/`accent` or `primary/80`), focus-visible (`border-ring` + 3px `ring-ring/50`), pressed (`translate-y-px`), disabled (`opacity-50`, `pointer-events-none`), invalid (`aria-invalid:border-destructive` + `ring-destructive/20`). WCAG 2.2 requires focus to be visible and not obscured (AA) and recommends a ≥2px indicator with ≥3:1 change contrast (AAA); disabled controls are exempt from contrast, but for this app "explain why disabled" (focusable-when-disabled or keep enabled + validate) is better than silently greyed buttons.

### Cited Findings
- shadcn base-nova button base classes (verbatim): `transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40`; variants: default `bg-primary text-primary-foreground hover:bg-primary/80`; outline `border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted`; sizes `h-6/h-7/h-8/h-9`, icon `size-6…size-9`; radius `rounded-lg`. — [shadcn registry base-nova/button.json](https://ui.shadcn.com/r/styles/base-nova/button.json)
- shadcn tokens: background/foreground pairs — `primary`, `secondary`, `muted` ("subtle content"), `accent` ("interactive states"), `destructive`, `border`, `input`, `ring`, `chart-1..5`, `sidebar-*`; OKLCH colours (e.g. `--background: oklch(1 0 0)` light, `oklch(0.145 0 0)` dark); new tokens such as `warning` are added in `:root` and `.dark` and exposed via `@theme inline` (`--color-warning: var(--warning)`); `--radius: 0.625rem`. — [shadcn Theming](https://ui.shadcn.com/docs/theming)
- WCAG 2.4.7 Focus Visible (AA) requires a visible indicator; 2.4.11 Focus Not Obscured (Minimum, AA): focused item "at least partially visible"; 2.4.12 (AAA) fully visible. — [W3C New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- 2.4.13 Focus Appearance (AAA): indicator area at least "a 2 CSS pixel thick perimeter of the unfocused component" and "a contrast ratio of at least 3:1 between the same pixels in the focused and unfocused states"; simplest method is a solid 2px outline (`outline` + `outline-offset`). Unmodified user-agent focus indicators are exempt. — [W3C Understanding 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
- 1.4.11 Non-text Contrast (AA): UI components and graphical objects need 3:1 against adjacent colours; focus indicators must meet it; hover treatments are "not 'required to identify' the hover state" and need not meet 3:1; disabled components "are not required to meet contrast requirements". — [W3C Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- `disabled` removes the element from tab order and ignores clicks; `aria-disabled="true"` keeps it focusable and announced as unavailable, but the click handler must be blocked manually; use `aria-disabled` when a tooltip must explain why. — [Deque: accessible ARIA buttons](https://www.deque.com/blog/accessible-aria-buttons/); [a11y-101 aria-disabled](https://a11y-101.com/development/aria-disabled)
- Base UI Button has `focusableWhenDisabled` ("so focus remains on the button while it is disabled", e.g. during loading) and exposes `data-disabled`. — [Base UI Button](https://base-ui.com/react/components/button)
- web.dev INP: show feedback in the next painted frame to avoid repeat clicks. — [web.dev INP](https://web.dev/articles/inp)

### Inferences
State spec (recommendation):

| State | Visual | Semantics / behaviour |
|---|---|---|
| Hover (pointer only) | `hover:bg-muted` (neutral) / `hover:bg-primary/90` (primary); ≤100 ms colour transition; wrap in `@media (hover:hover)` (Tailwind v4's `hover:` already does this) so touch doesn't get sticky hover | Never the only affordance; row hover in tables `hover:bg-muted/50`. |
| Focus-visible | Keep shadcn `ring-3 ring-ring/50` + `border-ring`, but verify the ring colour achieves ≥3:1 vs page background in both themes (50% alpha ring may fail); for AAA-grade use a solid 2px `outline-ring outline-offset-2`. Never `outline-none` without replacement. Sticky headers/bottom bars must not cover focused fields (use `scroll-padding-top/bottom`). | Only on keyboard focus (`:focus-visible`). |
| Active/pressed | `translate-y-px` (default) or `scale-[0.98]`, instant | Provide on touch too (`active:` works on tap). |
| Selected (rows, tabs, nav, toggles) | `bg-accent text-accent-foreground` / `aria-selected:bg-muted` plus a non-colour cue (check icon, left bar, bold) | `aria-selected`, `aria-current="page"` for nav, `aria-pressed` for toggles. |
| Loading | Keep button width; spinner + "Saving…"; `aria-busy="true"`; `focusableWhenDisabled` so focus isn't lost | Block double submit; skeletons for regions. |
| Disabled | `opacity-50`, `cursor-not-allowed` (shadcn uses `pointer-events-none`, which suppresses the cursor; choose one pattern) | Prefer: keep enabled and validate on submit, or `aria-disabled`/`focusableWhenDisabled` + helper text explaining why ("Add at least one item"). |
| Read-only (VIEWER role) | Render values as text or `readOnly` inputs with `bg-muted/40`, no input border emphasis, lock icon/"View only" badge at page level; hide (not disable) create/edit/delete actions | `readOnly` keeps fields focusable and copyable; don't show 20 greyed-out buttons. |
| Invalid | `aria-invalid:border-destructive` + ring (default), error icon + message below field in `text-destructive` | `aria-invalid="true"`, `aria-describedby` → message; focus first invalid field on submit; error summary for long forms. |
| Cursor rules | `cursor-pointer` on all clickable non-link controls (Tailwind v4 preflight changed buttons to `cursor: default`, so shadcn v4 styles may need it added), `cursor-not-allowed` on disabled, `cursor-text` on inputs, `cursor-grab` on drag handles | Consistency across Button, Select trigger, Checkbox, table rows that open details. |

### Gaps
- Whether the default shadcn `ring` token at 50% opacity meets 3:1 in both themes was not measured; needs a contrast check against the actual OKLCH values.
- Tailwind v4 changing the default button cursor to `default` is from prior knowledge, not re-verified in this pass.
- WAI-ARIA APG guidance on read-only vs disabled patterns was not fetched.

---

## Responsive design and touch

### Takeaway
Stay mobile-first with Tailwind v4 defaults (sm 640, md 768, lg 1024, xl 1280, 2xl 1536 px) and use container queries (`@container`, `@sm`…`@7xl`) for cards/panels that live in variable-width layouts. Key switches: < md sidebar becomes an off-canvas sheet; < md tables become cards; < md dialogs become bottom Drawers (shadcn "responsive dialog" pattern); forms get a sticky bottom action bar. Touch targets: WCAG AA minimum 24×24 CSS px, but design to 44–48 px for yard use; inputs ≥16 px font and correct `inputmode`.

### Cited Findings
- Tailwind v4 breakpoints: `sm` 40rem/640px, `md` 48rem/768px, `lg` 64rem/1024px, `xl` 80rem/1280px, `2xl` 96rem/1536px; mobile-first (unprefixed = all sizes); customise with `@theme { --breakpoint-xs: 30rem; }` using rem consistently. Container queries: `@container` and `@3xs` 16rem … `@sm` 24rem, `@md` 28rem, `@lg` 32rem, `@xl` 36rem, `@2xl` 42rem, `@3xl` 48rem … `@7xl` 80rem; named containers `@container/main`. — [Tailwind Responsive design](https://tailwindcss.com/docs/responsive-design)
- shadcn Drawer (Base UI-based) and the documented responsive-dialog composition: Dialog on desktop, Drawer on mobile via a `useMediaQuery` hook (typically 768px). Snap points supported. — [shadcn Drawer (Base)](https://ui.shadcn.com/docs/components/base/drawer)
- WCAG 2.5.8 Target Size (Minimum, AA): "at least 24 by 24 CSS pixels" unless: spacing (24 px circle centered on each target doesn't intersect another), equivalent control, inline, user-agent, or essential. For important controls consider 2.5.5 (AAA) 44×44. — [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Android: touch targets "at least 48dpx48dp. Larger is even better"; smaller acceptable for mouse/trackpad. — [Android Developers: Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps)
- NN/g: targets at least 1 cm × 1 cm (0.4 in); average fingertip 1.6–2 cm; ~2 mm spacing is often recommended but insufficient when targets are small. (May 2019) — [NN/g Touch Target Size](https://www.nngroup.com/articles/touch-target-size/)
- `inputmode`: `decimal` = digits + decimal separator (may include minus); `numeric` = digits 0–9 only; `tel`, `search`, `email`, `url`, `none`, `text`; it does not validate; prefer real `type` for email/tel/url/search; Baseline widely available since Dec 2021. — [MDN inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)
- iOS Safari zooms into inputs whose computed font-size is < 16px; ≥16px prevents it; alternatives (`maximum-scale=1`) exist but limit zoom. — [CSS-Tricks: 16px or larger prevents iOS form zoom](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/); [Rick Strahl 2023](https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing)
- shadcn base-nova button heights are h-6 (24px) to h-9 (36px) — i.e. default desktop sizes are below 44–48 px. — [shadcn registry base-nova/button.json](https://ui.shadcn.com/r/styles/base-nova/button.json)

### Inferences
- Breakpoint plan: `<md` (phones, portrait tablets <768): single column, sidebar in Sheet via hamburger (shadcn Sidebar already switches to Sheet on mobile), optional bottom nav with 4–5 top destinations (Dashboard, Purchases, Sales, Stock, More) for yard staff; tables → card list with the 3–4 key fields and a chevron; dialogs → bottom Drawer; forms full-screen with sticky bottom bar (`sticky bottom-0 pb-[env(safe-area-inset-bottom)]`) holding the primary action. `md–lg` (tablets/landscape): collapsible icon sidebar, tables with horizontal scroll and a pinned first column, 2-column forms. `≥lg` (office PCs): expanded sidebar, full data tables, dialogs centered (`sm:max-w-lg` etc.). Use `@container` for KPI card grids and detail panels so they adapt inside split views.
- Touch sizing: on `pointer: coarse` bump controls to 44 px (e.g. `h-11` buttons/inputs, `size-11` icon buttons, list rows ≥48 px) while desktop keeps shadcn h-8/h-9 density; Tailwind v4 `pointer-coarse:` variant can do this. Never place destructive actions adjacent to primary ones on mobile.
- Thumb zone: primary actions bottom (sticky bar / FAB-like "Add weighment"), destructive and rare actions top or in overflow menus. (No authoritative thumb-zone numbers were fetched.)
- Numeric fields: weights/tons/rates `type="text" inputmode="decimal"` (plus `pattern`/Zod validation) rather than `type="number"` (avoids scroll-wheel changes and locale issues); quantities in pieces `inputmode="numeric"`; phone `type="tel"`; GSTIN/vehicle numbers `autocapitalize="characters"`, `autocomplete="off"`. Set `enterkeyhint="next"/"done"`.
- Inputs `text-base` (16px) on mobile, `md:text-sm` on desktop (shadcn input already follows this pattern in recent versions; verify).
- Outdoor readability: provide a "High contrast / Sunlight" theme toggle (pure white bg, near-black text ≥7:1, thicker 2px borders, no low-alpha greys, larger base font 16–18px) and respect `prefers-contrast: more`; avoid thin font weights (<400) and light grey muted text on mobile.
- Weak data: Drawer/Sheet animation cost is CPU, not network; the bigger win is skeletons, optimistic UI, and code-splitting routes.

### Gaps
- Apple HIG 44×44 pt figure could not be retrieved from Apple's page (JS-rendered); it is reflected via WCAG 2.5.5's 44×44 recommendation.
- No authoritative, current thumb-zone measurements (e.g. Hoober) were fetched.
- No research-backed contrast/typography numbers for sunlight readability were found; the high-contrast recommendations are inferred (WCAG AAA 7:1 is the nearest standard).
- Exact current shadcn Input classes (`text-base md:text-sm`) not re-verified in this pass.

---

## Accessibility (WCAG 2.2 AA) checklist and what Base UI/shadcn provides vs what the app must do

### Takeaway
Base UI provides keyboard interaction, focus management/trapping, ARIA roles/states and data attributes for dialogs, menus, selects, tabs, accordions, etc.; the app still owns colour contrast (4.5:1 text, 3:1 UI/graphics), visible and unobscured focus, labels and error messages, status announcements, target sizes, dragging alternatives, table semantics, chart text alternatives, non-colour signals, consistent help, and `lang` attributes.

### Cited Findings
- WCAG 2.2 new criteria: 2.4.11 Focus Not Obscured (Min) AA; 2.4.12 (Enh) AAA; 2.4.13 Focus Appearance AAA; 2.5.7 Dragging Movements AA ("provide a simple pointer alternative"); 2.5.8 Target Size (Min) AA; 3.2.6 Consistent Help A ("Put help in the same place"); 3.3.7 Redundant Entry A ("Don't ask for the same information twice in the same session"); 3.3.8 Accessible Authentication (Min) AA ("Don't make people solve, recall, or transcribe something to log in"); 3.3.9 AAA; 4.1.1 Parsing removed. — [W3C What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- 1.4.11: 3:1 for UI components and graphical objects; each line in a graph needs 3:1 against background but not against each other; disabled controls exempt; focus indicators must comply. — [W3C Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- Text contrast: 4.5:1 for normal text, 3:1 for large text (Android's rendering of the same rule: text <18sp or bold <14sp needs 4.5:1). — [Android Developers accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps)
- 2.3.3 (AAA) motion from interaction can be disabled; technique C39 `prefers-reduced-motion`. — [W3C Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- Base UI: exposes state data attributes (`data-open`, `data-closed`, `data-disabled`, `data-starting-style`…) and waits for exit animations; Button supports `focusableWhenDisabled`. — [Base UI Animation](https://base-ui.com/react/handbook/animation); [Base UI Button](https://base-ui.com/react/components/button)
- React ViewTransition does not honour reduced motion automatically. — [react.dev ViewTransition](https://react.dev/reference/react/ViewTransition)
- Motion alone is not a valid error indication; pair with text and `aria-describedby`. — [animationpatterns.art](https://animationpatterns.art/animations/error-shake-feedback/)

### Inferences
App-owned checklist (AA target, selected AAA where cheap):
1. Contrast: verify all token pairs (foreground on background/card/muted, primary-foreground on primary, destructive text, muted-foreground ≥4.5:1; borders of inputs/checkboxes ≥3:1 vs background — shadcn's very light `--input`/`--border` greys often fail 3:1 for input boundaries; strengthen `--input` for form fields).
2. Keyboard: every action reachable by Tab/Enter/Space/Esc; logical DOM order matching visual order (esp. with sticky mobile bars); skip link to main content; focus returns to trigger after dialog close (Base UI default) and to the new/edited row after save.
3. Focus: visible 2px+ indicator ≥3:1 (2.4.7/1.4.11, aim 2.4.13); `scroll-padding` so sticky header/footer never hides focus (2.4.11).
4. Labels: visible `<Label>` for every field (shadcn Field/Form wiring `htmlFor`/`aria-describedby`); icon-only buttons need `aria-label`; units in label ("Weight (kg)").
5. Errors (3.3.1/3.3.3): identify field, describe fix in text, `aria-invalid`, focus first error; confirm destructive actions or provide Undo (3.3.4 for financial/data transactions — invoices, payments).
6. Status messages (4.1.3): toasts and "Saved/Copied/3 results" via polite live regions (Sonner uses one); don't move focus for success.
7. Target size (2.5.8): ≥24 px everywhere incl. table row action icons (shadcn `size-6` = 24 px is the floor), 44–48 px on touch.
8. Dragging (2.5.7): any drag-to-reorder or drag-upload must have buttons (Move up/down, "Browse files").
9. Consistent help (3.2.6): help/WhatsApp support link in the same place on every page. Redundant entry (3.3.7): prefill supplier/vehicle details from previous step. Accessible auth (3.3.8): allow password managers/paste, OTP autofill (`autocomplete="one-time-code"`).
10. Tables: real `<table>` with `<th scope="col">`, `<caption>` or `aria-label`, `aria-sort` on sortable headers; mobile card view keeps label:value pairs (`<dl>`).
11. Charts: text summary + "View as table" toggle; series distinguishable by more than colour (labels, patterns, direct labelling); each line/bar ≥3:1 vs background.
12. Colour not the only signal (1.4.1): status badges have text + icon (Paid ✓, Pending ◷, Overdue !); limit meter shows % text.
13. Language (3.1.1/3.1.2): `<html lang="en-IN">`; when Hindi/Gujarati UI is added set `lang="hi"`/`lang="gu"` on root or on mixed-language spans so screen readers switch voices and fonts pick correct shaping.
14. Reflow/zoom (1.4.10, 1.4.4): usable at 320 CSS px width and 200% zoom; don't set `maximum-scale=1`.
15. Reduced motion: global CSS for `prefers-reduced-motion` covering tw-animate-css, ViewTransition pseudo-elements and Motion.

### Gaps
- Did not fetch WAI-ARIA APG pages for grid/table or Base UI's per-component accessibility statements; claims about Base UI keyboard/focus management beyond fetched pages rely on general knowledge of the library.
- Did not verify Sonner's live-region implementation in this pass.
- No automated contrast measurement of shadcn default OKLCH tokens was performed.

---

## Typography and visual design fundamentals for data apps

### Takeaway
Use one neutral base + one brand colour on shadcn's semantic OKLCH tokens, add `success`/`warning`/`info` token pairs (background + foreground) validated at 4.5:1 text / 3:1 UI in both themes, set all numeric data in tabular lining figures, and keep a 4/8 px spacing rhythm with borders over shadows for density. Pair a Latin UI font with a Devanagari/Gujarati-capable companion (e.g. Noto Sans family) ahead of localisation.

### Cited Findings
- `tabular-nums`: "activating the set of figures where numbers are all of the same size, allowing them to be easily aligned like in tables" (OpenType `tnum`); combine `lining-nums tabular-nums`; `slashed-zero` is independent; `font-variant-numeric` preferred over `font-feature-settings`. Tailwind utility: `tabular-nums`. — [MDN font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric)
- shadcn tokens are OKLCH semantic pairs; add custom `warning` via `:root`, `.dark` and `@theme inline`; `--radius: 0.625rem` (10px) with derived `radius-sm…radius-4xl`; `chart-1..5` for data viz. — [shadcn Theming](https://ui.shadcn.com/docs/theming)
- Contrast: 4.5:1 normal text, 3:1 large text/UI components and graphs. — [W3C Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html); [Android Developers accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps)
- iOS input zoom threshold 16px (constrains minimum input font size on mobile). — [CSS-Tricks](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)

### Inferences
- Type scale (Tailwind defaults, desktop dense / mobile comfortable): 12px (`text-xs`, captions, table meta), 14px (`text-sm`, desktop body/table cells, shadcn default), 16px (`text-base`, mobile body and all mobile inputs), 18px (`text-lg`, section titles), 20–24px (page titles), 28–36px (KPI numbers). Line-height ~1.4–1.5 body, 1.2 headings; Devanagari/Gujarati need looser leading (~1.6) because of matras.
- Numbers: `tabular-nums` on tables, KPIs, totals, weights; right-align numeric columns; Indian digit grouping via `Intl.NumberFormat('en-IN')` (₹12,34,567.00); fixed decimals per unit (tons 3 dp, ₹ 2 dp).
- Fonts: Inter or Geist (Latin; both have `tnum`) + Noto Sans Devanagari / Noto Sans Gujarati as fallbacks in the same `font-family` stack; self-host subsetted WOFF2 with `font-display: swap` to protect weak-data loads. (Font coverage/`tnum` availability not verified in this pass.)
- Spacing: 4px base (Tailwind `1` = 0.25rem), use 8px multiples for layout (8/16/24/32), 4px for tight intra-component gaps; card padding 16px mobile / 24px desktop.
- Elevation: flat surfaces with 1px `border` + `ring-foreground/10` (base-nova style); shadows only for floating layers (popover, dropdown, dialog). Cheaper to render on low-end devices than large blurred shadows.
- Colour tokens: neutral (zinc/stone/slate) base + one brand hue as `primary`; semantic pairs `success`, `warning`, `info` alongside `destructive`, each with `-foreground` and a subtle tint (e.g. `bg-success/10 text-success` for badges) — must check the tinted-badge text colour reaches 4.5:1 in light and dark; warning amber typically needs dark foreground text (not white) to pass. Chart palette via `chart-1..5` checked for 3:1 vs background and colour-blind safety.

### Gaps
- No authoritative source fetched for Inter/Geist feature support, Noto Sans Devanagari/Gujarati metrics, or recommended line-heights for Indic scripts.
- No verified AA-passing OKLCH values for success/warning/info in light and dark were retrieved; these must be computed/validated with a contrast tool.
- Material/Carbon type-scale numbers were not fetched; the scale above is based on Tailwind defaults.
