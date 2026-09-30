# Data display and data entry patterns for the Metal Scrap Management System (tables, cards, forms, filters, search, charts)

Scope: concrete, evidence-based patterns for a numeric-heavy Indian business app (Vite + React 19, shadcn/ui on Base UI, Tailwind v4, TanStack Table v9, React Hook Form + Zod, Recharts v3 via shadcn Charts). Research done September 2026. Where a source is older but still the standard reference, the date is given and marked "(older, still standard)".

Research method note: about 18 searches and fetches. Two IBM Carbon doc pages (data-table usage and style) came back truncated from the fetch tool, so the Carbon row heights below come from search-result summaries of the Carbon style page and Carbon Svelte docs, not from reading the page directly. The Matthew Ström "Design Better Data Tables" article returned 403 and is not cited directly.

---

## 1. Data tables (column order, alignment, density, sticky header, row actions, pagination, totals, status, progress, truncation, mobile cards)

### Takeaway
Use a dense, scannable table: the first column is a readable record identifier, text is left-aligned, numbers are right-aligned with tabular figures, the header row stays fixed, rows highlight on hover, there is a row actions menu, column visibility can be changed, and pagination is numbered (not infinite scroll) because users look for specific records and compare them. On phones, turn each row into a card that shows only the identifier, status, the 2–3 key numbers, and a link to the detail view.

