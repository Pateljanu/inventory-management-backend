# System States and User Feedback Playbook (shadcn/ui, 2025-2026) — Metal Scrap Management System

Scope: loading, empty, error, success, confirmation states; toasts, alerts/banners, tooltips, inline feedback; status communication. App: Vite + React 19 SPA, shadcn/ui on Base UI + Tailwind v4, TanStack Query v5, Sonner. Users: non-technical Indian scrap-business owners/staff, desktop + phones, weak mobile data. Backend errors: `{ success:false, error:{ code, message, details, requestId } }`.

Note on dating: several core sources are older research that remains the standard reference (NN/g response-time limits originate from 1993; NN/g confirmation dialogs 2018; NN/g error-message guidelines 2023; NN/g skeleton screens 2023). NN/g pages show "last reviewed" dates in 2026, meaning NN/g still endorses them. Copy examples in "Inferences" are written by the researcher (not sourced) and are marked as proposals.

---

## 1. Loading states (skeleton vs spinner vs progress, anti-flicker, keep-previous-data, button loading, optimistic updates, double submit, layout shift)

### Takeaway
Use nothing for waits under ~1 s, a content-shaped skeleton for full-page/first loads, a spinner for a single module or button, and a determinate progress bar for anything ~10 s+. Keep old data on screen while refetching (TanStack v5 `placeholderData: keepPreviousData` + `isPlaceholderData`/`isFetching`), and never do optimistic updates on stock-limited writes, which the server may reject with 409.

