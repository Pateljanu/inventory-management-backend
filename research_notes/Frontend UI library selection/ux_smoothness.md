# UX Principles, Indian SMB Context and "Smoothness" in React (for Metal Scrap Management System)

Scope: usability guidance for data-entry-heavy business apps used by non-technical Indian scrap-yard owners, accountants and yard staff (desktop in office; phone/tablet outdoors on weak data), plus the 2026 React techniques that make a UI feel "smooth". Research date: 2026-09-27. Around 20 tool calls. Items marked "(training knowledge, not re-verified this session)" should be treated as lower-confidence.

---

## 1. Usability principles for data-entry forms and low-tech-literacy users

### Takeaway
Use plain-language, specific error messages shown next to the field and in a summary at the top. Never clear what the user typed. Show limits *before* submit (for this app, the live "PO remaining / stock / supplier stock / max allowed" panel is the main error-prevention device). Default to sensible values (today's date, the last-used supplier/material), and give controls large touch targets. For outdoor use, content contrast matters more than any other visual lever.

### Cited Findings
- GOV.UK Design System: show each error message in two places, **next to the field and in an Error summary at the top of the page**. Both must "look, sound and mean the same" and "make sense out of context". — [GOV.UK Error message](https://design-system.service.gov.uk/components/error-message/)
- GOV.UK: be specific rather than generic ("An error occurred" / "This field is required" are discouraged). Different error types (empty, too long, wrong format) each get their own message. Avoid jargon, negative framing ("forbidden", "you forgot") and filler words ("please", "sorry", "valid/invalid"). Reuse the wording of the field label in the message. — [GOV.UK Error message](https://design-system.service.gov.uk/components/error-message/)
- GOV.UK: **do not clear form fields** when showing errors. Keep what the user entered so they can correct it. Put the error text in red after the label and hint, with a red border tying it to the field, and give it a visually hidden "Error:" prefix for screen readers that can be translated. — [GOV.UK Error message](https://design-system.service.gov.uk/components/error-message/)
- WCAG 2.2 SC 2.5.8 (AA): interactive targets must be at least **24×24 CSS px**, or be spaced so that a 24px circle centred on each target does not overlap its neighbours. Practitioners recommend 44px as "even better". — [AllAccessible 2.5.8 guide](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide); [wcag22aa.org](https://wcag22aa.org/new-criteria/target-size/)
- Outdoor readability: sunlight washout is mainly a problem of reflection, not screen brightness. The contrast of the content itself matters more than compensating for glare, and decluttering to the essential information helps. (Industry/blog sources, so treat as sentiment.) — [Medium: Industrial UX, sunlight susceptible screens](https://medium.com/@callumjcoe/industrial-ux-sunlight-susceptible-screens-2e52b1d9706b); [LinkedIn advice: design for bright sunlight](https://www.linkedin.com/advice/3/how-can-you-design-mobile-app-user-t85ue)

### Inferences
- **Delivery form**: render the four limits ("PO remaining / Stock / Supplier stock / Max allowed") as a sticky, always-visible panel that updates as the user picks a PO and supplier. Pre-fill the tons field's max from `min(PO remaining, supplier stock)`. If the value goes over, show a specific inline message right away ("Tons cannot be more than 12.500 t — only 12.500 t left on this PO") rather than waiting for submit. This follows the GOV.UK wording rules and turns error correction into error prevention.
- **Validation timing**: GOV.UK's error-message page does not say when to validate. A reasonable hybrid for this app is to validate format on blur, validate limit breaches live (they are numeric and cheap to check), and run a full check with an error summary on submit. Do not disable the Save button with no explanation, because low-literacy users cannot tell why it won't work (training knowledge, not re-verified this session: GOV.UK advises against disabled buttons).
- **Defaults**: date = today (DD/MM/YYYY). Material and supplier = last used. Rate = that supplier's last rate for the material, shown as editable. Vehicle number gets an uppercase mask for Indian plates, e.g. `GJ 05 AB 1234`.
- **Single-column layout** on mobile. On desktop, use two columns only for tightly related pairs (tons + rate → amount computed live). Use large numeric inputs (`inputmode="decimal"`) so phones show the number pad.
- **Icons**: always pair an icon with a text label, because low-literacy users recognise words or pictures unevenly. Use 44–48px targets on yard devices, above the 24px WCAG AA minimum.
- **Sunlight mode**: dark text on a white or near-white background, no light-grey secondary text for key numbers, and bold weights for stock and tons figures. Consider a "high-contrast/outdoor" toggle.
- **Confirmations**: use a review step or confirm dialog only for irreversible or high-value actions (delete, cancel PO). For routine saves, use a non-blocking success toast with "Undo" where the backend allows it.

### Gaps
- I did not fetch NN/g or Baymard articles specifically on inline validation, input masks or single-column forms this session. Those recommendations are well established (training knowledge) but not cited here.
- Material 3 and Fluent touch-target figures (48dp / 44pt) were not re-verified this session.
- I found no rigorous source quantifying outdoor contrast requirements beyond WCAG. The sunlight sources are industry blogs.

---

## 2. ERP list-screen patterns (filters, search, date presets, empty states, cards vs tables)

### Takeaway
Use tables with sticky headers on desktop. On mobile, use cards or a reduced set of columns that users can choose. Empty states should say what the list is for and give one clear action. Keep filters and date presets visible and persistent.

### Cited Findings
- NN/g: for tables longer than one screen, **sticky column headers** stop users losing context. Locking headers and letting users pick a subset of data make large tables usable on mobile. Rich headers suitable for desktop should be reduced on mobile. — [NN/g Mobile Tables](https://www.nngroup.com/articles/mobile-tables/); [NN/g Data Tables: Four Major User Tasks](https://www.nngroup.com/articles/data-tables/)
- NN/g discusses the functional advantages of tables over cards/dashboards for multivariate data, especially for comparison tasks. — [NN/g Data Tables](https://www.nngroup.com/articles/data-tables/)
- Shopify Polaris empty state: use it when a list, table or chart has no data, as "an opportunity to provide explanation or guidance". Be action-oriented, be conversational, and use clear, predictable buttons. The component is for whole empty pages, not small areas. — [Polaris Empty state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state?example=empty-state-with-full-width-layout); [Polaris Index table](https://polaris-react.shopify.com/components/tables/index-table?example=index-table-with-empty-state)

### Inferences
- **Purchases / Sales POs / Deliveries lists**:
  - Desktop: dense table with sticky header, right-aligned numeric columns (tons, rate, ₹ amount), and a totals row.
  - Mobile: a card per row showing the 3–4 most important fields (supplier, material, tons, ₹ amount, date), with tap to open details.
- **Date presets** as one-tap chips: Today, Yesterday, This week, This month, Last month, This FY (Apr–Mar, the Indian financial year), Custom. Remember the last chosen preset per screen (URL query params + localStorage).
- **Search**: one box that matches supplier/customer name, vehicle number, invoice number and PO number. Filters for material and supplier should be dropdowns with type-ahead.
- **Empty states**: separate "no data yet" (e.g. "No purchases recorded yet. [+ Record purchase]") from "no results for these filters" (e.g. "No purchases match. [Clear filters]").
- Filter changes should keep the old rows on screen, slightly dimmed, until new rows arrive. Do not blank the table (see §4, `placeholderData`).

### Gaps
- Baymard's filtering research is e-commerce-oriented and was not fetched. I found no authoritative ERP-specific study on saved date presets.

---

## 3. Indian SMB context (Tally, Vyapar, Khatabook, Zoho; formats; language)

### Takeaway
Indian SMB users are split in two. Accountants have Tally keyboard muscle memory (function-key vouchers, Enter-to-advance). Owners and staff are used to simple, mobile-first, vernacular apps like Vyapar and Khatabook. The app should support both: keyboard-driven entry on desktop and big, simple mobile screens. It should use Indian formats everywhere (₹, lakh/crore grouping, DD/MM/YYYY, April–March FY) and be designed so a Hindi/Gujarati translation can be added later.

### Cited Findings
- TallyPrime is still India's most widely used accounting software, strong on compliance, inventory and reporting. Vyapar was created because tools like Tally "were powerful but too complex for non-accountants". — [AI Accountant: best accounting software India 2026](https://www.aiaccountant.com/blog/best-accounting-software-for-small-businesses-in-india); [Vyapar history (businessmodelcanvastemplate)](https://businessmodelcanvastemplate.com/blogs/brief-history/vyapar-app-brief-history)
- Vyapar is mobile-first, aimed at very small businesses and first-time software users, and keeps billing working when the internet drops. Its growth is attributed to product focus and **local-language UX**. — [Accountune: Tally alternatives 2026](https://accountune.com/best-tally-alternative-india); [Vyapar history](https://businessmodelcanvastemplate.com/blogs/brief-history/vyapar-app-brief-history)
- Khatabook supports **11 languages**, including English, Hindi, Hinglish (Hindi+English), Gujarati, Tamil, Marathi, Telugu, Malayalam and Bangla. It explicitly targets owners who "may not be educated". — [Khatabook blog: features](https://khatabook.com/blog/khatabook-app-features/); [Google Play listing](https://play.google.com/store/apps/details?id=com.vaibhavkalpe.android.khatabook&hl=en_US)
- Tally users rely on hotkeys: F2 (change date), F5 Payment, F6 Receipt, F8 Sales, **F9 Purchase**, Ctrl+A (save), Alt+G (Go To search), Alt+C (calculator in the amount field), Ctrl+R (reuse previous narration). The claims that shortcuts cut entry time "up to 60%" or "30–50%" come from blogs and should be treated as sentiment, not measured data. — [Suvit: 40 TallyPrime tips](https://www.suvit.io/post/40-tips-for-tally); [AI Accountant: Tally shortcut cheat sheet 2026](https://www.aiaccountant.com/blog/all-tally-prime-shortcut-keys-list)
- `Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'}).format(1234567.89)` → `₹12,34,567.89`, i.e. Indian 3-then-2 grouping (1,00,000 = 1 lakh; 1,00,00,000 = 1 crore). Compact notation and grouping options are available. — [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat); [codes.jarhalab INR guide](https://codes.jarhalab.com/guides/how-to-format-inr-with-indian-numbering-system)

### Inferences
- **Desktop keyboard flow, Tally-style**:
  - Enter moves to the next field. Ctrl+S / Ctrl+A saves.
  - Global shortcuts mirroring Tally: F9 = new Purchase, F8 = new Sale PO, plus one for Delivery. Show them as small key hints on the buttons (e.g. "Purchase F9").
  - An Alt+G / Ctrl+K "Go to" command palette.
  - Autocomplete comboboxes that accept typing plus Enter.
  - Caveat: F-keys can clash with browser defaults (e.g. F5 reloads), so do not rebind F5 or F11/F12.
- **Formats**: one shared `formatINR` and `formatTons` utility.
  - Dashboard tiles can use compact lakh/crore ("₹12.3 L", "₹1.2 Cr"). Tables should show full `en-IN` figures. Tons should have 3 decimals with a "t" suffix.
  - Dates are DD/MM/YYYY. Date pickers must display DD/MM/YYYY even though HTML `type=date` follows the browser locale, so a custom or controlled date input is safer.
  - FY is April–March for reports and presets.
- **Language**: ship English first, but externalise every string (react-i18next or similar) from day one so Hindi or Gujarati can be added. Use simple English words the trade already uses (e.g. "Maal" is not needed, but prefer "Stock", "Rate", "Party" / "Supplier").
- **GST**: if invoices are recorded, show taxable value, GST % and GST amount separately, and total in ₹. Users coming from Vyapar and Tally expect this breakdown.
- **Weak data**: Vyapar's offline billing is a selling point. The app should at least survive flaky connections: cache the last data, retry mutations, and never lose a half-filled form (persist the draft to localStorage).

### Gaps
- I found no primary usability studies (academic or NN/g) on Indian SMB users' software preferences. The evidence is vendor comparison pages and blogs.
- No reliable statistic was found on what share of Indian SMB owners prefer English versus Hindi/regional UI.
- Zoho Books' UX patterns were not researched this session.
- The Tally productivity percentages come from unsourced blogs.

---

## 4. "Smoothness": perceived performance and animation tooling in React (2026)

### Takeaway
Most of the perceived smoothness in a CRUD/ERP app comes from data handling, not animation:
- keep the previous data on screen while loading the next,
- update optimistically on save,
- show skeletons only for full-page loads longer than about 2 s,
- reserve space so nothing jumps.

For animation, keep durations short (roughly 150–300 ms for most UI), respect reduced-motion, and use CSS/tw-animate-css plus, where needed, React 19.3's now-stable `<ViewTransition>` or Motion with `LazyMotion`.

### Cited Findings
**Loading states**
- NN/g (article published June 2023, reviewed 2 Sep 2026):
  - Under about 2 s: **no indicator needed**.
  - 2–10 s: skeleton for a full-page load, spinner for a single module.
  - Over 10 s: a progress bar is strongly recommended.
  - Frame-only skeletons (header/footer only) confuse users. Animated skeletons can be distracting or cause accessibility problems, so keep any motion subtle.
  - Do not use skeletons for uploads or downloads.
  — [NN/g Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/); [NN/g video](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/)

**Keeping previous data and optimistic updates**
- TanStack Query v5 removed `keepPreviousData`/`isPreviousData`. Instead use `placeholderData: keepPreviousData` (or `prev => prev`) so the last successful data stays visible while a new query key (page or filter) loads, flagged by `isPlaceholderData`. v5 also added a simpler optimistic-update pattern that uses the mutation's `variables` instead of manual cache writes. — [TanStack Query v5 migration](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5); [Paginated/lagged queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries); [Announcing v5](https://tanstack.com/blog/announcing-tanstack-query-v5)

**Animation durations**
- NN/g: most UI animations should last **100–500 ms**, depending on complexity and distance travelled. Pick "the shortest time that an animation can take without being jarring". Material's toggle uses about 100 ms feedback. — [NN/g Animation Duration](https://www.nngroup.com/articles/animation-duration/)
- Practitioner breakdown (blog, treat as sentiment): 100–150 ms for hover/instant feedback, 200–300 ms for most transitions, 300–500 ms for modals and panels. — [MagicLogix microinteraction rules](https://www.magiclogix.com/theories/microinteractions-in-ux/)

**React `<ViewTransition>`**
- **React 19.3 was released 9 Sep 2026 and made `<ViewTransition>` stable.** It animates enter/exit/update/share, but **only for updates wrapped in `startTransition`** (urgent updates are not animated). `addTransitionType` lets the same component animate differently depending on the cause. Suspense guidance: fallbacks should appear immediately *without* animation, and the swap to final content animates. It works in the DOM only. 19.3 fixed a Mobile Safari crash. Fragment refs are also stable. — [React 19.3 blog](https://react.dev/blog/2026/09/09/react-19-3); [DevX summary](https://www.devx.com/coding/19-3-view-transitions-fragment-refs/)
- Browser support: same-document View Transitions became **Baseline Newly Available on 14 Oct 2025** when Firefox 144 shipped (Chrome/Edge 111+, Safari 18+, Samsung Internet 23+). Firefox's first implementation lacked view-transition *types*. — [web.dev Baseline post](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available); [caniuse](https://caniuse.com/view-transitions)

**Motion (formerly Framer Motion)**
- The full declarative `motion` component cannot be tree-shaken below about **34 kb**. Using `m` + `LazyMotion` brings initial render to about **4.6 kb**; `domAnimation` adds about 15 kb (animations, variants, exit, tap/hover/focus) and `domMax` about 25 kb (adds drag and layout animations). `useAnimate` mini is about 2.3 kb, and single hooks like `useReducedMotion` are about 1 kb. LogRocket's 2026 comparison puts Motion at about 32 KB gzipped. — [Motion: reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size); [LogRocket 2026 comparison](https://blog.logrocket.com/best-react-animation-libraries/)

**tw-animate-css**
- `tw-animate-css` is the Tailwind v4, pure-CSS replacement for the JS plugin `tailwindcss-animate`. **shadcn/ui deprecated tailwindcss-animate in favour of tw-animate-css.** It ships accordion-down/up and caret-blink plus enter/exit utilities. — [tw-animate-css GitHub](https://github.com/wombosvideo/tw-animate-css); [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4)

### Inferences
**Priority order for "smooth" in this app** (highest impact first):
1. TanStack Query caching with `staleTime` of about 30–60 s for masters (suppliers, materials, customers) and `placeholderData: keepPreviousData` on every filtered or paged list.
2. Prefetch on hover/focus of nav links and list rows (`queryClient.prefetchQuery`), and prefetch dashboard data right after login.
3. Optimistic insert of a new purchase or delivery row, with rollback on error and a toast.
4. Skeleton only on the first full-page load. Use no indicator for loads under 2 s and a subtle inline spinner on the Save button while posting.
5. Reserve fixed heights for dashboard tiles, charts and the live-limits panel to avoid layout shift (CLS).
6. Tabular (`font-variant-numeric: tabular-nums`) figures so live-updating numbers don't jitter.

**Animation stack**:
- tw-animate-css (free if using shadcn) for dialogs, sheets and toasts.
- React 19.3 `<ViewTransition>` for route and list transitions, since it has zero bundle cost and is Baseline in all major browsers.
- Motion only if a specific interaction needs gestures or layout animation, loaded via `LazyMotion` + `domAnimation`.
- For a data-entry app, animation should be minimal: 150–200 ms fades/slides, never delaying input.

**Reduced motion**: honour `prefers-reduced-motion`. Motion offers `useReducedMotion` and `MotionConfig reducedMotion="user"` (training knowledge, not re-verified). CSS/ViewTransition animations need an explicit `@media (prefers-reduced-motion: reduce)` override. The React 19.3 post does not mention reduced motion.

**Weak mobile data**: bundle size matters more than animation polish. Code-split routes, keep the initial JS small, and avoid a 34 kb full Motion import.

### Gaps
- **AutoAnimate**: current version, bundle size and maintenance status were not researched this session.
- **"Which UI library feels smoothest out of the box"**: not researched here (probably covered by the parallel UI-library research). No reliable comparative source was found.
- The Motion major version (v12 vs later) was not confirmed from a primary changelog this session. Only the bundle-size docs were checked.
- No 2025–2026 NN/g data on optimistic UI was found.

---

## 5. Accessibility basics (WCAG 2.2 AA) for this audience

### Takeaway
The WCAG 2.2 AA items that matter most here:
- target size (24px minimum; aim for 44–48px on yard devices),
- contrast (which also helps in sunlight),
- errors identified in text with suggestions (the GOV.UK pattern),
- visible focus for keyboard-driven accountants,
- respecting reduced motion.

### Cited Findings
- SC 2.5.8 Target Size (Minimum), Level AA and new in WCAG 2.2: 24×24 CSS px or the spacing alternative. CSS pixels are used, so high-DPI screens do not change the requirement. — [AllAccessible](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide); [HK Digital Policy Office handbook](https://www.digitalpolicy.gov.hk/en/our_work/digital_government/digital_inclusion/accessibility/promulgating_resources/handbook/wcag2aa/9_17_target_size_min.html)
- Error messages with a screen-reader "Error:" prefix, kept input, and specific wording. — [GOV.UK Error message](https://design-system.service.gov.uk/components/error-message/)
- NN/g notes that animated skeletons can create accessibility problems. — [NN/g Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)

### Inferences
- Other WCAG 2.2 AA criteria relevant here (training knowledge, not re-verified this session):
  - 1.4.3 text contrast 4.5:1 (3:1 for large text); treat 7:1 as the outdoor target for key numbers.
  - 1.4.11 non-text contrast 3:1 for input borders and focus rings.
  - 2.4.7 / 2.4.11 visible focus that is not obscured by sticky headers or footers. This is relevant because the sticky limits panel and sticky table headers could hide the focused field.
  - 3.3.1 / 3.3.3 error identification and suggestion.
  - 3.3.7 Redundant Entry: don't make users re-enter the supplier or vehicle already chosen in the same flow.
  - 3.3.8 Accessible Authentication: allow password managers and paste on login.
  - 1.4.4 / 1.4.10 zoom and reflow to 320px.
- Colour must not be the only signal (e.g. over-limit red), so pair it with an icon and text.

### Gaps
- I did not fetch the W3C WCAG 2.2 spec pages for criteria other than 2.5.8.

---

## 6. Admin/inventory UIs to emulate

### Takeaway
Polaris is the most directly transferable public guideline set for a merchant-facing admin: index tables, empty states and plain-language copy for non-expert business owners. Linear and Stripe are useful references for clarity, speed and keyboard-first navigation, but I found no primary sources this session explaining their design rationale.

### Cited Findings
- Polaris' empty-state guidance addresses "merchants", i.e. non-technical small-business owners, a close analogue to scrap-yard owners. It is action-oriented, conversational and uses predictable buttons. The Index table component has built-in empty-state examples. — [Polaris Empty state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state?example=empty-state-with-full-width-layout); [Polaris Index table](https://polaris-react.shopify.com/components/tables/index-table?example=index-table-with-empty-state)
- Vyapar and Khatabook are the local benchmarks for "simple enough for first-time software users", thanks to mobile-first design and vernacular support. — [Accountune](https://accountune.com/best-tally-alternative-india); [Khatabook blog](https://khatabook.com/blog/khatabook-app-features/)

### Inferences
- Take from **Polaris**: the index-table pattern (filters/tabs above, bulk actions, empty state) and the merchant-friendly copy tone.
- Take from **Linear** (training knowledge): instant navigation from local caching, a Cmd/Ctrl+K command palette, restrained monochrome UI with one accent colour, and little decoration.
- Take from **Stripe Dashboard** (training knowledge): clean tables with right-aligned money, clear status badges (Paid/Pending → here "Open/Partially delivered/Completed" for POs), and detail drawers instead of full-page navigation.
- Take from **Vyapar/Khatabook**: big primary buttons on mobile ("+ Purchase", "+ Delivery"), a home screen showing the numbers owners care about (stock by material, what to buy, average buy/sell rate), and minimal fields per screen.

### Gaps
- No primary sources were fetched on Linear's or Stripe's design principles. Those rationales are training knowledge, not verified this session.
- I found no published case study of UX in Indian scrap or metal-trading software.