### Cited Findings
**Structure and scanning**
- The first column (by default) should be a human-readable record identifier, not an auto-generated ID. Order columns by how much they matter to users and keep related columns next to each other. — [NN/g, Data Tables: Four Major User Tasks (Apr 2022)](https://www.nngroup.com/articles/data-tables/)
- Larger tables should have frozen header rows and frozen columns. Zebra striping helps the eye follow a row, borders keep the structure clear, and hover highlighting helps users keep their place. — [NN/g Data Tables (Apr 2022)](https://www.nngroup.com/articles/data-tables/)
- Users should be able to hide and reorder columns, with a clear sign of how many columns are hidden. Column changes should not need drag-and-drop only, because that is an accessibility problem. — [NN/g Data Tables (Apr 2022)](https://www.nngroup.com/articles/data-tables/)
- Filters should be easy to find, and the table should clearly show when a filter is active. Browser Ctrl-F and/or a built-in search should work. — [NN/g Data Tables (Apr 2022)](https://www.nngroup.com/articles/data-tables/)
- Tables beat card layouts for comparing nearby values and for cognitive load, and they scale to any number of rows and columns. — [NN/g Data Tables (Apr 2022)](https://www.nngroup.com/articles/data-tables/)

**Actions**
- Inline row actions only work for 1–2 actions. More than that crowds the row or hides the actions. For batch actions, use checkboxes plus action buttons above or below the table, and give a one-click "select all" for the whole dataset when it applies. — [NN/g Data Tables (Apr 2022)](https://www.nngroup.com/articles/data-tables/)
- Avoid modals for heavy editing because they hide the data users need to refer to. Prefer a nonmodal side panel. If editing happens in place, make edit mode clearly different. — [NN/g Data Tables (Apr 2022)](https://www.nngroup.com/articles/data-tables/)
- The shadcn data-table guide (2026) uses TanStack Table v9 with a "features" architecture (`tableFeatures()`, tree-shakable). It covers pagination, sorting via `column.toggleSorting()`, column filtering via `setFilterValue()`, a column-visibility dropdown via `column.toggleVisibility()`, checkbox row selection with header select-all, and a per-row `DropdownMenu` for row actions reading `row.original`. Its example right-aligns the currency amount cell and formats it with `Intl.NumberFormat`. The guide shows client-side pagination only and does not cover server-side pagination. — [shadcn/ui Data Table docs](https://ui.shadcn.com/docs/components/data-table)

**Density (row heights)**
- IBM Carbon row sizes: Compact 24px, Short 32px, Default 48px, Tall 64px. Carbon v11 added a 40px (medium) size. Virtual row height follows the size variant (48 default, 24 compact, 32 short, 64 tall). — [Carbon data table style](https://carbondesignsystem.com/components/data-table/style/); [Carbon Components Svelte DataTable](https://svelte.carbondesignsystem.com/components/DataTable); related sizing discussion in [carbon issue #8874](https://github.com/carbon-design-system/carbon/issues/8874). (Taken from search summaries because the page fetch was truncated.)

**Numbers and alignment**
- Tabular figures give every digit the same width so numbers line up in a column. Set them with `font-variant-numeric: tabular-nums` (over 96% browser support). Right-align numeric data and pair `tabular-nums` with `text-right`. — [DEV: Tabular numbers in CSS](https://dev.to/alanwest/tabular-numbers-in-css-font-variant-numeric-vs-monospace-hacks-25cn); [MDN font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric); [theosoti: tabular-nums](https://theosoti.com/short/tabular-nums/)
- According to the 2024 Web Almanac (as reported), only 16% of web fonts support tabular number variants. Inter, IBM Plex Sans, Source Sans, Noto Sans and Lato do. Use tabular figures only where alignment matters (prices, table columns). Proportional digits read better in body copy. — [DEV: Tabular numbers in CSS](https://dev.to/alanwest/tabular-numbers-in-css-font-variant-numeric-vs-monospace-hacks-25cn) (secondary source quoting the Web Almanac)
- Classic web typography reference on designing tables to be read: [A List Apart, Web Typography: Designing Tables to be Read (older, still standard)](https://alistapart.com/article/web-typography-tables/)

**Pagination vs infinite scroll vs load more**
- NN/g advises against infinite scroll when users need to find something specific, compare items across a long list, or find only the top results. Infinite scroll can also block access to the footer, and after "back" users land at the top of the list again. "Load more" eases the footer problem. Infinite scroll suits homogeneous content browsed with no goal (feeds). — [NN/g Infinite Scrolling: When to Use It (Sep 2022)](https://www.nngroup.com/articles/infinite-scrolling-tips/)

**Mobile**
- On phones, content must be readable without zooming. Number-heavy tables can fit more columns than text-heavy ones, which often fit only about 2 columns. Use a sticky header for tables taller than one screen and lock the left column when scrolling sideways. Show horizontal overflow with arrows or cut-off content, not dots. Let users narrow the data before viewing, or pick rows/columns while viewing. Group data with accordions. Do not force landscape. — [NN/g Mobile Tables (Sep 2017, older, still standard)](https://www.nngroup.com/articles/mobile-tables/)

### Inferences (app-specific recommendations)
- **Column order** (identifier first, then context, then numbers, then status, then actions):
  - Purchases: Date | Supplier | Material | Tons (T) | Rate (₹/T) | Amount (₹) | Vehicle | Invoice | ⋯
  - Sales POs: PO No. | Date | Customer | Material | Ordered (T) | Delivered (T) | Remaining (T) | Progress | Rate (₹/T) | Status | ⋯
  - Deliveries: Date | PO No. | Customer | Supplier (stock from) | Material | Tons (T) | Amount (₹) | Vehicle | ⋯
  - Companies: Name | Type (Supplier/Customer) | GSTIN | Phone | City | ⋯
  - Materials: Name | Current stock (T) | Open demand (T) | ⋯
  (Follows the NN/g rules on readable identifier first and related columns together.)
- **Units go in the header, not in every cell**: "Tons (T)", "Rate (₹/T)", "Amount (₹)". Cells then hold bare numbers such as `30.250` and `11,87,894.21`, which cuts noise and keeps right-alignment clean. Keep the unit in summary tiles, cards and forms, where there is no header. (Inference: no primary source fetched states the header-vs-cell rule. It follows from the alignment and scannability guidance above.)
- **Alignment**: text columns and their headers left-aligned. Numeric columns and their headers right-aligned, with `tabular-nums` on all numeric cells (Tailwind `tabular-nums text-right`). Fixed decimals per column (3 for tons, 2 for money) so decimal points line up. Status and progress columns left-aligned. The row actions column is narrow and right-aligned.
- **Density**: offer 2 densities. Default is about 40px rows (shadcn default `h-10`, close to Carbon's 40px), and compact is 32px for power users on desktop. On touch (mobile cards), tap targets should be 44px or more. Save the density choice per user in localStorage.
- **Stripes vs dividers**: NN/g supports zebra striping. shadcn's default uses row dividers (border-b) plus hover. Recommendation: keep dividers plus hover by default, and add subtle zebra striping (`even:bg-muted/40`) on wide tables with many numeric columns (Sales POs, Purchases). Keep stripes low-contrast so they don't clash with the selection and status colours.
- **Sticky**: sticky header always (`sticky top-0 bg-background z-10`). Sticky first column only when the table scrolls sideways (tablet widths).
- **Row click vs actions**: make the whole row a link to the detail page (with a real `<a>` or row `onClick` plus a keyboard-focusable link in the first cell), and put secondary actions (Edit, Record delivery, Delete) in a trailing `⋯` DropdownMenu. Show at most 1 inline action (for example "Deliver" on an open PO), following NN/g's 1–2 inline actions limit.
- **Bulk actions**: probably not needed for v1. Nothing here is a batch operation except export. Offer "Export CSV/Excel of current filter" as a toolbar button instead of row selection. (Inference.)
- **Pagination**: numbered pagination with page-size choice (25/50/100, max 100 to match the API), total count shown ("Showing 51–100 of 1,234"), and page plus filters kept in the URL. No infinite scroll (NN/g: users look for specific records and compare). On mobile, a "Load more" button is fine for the card list.
- **Totals**: show a summary strip above the table for the whole filtered set (Total tons, Total amount), computed server-side. Page-only footer totals mislead with server pagination. If there is a footer row, label it "Page total".
- **Status badges**: colour plus text always ("Open", "Partly delivered", "Completed", "Cancelled"), and optionally an icon, so colour is never the only signal.
- **Progress in cell**: Sales PO "Progress" cell = thin bar (h-1.5 to h-2), 64–96px wide, with a text label `18.500 / 30.000 T (62%)`, or `62%` with a tooltip giving the absolute values.
- **Truncation**: truncate long company names and invoice numbers with `truncate max-w-[16rem]` plus a Tooltip (and a `title` fallback). Never truncate numbers.
- **Mobile cards (below 768px)**: card header = identifier + status badge. Body = 2–3 key numbers in a 2-column definition grid (for example Tons / Amount, or Remaining / Progress bar). Footer = date (DD/MM/YYYY) + counterparty. The whole card is tappable to the detail page, and the `⋯` menu sits top-right. Move the filters into a Sheet/Drawer.

### Gaps
- Could not fetch the Carbon, Polaris, Fiori or Primer data-table pages directly, so no primary-source quote on header/cell unit placement, exact cell padding, or totals-row conventions.
- No quantitative study found comparing zebra stripes and row dividers. NN/g recommends striping but gives no numbers.
- No ERP-specific study of pagination vs load-more. The NN/g guidance is general (e-commerce/content) but applies to goal-directed lookups.

---

## 2. Filters and search (bar vs panel, chips, clear all, date presets, debounce, URL sync, saved views, zero results)

### Takeaway
For a handful of known filters (date range, company, material, status, text search), use a horizontal filter bar above the table on desktop and a Sheet/Drawer with an "Apply" button on mobile. Show active filters clearly with a "Clear all". The research base for chips, presets, URL syncing and saved views is thin. Most of those recommendations are inferences.

### Cited Findings
- **Batch filtering** (Apply button) is recommended when users know their criteria, when the site is slow (especially on mobile), or when several filters must be set before results appear. **Interactive filtering** (instant) suits exploratory users when responses take under 1 second. "Let users tell you when they're done selecting filters." Mobile should use batch filtering. — [NN/g Applying Filters (Feb 2016, older, still standard)](https://www.nngroup.com/articles/applying-filters/)
- Tables must clearly show when a filter is active. Filters should be discoverable, fast and powerful. — [NN/g Data Tables (Apr 2022)](https://www.nngroup.com/articles/data-tables/)
- On mobile, let users narrow data before viewing it when they don't need to compare. — [NN/g Mobile Tables (2017)](https://www.nngroup.com/articles/mobile-tables/)
- Infinite scroll loses the user's position on "back", which is why list state (page and filters) should survive navigation. — [NN/g Infinite Scrolling (2022)](https://www.nngroup.com/articles/infinite-scrolling-tips/)

### Inferences (app-specific recommendations)
- **Desktop**: a single-row toolbar containing search input (left, about 240–320px) | Date range (Popover with presets + calendar) | Company (Combobox with search) | Material (Select) | Status (Select or segmented control) | "Clear all" text button (only when a filter is active) | Column visibility and Density (right). Apply instantly (the server responds in under 1s at 100 rows or fewer), debounce text search by about 300ms, and cancel stale requests (TanStack Query with an abort signal).
- **Mobile**: search stays visible, and a "Filters (3)" button opens a bottom Sheet with an **Apply** button (batch filtering, per NN/g) and "Reset".
- **Active filter chips**: under the toolbar, show removable chips such as `Supplier: Shree Metals ✕`, `Date: This month ✕`, then "Clear all". The count badge on the mobile Filters button carries the same information.
- **Date presets for an Indian business**: Today, Yesterday, This week (Mon–Sun), This month, Last month, This quarter (Apr–Jun / Jul–Sep / Oct–Dec / Jan–Mar), **This financial year (1 Apr – 31 Mar)**, Last financial year, Custom range. Show the resolved dates next to the preset label ("This month · 01/09/2026 – 30/09/2026").
- **URL sync**: store `page`, `pageSize`, `sort`, `q`, `from`, `to`, `company`, `material` and `status` in the query string (for example with nuqs or TanStack Router search params) so filtered views can be bookmarked and shared on WhatsApp, and "back" restores the view. Use `replace` history entries for typing and `push` for filter changes.
- **Saved views**: optional for v1. A lightweight version is 3–5 fixed "quick views" as tabs (for example on Sales POs: Open | Partly delivered | Completed | All), which covers most needs without a saved-views backend.
- **Zero results**: tell the user it's filters, not missing data: "No purchases match these filters", list the active filters, and give a "Clear filters" button. Separate this from the true empty state ("No purchases yet — Add purchase").

### Gaps
- No primary (2025–2026) research found on filter chips, date-range presets, debounce timing, URL-synced filters or saved views. The recommendations above are practitioner conventions, not evidence-backed.
- The core NN/g filter article dates from 2016.

---

## 3. Forms (layout, labels, required/optional, widths, masks, addons, live total, validation timing, error messages, error summary, disabled buttons, keyboard flow, limits panel)

### Takeaway
Use single-column forms with labels above fields, grouped into sections. Mark optional fields with "(optional)", and mark required ones too when both kinds are mixed. Size inputs to the expected value, and use unit addons ("T", "₹/T"). Never disable the submit button. Validate on submit plus on blur for tricky fields, and never while the user is still typing a first entry. Show an error summary at the top that links to each field, with inline messages next to each field. The evidence on "on blur" validation conflicts (Wroblewski vs GOV.UK), so a hybrid is safest.

### Cited Findings
**Validation timing (conflicting evidence)**
- Wroblewski's inline validation study (Sep 2009, older, still standard) found that, compared with the control form, the best inline validation form gave **+22% success, −22% errors, +31% satisfaction, −42% completion time, −47% eye fixations**. "After" (on-blur) validation performed best, with users finishing 7–10 seconds faster. "While" (on-keypress) validation slowed users down. "Before and while" was worst: premature errors frustrated people. Inline validation helped most on hard fields where users lacked confidence. — [A List Apart, Inline Validation in Web Forms (2009)](https://alistapart.com/article/inline-validation-in-web-forms/)
- GOV.UK guidance: "Do not validate when the user moves away from a field. Wait until they try to move to the next part of the service – usually by clicking the 'continue' or 'submit' button." Avoid validating before the user has finished, which especially hurts slower typists. Use live validation only if research justifies it. After an error, show the form again with the user's entries kept. Do not use HTML5 validation: add `novalidate` and don't use `required` attributes. — [GOV.UK Design System, Validation pattern](https://design-system.service.gov.uk/patterns/validation/)
  - **Conflict**: Wroblewski (2009) supports on-blur, while GOV.UK (current) says validate on submit only. GOV.UK's audience includes low-literacy and assistive-technology users, which is closer to "non-technical owners and staff".

**Error summary and messages**
- Always show an error summary when there is a validation error, even for one error. Place it at the top of the main container above the page heading. Move focus to it on load. Link each error to its field (for multi-part inputs, link to the first field with the error). Use the heading "There is a problem". Use the same wording as the inline messages. Prefix inline messages with "Error:" for screen readers, and add "Error: " to the page `<title>`. — [GOV.UK Error summary](https://design-system.service.gov.uk/components/error-summary/)
- NN/g error messages: show them close to the source. Use redundant, noticeable, accessible indicators (colour plus icon/border, not colour alone). Use plain language and describe the specific problem. Offer constructive advice. Take a positive tone that doesn't blame the user, and avoid words like "invalid" or "illegal". Keep the user's input. Catch common errors early and suggest corrections. — [NN/g Error-Message Guidelines (May 2023)](https://www.nngroup.com/articles/error-message-guidelines/)

**Disabled submit buttons**
- Adam Silver (May 2023) lists six problems with disabled buttons: no feedback on what's wrong; the UI feels broken when errors remain; low contrast is hard to read; they can't be focused by keyboard; the styling is ambiguous; and users miss the moment the button becomes enabled. The alternative: keep the button enabled and give good error recovery on submit. — [Adam Silver, The problem with disabled buttons (2023)](https://adamsilver.io/blog/the-problem-with-disabled-buttons-and-what-to-do-instead/)

**Required vs optional**
- Baymard (2018) found that when only optional fields were marked, 32% of test users hit a validation error from missing a required field. It recommends marking both: an asterisk for required plus "(optional)" for optional. Only 14% of checkouts did so. — [Baymard, Mark both required and optional fields](https://baymard.com/blog/required-optional-form-fields)

**Input widths**
- Baymard: input width should match the expected input. Mismatched widths cause hesitation (re-reading the label, typing extra characters). Fixed-length inputs should be just wide enough for their characters. Variable-length "normal" inputs share one consistent width. — [Baymard, Form Field Usability: Matching User Expectations](https://baymard.com/blog/form-field-usability-matching-user-expectations)

**shadcn building blocks (2026)**
- `Field` supports `orientation="vertical" | "horizontal" | "responsive"`. The family includes `FieldLabel`, `FieldDescription`, `FieldError` (accepts error arrays from RHF / Standard Schema such as Zod and renders several as a list), `FieldGroup` (container queries), `FieldSet`/`FieldLegend`, `FieldSeparator` and `FieldContent`. Put `data-invalid` on `Field` and `aria-invalid` on the input. — [shadcn/ui Field](https://ui.shadcn.com/docs/components/field)
- `InputGroup` with `InputGroupInput`, `InputGroupAddon` (`align`: `inline-start` default, `inline-end`, `block-start`, `block-end`), `InputGroupText` and `InputGroupButton`. In the DOM the addon must come after the input for focus handling. Base UI variant available. — [shadcn/ui Input Group](https://ui.shadcn.com/docs/components/input-group)

### Inferences (app-specific recommendations)
- **Layout**: single column, max form width about 560–640px. Labels on top. On desktop (at 768px and up), pair short related fields in 2 columns only when they form one unit (Tons + Rate). Sections, using `FieldSet` + `FieldLegend`:
  - Purchase: 1. What & who (Date, Supplier, Material) · 2. Quantity & price (Tons, Rate, **Total** read-only) · 3. Transport & paperwork (Vehicle no., Invoice no. (optional), Notes (optional)).
  - Delivery: 1. Sales PO (pick PO; then show read-only Customer / Material / Rate) · 2. Stock source (Supplier) · 3. Quantity (Tons + live limits panel) · 4. Transport (Vehicle, Invoice).
- **Single page vs multi-step**: single page. These forms have 6–10 fields. The Delivery form's dependency (PO first) is handled with progressive disclosure, where later sections unlock or fill in once the PO is picked, not with a wizard.
- **Required marking**: most fields are required, so mark only optional ones with "(optional)" in the label. If a form mixes many of both, follow Baymard and add `*` to required fields plus a "* required" note at the top.
- **Input widths** (Tailwind, at 16px root): Date `w-40` (160px, fits DD/MM/YYYY + icon); Tons `w-36` (144px); Rate `w-40`; Vehicle no. `w-44` (about 12 chars); GSTIN `w-56` (15 chars uppercase); Invoice no. `w-48`; Company/Material combobox full width. On mobile all fields go full width.
- **Unit addons**: Tons → `InputGroupInput inputMode="decimal"` + `InputGroupAddon align="inline-end"`: `T`. Rate → prefix `₹` (inline-start) + suffix `/T` (inline-end). Right-align text inside numeric inputs (`text-right tabular-nums`). Use `type="text" inputMode="decimal"` rather than `type="number"`, which has scroll-wheel and locale problems. Format on blur (`30.25` → `30.250`), and show a raw editable value on focus.
- **Masks**: Vehicle number: auto-uppercase, strip spaces and hyphens on input, validate with Zod regex `^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$` (covers GJ01AB1234 and older formats; BH series `^\d{2}BH\d{4}[A-Z]{1,2}$` as an alternative). Display with spaces `GJ 01 AB 1234`. GSTIN: auto-uppercase, max 15 characters, regex `^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`, and optionally verify the checksum. Prefer "soft" masks (normalise on blur) over hard character-slot masks, which fight paste and editing. (Regexes are inferences from the public GSTIN/RTO formats and were not verified against a primary source in this research.)
- **Live total**: read-only row under Tons × Rate: "Total amount ₹11,87,894.21", visually emphasised (text-lg, font-semibold, tabular-nums), with `aria-live="polite"`. Compute in paise or integer-milli-tons, or with decimal.js, to avoid float drift. The server stays authoritative.
- **Validation timing (hybrid, reconciling the conflict)**: (1) validate everything on submit; (2) after the first submit attempt, re-validate a field as the user edits it so the error clears as soon as it's fixed (RHF `mode: "onSubmit"`, `reValidateMode: "onChange"`); (3) use on-blur validation only for format fields where users lack confidence (Vehicle no., GSTIN), per Wroblewski; (4) never show an error while the user is still typing a first entry.
- **Submit button**: always enabled. While submitting, show a spinner and "Saving…" and block double-submit. Never disable it for invalid state (Adam Silver).
- **Server errors**: map 422 field issues with `setError(path, { message })` into each `FieldError`, and also render an error summary Alert at the top of the form ("There is a problem" with a list of links that focus the fields), then focus it. Map 409 limit errors to the Tons field **and** refresh the limits panel with the returned numbers.
- **Error copy pattern**: say what's wrong and how to fix it, in plain words, with no "invalid". Examples: "Enter tons as a number, like 30.250" · "Tons can't be more than 12.500 T — that's all Shree Metals has in stock" · "Enter the vehicle number like GJ01AB1234" · "Choose a supplier".
- **Live limits panel (Delivery)**: a Card next to the form on desktop (sticky) or directly under Tons on mobile. Three rows, each with a label, value (T) and mini bar: "PO remaining 11.750 T", "Total stock 84.300 T", "Shree Metals stock 9.200 T". A computed line "You can deliver up to **9.200 T** (limited by Shree Metals stock)" names the tightest constraint. As the user types, show "After this delivery: PO remaining 2.550 T". When the typed tons exceed the max, the row turns destructive colour with an icon and text. It's a warning while typing that becomes a blocking error on submit. Add a "Use max" button to fill the maximum allowed. Refetch the limits when the PO or supplier changes, and re-check on submit (the server 409 is the final guard).
- **Keyboard**: autofocus the first field only on dedicated "New X" pages or dialogs, not on pages with content above the form. Enter-to-next-field: Enter in a text or numeric input moves focus to the next field; Enter on the last field or Ctrl+Enter submits. Keep native Tab order, and after a successful save offer "Save & add another" for fast data entry.
- **Unsaved changes**: when the form is dirty (RHF `formState.isDirty`), warn on in-app navigation (router blocker with a confirm dialog) and on tab close (`beforeunload`).

### Gaps
- No primary research found on Enter-to-next-field, autofocus effects, or unsaved-changes warnings. These are conventions.
- No 2025–2026 quantitative study found that updates Wroblewski (2009) on validation timing. The Baymard inline-validation research was not fetched.
- Vehicle and GSTIN regexes were not checked against official GSTN or MoRTH specs in this research.

---

## 4. Making complex numeric data easy to understand (formatting, lakh/crore, compact numbers, attention, progressive disclosure, plain labels, dates)

### Takeaway
Use one global set of formatting rules everywhere: tons always to 3 decimals, money always to 2 decimals in en-IN grouping, compact "₹12.5 L" only on summary tiles (with the exact value on hover), fixed DD/MM/YYYY dates for records, and plain-language labels. Surface exceptions (overdue POs, low supplier stock, negative balances) with colour plus icon plus text.

### Cited Findings
- `Intl.NumberFormat` with the `en-IN` locale produces Indian grouping, and with `notation: "compact"` it produces lakh/crore abbreviations ("L", "Cr"). — [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat); [India number format, localization.guide](https://www.localization.guide/country/in); [Crore, Wikipedia](https://en.wikipedia.org/wiki/Crore) (search summary; exact compact output not verified in a browser in this research)
- Relative timestamps ("2 hours ago") are easier to scan in activity feeds. Absolute timestamps suit records and audit logs. A hybrid works well: show relative time and expose the absolute value through a `<time>` element with a `title` tooltip. Always label what the timestamp refers to. — [Cloudscape, Timestamps pattern](https://cloudscape.design/patterns/general/timestamps/); [UX Movement, Absolute vs Relative Timestamps](https://uxmovement.com/content/absolute-vs-relative-timestamps-when-to-use-which/)
- PatternFly has UX-writing rules for numerics, for reference. — [PatternFly Numerics](https://www.patternfly.org/ux-writing/numerics/)
- Error and status indicators should be redundant (not colour alone) and in plain language. — [NN/g Error-Message Guidelines (2023)](https://www.nngroup.com/articles/error-message-guidelines/)

### Inferences (app-specific formatting rules)
- **Tons**: `new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })` → `30.250`. In cards and forms append " T" with a thin/normal space (`30.250 T`). In tables, bare number with the unit in the header.
- **Money**: `new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })` → `₹11,87,894.21`. In table cells drop the "₹" (header says "Amount (₹)") or keep it consistently; pick one rule and apply it everywhere.
- **Rates**: `₹42,500.00/T` in cards; `42,500.00` in a "Rate (₹/T)" column.
- **Compact** (tiles and chart axes only): `Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })` gives roughly `₹12.5L` / `₹3.2Cr`. Set `maximumFractionDigits` explicitly, because the default compact rounding may give `13L`. Test the exact output in Chrome, Safari and Firefox. Show the full value in a tooltip or subtitle. Never use compact numbers in tables, forms or anything the user might copy into an invoice.
- **Percentages**: 0 decimals in badges and bars (`62%`), 1 decimal only in analytics.
- **Negatives and zero**: show a leading minus `−` (U+2212) and destructive colour for negative stock or balances. Show `0.000` rather than blank for real zero, and "—" for not-applicable.
- **Dates**: records (purchase date, delivery date) always absolute `DD/MM/YYYY` (for example `date-fns format(d, 'dd/MM/yyyy')`). Use relative time ("Updated 5 min ago") only for "last updated" meta and activity feeds, with the absolute date in a tooltip. Date inputs accept DD/MM/YYYY typed or picked.
- **Plain labels**: "Remaining to deliver" not "Balance qty"; "Stock with supplier" not "Supplier inventory"; "Rate per ton" not "Unit price"; statuses "Open / Partly delivered / Completed / Cancelled".
- **Attention**: a dashboard "Needs attention" list (POs with less than 10% stock coverage, POs past their expected date, suppliers with negative or low stock). In tables, a warning icon plus tooltip next to the affected value.
- **Progressive disclosure**: list pages show the 6–9 most important columns (others hidden by default through column visibility), and detail pages or side sheets show the full record and its linked deliveries.

### Gaps
- Did not find an authoritative design-system rule on currency symbols in each cell vs the header. The recommendation is an inference.
- Did not verify real-browser output of `en-IN` compact notation (CLDR data suggests "L" / "Cr" suffixes, but rounding defaults need testing).

---

## 5. Data visualisation (chart choice, direct labels vs legends, colour, sparklines, table vs chart)

### Takeaway
Pick the chart by the question: bars for comparing materials (stock vs demand), a progress/bullet bar for PO fulfilment, lines for rate trends over time. Label directly instead of relying on a legend. Never rely on colour alone. Start bar axes at zero, and use tables when users need exact values. shadcn Charts (Recharts v3) support this through `ChartConfig` tokens and `accessibilityLayer`.

### Cited Findings
- UK Government Analysis Function (May 2022): bars for comparing category sizes, rankings and single-series equal-interval time series. Lines for trends and for more than one time series ("When you have more than one time series on a chart, do not use a bar chart, use a line chart instead"). — [Analysis Function, Data visualisation: charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/)
- Prefer direct labels. "Legends use colour to match labels to data. This fails accessibility success criterion 1.4.1." Label lines directly or at the right edge in dark text, and use legends only when direct labelling isn't possible. — [Analysis Function charts guidance (2022)](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/)
- Never break the axis on bar charts (start at zero). Line charts may break the y-axis, with clear indication. — [Analysis Function (2022)](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/)
- Colour limits: pie charts 5 categories or fewer, 4 or fewer per stacked bar, about 4 lines at most, clustered bars ideally 2 (at most 4). Charts must meet WCAG 2.2 AA contrast and not rely on colour alone. — [Analysis Function (2022)](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/)
- Use a table when users need precise values: "A well structured table can often be as powerful as a chart." Provide alt text or a data table alternative. — [Analysis Function (2022)](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/)
- Direct labels make charts readable even when colours are hard to tell apart. Use redundant encoding (line style, shape, pattern) for colour-blind users. — [Datylon, charts for colour-blind readers](https://www.datylon.com/blog/data-visualization-for-colorblind-readers); [Sigma, charts for color blindness](https://www.sigmacomputing.com/blog/data-charts-color-blindness) (vendor blogs, consistent with the government guidance above)
- shadcn Chart (2026) is built on **Recharts v3**. `ChartContainer` needs `min-h-*` or `aspect-*`. `ChartConfig` holds labels, icons and colours (recommended CSS vars `--chart-1`…`--chart-5`, referenced as `var(--color-KEY)`, with light/dark theme objects). `ChartTooltip`/`ChartLegend` wrappers are available, and the `accessibilityLayer` prop adds keyboard and screen-reader support. Recharts v3 migration: use `var(--chart-1)` directly, not `hsl(var(--chart-1))`. — [shadcn/ui Chart](https://ui.shadcn.com/docs/components/chart)

### Inferences (app-specific chart choices)
- **Stock vs demand per material**: horizontal grouped bar (2 bars per material: "In stock" and "Open PO demand"), sorted by gap, zero-based axis, value labels at the bar ends in `x.xxx T`. Materials where demand is greater than stock get a warning icon and text next to the label, not just colour. With more than 8 materials, switch to a table with inline bars.
- **PO fulfilment**: a bullet/progress bar per PO (delivered filled, remaining track, value labels `18.500 / 30.000 T · 62%`), not a pie or donut.
- **Rate trend**: a line chart of the average purchase rate vs average sale rate (₹/T) by week or month for a chosen material. Label the lines directly at the right end ("Buy", "Sell"), and use solid vs dashed lines as a redundant cue. The y-axis may start above zero here (per the guidance on lines), with the axis labels showing ₹ in compact form.
- **Monthly purchases/sales volume**: vertical bars by month in financial-year order (Apr→Mar). Use lines instead if comparing 2 or more series.
- **KPI tiles**: large compact value (`₹12.5 L`), exact value in the tooltip or subtitle, delta vs the previous period with an arrow **and** a +/− sign and text ("↑ 8% vs last month"), and an optional 30-day sparkline (no axes, `h-8 w-24`, one colour, last point marked). Use sparklines only for trend context, never as the only carrier of a value.
- **Colour**: map semantic states to tokens (success = completed or within limits, warning = near a limit, destructive = over a limit or negative, muted = cancelled). Keep series colours in `--chart-1..5`, and check them against a colour-blind palette (for example Okabe-Ito or IBM's colour-blind-safe set). At most 4 series per chart.
- **Table beats chart**: any screen where users need exact tons or rupees to act (reconciliation, supplier ledgers, PO lists). Charts are for dashboards and trends only.

### Gaps
- Did not fetch the Carbon Charts, Atlassian or Polaris data-viz colour guidance, so there is no primary source for a specific colour-blind-safe palette. Okabe-Ito and IBM's palette are named from general knowledge, not verified in this research.
- No research found specifically on bullet charts vs progress bars for fulfilment. The recommendation is an inference from the bar-chart guidance (zero-based, precise comparison).