### Cited Findings
- Three classic response-time limits: 0.1 s feels instantaneous; 1 s keeps the user's flow of thought; 10 s is the limit of keeping attention. From 1-10 s users "feel at the mercy of the computer"; after 10 s they start thinking about other things. (Older research, still standard.) — [NN/g, Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- Between 0.1 and 1.0 s normally no special feedback is needed; use a looped (indeterminate) indicator for delays of 2-9 s and a percent-done indicator for 10 s or more. — [NN/g, Progress Indicators](https://www.nngroup.com/articles/progress-indicators/); [NN/g, Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- Progress indicators reassure users the system hasn't crashed, indicate roughly how long to wait, and give something to look at. — [NN/g, Progress Indicators](https://www.nngroup.com/articles/progress-indicators/)
- Skeleton screens (Samhita Tankala, June 2023, last reviewed Sept 2, 2026): under 1 s, neither skeletons nor spinners are needed — showing them causes a quick flash that makes users "feel like they can't keep up"; 2-10 s: spinners for a single module (e.g., a card on a dashboard), skeletons for full-page loads because the wireframe "minimizes cognitive load"; over 10 s: "Progress bars are strongly recommended". — [NN/g, Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)
- Use content-placeholder skeletons that "mimic the layout of the page"; "Do not use a frame-display skeleton screen" (header/footer only), which gives no layout information. — [NN/g, Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)
- TanStack Query v5 removed the `keepPreviousData` option; use `placeholderData: keepPreviousData` (imported helper) or `placeholderData: (prev) => prev`. `isPreviousData` became `isPlaceholderData`; `isLoading` became `isPending`; the new `isLoading` = `isPending && isFetching`. Caveats: placeholder data always has `success` status, and `dataUpdatedAt` resets to 0. — [TanStack Query, Migrating to v5](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)
- With placeholder data a query does not enter pending state; it starts in success; `isPlaceholderData` distinguishes the temporary data. — [TanStack Query, Placeholder Query Data](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data)
- Optimistic updates, two approaches: (a) "via UI" — render `variables` while `isPending` (e.g., at opacity 0.5) and show a Retry on `isError`; (b) "via cache" — `onMutate` cancels queries, snapshots previous data, `setQueryData`, and rolls back in `onError`. "If you only have one place where the optimistic result should be shown, using `variables` and updating the UI directly is the approach that requires less code." `useMutationState` with a `mutationKey` exposes pending variables to other components. — [TanStack Query, Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- Sonner/Toast `toast.promise` handles loading → success → error for an async operation. — [shadcn/ui Toast (Base UI)](https://ui.shadcn.com/docs/components/base/sonner)

### Inferences
- **Decision table (proposal):**
  | Situation | Treatment |
  |---|---|
  | First load of a list/table/detail page | shadcn `Skeleton` rows matching real column widths/row height (same count as page size, e.g. 10) |
  | Refetch after filter/page change | Keep old rows (`placeholderData: keepPreviousData`), dim table to ~60% opacity when `isPlaceholderData`, thin top progress line or small `Spinner` next to the heading; disable next-page button while `isPlaceholderData` |
  | Background refetch (window focus / interval) | No visible indicator beyond "Updated 2 min ago" text changing; optionally a tiny spinner icon on the Refresh button |
  | Single dashboard card | `Spinner` inside the card, or card-level skeleton |
  | Button submit | `Spinner` inside button + verb in progress ("Saving…"), button `disabled`/`aria-busy`, fixed min-width so it does not jump |
  | Report export / bulk import (>10 s) | Determinate `Progress` bar with "32 of 120 rows" text |
- **Anti-flicker delay:** because NN/g says sub-1 s waits should show nothing and flashes annoy users, delay loaders ~300-500 ms and, once shown, keep them visible for a minimum ~300-500 ms. This specific delay/minimum-duration value is a common engineering convention, not a sourced NN/g number (see Gaps). On weak mobile data, most first loads will exceed the delay, so skeletons will show.
- **Double submit:** disable the submit button when `mutation.isPending`; also guard in the handler (`if (mutation.isPending) return`). For creates (Delivery, Purchase, PO), consider an idempotency key header so a retry after a network drop cannot create two records — backend decision.
- **Optimistic update policy for this app:**
  - SAFE to be optimistic: toggles and non-stock metadata with no server-side business rule (e.g., marking a notification read, renaming a label, pinning a filter).
  - NOT optimistic (use pessimistic + button spinner): anything touching stock or money — creating/editing Deliveries, Purchases, stock transfers, PO receive, backdated edits — because the server can return 409 `INSUFFICIENT_SOURCE_STOCK`, `NEGATIVE_STOCK_HISTORY` or `DUPLICATE_VALUE`, and a rolled-back number the user already saw is worse than a 1-2 s wait. Also not optimistic for status changes like "Cancel PO" and "Deactivate company".
  - After a successful stock-affecting mutation, `invalidateQueries` for stock summaries, the ledger, and the affected entity lists.
- **Layout shift:** skeletons must reserve the same height as final content; tables should keep header row rendered during loading; button loading state must not change width (keep label text or set `min-w`); reserve space under form fields for error text only when shown (acceptable shift) or use `aria-describedby` text that appears below.

### Gaps
- No primary source found (in the calls made) for a specific "delay before showing spinner" value (e.g., 300 ms/500 ms) or minimum display time; the recommendation is inferred from NN/g's "<1 s show nothing" guidance.
- shadcn `Spinner` and `Skeleton` docs pages were not fetched; component APIs assumed from shadcn conventions.

---

## 2. Empty states (first use vs no results vs cleared)

### Takeaway
Distinguish three empty states and give each a status message, a short explanation, and one clear path forward: first-use → "add your first X" primary action; no results from filters/search → say which filters and offer "Clear filters"; cleared/done state → positive confirmation, no action needed. Build them with shadcn `Empty` (`EmptyHeader/EmptyMedia/EmptyTitle/EmptyDescription/EmptyContent`).

### Cited Findings
- NN/g's three guidelines for empty states in complex apps: communicate system status (briefly state no content is available; if a process is still running, show a progress indicator instead), increase learnability (teach, e.g., "Learn more" link), and provide direct pathways to key tasks (e.g., links to add data or to load demo data). — [NN/g, Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/)
- Polaris: the primary action should be a button or link; secondary actions for less important actions such as "Learn more"; content should be encouraging, "never make merchants feel unsuccessful or guilty", explain steps to activate, be action-oriented. An action is no longer required in current Polaris. — [Shopify Polaris, Empty state](https://polaris.shopify.com/components/structure/empty-state)
- shadcn/ui `Empty` component: `Empty` wrapper, `EmptyHeader`, `EmptyMedia` (`variant="default" | "icon"`), `EmptyTitle`, `EmptyDescription`, `EmptyContent` (buttons/inputs); styling examples: outline (border), background, avatar, avatar group, InputGroup (search inside empty state); RTL supported. — [shadcn/ui, Empty](https://ui.shadcn.com/docs/components/empty)

### Inferences
- **Never show an empty state while loading** (NN/g: while a process runs, show progress). Only render `Empty` when `isSuccess && data.length === 0`; if `isError`, show the error state instead of "No data".
- **Proposed copy (non-technical, Indian scrap context):**
  - First use — Deliveries: Title "No deliveries yet". Description "When scrap goes out to a buyer, record it here. Stock updates automatically." Primary: "Add delivery". Secondary: "How deliveries work" (popover/link).
  - First use — Suppliers/Companies: "No companies added yet" / "Add the buyers and suppliers you trade with. You'll pick them when making purchases and deliveries." / "Add company".
  - No results (filters): Title "No purchases match these filters". Description "Showing: Copper, 1-15 Aug 2026, Supplier: Sharma Metals." Actions: "Clear filters" (primary) and optionally "Change dates".
  - No results (search): "No results for 'bras'" / "Check the spelling or search by invoice number." / "Clear search".
  - Cleared/all-done (e.g., "materials needing purchase" list): "All materials are stocked" / "Nothing needs to be purchased right now." No button.
  - VIEWER role first-use: same explanation but no "Add" button (or explain "Ask the owner to add companies"), since VIEWER writes return 403.
- Keep table headers and the filter bar visible above a "no results" state so users can see and change what's filtering the data; use `Empty` inside the table body area (outline variant) rather than replacing the whole page.

### Gaps
- Atlassian, Carbon and GitHub Primer empty-state pages were not fetched within the tool budget; their specific guidance is not cited here. Report writer should treat Polaris + NN/g as the evidence base.

---

## 3. Errors (inline, summary, toast, full page, boundary; API error mapping; copy; retry; offline; session expiry)

### Takeaway
Put errors as close to their cause as possible: field errors inline (422), business conflicts (409) inline at the form top or next to the offending field with the numbers from `details`, permission (403) prevented up front by hiding/disabling actions, transient failures (network/429/500) as a persistent retryable message, and crashes via an error boundary. Copy must say what happened and how to fix it in plain language, with no codes — but show a copyable requestId for support on 500s.

### Cited Findings
- NN/g error-message guidelines (Neusesser & Sunwall, May 2023): display the error close to its source; use redundant indicators (bold, high-contrast red plus not relying on colour alone); reserve modal dialogs for severe errors, banners/toasts for less critical ones; don't show errors prematurely during exploratory input; use plain language, precise descriptions (not "An error occurred"), constructive advice, no blame; preserve user input; reduce correction effort by suggesting fixes. — [NN/g, Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)
- GOV.UK: say what has happened and how to fix it, in plain English with positive language; avoid technical jargon ("form post error", "unspecified error"), "forbidden", "illegal", "you forgot", "prohibited", "please", "sorry", "valid/invalid", and "oops"; use natural phrasing ("Enter your first name" rather than "First name must have an entry"); be specific rather than "This field is required"; match error wording to the field label; messages next to the field and in the error summary must be the same. — [GOV.UK Design System, Error message](https://design-system.service.gov.uk/components/error-message/)
- WCAG 2.2 SC 4.1.3 Status Messages (AA): status messages (including errors like "5 errors on page") must be programmatically determinable without receiving focus; `role="alert"` (ARIA19) for errors/warnings, `role="status"` (ARIA22) for success/results, `role="log"` (ARIA23) for sequential progress. Errors in a modal dialog that takes focus are a change of context and don't need `role="alert"`. — [W3C, Understanding SC 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- Primer: for errors, use banners for passive availability or dialogs for urgent interruption; toasts not recommended; assistive-tech announcements should always be triggered for failed user actions. — [GitHub Primer, Accessible notifications and messages](https://primer.style/accessibility/patterns/accessible-notifications-and-messages/)
- Carbon: don't use timed (auto-dismissing) notifications for critical messages; inline notifications persist until dismissed or resolved; omit the close button if reading/acting on it is critical. — [Carbon, Notification usage](https://carbondesignsystem.com/components/notification/usage/)

### Inferences
- **API error → UI mapping (proposal):**
  | Backend | UI treatment | Example copy (plain language) |
  |---|---|---|
  | 422 `VALIDATION_ERROR` with field paths | Map `details[].path` to `form.setError(path)`; red text under each field (`aria-invalid`, `aria-describedby`); if >1 error or the field is off-screen, an `Alert variant="destructive"` summary at form top listing errors as links, then focus the summary. Never a toast. | "Enter the weight in kg" / "Rate must be more than 0" / "Choose a supplier" |
  | 409 `INSUFFICIENT_SOURCE_STOCK` | Inline `Alert` at form top + error on the quantity field; use `details.available`/`maxAllowed`; offer a one-click fix | "Only 420 kg of Copper is in stock. You entered 500 kg. Reduce the quantity to 420 kg or less." Button: "Use 420 kg" |
  | 409 `DUPLICATE_VALUE` (invoice/PO no.) | Field-level error on that input; optional link to the existing record | "Invoice number INV-1042 is already used. Enter a different number or open the existing purchase." |
  | 409 `NEGATIVE_STOCK_HISTORY` (backdated edit) | Inline `Alert` (destructive) in the edit form, explaining the date and material; keep form input | "This change would make Brass stock go below zero on 12 Aug 2026. Change the quantity or date, or edit the later deliveries first." |
  | 403 `FORBIDDEN` | Prevent: hide or clearly disable write actions for VIEWER; if still received, inline `Alert` / toast.error | "You have view-only access. Ask the owner to change your role if you need to make changes." |
  | 404 | Full-page (route) state with a way back | "This purchase could not be found. It may have been moved or the link is wrong." Button: "Go to purchases" |
  | 401 (expired session) | Silent refresh; retry the original request; if refresh fails, open a re-login dialog over the form (not a redirect) so typed data is preserved; optionally stash form draft in sessionStorage | "Your session has ended. Log in again to save your work — your entries are kept." |
  | 429 | Non-blocking warning; auto-retry with backoff for GETs; keep form | "Too many requests in a short time. Wait a few seconds and try again." |
  | 500 | Inline/persistent error with Retry, plus small copyable "Reference: {requestId}" | "Something went wrong on our side and your delivery was not saved. Try again. If it keeps happening, share this reference with support: 7f3a-…" |
  | Network error / timeout (no response) | Keep form; inline error with Retry; global offline banner if `navigator.onLine` false | "No internet connection. Your entries are still here — try again when you're back online." |
  | Query (GET) failure on a page/section | In-place error state in the section (not a toast) with "Try again" calling `refetch()` | "Couldn't load stock summary. Check your connection and try again." |
  | Render crash | React error boundary per route (and around dashboard widgets) with Reload + requestId if known | "This page stopped working. Reload the page. Your saved records are safe." |
- Use the backend `error.message` only if it's already user-grade; otherwise map by `code` to a client copy dictionary (supports future Hindi/regional localisation). Never show raw codes like `INSUFFICIENT_SOURCE_STOCK` to users; the requestId is the only technical token shown, labelled "Reference".
- **Retry:** TanStack Query retries failed queries (default 3 with exponential backoff) — keep for GETs but set `retry` to skip 4xx (403/404/409/422) so users see errors fast; never auto-retry mutations that create records unless idempotent.
- **Offline banner:** a persistent top `Alert` (warning) when offline: "You're offline. Changes can't be saved until the connection is back." Auto-hide when `online` fires, and show a brief `role="status"` "Back online". TanStack's `onlineManager` pauses queries/mutations offline by default (`networkMode: 'online'`) — so show "Waiting for connection…" on paused mutations rather than an infinite spinner.
- Announce errors: form summary gets focus (so no `role="alert"` needed) or uses `role="alert"`; field errors are linked via `aria-describedby`.

### Gaps
- TanStack Query `networkMode`/`onlineManager` and default retry counts are from domain knowledge; the docs pages were not fetched in this session — verify against [TanStack Query network mode docs](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode).
- No sourced evidence found on best practice for re-auth dialogs preserving form state; recommendation is inferred from NN/g's "preserve input" guideline.

---

## 4. Success feedback (toast vs inline vs redirect; actions; duration/placement/stacking; accessibility)

### Takeaway
For routine saves, a short toast (`role="status"`) plus a visible result (the new row in the list, or the detail page) is fine; toasts must never be the only place critical or actionable information lives. Toasts with actions should not auto-dismiss (Carbon), and GitHub Primer now recommends against toasts altogether — so keep toasts brief, non-critical, and duplicate important outcomes in the page.

### Cited Findings
- Primer: "Toasts pose significant accessibility concerns and are not recommended for use." Issues: WCAG 2.2.1 Timing Adjustable (auto-dismiss), 1.3.2 Meaningful Sequence (DOM placement disconnected from trigger), 2.1.1 Keyboard (interactive toasts), 4.1.3 Status Messages; usability: info loss for distracted users, off-field-of-view on large screens, obscuring content/buttons, magnification users miss them. Alternatives: for simple successful actions, no secondary reinforcement needed (success should be self-evident); for complex actions, banners or progressive disclosure; for long-running tasks, banners plus other notifications. — [GitHub Primer, Accessible notifications and messages](https://primer.style/accessibility/patterns/accessible-notifications-and-messages/)
- Carbon: toasts are non-modal, time-based, can be coded to auto-dismiss after 5 s, with an optional close button; if a toast includes an action button it should remain on screen until the user dismisses it; only one action per notification; don't use timed notifications for critical messages. — [Carbon, Notification usage](https://carbondesignsystem.com/components/notification/usage/)
- Sonner defaults: `position: "bottom-right"`, duration 4000 ms, `visibleToasts: 3`, `expand: false` (expand on hover), `richColors: false`, `closeButton: false`, hotkey Alt+T to focus the toaster, `offset` 32 px, `mobileOffset` 16 px (<600 px). — [Sonner, Toaster API](https://sonner.emilkowal.ski/toaster)
- Toasts should be implemented as status messages in `role="status"` (or `role="log"`), must never take focus, and interactive controls (e.g., Undo) are often unreachable by keyboard before auto-dismiss. — [Scott O'Hara, A toast to an accessible toast](https://www.scottohara.me/blog/2019/07/08/a-toast-to-a11y-toasts.html); [Sheri Byrne-Haber, Designing Toast Messages for Accessibility](https://sheribyrnehaber.medium.com/designing-toast-messages-for-accessibility-fb610ac364be) (secondary/opinion sources surfaced via search; content summarized from search snippets)
- WCAG 4.1.3: "Your form was successfully submitted" is a canonical status message → `role="status"`. — [W3C, Understanding SC 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- **shadcn toast landscape (2026):** shadcn added a new **Toast component built on Base UI primitives** in July 2026 (actions, status types success/info/warning/error/loading, `toast.promise`, stacking, swipe dismissal; API `toast.add({ title, description, type, actionProps })`, `toast.close(id)`), installed via `shadcn add toast`. In the Base UI docs tree, the old "sonner" URL now serves this Toast page. — [shadcn/ui changelog, July 2026 – Toast](https://ui.shadcn.com/docs/changelog/2026-07-toast); [shadcn/ui Toast (Base UI)](https://ui.shadcn.com/docs/components/base/sonner). Sonner remains documented for the Radix variant — [shadcn/ui Sonner (Radix)](https://ui.shadcn.com/docs/components/radix/sonner). The changelog does not say Sonner is deprecated.

### Inferences
- **Decision for this app:**
  - Create record from a dedicated page (e.g., New Delivery) → redirect to the detail page (or back to the list with the new row highlighted) + toast "Delivery saved" with action "Add another". Because the page itself shows the result, the toast is reinforcement, not the only signal (satisfies Primer's "self-evident" principle).
  - Create from a dialog/sheet on a list → close dialog, new row appears/highlighted at top, toast "Company added".
  - Edit inline/in a sheet → toast "Changes saved" (or inline "Saved" text next to the Save button for long forms).
  - Stock-affecting save → toast plus visible updated stock figure; for backdated edits, a toast like "Purchase updated. Stock from 12 Aug onward was recalculated." with action "View stock ledger".
  - Long-running (report export, import) → persistent inline/banner progress, then a banner with "Download" — not a timed toast.
- **Toast configuration (proposal):** position `bottom-center` on mobile / `bottom-right` on desktop (keeps away from top app bar and doesn't cover the primary "Save" button that is typically top-right in headers; verify against layout); `visibleToasts: 3`; success duration ~4-5 s; toasts with an action: `duration: Infinity` or ≥10 s plus `closeButton` (per Carbon); error toasts: persistent until dismissed (but prefer inline errors — see §3); `richColors` on for quick recognition, always with an icon so colour isn't the only cue.
- **Toast copy (proposals):** "Delivery saved" — actions "View" / "Add another". "Purchase PO-1042 created". "Company deactivated" — action "Undo" (only if backend supports reactivation; it does via edit). Keep ≤ ~60 characters, noun + past-tense verb, no "Successfully".
- **Decide Sonner vs new Base UI Toast:** since the app is shadcn-on-Base-UI and uses Sonner today, either works; the new Base UI Toast matches the rest of the component stack. Whichever is used, wrap it in a single `notify.success/error/info` helper so the choice is swappable.

### Gaps
- NN/g's article on toasts/"indicators, validations and notifications" was not fetched; no NN/g-specific toast duration numbers cited.
- Whether the shadcn Base UI Toast sets `role="status"`/`aria-live` by default was not verified; Base UI Toast docs not fetched.
- The Medium article "GitHub Just Killed Toast Messages" surfaced in search is an aggregator; the primary source (Primer page) is cited instead.

---

## 5. Confirmation (confirm vs undo, fatigue, which actions, dialog design)

### Takeaway
Confirm only actions with serious, hard-to-reverse consequences, and make the dialog specific: name the record, state the consequence, and use verb-labelled buttons ("Cancel PO" / "Keep PO"). Prefer undo for reversible actions to avoid confirmation fatigue. Use shadcn `AlertDialog` for confirmations.

### Cited Findings
- Use confirmation dialogs "before committing to actions with serious consequences — such as destroying users' work or costing large amounts of money"; avoid for routine operations — "if you cry wolf too many times, people will stop paying attention." (Jakob Nielsen, Feb 2018; last reviewed Aug 2026.) — [NN/g, Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/)
- Don't ask "Are you sure you want to do this?"; explain what this is in user-centric terms; use buttons that "summarize what will happen", e.g., "Delete file" / "Keep file"; show the specific object (e.g., filename). Offer undo wherever possible (user control and freedom). — [NN/g, Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/)
- Error dialogs that take focus are a change of context (no `role="alert"` needed). — [W3C, Understanding SC 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

### Inferences
- **Action classification for this app (no delete endpoints):**
  | Action | Treatment | Why |
  |---|---|---|
  | Cancel a PO | `AlertDialog` confirm | Business commitment; likely irreversible or hard to reverse |
  | Deactivate company / material / user | `AlertDialog` confirm **or** immediate + Undo toast. Recommend confirm, since deactivation hides it from pickers for all staff | Affects other users' workflows |
  | Edit a past (backdated) purchase/delivery that changes stock | Confirm step showing the impact (e.g., "Stock for Copper from 12 Aug onward will change by −80 kg"); server still enforces `NEGATIVE_STOCK_HISTORY` | Retroactive stock/money impact |
  | Reactivate | No confirm; toast | Reversible, low risk |
  | Normal create/edit of current records | No confirm | Routine; confirmation would cause fatigue |
  | Leaving a form with unsaved changes | Confirm ("Discard changes?") | Destroys user's work |
- **Dialog copy (proposals):**
  - Cancel PO — Title: "Cancel PO-1042?" Body: "The supplier order for 2,000 kg Aluminium from Sharma Metals will be marked Cancelled. You won't be able to receive stock against it." Buttons: "Cancel PO" (destructive) / "Keep PO". (Avoid the ambiguous "Cancel" as the dismiss label; use "Keep PO" or "Go back".)
  - Deactivate company — "Deactivate Sharma Metals?" / "It will no longer appear when you create purchases or deliveries. Past records stay unchanged. You can reactivate it later from Companies." / "Deactivate" / "Keep active".
  - Backdated edit — "Update this purchase from 12 Aug 2026?" / "This changes Copper stock from 12 Aug onward. Current stock will go from 1,240 kg to 1,160 kg." / "Save changes" / "Go back".
  - Unsaved changes — "Leave without saving?" / "Your changes to this delivery will be lost." / "Leave" / "Stay on page".
- Use `AlertDialog` (not `Dialog`) so it requires an explicit choice; destructive button uses `variant="destructive"`; initial focus on the safe option for irreversible actions; keep the confirm button in loading state while the mutation runs and show 409 errors inside the dialog rather than closing it.

### Gaps
- shadcn `AlertDialog` Base UI docs were not fetched; focus-management defaults unverified.

---

## 6. Alerts and banners (persistent in-page, severity, dismissibility)

### Takeaway
Use persistent inline alerts (shadcn `Alert`) for conditions that stay true until resolved ("This PO is cancelled", "3 materials need purchase", "You're offline"); they should not auto-dismiss, and critical ones should not be dismissible at all.

### Cited Findings
- Carbon: inline notifications do not dismiss automatically; they persist until dismissed or the user resolves the issue; the close button is optional and should be omitted if it is critical for the user to read/act on the notification; actionable notifications allow only one action, usually linking to where the issue can be resolved. — [Carbon, Notification usage](https://carbondesignsystem.com/components/notification/usage/)
- Primer recommends banners for persistent success/failure feedback and InlineMessage for contextual messages near related content. — [GitHub Primer, Accessible notifications and messages](https://primer.style/accessibility/patterns/accessible-notifications-and-messages/)
- NN/g: use redundant indicators, not colour alone. — [NN/g, Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)

### Inferences
- **Severity scale (proposal, 4 levels, icon + colour + word):** Info (blue, `Info` icon), Success (green, `CircleCheck`), Warning (amber, `TriangleAlert`), Error/Critical (red, `CircleX`). shadcn `Alert` ships `default` and `destructive` variants; add `warning`, `success`, `info` variants as Tailwind v4 tokens in the theme.
- **Examples:**
  - PO detail: non-dismissible warning/neutral banner — "This PO was cancelled on 14 Aug 2026 by Ramesh. It can't be received or edited."
  - Dashboard: info/warning alert — "3 materials are below minimum stock: Copper, Brass, Lead." Action: "View materials". Dismissible per session only (re-appears if still true).
  - Deactivated company page: "Sharma Metals is inactive. It won't appear in new purchases." Action: "Reactivate" (owner only).
  - VIEWER role: subtle info banner once — "You have view-only access."
- Rule: dismissible only if informational and non-critical; persist dismissal in localStorage keyed by condition; warnings about current data state are never dismissible (they disappear when resolved).
- Page-level alerts rendered on load don't need `role="alert"` (they're part of initial content); alerts inserted dynamically after an action should use `role="alert"` (errors) or `role="status"` (info).

### Gaps
- No source fetched on specific colour contrast values for alert variants; follow WCAG 1.4.3/1.4.11 contrast checks when defining tokens.

---

## 7. Tooltips and help (tooltip vs visible help, disabled buttons, info popovers)

### Takeaway
Don't hide essential information in tooltips — critical help should be visible text; tooltips suit labels for icon-only buttons and short supplementary hints on desktop. Tooltips on natively disabled buttons don't work (no focus/pointer events); use `aria-disabled` plus visible reason text, or keep the button enabled and explain on click. Use a click/tap `Popover` ("i" info button) for definitions like "supplier stock", because hover doesn't exist on phones.

### Cited Findings
- The native `disabled` attribute removes the button from tab order and disables pointer events, so tooltips on it don't fire; `aria-disabled="true"` keeps it focusable and announced as disabled but requires manually preventing the action and styling it. Wrapping a disabled button in a focusable span is an anti-pattern (dummy tab stop). — [CSS-Tricks, Making Disabled Buttons More Inclusive](https://css-tricks.com/making-disabled-buttons-more-inclusive/); [MDN, aria-disabled](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled); [Smart Interface Design Patterns, Disabled Buttons UX](https://smart-interface-design-patterns.com/articles/disabled-buttons/) (content summarized from search results; pages not fully fetched)
- NN/g: "educate concisely" — brief messages with links to supplementary details. — [NN/g, Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)

### Inferences
- **Rules for this app:**
  - Icon-only buttons (edit pencil, refresh, filter) → `Tooltip` with the action name + `aria-label`.
  - Field help that users need to fill the form correctly (e.g., "Weight in kg, after deducting bag/tare") → visible helper text under the field (`FormDescription`), not a tooltip.
  - Domain terms ("Supplier stock", "Net weight", "Backdated") → small info icon button opening a `Popover` (works on tap and keyboard): "Supplier stock: scrap that a supplier is holding for you but hasn't delivered yet." (definition text is a placeholder — confirm with the business spec).
  - Disabled actions: prefer not disabling. E.g., if a PO is cancelled, hide "Receive" and show the banner explaining why. If a button must appear unavailable (VIEWER role, form incomplete), use `aria-disabled` + visible reason ("View-only access") or let it be clicked and show the validation errors (common guidance for Submit buttons).
  - Tooltip content must be short text, no links or buttons inside (use Popover for interactive content).

### Gaps
- NN/g's "Tooltip Guidelines" article was not fetched; specific NN/g tooltip rules are not cited.
- Base UI Tooltip behaviour on touch devices not verified.

---

## 8. Status communication (badges, "last updated", real-time vs manual refresh)

### Takeaway
Show record status with text badges (colour + label, never colour alone), show data freshness with a relative "Updated x min ago" derived from TanStack Query's `dataUpdatedAt`, and rely on refetch-on-focus plus a manual Refresh button rather than real-time sockets for this app.

### Cited Findings
- `dataUpdatedAt` is available on queries (it resets to 0 when showing placeholder data in v5 — so read freshness from the real query, not placeholder state). — [TanStack Query, Migrating to v5](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)
- Use redundant indicators, not colour alone. — [NN/g, Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)
- Status messages like "5 results returned" should be exposed via `role="status"`. — [W3C, Understanding SC 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

### Inferences
- **PO status badges (proposal, shadcn `Badge`):** Draft (outline/grey), Open/Ordered (blue), Partially received (amber, with "1,200 / 2,000 kg"), Received/Completed (green), Cancelled (red/muted with strike icon). Always text label; optional icon. Same mapping everywhere (list, detail, dashboard).
- Record active state: "Active" (green) / "Inactive" (grey) badge on companies/materials.
- **Freshness:** "Updated 2 min ago" next to page title, with a Refresh icon button (tooltip "Refresh"); spin the icon while `isFetching`; on refetch failure keep old data and show "Couldn't refresh — showing data from 10:42 AM" (warning, inline).
- **Real-time vs manual:** For a small-business inventory app on weak mobile data, polling/websockets add cost; TanStack's default refetch-on-window-focus/reconnect plus invalidation after mutations gives near-real-time for the acting user. Consider `refetchInterval` (e.g., 60 s) only on the dashboard stock summary. Multi-user conflicts are caught server-side (409).
- Result counts after filtering ("Showing 24 purchases") in a `role="status"` region so screen reader users hear filter results.
- Use Indian number formatting (en-IN: 1,20,000) and DD MMM YYYY dates in all status text/badges for this audience.

### Gaps
- No external source consulted on real-time vs polling trade-offs for business dashboards; recommendation is inferred.
- Fluent 2 and Material 3 guidance on badges/snackbars was not fetched within the tool budget.
