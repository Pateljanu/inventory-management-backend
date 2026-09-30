# Build a scrap-yard UI that explains itself

The recommended system is a **calm, number-first shadcn/ui interface on Base UI**. It is built from one persistent sidebar (a bottom bar on phones), one page anatomy, one table that turns into cards on phones, one form pattern and one formatter for ₹ and tons, and every screen answers one of the owner's two daily questions: *what do I need to buy* and *what can I deliver*. The single most important interaction is the **delivery form's live limits panel**, which shows PO remaining, yard stock and the chosen supplier's stock, names the tightest limit and offers a one-tap "Use max", turning the backend's strictest 409 rules into guidance the user sees *before* saving. Around it, navigation stays visible because hidden navigation made desktop users at least 39% slower in NN/g testing ([NN/g](https://www.nngroup.com/articles/hamburger-menus/)); there is one operational dashboard that fits one screen, with no pies or gauges and every number linking to a filtered list ([NN/g](https://www.nngroup.com/articles/dashboards-preattentive/)); errors sit next to their cause in plain words that reuse the server's own numbers ("Only 9.200 t left from Shree Ganesh Metals — Use 9.200 t"), with a copyable reference only on 500s; motion lasts 100–300 ms, never more than 400 ms, and exists only to give feedback ([NN/g](https://www.nngroup.com/articles/animation-duration/)); and phones get 44–48 px controls, bottom drawers instead of dialogs, and cards instead of tables. Three findings revise earlier assumptions: Base UI (shadcn's default since July 2026, with a native Combobox) is the better base, so the Radix-based shadcn-admin template becomes a reference rather than a fork ([shadcn](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)); stock-affecting saves must not be optimistic, because the server can reject them with 409; and built-in compact number formatting printed "1.2KCr" in testing, so a custom lakh/crore formatter is required. The final section, "Screen specifications", gives exact layouts and sample data for mockups.

## One shell, four sidebar groups and a Ctrl+K palette organise eight modules

### A visible sidebar beats a hamburger for eight sections

NN/g's study of hidden navigation found it cut discoverability by more than 20%, made desktop users **at least 39% slower** and mobile users 15% slower, and saw hidden menus used in only 27% of desktop tasks against 48–50% for visible navigation ([NN/g](https://www.nngroup.com/articles/hamburger-menus/)). The app therefore uses shadcn's `Sidebar` with `collapsible="icon"` and `variant="inset"`, the setup behind the official `dashboard-01` block ([shadcn Blocks](https://ui.shadcn.com/blocks)). Its defaults already cover most shell requirements: **16rem expanded, a 3rem icon rail and an 18rem Sheet on phones**, a Ctrl+B toggle with a `sidebar_state` cookie that remembers the state for seven days, tooltips on collapsed icons on desktop only, and an automatic switch to an off-canvas Sheet below 768 px ([shadcn sidebar source](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx)).

Every page shares one anatomy. A 56 px header strip holds the sidebar trigger, breadcrumbs, a visible "Search… Ctrl K" button and a "+ New" menu. Below it, a `PageHeader` carries the title, a one-line description and **exactly one primary action at top right**, with at most three secondary actions, as Polaris prescribes ([Polaris Page](https://polaris.shopify.com/components/structure/page)). Content width depends on the page type: lists use the full width because tables need horizontal room, forms stay near 640 px so labels sit close to their inputs, and detail pages split 2/3 + 1/3 from 1024 px. Page padding is `p-4 lg:p-6`, with 16–24 px between sections, matching `dashboard-01`.

### Group by frequency, use trade words, hide what VIEWERs cannot do

The sidebar is split into labelled groups ordered by how often people use them, with the rarely edited masters last, a convention Tally users already know from "Create Master" (Alt+C) ([Tally shortcut guide](https://tallymantra.com/tally-prime-shortcut-keys-complete-2026-reference-guide/)).

| Group | Items |
|---|---|
| **Overview** | Dashboard |
| **Daily work** | Purchases · Sales Orders (with an open-order count badge) · Deliveries |
| **Stock & reports** | Supplier stock · Company report |
| **Setup** | Companies · Materials |

Every item carries a lucide icon **and** a visible text label, because low-literacy users recognise words and pictures unevenly and Material 3 requires text labels on bottom-bar destinations ([Material 3](https://m3.material.io/components/navigation-bar/guidelines)). Labels use trade words rather than system words: "Left to deliver" instead of "Balance qty", "Stock with supplier" instead of "Supplier inventory", and "Rate per ton" instead of "Unit price". Sales POs appear as **"Sales Orders"** with numbers such as `PO-0142`, and the four backend statuses map everywhere to **Pending, Partly delivered, Completed and Cancelled**.

For the **VIEWER** role, write controls are hidden rather than disabled: there is no "New purchase" button, no Edit or Cancel in row menus and no "+ New" in the header, while a small "View only" badge in the user menu explains the absence. One `can('write')` helper drives both the UI and a TanStack Router `beforeLoad` redirect on routes such as `/purchases/new`, and the server still enforces 403. No study settles hiding versus disabling for permission-restricted actions, so this choice rests on Adam Silver's evidence that disabled controls give no feedback and read as broken ([Adam Silver](https://adamsilver.io/blog/the-problem-with-disabled-buttons-and-what-to-do-instead/)).

### A palette, Tally-style keys and URLs that remember everything

A **Ctrl+K command palette** (shadcn `Command` in a `CommandDialog`) offers Create (OWNER only), Go to (every section), Recent (the last five companies or POs opened) and Search (server-side company, material and PO lookup, debounced 300 ms). Palettes are a practitioner standard rather than a researched one, used by Linear, GitHub and Slack, and the standing advice is to keep a visible "Ctrl K" chip so that infrequent users discover it ([Mobbin](https://mobbin.com/glossary/command-palette)).

Accountants arrive with Tally muscle memory: F8 Sales, F9 Purchase and Alt+C to create a missing master inside a voucher ([Tally guide](https://tallymantra.com/tally-prime-shortcut-keys-complete-2026-reference-guide/)). Browsers capture F5 and F11, so the primary shortcut set uses Alt combinations, with F8 and F9 offered only as aliases.

| Shortcut | Action |
|---|---|
| Ctrl+K | Command palette |
| Ctrl+B | Toggle sidebar |
| Alt+P / Alt+O / Alt+D | New purchase / new sales order / new delivery |
| Alt+C | Inside a picker, add the typed company or material |
| Ctrl+Enter or Ctrl+S | Save the form |
| Enter | Move to the next field |
| / | Focus the table search |
| Esc | Close the open sheet or dialog |
| ? | Open the shortcut list |

Every list filter, tab, sort, page and date range lives in TanStack Router search params validated by Zod, for example `/sales-orders?status=PENDING,PARTIALLY_SUPPLIED`. As a result, dashboard drill-downs are plain links, browser Back restores the previous view, and "this month's purchases from Sharma Traders" becomes a link that can be shared on WhatsApp.

### Sheets for records, dialogs for tiny tasks, pages for anything with children

NN/g warns that modals interrupt work, hide the content behind them and make users "forget some of the details" they needed ([NN/g](https://www.nngroup.com/articles/modal-nonmodal-dialog/)). Carbon uses small modals for one- or two-field creation and side panels for richer flows because they keep the user in context ([Carbon create flows](https://carbondesignsystem.com/community/patterns/create-flows/)). The app applies the same split.

| Container | Used for |
|---|---|
| **Right Sheet** (512–576 px; 768 px for Delivery) | Create and edit forms for purchases, sales orders, companies, materials and deliveries |
| **Small Dialog** | A company or material created from inside a picker |
| **AlertDialog** | Confirmations only |
| **Full page with its own URL** | Detail views for Sales Orders, Companies and Materials |

Sheets are deep-linkable (`/purchases?create=1`, `/sales/new?poId=…`) and rendered over the list, so a refresh never loses the form. A detail page always runs in the same order: breadcrumb, then a title with a status badge and one primary action, then a row of 3–5 stat cards, then related records in the same `DataTable` used everywhere else. Flat records such as a single purchase may open a "peek" Sheet instead, with a link to the full page.

## The dashboard answers "what do I buy and what can I deliver" on one screen

Stephen Few defines a dashboard as the most important information "arranged on a single screen so the information can be monitored at a glance", and names **inadequate context** (a number with no indication of whether it is good or bad) among its pitfalls ([Data Rocks review of Few](https://www.datarocks.co.nz/blog/data-viz-bookshelf_information-dashboard-design-stephen-few)). NN/g separates operational from analytical dashboards, favours length and position encodings, and rules out pies, donuts, gauges and 3D ([NN/g](https://www.nngroup.com/articles/dashboards-preattentive/)). Linear's usage data shows the median workspace builds only two dashboards; its advice is to pair every metric with context such as last week, so viewers "instantly see if something was good, bad, or in line with expectations" ([Linear](https://linear.app/now/dashboards-best-practices)). The app therefore has **one operational dashboard**, laid out as follows.

| Row | Contents |
|---|---|
| 0 | Period control (Today, This week, This month, This FY, Custom) with resolved dates and the comparison period in words; "Updated 2 min ago" with a refresh icon |
| 1 | Four KPI cards with deltas: **Stock in yard (t)**; **Buy needed (t)**, i.e. open-order demand minus stock, summed per material where positive and the most actionable number in the business; **Open sales orders** (count and tons left); **Delivered this month** (tons and ₹) |
| 2 | "Needs attention" card (two-thirds width) listing materials to buy (with "+ Purchase"), orders waiting oldest-first (with "Deliver") and low supplier stock; beside it a sorted horizontal bar chart of stock versus open demand per material |
| 3 | A two-line chart of tons bought versus delivered per week, and the last six transactions |

A margin KPI (average sell rate minus average buy rate) is tempting, but averaged across copper and HMS it is meaningless. It should wait until the backend exposes per-material rate series, the time-series endpoint flagged in the earlier library research.

Every KPI, attention item and chart bar is a deep link: Open orders goes to `/sales-orders?status=PENDING,PARTIALLY_SUPPLIED`, Buy needed to `/reports/stock?view=shortfall`, and a chart bar to `/purchases?materialId=…&from=…&to=…`. Colour stays restrained, with one accent colour plus grey, and amber or red only for items that need attention. Deltas always carry an arrow, a sign and words ("▲ 8% vs Aug"), so colour is never the only signal. The VIEWER sees the same layout without the Deliver and Purchase buttons. On phones the KPI cards form a 2×2 grid followed by the attention list, the part most useful in the yard, with charts below the fold.

KPI numbers do not count up: the effect fails NN/g's purpose test on a screen checked many times a day, delays reading the real value, and makes screen readers chatter ([NN/g](https://www.nngroup.com/articles/animation-purpose-ux/)). The dashboard refetches every 60 s and on window focus. Nothing faster is needed, because the acting user's own saves invalidate the relevant queries immediately.

## Tables, filters and forms carry the daily work

### Identifier first, numbers right-aligned, pagination instead of infinite scroll

NN/g's data-table guidance sets the base rules: a human-readable identifier comes first with related columns side by side, headers stay frozen, rows highlight on hover, users can hide columns, active filters are clearly shown, and inline row actions stop at one or two because more crowd the row ([NN/g Data Tables](https://www.nngroup.com/articles/data-tables/)). Numeric columns are **right-aligned with `tabular-nums`** so the digits line up ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric)), with fixed decimals per column type (3 for tons, 2 for rupees). **Units live in the header** ("Tons (t)", "Rate (₹/t)", "Amount (₹)"), so cells hold bare numbers.

| List | Columns (in order) |
|---|---|
| Purchases | Date · Supplier · Material · Tons (t) · Rate (₹/t) · Amount (₹) · Vehicle · Invoice · ⋯ |
| Sales Orders | PO no. · Date · Customer · Material · Ordered (t) · Delivered (t) · Left (t) · Progress · Rate (₹/t) · Status · Deliver · ⋯ |
| Deliveries | Date · PO no. · Customer · Stock from · Material · Tons (t) · Amount (₹) · Vehicle · ⋯ |
| Companies | Name · Type · GSTIN · Phone · City · ⋯ |
| Materials | Name · In yard (t) · Open demand (t) · Buy needed (t) · ⋯ |

Rows are **40 px on desktop**, close to Carbon's medium size ([Carbon](https://carbondesignsystem.com/components/data-table/style/)), with a compact 32 px option to follow later. The whole row links to its detail page and secondary actions sit in a trailing `⋯` menu; open sales orders additionally get one visible "Deliver" button, since it is the most frequent action. Long names truncate with a tooltip, but numbers never truncate. Pagination is numbered, with 25, 50 or 100 rows per page (the API maximum), because NN/g advises against infinite scroll when users look for specific records or compare them, and infinite scroll also loses position on Back ([NN/g](https://www.nngroup.com/articles/infinite-scrolling-tips/)). Totals for the **whole filtered set**, computed on the server, sit in a summary strip above the table ("46 purchases · 412.380 t · ₹1,84,62,310.00"); a page-only total would mislead under server pagination. The shadcn data-table guide already targets TanStack Table v9 and shows sorting, column visibility, row selection and row-action menus as "a guide on how to build your own" ([shadcn Data Table](https://ui.shadcn.com/docs/components/data-table)). Bulk selection stays out of v1, because nothing in this domain is a batch operation except export.

On phones, NN/g notes that text-heavy tables fit about two columns and recommends letting users narrow the data before viewing it ([NN/g Mobile Tables](https://www.nngroup.com/articles/mobile-tables/)). Below 768 px each row therefore becomes a tappable card whose header holds the identifier and status badge, whose body holds the two or three key numbers in a two-column `<dl>`, and whose footer holds the date and counterparty, with a `⋯` menu at top right and a "Load more" button in place of numbered pages.

### Filters apply instantly on desktop, in a batch on phones, and always live in the URL

NN/g recommends instant filtering when results return in under a second, and batch filtering with an Apply button on mobile and slow connections ([NN/g Applying Filters](https://www.nngroup.com/articles/applying-filters/)). On desktop, `FilterBar` is a single toolbar row containing a 280 px search box (debounced 300 ms, matching party, vehicle, invoice and PO number), a date range, a company combobox, a material select, status (shown as quick-view tabs on Sales Orders: Open · Partly delivered · Completed · All) and a "Clear all" link that appears only when a filter is active, with column and density controls at the far right. Active filters appear as removable chips ("Supplier: Shree Ganesh Metals ✕"). On phones, search stays visible and a "Filters (2)" button opens a bottom Drawer with Apply and Reset.

Date presets follow the Indian financial year. Each preset displays its resolved dates beside its label ("This month · 01/09/2026 – 30/09/2026"), and the FY rule is simple: if today's month is January to March, the FY began on 1 April of the previous calendar year.

| Preset | Resolved range on 27/09/2026 |
|---|---|
| Today / Yesterday | 27/09/2026 / 26/09/2026 |
| This week | Monday to Sunday of the current week |
| This month / Last month | 01/09/2026 – 30/09/2026 / 01/08/2026 – 31/08/2026 |
| This quarter | FY quarters: Q1 Apr–Jun, Q2 Jul–Sep, Q3 Oct–Dec, Q4 Jan–Mar |
| **This FY** / **Last FY** | 01/04/2026 – 31/03/2027 / 01/04/2025 – 31/03/2026 |
| Custom | A range calendar |

The research base for chips, presets and saved views is thin: these are conventions rather than tested findings, which is one more reason for a quick user test.

### Forms use one column, labels on top, a Save button that is never disabled, and errors in two places

The evidence on validation timing conflicts. Wroblewski's inline-validation study found that on-blur ("after") validation cut errors by 22% and completion time by 42% against a control, while validating during typing slowed people down ([A List Apart](https://alistapart.com/article/inline-validation-in-web-forms/)). GOV.UK, whose audience is closer to non-technical users, says to validate only on submit and never while the user is still typing ([GOV.UK validation](https://design-system.service.gov.uk/patterns/validation/)). Baymard found that 32% of users hit errors when only optional fields were marked ([Baymard](https://baymard.com/blog/required-optional-form-fields)), and Adam Silver lists six failures of disabled submit buttons, including no feedback and no keyboard focus ([Adam Silver](https://adamsilver.io/blog/the-problem-with-disabled-buttons-and-what-to-do-instead/)).

The app reconciles these sources with a hybrid. React Hook Form validates on submit (`mode: "onSubmit"`), then re-validates as the user types after a failed submit (`reValidateMode: "onChange"`) so each error clears the moment it is fixed. On-blur validation is reserved for format fields where users lack confidence, such as vehicle number and GSTIN; limit breaches are checked live as warnings because they are numeric and cheap to compute; and no error ever appears during a first entry. Save always stays enabled, and while saving it shows a spinner and "Saving…" and blocks a second submit. **Errors appear in two places with identical wording**: inline under each field in a `FieldError` linked through `aria-describedby`, and in a focused "There is a problem" summary at the top that links to each field ([GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/)).

Forms are a single column about 560–640 px wide, grouped into `FieldSet` sections such as "What & who", "Quantity & price" and "Transport & paperwork". Only one pair sits side by side on desktop: Tons and Rate, which feed a live **read-only Amount** announced through `aria-live="polite"`. Because most fields are required, only optional ones are marked "(optional)". Input widths match the expected value — Date 160 px, Tons 144 px, Rate 160 px, Vehicle 176 px, GSTIN 224 px ([Baymard](https://baymard.com/blog/form-field-usability-matching-user-expectations)). Numeric fields use `type="text" inputMode="decimal"` instead of `type="number"`, which suffers from scroll-wheel changes and locale bugs, and carry unit add-ons through shadcn `InputGroup`: "₹" in front, "t" or "/t" behind ([shadcn Input Group](https://ui.shadcn.com/docs/components/input-group)). Masks are "soft" and normalise on blur: vehicle numbers are uppercased, stripped of spaces, validated against `^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$` (or the BH series) and displayed as "GJ 03 AX 4521", while GSTIN is uppercased and capped at 15 characters. Neither regex has been verified against official specifications.

Error copy follows GOV.UK and NN/g: say what is wrong and how to fix it, avoid "invalid", "please", "sorry" and "oops", and keep the user's input ([GOV.UK error message](https://design-system.service.gov.uk/components/error-message/); [NN/g](https://www.nngroup.com/articles/error-message-guidelines/)). Typical messages are "Enter tons as a number, like 12.450", "Choose a supplier" and "Enter the vehicle number like GJ03AX4521". When a form has unsaved changes, a router blocker and `beforeunload` warn before the user leaves, and half-filled delivery and purchase drafts are saved to localStorage so a dropped yard connection never loses work.

### The live limits panel is the product's signature component

A delivery is capped by three numbers: the PO's remaining quantity, the material's stock in the yard and the chosen supplier's stock. The panel shows all three as `LimitMeter` rows, each with a small bar, followed by one computed sentence that names the binding constraint in bold ("**You can deliver up to 9.200 t** — limited by Shree Ganesh Metals stock") and a preview line that updates as the user types ("After this delivery: PO left 5.750 t · supplier stock 3.200 t"). The panel has four states: neutral below 80% of the maximum; amber with a warning icon and "Close to the limit" from 80% to 99%; red with an icon and the exact message above 100%, which blocks Save on submit; and skeleton rows with "Checking limits…" while the limits are being fetched. A **"Use max"** button fills in the maximum. The limits refetch, debounced 300 ms, whenever the PO, supplier or date changes, and the server's 409 remains the final guard: when it fires, the panel refreshes from the `remaining`, `available` and `maxAllowed` numbers in `error.details` instead of showing a generic toast. The supplier picker lists only suppliers holding that material, sorted by stock with each supplier's tons shown, and quantity defaults to the smallest of the three limits. This design depends on the read-only capacity endpoint recommended in the earlier research; without it, the panel would have to stitch together report calls whose as-of dates may not match.

### Bars compare, lines show trends, labels sit on the data, and tables handle precision

The UK Government Analysis Function supplies the chart rules: bars for comparing categories and lines whenever there is more than one time series, direct labels instead of legends (a legend that relies on colour fails WCAG 1.4.1), bar axes starting at zero, about four lines at most, and a table whenever users need exact values ([Analysis Function](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/)). shadcn Charts run on Recharts v3, take series colours from `ChartConfig` as `var(--chart-n)` rather than the old `hsl(var(--chart-n))`, need an explicit height or aspect ratio on `ChartContainer`, and gain keyboard and screen-reader support through `accessibilityLayer` ([shadcn Chart](https://ui.shadcn.com/docs/components/chart)).

| Chart | Question it answers | Design |
|---|---|---|
| Horizontal grouped bars | Stock vs open demand per material | Sorted by shortage, end labels ("Short 24.500 t"), warning icon on shortages |
| Bullet / progress bar | PO fulfilment | "18.250 of 30.000 t · 61%" |
| Two-line chart | Tons bought vs delivered per week | Direct labels; solid vs dashed lines as a redundant cue |
| Rate trend line (once the endpoint exists) | Average buy vs sell ₹/t per material | Y-axis may start above zero; compact ₹ labels |

Every chart has a "View as table" toggle, and with more than eight materials the stock chart becomes a table with inline bars. On phones, values appear as data labels rather than tap tooltips, because Recharts' touch tooltips have a long history of problems.

## Indian numbers follow one formatter: exact in tables, compact only on tiles

`Intl.NumberFormat('en-IN')` produces Indian 3-then-2 grouping, such as ₹11,87,894.21 ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)). Given a **string**, it formats "the exact value that the string represents", so API decimals can remain strings from the response all the way to the screen ([MDN format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format)). Built-in compact notation cannot be trusted for this audience: a local test printed **"1.2KCr"** for about ₹119 crore, and rounding defaults vary. All formatting therefore lives in `lib/format.ts`, which includes a small custom compact formatter, and nothing else in the app formats numbers.

| Kind | Rule | Example |
|---|---|---|
| Tons (tables) | 3 fixed decimals, en-IN grouping, unit in the column header | `1,284.500` |
| Tons (cards, forms, sentences) | Same, with a " t" suffix | `12.450 t` |
| Tons (KPI tile) | 1 decimal, exact value in tooltip or subtitle | `286.5 t` (exact 286.450 t) |
| Money (tables) | 2 fixed decimals, en-IN grouping, "₹" in the header rather than the cells | `11,87,894.21` |
| Money (cards, forms, toasts) | With the ₹ symbol | `₹11,87,894.21` |
| Rate | ₹ with "/t" | `₹38,500.00/t` |
| Money (KPI tile, chart axis) | Custom compact: under ₹1 L shows full rupees, ₹1 L up to ₹1 Cr shows lakh, ₹1 Cr and above shows crore; at most 3 significant digits and a space before the unit | `₹8.75 L`, `₹12.5 L`, `₹1.96 Cr`, `₹245 Cr` |
| Percent | 0 decimals in badges and bars; 1 decimal only in reports | `61%` |
| Negative | True minus (U+2212) plus destructive colour and icon | `−2.300 t` |
| Zero vs not applicable | Real zero shows as zero; not applicable shows a dash | `0.000` vs `—` |
| Dates (records) | Always DD/MM/YYYY | `27/09/2026` |
| Dates (freshness, activity) | Relative, with the absolute date in `<time title>` | "Updated 2 min ago" |
| Delta | Arrow, sign and words | "▲ 8% vs Aug", "▼ 3.200 t vs last week" |

Compact values never appear in tables, forms or anything a user might copy into an invoice. Arithmetic such as Tons × Rate and limit comparisons runs through big.js on strings, never on floats. Validation uses the backend's scales, `^\d+(\.\d{1,3})?$` for tons and `^\d+(\.\d{1,2})?$` for money, and dates go to the API as `yyyy-MM-dd` through date-fns, never through `toISOString()`, which shifts IST dates back a day. Timestamps follow Cloudscape's rule of absolute dates for records and relative time only for activity and freshness ([Cloudscape](https://cloudscape.design/patterns/general/timestamps/)). Progressive disclosure keeps the numbers digestible: list pages show 6–9 columns with the rest available behind the column menu, detail pages lead with 3–5 stat cards before the full record, and exceptions such as negative stock, shortages and aged orders always surface as colour, icon and words together.

## Every state has a designed screen, and errors quote the backend's own numbers

### Show nothing under a second, skeletons for pages, spinners for parts, and keep the old rows

NN/g's response-time limits still hold: 0.1 s feels instant, 1 s preserves the flow of thought and 10 s is the limit of attention ([NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/)). Its skeleton-screen guidance, reviewed again in September 2026, follows from them: under 1 s show neither skeletons nor spinners, because a quick flash makes users "feel like they can't keep up"; from 2 to 10 s use spinners for single modules and content-shaped skeletons for full pages; beyond 10 s use progress bars; and never use frame-only skeletons, which carry no layout information ([NN/g Skeleton Screens](https://www.nngroup.com/articles/skeleton-screens/)). The app encodes this with shared timing tokens: a loader waits **500 ms** before appearing and, once shown, stays for at least **500 ms**. Both values are engineering conventions rather than NN/g figures.

| Situation | Treatment |
|---|---|
| First load of a list | Skeleton rows at the real row height and column widths; header and filter bar already live |
| Filter or page change | `placeholderData: keepPreviousData` keeps old rows visible, dimmed to 60% while `isPlaceholderData`; a 2 px progress line runs under the toolbar and "Next" waits for data ([TanStack Query v5](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)) |
| Background refetch | Only the "Updated…" text changes and the refresh icon spins |
| Single dashboard card | A spinner or skeleton inside that card only |
| Save button | An immediate spinner with "Saving…", width locked, `aria-busy` |
| Export over 10 s | A determinate progress bar with "32 of 120 rows" |

Skeletons reserve the final height, so nothing jumps when the data arrives. **Optimistic updates are limited to trivial metadata.** Anything touching stock or money — purchases, deliveries, PO cancellation, backdated edits and deactivation — stays pessimistic, because the server can answer with `INSUFFICIENT_SOURCE_STOCK`, `NEGATIVE_STOCK_HISTORY` or `DUPLICATE_VALUE`, and rolling back a number the user has already seen is worse than a one-second wait ([TanStack optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)). This reverses the earlier report's suggestion to insert new purchases optimistically.

### Three kinds of empty state, each with one way forward

NN/g asks empty states to say that nothing is there, teach the feature, and offer a direct path to the key task ([NN/g](https://www.nngroup.com/articles/empty-state-interface-design/)), and Polaris asks them to encourage without making merchants "feel unsuccessful or guilty" ([Polaris](https://polaris.shopify.com/components/structure/empty-state)). shadcn's `Empty` component provides the structure through `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription` and `EmptyContent` ([shadcn Empty](https://ui.shadcn.com/docs/components/empty)).

| Case | Example copy | Action |
|---|---|---|
| **First use** | "No deliveries yet. When scrap goes out to a buyer, record it here. Stock updates automatically." | Add delivery |
| **No results** | "No purchases match these filters", followed by the active filters | Clear filters |
| **All done** | "All materials are stocked. Nothing needs to be purchased right now." | None |

"No results" keeps the table header and filter bar visible so the user can see what is filtering the data. An empty state renders only when the query has succeeded with zero rows, never while loading or after an error. VIEWERs see the explanation without the button: "Ask the owner to add companies."

### Errors sit closest to their cause, in plain words, with numbers from `details`

NN/g's 2023 guidelines ask that errors sit near their source, use redundant indicators and plain, specific, blame-free language, and preserve the user's input ([NN/g](https://www.nngroup.com/articles/error-message-guidelines/)). WCAG 4.1.3 requires status messages to be programmatically determinable without taking focus, using `role="alert"` for errors and `role="status"` for results ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)), and Carbon never times out critical messages, keeping inline notifications until they are resolved ([Carbon notifications](https://carbondesignsystem.com/components/notification/usage/)). The API client throws a typed `ApiError { status, code, message, details, requestId }`, and a copy dictionary keyed by `code` produces the user-facing text, which also keeps future Hindi or Gujarati localisation simple. Raw codes never appear; the requestId, labelled "Reference", is the only technical token users see.

| Backend response | Where it appears | Example copy | One-tap fix |
|---|---|---|---|
| **422** field issues | `setError(path)` on each field + "There is a problem" summary at the form top, focused; never a toast | "Enter tons as a number, like 12.450" · "Choose a supplier" · "Enter the vehicle number like GJ03AX4521" | Summary links jump to fields |
| **409 PO_QUANTITY_EXCEEDED** | Error on Tons + destructive Alert at form top; limits panel refreshed from `details` | "PO-0142 has only 11.750 t left to deliver. You entered 12.000 t. Enter 11.750 t or less." | "Use 11.750 t" |
| **409 INSUFFICIENT_STOCK** | Same | "Only 71.500 t of HMS 1 is in the yard. You entered 80.000 t. Enter 71.500 t or less." | "Use 71.500 t" |
| **409 INSUFFICIENT_SOURCE_STOCK** | Same, with the supplier field highlighted | "Only 9.200 t of HMS 1 from Shree Ganesh Metals is left. Enter 9.200 t or less, or choose another supplier." | "Use 9.200 t" · "Choose another supplier" |
| **409 DUPLICATE_VALUE** | Error on the offending field | "Invoice number ST/26-27/418 is already used on another purchase. Enter a different number." | "Open that purchase" |
| **409 NEGATIVE_STOCK_HISTORY** | Destructive Alert inside the edit form; input kept | "This change would make HMS 1 stock go below zero on 18/09/2026. Change the quantity or date, or edit the later deliveries first." | "View stock history" |
| **403** | Prevented by hiding write actions; inline Alert if it still occurs | "You have view-only access. Ask the owner if you need to make changes." | — |
| **404** | Full route state | "We couldn't find this sales order. The link may be wrong." | "Go to Sales Orders" |
| **401** | Silent single-flight refresh and retry; if the refresh fails, a re-login dialog **over** the form rather than a redirect | "Your session has ended. Log in again to save this delivery — your entries are kept." | Log in |
| **429** | Non-blocking warning; GETs retry with backoff; form kept | "Too many requests in a short time. Wait a few seconds and try again." | Try again |
| **500** | Persistent inline Alert with a copyable reference | "Something went wrong on our side and this purchase was not saved. Try again. If it keeps happening, share this reference with support: 7f3a9c2e." | "Try again" · "Copy reference" |
| **Network / timeout** | Inline error + global offline banner | "No internet connection. Your entries are still here — try again when you're back online." | Try again |
| **GET failure in a section** | Error state inside that section, not a toast | "Couldn't load stock summary. Check your connection and try again." | Try again (`refetch`) |
| **Render crash** | Route-level and widget-level error boundary | "This page stopped working. Reload the page. Your saved records are safe." | Reload |

Queries do not retry 4xx responses, so those errors reach users quickly, and create mutations never retry automatically unless the backend adds an idempotency key. While the device is offline, a persistent warning banner reads "You're offline. Changes can't be saved until the connection is back", and a brief "Back online" appears with `role="status"` when the connection returns.

### Success, notifications, alerts and tooltips reinforce what the page already shows

GitHub Primer now **recommends against toasts altogether**, citing timing, focus-order, keyboard and magnification failures, and argues that simple successes should be self-evident ([Primer](https://primer.style/accessibility/patterns/accessible-notifications-and-messages/)). The app therefore always shows the result in the page first: after a save the Sheet closes, the new row is highlighted and scrolled into view, focus moves to it, and only then does a short toast confirm. Sonner's defaults are bottom-right, 4 s, three visible toasts and Alt+T to focus the toaster ([Sonner](https://sonner.emilkowal.ski/toaster)). The app keeps 4 s for plain successes, holds any toast with an action for at least 10 s with a close button (Carbon's rule for actionable toasts), keeps the rare error toast until dismissed, and moves toasts to bottom-centre above the bottom bar on mobile. Toast copy is a noun plus a past-tense verb, under about 60 characters and without "successfully" — for example "Delivery saved · 6.000 t to Bharat Castings" with "View" and "Add another", or "Company deactivated" with "Undo" where reactivation exists.

Persistent in-page `Alert`s cover conditions that stay true until resolved, such as "This order was cancelled on 14/09/2026 by Rajesh Patel. Deliveries can't be recorded against it." There are four severities — Info (blue), Success (green), Warning (amber) and Error (red) — each with an icon and a word as well as a colour, and warnings about the current state of the data are never dismissible; they disappear when the condition is resolved. Tooltips only name icon-only buttons and add short hints on desktop. Help that users need in order to succeed goes into visible helper text instead ("Weight after deducting the truck (tare)"), and domain terms such as "Supplier stock" get a small "i" button that opens a `Popover`, because hover does not exist on phones. Native `disabled` buttons cannot show tooltips, since they receive no focus or pointer events ([CSS-Tricks](https://css-tricks.com/making-disabled-buttons-more-inclusive/)), so any control that must look unavailable uses `aria-disabled` (Base UI's `focusableWhenDisabled`) together with visible reason text.

### Confirmations are rare, specific and labelled with verbs

NN/g reserves confirmations for actions "with serious consequences", warns that "if you cry wolf too many times, people will stop paying attention", and asks dialogs to name the object and label buttons with the outcome ("Delete file" / "Keep file") rather than asking "Are you sure?" ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/)). The app confirms only four things: cancelling a sales order, deactivating a company or material, saving a backdated edit that changes stock history (with the impact shown before saving), and leaving a form with unsaved changes. Routine creates and edits are never confirmed. Every confirmation uses `AlertDialog`, with initial focus on the safe button, a spinner on the destructive button while the request runs, and any 409 shown inside the dialog instead of closing it. In a dialog about cancelling an order, the dismiss button reads "Keep order", never "Cancel".

## Motion stays under 300 ms and exists only to give feedback

### Six micro-interactions earn their place; count-ups and shakes do not

NN/g defines micro-interactions as trigger-feedback pairs ([NN/g](https://www.nngroup.com/articles/microinteractions/)) and accepts animation for four purposes — feedback, state change, spatial navigation and signifiers — asking that it be "subtle, unobtrusive, and brief" and noting that decorative motion "often frustrate[s] participants" ([NN/g](https://www.nngroup.com/articles/animation-purpose-ux/)). web.dev's INP guidance adds that feedback must appear in the very next painted frame, or users click again ([web.dev INP](https://web.dev/articles/inp)). The app keeps six micro-interactions: a 1 px press shift on buttons with no ripple; a Save sequence that moves from spinner to a check for 1.2 s and back to the label; progress and limit meters whose fills animate on value change; copy feedback that swaps the icon and shows "Copied" for 1.5 s; a highlight on new or edited rows that fades over 1.5 s; and shadcn's default overlay, accordion and tab motion. It rejects KPI count-ups, validation shake (a vestibular trigger that must never be the only error signal ([animationpatterns.art](https://animationpatterns.art/animations/error-shake-feedback/))), shimmer skeletons (a static or slow-pulse skeleton that stops under reduced motion replaces them), and confetti, parallax, pull-to-refresh and animated illustrations, which drain battery on low-end Android phones.

### Motion tokens come from Carbon, Material 3 and NN/g

NN/g places most UI animation between **100 and 500 ms**, with about 100 ms for simple feedback and 200–300 ms for modals, warns that "at 500 ms, animations start to feel like a real drag", and recommends ease-out for entering elements, ease-in for exiting ones, and exits slightly shorter than entrances ([NN/g](https://www.nngroup.com/articles/animation-duration/)). Carbon's productive tokens supply concrete values — durations of 70, 110, 150, 240 and 400 ms, and easing curves of `(0.2, 0, 0.38, 0.9)` for standard, `(0, 0, 0.38, 0.9)` for entrance and `(0.2, 0, 1, 0.9)` for exit ([Carbon motion.json](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/motion/src/dtcg/motion.json)) — and Material 3's emphasized-decelerate curve `(0.05, 0.7, 0.1, 1)` suits full-height sheets ([compose-skill M3 reference](https://raw.githubusercontent.com/aldefy/compose-skill/master/skills/compose-expert/references/material3-motion.md)). The full token table and per-component values are in the Screen specifications.

Three rules govern how the tokens are applied: exits run at 0.7–0.8× their entrance duration; anything repeated many times a minute, such as row hover, sorting and filter chips, gets only a colour change of 100 ms or less; and typing and keyboard navigation never animate. Only `transform` and `opacity` animate, because layout and blur properties are expensive ([web.dev](https://web.dev/articles/animations-guide)); that means removing shadcn base-nova's `backdrop-blur-xs` on dialog overlays below `md` and narrowing the button's `transition-all` to colour, border, shadow and transform. WCAG 2.3.3 (AAA) lets users disable motion triggered by interaction and does not count opacity or colour changes as motion ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)), so the global `prefers-reduced-motion` rule removes transforms and keeps only fades of 100 ms or less. An in-app "Reduce animations" switch in the user menu does the same on low-end phones, following Fluent's advice to offer a no-motion setting ([Fluent 2](https://fluent2.microsoft.design/motion)). Route changes use React 19.3's now-stable `<ViewTransition>` as a 150 ms cross-fade ([React 19.3](https://react.dev/blog/2026/09/09/react-19-3)); React does not honour reduced motion for these by itself, so the CSS must null `::view-transition-old` and `::view-transition-new` ([react.dev](https://react.dev/reference/react/ViewTransition)), and ViewTransition stays off large tables because it animates snapshots of hundreds of rows. The Motion library stays optional; if a gesture ever needs it, it loads through `LazyMotion` with `domAnimation`, about 4.6 kB initially plus 15 kB for the feature bundle ([Motion](https://motion.dev/docs/react-reduce-bundle-size)).

### One state vocabulary across every control

shadcn base-nova's button already encodes most of the state vocabulary: `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` for focus, `active:translate-y-px` for press, `disabled:opacity-50` for disabled, and `aria-invalid:border-destructive aria-invalid:ring-destructive/20` for invalid ([shadcn base-nova button](https://ui.shadcn.com/r/styles/base-nova/button.json)). WCAG 2.2 requires a visible focus indicator (2.4.7) that is at least partly unobscured (2.4.11) ([W3C](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)), and 1.4.11 requires 3:1 contrast for UI components and focus indicators while exempting hover states and disabled controls ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). A 50%-alpha ring on a white page may miss 3:1, so the app replaces it with a **solid 2 px `outline-ring` with a 2 px offset**, which also meets the AAA Focus Appearance guidance ([W3C 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)). Selected states pair colour with a non-colour cue (a check, a left bar or bold text) and the right ARIA attribute (`aria-selected`, `aria-current="page"` or `aria-pressed`). Read-only states — for VIEWERs, or for the locked PO in a delivery form — render plain text or `readOnly` inputs on `bg-muted/40` with a lock icon, still focusable and copyable. Disabled states are avoided where possible and explained in visible text when they cannot be. `cursor-pointer` is restored on buttons because Tailwind v4's preflight changed their default cursor. The per-component table is in the Screen specifications.

## Phones get cards, drawers and a thumb-reach bottom bar

The breakpoints follow Tailwind v4's defaults of 640, 768, 1024, 1280 and 1536 px, with **`md` (768 px) as the main switch** because it matches shadcn's `MOBILE_BREAKPOINT` ([Tailwind](https://tailwindcss.com/docs/responsive-design)). Container queries (`@container`) let StatCard grids and detail panels adapt inside split views.

| Width | Navigation | Lists | Forms and overlays | Layout |
|---|---|---|---|---|
| < 640 px (phones) | Bottom bar (4 destinations + centre "+"), "More" Sheet | Cards, "Load more" | Full-height bottom Drawer, sticky Save bar | Single column, 16 px gutter |
| 640–767 px (large phones) | Same | Cards | Drawer | Single column |
| 768–1023 px (tablets) | Icon-rail sidebar (3rem) | Table with horizontal scroll and pinned first column | Right Sheet; Dialog centred | 2-column forms for paired fields |
| 1024–1279 px (laptops) | Expanded sidebar (collapsible) | Full table | Sheet / Dialog | Detail 2/3 + 1/3 |
| ≥ 1280 px (desktops) | Expanded sidebar | Full table, 4-up KPI grid | Sheet / Dialog | Unbounded content width for lists |

Material 3 caps a navigation bar at 3–5 destinations and says compact windows under 600 dp should always use one ([Material 3](https://m3.material.io/components/navigation-bar/guidelines)), while NN/g advises keeping mobile navigation visible when it has four or fewer items ([NN/g](https://www.nngroup.com/articles/hamburger-menus/)). The OWNER's bottom bar therefore holds Home, Purchases, a raised centre "+" that asks "What are you recording?" (Purchase for scrap coming in, Delivery for scrap going out, or Sales order), Orders, and More, a Sheet with Deliveries, Supplier stock, Company report, Companies, Materials and Settings. VIEWERs get Home, Purchases, Orders, Stock and More, without the "+". Below `md`, dialogs become bottom Drawers through a `ResponsiveDialog` composite; shadcn's Drawer now runs on Base UI rather than Vaul and supports snap points ([shadcn Drawer](https://ui.shadcn.com/docs/components/base/drawer)).

Touch sizing needs a deliberate bump. WCAG 2.2 AA sets a 24×24 CSS px minimum target ([W3C 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)), Android asks for at least 48 dp ([Android](https://developer.android.com/guide/topics/ui/accessibility/apps)) and NN/g for at least 1 cm × 1 cm ([NN/g](https://www.nngroup.com/articles/touch-target-size/)), yet base-nova's buttons are only 24–36 px tall. A Tailwind `pointer-coarse:` variant therefore raises buttons and inputs to `h-11` (44 px), icon buttons to `size-11`, list rows to at least 48 px and bottom-bar items to 64 px on touch devices, while desktop keeps shadcn's density. Mobile inputs use at least 16 px text so iOS does not zoom ([CSS-Tricks](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)); decimal fields use `inputmode="decimal"` and phone fields `type="tel"` ([MDN inputmode](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode)); fields set `enterkeyhint="next"` (or `"done"` on the last one); and GSTIN and vehicle fields set `autocapitalize="characters"`. Primary actions sit in a sticky bottom bar padded by `env(safe-area-inset-bottom)`, and destructive actions live in overflow menus, never beside Save.

For outdoor use, a **"Sunlight" high-contrast theme** in the user menu switches to a pure white background, near-black text at 7:1 or better, 2 px input borders, no low-alpha greys, a 16 px base font and bold key figures, and it also follows `prefers-contrast: more`. No research gives sunlight-specific numbers, so WCAG AAA's 7:1 serves as the nearest standard.

## WCAG 2.2 AA is mostly token and wiring work the app must own

Base UI supplies keyboard interaction, focus trapping and return, ARIA roles, and the `data-open`, `data-disabled` and `data-starting-style` hooks, and it waits for exit animations before unmounting ([Base UI](https://base-ui.com/react/handbook/animation)). Everything else belongs to the app, including the criteria WCAG 2.2 added — Focus Not Obscured (2.4.11), Dragging Movements (2.5.7), Target Size (2.5.8), Consistent Help (3.2.6), Redundant Entry (3.3.7) and Accessible Authentication (3.3.8) ([W3C](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)).

| # | Criterion | App obligation | Owner |
|---|---|---|---|
| 1 | 1.4.3 Contrast (text) | ≥ 4.5:1 for all text; darken `--muted-foreground` so it passes on `--muted` backgrounds too; amber badges use dark text | Tokens |
| 2 | 1.4.11 Non-text contrast | Input and checkbox borders ≥ 3:1 (strengthen `--input`); focus ring ≥ 3:1; chart marks ≥ 3:1 vs background | Tokens |
| 3 | 1.4.1 Use of colour | Status badges, deltas, limit meters and chart series always carry text or icon as well as colour | Composites |
| 4 | 2.1.1 Keyboard | Every action reachable by Tab/Enter/Space/Esc; row links focusable; skip link to main content | Composites |
| 5 | 2.4.7 / 2.4.11 Focus visible, not obscured | Solid 2 px outline; `scroll-padding-top/bottom` so the sticky header, sticky Save bar and bottom nav never hide the focused field | Global CSS |
| 6 | 2.4.3 Focus order | Focus returns to the trigger after overlays close (Base UI default) and moves to the new row after save | Composites |
| 7 | 2.5.8 Target size | ≥ 24 px everywhere (row action icons `size-6` is the floor); 44–48 px on touch | Tokens |
| 8 | 2.5.7 Dragging | Any reorder or upload has button alternatives | Features |
| 9 | 3.3.1 / 3.3.3 Error identification & suggestion | Text errors with fixes, `aria-invalid`, `aria-describedby`, focused error summary, visually hidden "Error:" prefix | Forms |
| 10 | 3.3.4 Error prevention (financial/data) | Limits panel before submit; confirm or undo for cancel, deactivate and backdated edits | Features |
| 11 | 4.1.3 Status messages | Toasts, "Saved", "Copied" and "Showing 24 purchases" in polite live regions; errors `role="alert"` | Composites |
| 12 | 3.2.6 Consistent help | Help, shortcuts and WhatsApp support link in the same place (sidebar footer) on every page | Shell |
| 13 | 3.3.7 Redundant entry | Pre-fill supplier, material, rate, PO data and vehicle from previous steps | Forms |
| 14 | 3.3.8 Accessible authentication | Allow paste and password managers; `autocomplete` on login; OTP autofill if added | Login |
| 15 | 1.3.1 Info & relationships | Real `<table>` with `<th scope="col">`, `aria-sort`, caption or `aria-label`; cards use `<dl>`; every input has a `<label>` (Field wiring) | Composites |
| 16 | 1.1.1 Non-text content | Charts have a text summary and a "View as table" toggle; icon-only buttons have `aria-label` | Composites |
| 17 | 1.4.4 / 1.4.10 Resize and reflow | Usable at 320 px and 200% zoom; never set `maximum-scale=1` | Global |
| 18 | 3.1.1 / 3.1.2 Language | `<html lang="en-IN">`; `lang="hi"` or `"gu"` on translated UI later | Shell |
| 19 | 2.3.3 (AAA, cheap) | `prefers-reduced-motion` covers tw-animate-css, ViewTransition and any Motion use; in-app toggle | Global CSS |

shadcn's React Hook Form guide handles part of item 15 by wiring `data-invalid` on `Field` and `aria-invalid` on the control ([shadcn RHF guide](https://ui.shadcn.com/docs/forms/react-hook-form)), tweakcn's contrast checker covers the token work in items 1 and 2 ([tweakcn](https://github.com/jnsahaj/tweakcn)), and `eslint-plugin-jsx-a11y` belongs in CI.

## Three clicks per core task, with defaults doing the rest

NN/g's rule on defaults is simple: "Pre-populate fields with the most common value if you can determine it in advance". Defaults act as just-in-time instructions, and most users keep them ([NN/g](https://www.nngroup.com/articles/the-power-of-defaults/)). DWP's notes on "add another" add that internal services need speed where public ones need clarity ([DWP](https://f-new-site.design-system.dwp.gov.uk/patterns/add-another-thing/design-notes)).

In the table below, a "click" includes choosing an option. Typing is not counted. The targets assume a desktop user with the OWNER role. They are design goals rather than measured times, and should be checked in a 3–5 user test.

| Flow | Fastest entry point | Steps | Clicks (desktop) | Keyboard path | Phone taps |
|---|---|---|---|---|---|
| **Record a purchase** | "+ New › Purchase", the Purchases primary button, or dashboard "+ Purchase" next to a shortage | Sheet opens with date = today and supplier, material and rate = last used (rate = that supplier's last rate for the material) → confirm or change supplier → confirm or change material → type tons (and vehicle/invoice) → Save | **4** (2 when defaults match) | Alt+P → type → Ctrl+Enter | 5 ("+" → Purchase → fields → Save) |
| **Create a sales order** | Sales Orders primary button, customer detail page (customer pre-filled), Alt+O | Customer (SALE/BOTH only) → material → quantity and rate typed → Save; toast offers "Record delivery now" | **4** | Alt+O → type → Ctrl+Enter | 5 |
| **Record a delivery against a PO** | "Deliver" on the PO row, PO detail, or dashboard "Orders waiting" | Sheet opens with PO locked and customer/material/rate shown → choose "Stock from" supplier (sorted by stock, tons shown) → quantity pre-filled with the maximum allowed, or type less → Save; a fully delivered PO turns Completed and leaves the Open view | **3** | Alt+D → pick PO → pick supplier → Ctrl+Enter | 4 |
| **Check what to buy** | Dashboard (home) "Buy needed" | Read shortage per material → "+ Purchase" beside it opens the Sheet with material pre-filled | **0–1** | — | 0–1 |
| **Look up a company's history** | Ctrl+K → type name → Enter | Lands on company detail with FY-to-date stat cards and tabs (Purchases / Sales orders / Deliveries / Stock) held in the URL | **2** | Ctrl+K → type → Enter | 3 (More → Companies → card) |
| **See a supplier's stock** | Sidebar › Supplier stock | Table of supplier × material with purchased / used / available bars; filter by material | **2** | Ctrl+K → "stock" → Enter | 3 |

Most of the savings come from ten click reducers, listed roughly in order of impact.

| Click reducer | What it removes |
|---|---|
| **"Deliver" where the decision is made** (PO row, PO page, dashboard) | Picking the PO at all |
| **Delivery quantity defaults to the maximum allowed**, and "Use max" is the fix inside every limit error | Calculating and retyping the limit |
| **Predictable defaults**: today's date, last-used supplier, material and rate (tagged "Last used", always editable), PO-inherited data | Two to three picks per purchase |
| **Inline creation**: every `EntityCombobox` ends with "+ Add '<typed text>'" (Alt+C, as in Tally), which opens a small pre-filled Dialog and auto-selects the new record | Five or more clicks spent leaving the form and coming back |
| **"Save & add another"**, which keeps date and supplier, clears quantity, vehicle and invoice, and refocuses the first cleared field | Reopening the form for each truck |
| **"Repeat purchase"** in the row menu, opening a pre-filled copy | Re-entering repeat supplies, which arrive every few days |
| **Filters and views held in the URL** | Re-filtering after drill-downs or Back |
| **Sales Orders open on the "Open" tab** | Filtering out completed orders |
| **Keyboard-first entry**: Enter to the next field, Ctrl+Enter to save, Ctrl+K to go anywhere | Mouse travel for accountants |
| **A centre "+" on phones** reaching either transaction in two taps | Navigating to the right list first |

## Base UI, semantic tokens and a dozen composites keep the system consistent

### Radix vs Base UI: choose Base UI once, at project start

In July 2026 shadcn made **Base UI the default component library**, at Base UI 1.6.0 with more than 6M weekly downloads. By then, new projects were already choosing Base UI over Radix by 2 to 1. shadcn also stated that "Radix is not being deprecated… every update and new component will ship for both libraries" ([shadcn changelog](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)).

Three facts decide it for this app. **Base UI has primitives Radix never shipped — Combobox, Autocomplete and Number Field** ([OpenReplay](https://blog.openreplay.com/shadcn-ui-radix-base-ui-switch/)) — and the shadcn Combobox's default implementation is built on Base UI's, which matters because `EntityCombobox` is the app's most important input after the numeric fields. shadcn's Drawer now runs on Base UI with snap points ([shadcn Drawer](https://ui.shadcn.com/docs/components/base/drawer)), and there is a native Base UI Toast ([shadcn Toast](https://ui.shadcn.com/docs/changelog/2026-07-toast)).

The cost is real. **satnaing/shadcn-admin is Radix-based** ([GitHub](https://github.com/satnaing/shadcn-admin)), and the two libraries differ in many small ways ([OpenReplay](https://blog.openreplay.com/shadcn-ui-radix-base-ui-switch/)):

| Radix | Base UI |
|---|---|
| `asChild` | `render` |
| `Content` | `Positioner > Popup` |
| `Overlay` | `Backdrop` |
| `data-[state=open]` | `data-open` |
| `onOpenChange` + `event.preventDefault()` | `onOpenChange(open, details)` + `details.cancel()` |
| Select value never null | Select values are `Value \| null` |
| Tabs arrow keys switch panels | Tabs arrow keys only move focus unless `activateOnFocus` is set |
| Checkbox and radio menu items close on click | They stay open by default |

The decision, which revises the earlier "fork shadcn-admin" advice, is to **run `shadcn init` with the Vite template on Base UI using the compact Nova style**, port shadcn-admin's MIT shell and feature layout code onto the freshly generated Base UI primitives, and never mix `asChild` and `render` conventions within one `components/ui`. A team that insists on forking shadcn-admin as it stands should instead stay fully on Radix, which is supported and simpler, using Popover + Command for pickers and Sonner for toasts. Either way, pin `components.json`, run `shadcn add --dry-run`/`--diff` before every add, and pass `-b` explicitly in CI scripts.

Toasts go through a single `lib/notify.ts` wrapper. Sonner is the recommended starting point because its defaults are documented and its API is simpler, and it still works in a Base UI project; the wrapper keeps a later switch to Base UI Toast a one-file change, since the two APIs differ ([GitHub discussion](https://github.com/shadcn-ui/ui/discussions/11317)). Pin `react-day-picker` (shadcn's copied Calendar breaks on DayPicker v10 until it is regenerated ([shadcn issue #10914](https://github.com/shadcn-ui/ui/issues/10914))), `recharts@3` and `@base-ui/react`.

### Which shadcn component serves each need

| Need in this app | shadcn components (Base UI) | Notes |
|---|---|---|
| App shell | `Sidebar` (`collapsible="icon"`, `variant="inset"`; blocks `dashboard-01`, `sidebar-07`), `SidebarInset`, `SidebarTrigger`, `SidebarMenuBadge`, `Breadcrumb`, `Separator`, `DropdownMenu`, `Avatar` | Ctrl+B and cookie persistence built in |
| Mobile navigation | Custom `BottomNav` (built from `Button` + router links), `Sheet` for "More", `Drawer` for the "+" action sheet | The shadcn Sidebar auto-becomes a Sheet below 768 px |
| Command palette | `Command` in `CommandDialog`, `CommandShortcut`, `Kbd` / `KbdGroup` | "Search… Ctrl K" button in the header |
| Page header | `Breadcrumb`, `Button`, `ButtonGroup`, `DropdownMenu` | Wrapped as `PageHeader` |
| KPI tiles | `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`), `Badge`, `Tooltip`, `Skeleton` | Wrapped as `StatCard` |
| Charts | `Chart` (`ChartContainer`, `ChartTooltip`, `ChartLegend`, `accessibilityLayer`), `ToggleGroup` for period | Recharts v3; `var(--chart-n)` |
| Data tables | `Table` + TanStack Table v9 guide, `DropdownMenu` (row actions, columns), `Pagination`, `Select` (page size), `Checkbox` (only if selection is ever added), `ScrollArea` | Wrapped as `DataTable` with mobile card mode |
| Mobile lists | `Item` / `ItemGroup` or `Card` | Rendered by `DataTable` `renderMobileCard` |
| Filters and search | `InputGroup` (search icon), `Popover` + `Calendar mode="range"`, `Combobox`, `Select` / `NativeSelect`, `Tabs` (quick views), `Badge` (chips), `Drawer` (mobile) | Wrapped as `FilterBar` and `DateRangePicker` |
| Forms | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`, `FieldGroup`, `Input`, `InputGroup` (`InputGroupAddon` ₹, t, /t), `Textarea`, `Combobox`, `NativeSelect`, `RadioGroup`, `Switch` | RHF `Controller` + `Field` pattern ([shadcn RHF](https://ui.shadcn.com/docs/forms/react-hook-form)) |
| Entity pickers | `Combobox` (Base UI) with async search | Wrapped as `EntityCombobox` |
| Date inputs | `Popover` + `Calendar` (single/range) | DD/MM/YYYY display; `yyyy-MM-dd` to API |
| Money and tons inputs | `InputGroup` + react-number-format `NumericFormat` (`thousandsGroupStyle="lakh"`) | Wrapped as `MoneyInput` / `TonsInput`; string values |
| Delivery limits | `Card`, `Progress` (meter), `Alert`, `Button` ("Use max") | Wrapped as `LimitMeter` + `DeliveryLimitsPanel` |
| Status | `Badge` with added `success` / `warning` / `info` variants | Wrapped as `StatusBadge` |
| Create/edit containers | `Sheet` (desktop), `Drawer` (mobile), `Dialog` (inline create) | Wrapped as `ResponsiveDialog` / `FormSheet` |
| Confirmation | `AlertDialog` | Wrapped as `ConfirmDialog` |
| Loading | `Skeleton`, `Spinner`, `Progress` | `Spinner` inside `Button` |
| Empty states | `Empty` (`EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`) | Wrapped as `EmptyState` |
| Messages | `Alert` (+ added variants), Sonner via `notify` | |
| Help | `Tooltip` (icon buttons), `Popover` (info "i"), `Kbd` | No `HoverCard` for essential info |
| Detail pages | `Card`, `Tabs`, `Item` (key/value), `Separator`, `Badge`, `Progress` | Wrapped as `DetailHeader`, `KeyValueList` |
| Login | `login-03` block (`Card` + `Field` + `Input`) | Paste and password managers allowed |

### Tokens: semantic colour pairs, a type scale, 4 px spacing, one radius, one motion scale

shadcn theming is based on OKLCH CSS variables in `:root` and `.dark`, exposed to Tailwind v4 through `@theme inline`. The radius scale is derived from `--radius`. The token set does **not** include success, warning or info colours. The official recipe for adding one, shown with `warning`, is to define it in both themes and map it in `@theme inline` ([shadcn Theming](https://ui.shadcn.com/docs/theming)). The app adds `success`, `warning` and `info` pairs the same way.

Components use only semantic classes, so `bg-success` is allowed and `bg-green-500` is not. The values below are **proposals**. Only the warning pair comes from shadcn's documentation. Every pair must be checked in tweakcn's contrast checker in both themes before use.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` / `--foreground` | `oklch(1 0 0)` / `oklch(0.18 0 0)` | `oklch(0.16 0 0)` / `oklch(0.97 0 0)` | Page |
| `--card` / `--card-foreground` | `oklch(1 0 0)` / `oklch(0.18 0 0)` | `oklch(0.20 0 0)` / `oklch(0.97 0 0)` | Cards, sheets |
| `--primary` / `--primary-foreground` | `oklch(0.45 0.10 235)` steel blue / `oklch(0.985 0 0)` | `oklch(0.72 0.11 235)` / `oklch(0.18 0.02 235)` | Primary buttons, active nav, links, focus |
| `--muted` / `--muted-foreground` | `oklch(0.967 0 0)` / `oklch(0.48 0 0)` (darkened from shadcn's 0.556 so it passes on `--muted`) | `oklch(0.26 0 0)` / `oklch(0.72 0 0)` | Secondary text, stripes |
| `--accent` / `--accent-foreground` | `oklch(0.95 0.02 235)` / `oklch(0.25 0.05 235)` | `oklch(0.30 0.04 235)` / `oklch(0.97 0 0)` | Hover and selected rows |
| `--border` | `oklch(0.90 0 0)` | `oklch(1 0 0 / 12%)` | Decorative dividers |
| `--input` | `oklch(0.62 0 0)` (≥ 3:1 on white) | `oklch(0.55 0 0)` | Form control borders |
| `--ring` | = `--primary` (solid, 2 px outline) | = `--primary` | Focus |
| `--destructive` / fg | `oklch(0.577 0.245 27.3)` / `oklch(0.985 0 0)` | `oklch(0.704 0.191 22.2)` / `oklch(0.18 0 0)` | Over-limit, errors, cancel order |
| `--success` / fg | `oklch(0.50 0.12 150)` / `oklch(0.985 0 0)` | `oklch(0.72 0.15 150)` / `oklch(0.20 0.03 150)` | Completed, within limits, saved |
| `--warning` / fg | `oklch(0.84 0.16 84)` / `oklch(0.28 0.07 46)` | `oklch(0.41 0.11 46)` / `oklch(0.99 0.02 95)` | Pending, near limit, offline |
| `--info` / fg | `oklch(0.52 0.15 255)` / `oklch(0.985 0 0)` | `oklch(0.72 0.12 250)` / `oklch(0.18 0.03 250)` | Partly delivered, tips |
| Subtle tints | `bg-{success,warning,info,destructive}/12` with `text-success`, `text-warning-foreground`, `text-info`, `text-destructive` | `/20` tint, same text tokens | Badges, attention rows, highlights |
| `--chart-1…5` | `oklch(0.55 0.13 240)` blue · `oklch(0.70 0.16 55)` orange · `oklch(0.60 0.11 170)` teal · `oklch(0.55 0.15 300)` purple · `oklch(0.60 0 0)` grey | +0.12 L each | Series; ≤ 4 per chart; blue/orange for two-series charts |
| Sunlight theme (`.contrast`) | foreground `oklch(0 0 0)`, muted-fg `oklch(0.35 0 0)`, input `oklch(0.35 0 0)` 2 px, base 16 px | — | Outdoor mode |

**Base colour is Neutral.** Only `primary` carries a hue, and the steel blue suits "metal". `destructive` is kept for over-limit, error and cancel states.

**Typography** uses Inter (with `tnum`) plus Noto Sans Devanagari and Noto Sans Gujarati in the same `--font-sans` stack, ready for localisation. Fonts are self-hosted as subsetted WOFF2 files with `font-display: swap`. `tabular-nums` applies to every table number, KPI, total and live figure. Devanagari and Gujarati text needs looser leading, about 1.6, because of matras.

| Role | Desktop | Mobile | Weight / extras |
|---|---|---|---|
| KPI value | 30/36 px (`text-3xl`) | 24/32 px | 600, `tabular-nums` |
| Page title (h1) | 24/32 px (`text-2xl`) | 20/28 px | 600, `tracking-tight` |
| Section title (h2) | 18/28 px (`text-lg`) | 18/28 px | 500 |
| Card title / label | 14/20 px (`text-sm`) | 14/20 px | 500 |
| Body, table cell | 14/20 px | 16/24 px | 400 |
| Input text | 14 px | **16 px** (no iOS zoom) | 400; numbers right-aligned |
| Meta, helper, caption | 12/16 px (`text-xs`) | 13/18 px | 400, `text-muted-foreground` |

**Spacing** uses a 4 px base and 8 px multiples for layout:

| Element | Value |
|---|---|
| Page gutter | 16 px (mobile) / 24 px (desktop) |
| Gap between sections | 24 px |
| Card padding | 16 / 24 px |
| Gap between form fields | 16 px |
| Label to input | 8 px |
| Input to helper text | 6 px |
| Table cell padding | 12 px horizontal |
| Table row height | 40 px (desktop) / 48 px or more (touch) |

**Radius** is `--radius: 0.5rem`, which gives `sm` 4.8 px, `md` 6.4 px, `lg` 8 px (controls) and `xl` 11.2 px (cards and sheets). Badges use `rounded-md`.

**Elevation** is flat: cards use 1 px borders rather than shadows, popovers and menus use `shadow-md`, and dialogs and sheets use `shadow-lg`, because flat surfaces are cheaper to render on low-end phones. **Z-index layers** from bottom to top: sticky table header 10, app header 20, bottom nav and sticky Save bar 30, overlays 50 (the shadcn default), toasts 100.

**Motion tokens** are listed in the Screen specifications.

### Composite components and folder structure

The code is organised in three layers. **`components/ui`** holds shadcn CLI output only and is treated as vendored code: the only allowed edits are added variants and accessibility fixes, each logged in `components/ui/CHANGES.md`, and upgrades go through `shadcn add <c> --diff` ([shadcn CLI v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)). **`components/common`** holds the app's composites, named by domain role, built with `cva` variants, accepting `className` merged through `cn()` and exposing a `data-slot` for styling. **`features/*`** holds screen-specific code. ESLint's `no-restricted-imports` stops feature code from importing `@base-ui/react` or `sonner` directly. A CI grep bans raw palette classes such as `bg-red-500` outside `ui/`. A route-gated `/dev/components` page, available in dev builds only, shows every composite in every state. It is cheaper than Storybook for a small team and runs with the real providers.

```
src/
  components/
    ui/                      # shadcn CLI output only (Base UI). kebab-case files.
    layout/
      app-shell.tsx          # SidebarProvider + AppSidebar + SiteHeader + <Outlet/>
      app-sidebar.tsx        # groups, badges, nav-user footer
      site-header.tsx        # trigger, breadcrumbs, search button, + New
      bottom-nav.tsx         # < md only; 4 destinations + centre "+"
      command-palette.tsx    # Ctrl+K
      shortcuts.tsx          # global Alt+P/O/D, ?, Ctrl+Enter
    common/
      page-header.tsx        # title, description, primaryAction, secondaryActions (≤3), breadcrumbs
      detail-header.tsx      # + StatusBadge, meta, prev/next
      data-table/
        data-table.tsx       # TanStack v9, mode="server", renderMobileCard, states
        data-table-toolbar.tsx
        data-table-pagination.tsx
        data-table-view-options.tsx
        data-table-skeleton.tsx
        summary-strip.tsx    # "46 purchases · 412.380 t · ₹1,84,62,310.00"
      filter-bar/
        filter-bar.tsx       # URL-synced; Drawer on mobile; chips; Clear all
        date-range-picker.tsx# Indian FY presets
        filter-chips.tsx
      form/
        form-sheet.tsx       # Sheet (desktop) / Drawer (mobile), sticky footer, dirty guard
        form-section.tsx     # FieldSet + FieldLegend + FieldGroup
        form-field.tsx       # Controller + Field + FieldLabel + FieldError in one line
        error-summary.tsx    # "There is a problem", links, focus
        entity-combobox.tsx  # async search, "+ Add '<text>'", Alt+C
        money-input.tsx      # ₹ prefix, lakh grouping, 2 dp, string value
        tons-input.tsx       # t suffix, 3 dp, "Use max" slot
        date-input.tsx       # DD/MM/YYYY
        vehicle-input.tsx    # soft mask
      stat-card.tsx          # label, value (compact + exact tooltip), delta, footnote, href
      status-badge.tsx       # status → variant + icon + label
      limit-meter.tsx        # label, used, limit, thresholds 80/100
      empty-state.tsx        # first-use | no-results | all-done
      error-state.tsx        # section/page error with Try again + reference
      confirm-dialog.tsx     # AlertDialog, confirm() helper, pending, inline 409
      responsive-dialog.tsx  # Dialog ≥ md, Drawer < md
      key-value-list.tsx     # <dl> rows for detail/cards
      money.tsx / tons.tsx   # display components using lib/format
      freshness.tsx          # "Updated 2 min ago" + refresh
      offline-banner.tsx
  features/
    dashboard/ purchases/ sales-orders/ deliveries/ companies/ materials/ reports/ auth/
      api/ (queries, mutations, keys)  schemas/ (zod)  components/ (form, columns, card)  routes/
    deliveries/components/delivery-limits-panel.tsx
  lib/
    api-client.ts   # envelope unwrap, ApiError, refreshOnce()
    errors.ts       # code → copy dictionary, applyServerIssues(setError)
    format.ts       # formatTons, formatINR, formatINRCompact, formatRate, formatDate, formatDelta
    decimal.ts      # big.js helpers
    fy.ts           # FY and quarter presets
    notify.ts       # toast wrapper
    permissions.ts  # can('write')
  hooks/  use-media-query.ts  use-debounce.ts  use-table-url-state.ts  use-last-used.ts
  styles/ index.css (tailwind, tokens, motion, reduced-motion, sunlight theme)
```

| Composite | Key props / API | Built from |
|---|---|---|
| `PageHeader` | `title`, `description`, `primaryAction`, `secondaryActions` (≤ 3), `breadcrumbs` | Breadcrumb, Button, ButtonGroup, DropdownMenu |
| `DataTable<T>` | `columns`, `data`, `rowCount`, `state`, `onStateChange`, `renderMobileCard(row)`, `emptyState`, `isLoading`, `isPlaceholderData`, `error`, `getRowHref`, `highlightRowId` | Table, TanStack Table v9, Pagination, Skeleton, Empty |
| `FilterBar` | Zod-typed `filters` config; reads and writes router search params | InputGroup, Combobox, Select, Tabs, Badge, Drawer |
| `DateRangePicker` | `value`, `onChange`, `presets` (Indian FY set) | Popover, Calendar, Drawer |
| `EntityCombobox` | `queryKey`, `fetcher`, `filter` (e.g. company type SALE/BOTH), `onCreate`, `renderOption` | Base UI Combobox, Dialog |
| `MoneyInput` / `TonsInput` | Take and emit **strings** such as `"30.250"`; `max` and "Use max" slot on TonsInput | InputGroup, react-number-format |
| `StatCard` | `label`, `value`, `exactValue`, `delta` (`{ direction, text }`), `footnote`, `href`, `loading` | Card, Badge, Tooltip, Skeleton |
| `StatusBadge` | `status: 'PENDING' \| 'PARTIALLY_SUPPLIED' \| 'COMPLETED' \| 'CANCELLED' \| 'ACTIVE' \| 'INACTIVE'` | Badge |
| `LimitMeter` | `label`, `value`, `limit`, `isBinding`, `state` | Progress |
| `EmptyState` | `kind: 'first-use' \| 'no-results' \| 'all-done'`, `title`, `description`, `action` | Empty |
| `ConfirmDialog` | `await confirm({ title, body, confirmLabel, cancelLabel, destructive })` | AlertDialog, Spinner |
| `ResponsiveDialog` / `FormSheet` | `open`, `onOpenChange`, `title`, `footer`; dirty-state guard | Dialog / Sheet ≥ md, Drawer < md |

## Twenty changes ranked by how much friction they remove

| Rank | Change | Why it matters | Effort | Depends on |
|---|---|---|---|---|
| **P0-1** | Live delivery limits panel with "Use max" and binding-limit sentence | Turns the strictest 409s into guidance; removes most failed deliveries | M | Backend capacity endpoint |
| **P0-2** | "Deliver" button on open PO rows, PO page and dashboard, PO pre-locked | Cuts delivery to 3 clicks; removes PO picking errors | S | — |
| **P0-3** | Smart defaults: today, last-used supplier/material/rate, PO-inherited data, max quantity | Most users keep defaults ([NN/g](https://www.nngroup.com/articles/the-power-of-defaults/)); purchase in 2 clicks when repeated | S | Last-rate lookup |
| **P0-4** | One `lib/format.ts`: en-IN exact values, 3 dp tons, custom lakh/crore compact on tiles only | Eliminates misread figures and "1.2KCr" | S | — |
| **P0-5** | Plain-language error dictionary keyed by `code`, using `details` numbers, with one-tap fixes; 422 → field + summary | Users can fix errors without help | S | — |
| **P0-6** | Keep previous rows during refetch; skeleton only for first loads after 500 ms | Screen never blanks on weak data ([TanStack](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)) | S | — |
| **P0-7** | URL-held filters with Indian FY presets | Shareable views, working Back, one-tap "This FY" | M | — |
| **P0-8** | Hide write actions for VIEWER; "View only" badge | No dead ends or 403s | S | `/auth/me` role |
| **P0-9** | Pessimistic stock/money saves with row highlight, focus move and short toast | No rolled-back numbers; the result is visible in place | S | — |
| **P1-10** | `EntityCombobox` with inline "+ Add" (Alt+C) | Saves leaving the form to create masters | M | — |
| **P1-11** | "Save & add another" and "Repeat purchase" | Fast batch entry at the weighbridge | S | — |
| **P1-12** | Ctrl+K palette, Alt shortcuts, Enter-to-next, Ctrl+Enter save | Tally-speed entry for accountants | M | — |
| **P1-13** | Mobile bottom nav with centre "+", Drawer forms, sticky Save, 44–48 px targets | Yard staff record outdoors one-handed | M | — |
| **P1-14** | Sunlight theme, strengthened input borders, darker muted text | Readability outdoors and AA contrast | S | — |
| **P1-15** | Form drafts in localStorage and a re-login dialog that keeps entries | No lost work on dropped connections or expiry | S | — |
| **P1-16** | Dashboard "Needs attention" with inline actions and drill-down links | Answers "what to buy / deliver" at a glance | M | Dashboard endpoint |
| **P2-17** | Column visibility and density persisted per user | Power users see more | S | — |
| **P2-18** | Recent items in palette and sidebar | Faster return to working records | S | — |
| **P2-19** | Rate trend and margin charts | Pricing insight | M | Rates time-series endpoint |
| **P2-20** | `/dev/components` showcase, lint bans on raw colours, a11y lint; Hindi/Gujarati via i18n | Keeps the system consistent as it grows | M | — |

## Conclusion

The system can be simple because the domain is: scrap trading has few objects — parties, materials, purchases, orders and deliveries — and one hard rule, that nothing can be delivered that is not in stock. Most enterprise design systems treat that kind of rule as an error-handling problem. This one turns it into the interface: the three numbers the backend uses to reject a delivery become the default quantity, the meter, the warning and the one-tap fix, all visible *before* the user acts. That only works if the backend exposes those limits up front rather than only inside a 409, which makes a read-only capacity endpoint the highest-leverage design decision in the project even though it is a backend task. Two low-profile choices carry more risk than any visual one: number formatting, where built-in compact output prints "1.2KCr" and float arithmetic drifts, so one tested formatter removes a whole class of misread rupee figures; and the base library, where mixing Radix and Base UI conventions is the likeliest way for the system to decay, so it must be decided once, at `shadcn init`.

The click-count targets, the hide-versus-disable choice for VIEWERs and the label vocabulary are reasoned rather than tested. Before the remaining screens are built, they deserve a short session with three to five owners, accountants and yard staff, run on a mid-range Android phone in daylight, using the delivery form and one filtered list.

## Screen specifications

This section gives mockup-ready specifications. **Canvas sizes:** desktop 1440 × 900 px, tablet 768 × 1024 px, and phone 360 × 800 px, the typical CSS viewport of a low or mid-range Android phone.

All sample data is mutually consistent: stock per material sums to the dashboard's 286.450 t and open demand to 212.300 t, PO-0142's deliveries add up to its delivered quantity, every amount equals tons × rate, "today" is 27/09/2026, and the business is called "Metalix". Colour names refer to the tokens defined above, and icons are lucide-react.

### Shared vocabulary for all mockups

**Status badges** are 22 px tall, `rounded-md`, and use 12 px/500 text with a 14 px icon, a subtle tinted background and a same-hue text token.

| Backend value | Label | Token (bg / text) | Icon |
|---|---|---|---|
| PENDING | Pending | `warning/12` / `warning-foreground` | `Clock3` |
| PARTIALLY_SUPPLIED | Partly delivered | `info/12` / `info` | `Truck` |
| COMPLETED | Completed | `success/12` / `success` | `CircleCheck` |
| CANCELLED | Cancelled | `muted` / `muted-foreground` | `Ban` |
| Company ACTIVE / INACTIVE | Active / Inactive | `success/12` / `success` · `muted` / `muted-foreground` | `Circle` filled / `CircleOff` |
| Company type | Supplier · Buyer · Both | outline badge | `ArrowDownToLine` · `Truck` · `ArrowLeftRight` |

| Sample master data | Values used throughout the mockups |
|---|---|
| Suppliers | Shree Ganesh Metals (Rajkot), Sharma Traders (Ahmedabad), Patel Scrap Co. (Morbi), Jai Ambe Steel (Mumbai), Noor Metal Mart (Jamnagar) |
| Buyers | Bharat Castings Pvt Ltd, Rajkot Alloys, Kutch Foundry Works |
| Materials | HMS 1 (Heavy Melting Scrap), MS turnings, CRC bundle, Aluminium extrusion, Brass honey, Copper wire (Berry) |
| Users | Rajesh Patel (OWNER); Meena Shah, accountant, and Suresh, yard staff (both VIEWER) |

### S1 — App shell (desktop, 1440 × 900)

```
┌──────────────┬──────────────────────────────────────────────────────────────────────┐
│ [M] Metalix  │ [≡] │ Sales Orders › PO-0142     [🔍 Search or jump to…  Ctrl K] [+ New ▾] │ 56px
│ Scrap mgmt   ├──────────────────────────────────────────────────────────────────────┤
│              │                                                                      │
│ OVERVIEW     │   Page content (padding 24px, inset surface: bg-background,          │
│ ▣ Dashboard  │   rounded-xl, 1px border, 8px margin from sidebar)                   │
│ DAILY WORK   │                                                                      │
│ ⇩ Purchases  │                                                                      │
│ ☰ Sales Ord 14                                                                      │
│ ⛟ Deliveries │                                                                      │
│ STOCK & REP. │                                                                      │
│ ▤ Supplier st│                                                                      │
│ ▥ Company rep│                                                                      │
│ SETUP        │                                                                      │
│ ▦ Companies  │                                                                      │
│ ◫ Materials  │                                                                      │
│ ─────────────│                                                                      │
│ ? Help & keys│                                                                      │
│ (RP) Rajesh ▴│                                                                      │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
  256px (48px rail when collapsed)
```

| Region | Size | Exact contents |
|---|---|---|
| **SidebarHeader** | 256 × 64 | 32 px primary-filled rounded-lg square with white "M"; "Metalix" 14/600; below it "Scrap management" 12/400 muted. In collapsed rail only the square shows. |
| **Group "Overview"** | label 12/500 muted, uppercase-free sentence case | Dashboard (`LayoutDashboard`) |
| **Group "Daily work"** | | Purchases (`ArrowDownToLine`) · Sales Orders (`ClipboardList`, `SidebarMenuBadge` "14" = open orders) · Deliveries (`Truck`) |
| **Group "Stock & reports"** | | Supplier stock (`Warehouse`) · Company report (`FileBarChart`) |
| **Group "Setup"** | | Companies (`Building2`) · Materials (`Layers`) |
| **Menu item** | 32 px tall (44 px on touch), 8 px radius, 16 px icon + 14 px label | Active item: `bg-sidebar-accent`, 500 weight, 2 px primary bar on the left edge, `aria-current="page"`. Collapsed: icon only + tooltip with label. |
| **SidebarFooter** | 256 × 104 | "Help & shortcuts" (`CircleHelp`, opens shortcut dialog; also WhatsApp support link) · user row: 32 px avatar "RP", "Rajesh Patel" 14/500, role badge "Owner" (outline), `ChevronsUpDown`. Menu: Theme (Light / Dark / Sunlight), Reduce animations (switch), Keyboard shortcuts (?), Log out. VIEWER shows badge "View only" instead of "Owner". |
| **Header strip** | full width × 56, bottom border | `SidebarTrigger` (icon button 32 px, tooltip "Toggle sidebar · Ctrl B") · 16 px vertical `Separator` · `Breadcrumb` (top-level pages show only the page name; detail pages "Sales Orders › PO-0142", current page not a link) · flexible space · search button 280 × 36, outline, `Search` icon, placeholder "Search or jump to…", `Kbd` "Ctrl K" at right · "+ New" primary button with `ChevronDown` opening menu: Purchase `Alt P`, Sales order `Alt O`, Delivery `Alt D`, separator, Company, Material. VIEWER: "+ New" absent. |
| **Offline banner slot** | full width × 40 under header (only when offline) | `WifiOff` + "You're offline. Changes can't be saved until the connection is back." warning tint, not dismissible |
| **Content** | remaining area, scrolls independently; `scroll-padding-top: 72px` | Page padding 24 px; sections 24 px apart |
| **Toaster** | bottom-right, 16 px offset | max 3 visible |

### S2 — Dashboard (desktop, 1440 × 900; content 1136 px wide)

```
Dashboard                                              [Today][This week][This month✓][This FY][Custom ▾]
Good afternoon, Rajesh. Here's September so far.       01/09/2026 – 27/09/2026 · vs 01/08 – 27/08   Updated 2 min ago ⟳
┌ Stock in yard ──────┐┌ Buy needed ⚠ ───────┐┌ Open sales orders ──┐┌ Delivered this month ┐
│ 286.5 t             ││ 38.8 t              ││ 14                  ││ ₹1.96 Cr             │
│ ▲ 31.520 t since 1/9││ 3 materials short   ││ 212.300 t to deliver││ ▲ 8% vs Aug          │
└─────────────────────┘└─────────────────────┘└─────────────────────┘└──────────────────────┘
┌ Needs attention ─────────────────────────────────────┐┌ Stock vs open orders (t) ──────┐
│ BUY NEEDED                                            ││ HMS 1        ███████░░ Short 24.5│
│ ⚠ HMS 1 — short 24.500 t          [+ Purchase]        ││ Brass honey  ██░░░░░░ Short 13.0 │
│ ...                                                   ││ ...                              │
│ ORDERS WAITING                                        │└──────────────────────────────────┘
│ PO-0142 · Bharat Castings · 11.750 t left  [Deliver]  │
│ LOW SUPPLIER STOCK                                    │
└───────────────────────────────────────────────────────┘
┌ Bought vs delivered per week (t) ────────┐┌ Recent activity ─────────────────────┐
└───────────────────────────────────────────┘└──────────────────────────────────────┘
```

**Row 0 — page header.** On the left is "Dashboard" (24/600), and below it "Good afternoon, Rajesh. Here's September so far." (14, muted). On the right is a `ToggleGroup`: Today · This week · **This month** (selected) · This FY · Custom ▾. Beneath it, in 12 px muted text, "01/09/2026 – 27/09/2026 · compared with 01/08/2026 – 27/08/2026". Next to that sits `Freshness`: "Updated 2 min ago" plus a 32 px `RefreshCw` icon button, which spins while fetching.

**Row 1 — four StatCards.** The grid is `grid-cols-4 gap-4`. Each card is 272 × 132 px with 20 px padding and links to the stated destination.

| Card | Label (14/500 muted) | Value (30/600 tabular) | Delta / sub-line (12–14 px) | Footnote (12 muted) | Links to |
|---|---|---|---|---|---|
| 1 | Stock in yard | **286.5 t** (tooltip "286.450 t") | "▲ 31.520 t since 01/09/2026" (neutral foreground) | "6 materials · View stock →" | `/reports/source-stock` |
| 2 | Buy needed (`TriangleAlert` warning icon in `CardAction`) | **38.8 t** (tooltip "38.750 t") | "3 materials are short of open orders" (warning-foreground) | "HMS 1 24.500 t · Brass honey 13.000 t · Copper wire 1.250 t" | `/reports/stock?view=shortfall` |
| 3 | Open sales orders | **14** | "212.300 t left to deliver" | "9 pending · 5 partly delivered" | `/sales-orders?status=PENDING,PARTIALLY_SUPPLIED` |
| 4 | Delivered this month | **₹1.96 Cr** (tooltip "₹1,96,40,000.00") | "▲ 8% vs Aug (₹1.82 Cr)" in success text with `TrendingUp` icon | "380.860 t in 41 deliveries" | `/sales?from=2026-09-01&to=2026-09-30` |

**Row 2, left: the "Needs attention" card.** It spans 8 of 12 columns (748 px wide, about 360 px tall). The title is "Needs attention" with the subtitle "Things to act on today". It holds three sub-lists, each with a 12/600 muted heading and 44 px rows.

*Buy needed (3):*

| Material | Shortfall and detail | Action |
|---|---|---|
| ⚠ HMS 1 | short **24.500 t** · "Orders 96.000 t · in yard 71.500 t" | [+ Purchase] |
| ⚠ Brass honey | short **13.000 t** · "Orders 22.800 t · in yard 9.800 t" | [+ Purchase] |
| ⚠ Copper wire (Berry) | short **1.250 t** · "Orders 3.360 t · in yard 2.110 t" | [+ Purchase] |

*Orders waiting (oldest first, 3 of 14):*

| PO | Customer | Material | Left | Status and age | Action |
|---|---|---|---|---|---|
| PO-0142 | Bharat Castings Pvt Ltd | HMS 1 | **11.750 t** left | Partly delivered · 18 days | [Deliver] |
| PO-0147 | Rajkot Alloys | MS turnings | **22.000 t** left | Pending · 12 days | [Deliver] |
| PO-0151 | Kutch Foundry Works | Brass honey | **20.000 t** left | Pending · 7 days | [Deliver] |

A link below the list reads "View all 14 open orders →".

*Low supplier stock:* Sharma Traders · Copper wire (Berry) · **0.420 t** left.

The [+ Purchase] and [Deliver] buttons are small outline buttons, 28 px tall on desktop and 44 px on touch. VIEWERs do not see them.

**Row 2, right: "Stock vs open orders (t)".** It spans 4 of 12 columns and is a horizontal grouped bar chart, 300 px tall. The bars are "In yard" (`chart-1`, blue) and "Open orders" (`chart-2`, orange). There is no legend; the series names appear as direct labels on the first row. Materials are sorted by shortage:

| Material | In yard (t) | Open orders (t) | End label |
|---|---|---|---|
| HMS 1 | 71.500 | 96.000 | ⚠ Short 24.500 t |
| Brass honey | 9.800 | 22.800 | ⚠ Short 13.000 t |
| Copper wire (Berry) | 2.110 | 3.360 | ⚠ Short 1.250 t |
| Aluminium extrusion | 18.940 | 12.000 | Extra 6.940 t |
| MS turnings | 64.300 | 22.000 | Extra 42.300 t |
| CRC bundle | 119.800 | 56.140 | Extra 63.660 t |

The x-axis starts at zero. A "View as table" link sits at the bottom right.

**Row 3, left: "Bought vs delivered per week (t)".** It spans 7 columns and is a line chart, 260 px tall. The weeks on the x-axis are "01–06 Sep", "07–13 Sep", "14–20 Sep" and "21–27 Sep".

| Series | Line style | Values (t) | Direct label at the right end |
|---|---|---|---|
| Bought | Solid `chart-1` | 96.400, 108.900, 112.500, 94.580 (total 412.380) | "Bought" |
| Delivered | Dashed `chart-2` | 92.400, 101.300, 96.260, 90.900 (total 380.860) | "Delivered" |

**Row 3, right: "Recent activity".** It spans 5 columns. Each row has an icon, a title line, a sub line and a right-aligned value:

| Date | Type | Title line | Sub line | Value |
|---|---|---|---|---|
| 27/09 | Purchase (⇩) | Shree Ganesh Metals | HMS 1 · 12.450 t | ₹4,29,525.00 |
| 27/09 | Purchase | Sharma Traders | Copper wire (Berry) · 1.275 t | ₹10,00,875.00 |
| 26/09 | Delivery (⛟) | PO-0138 · Rajkot Alloys (now Completed) | MS turnings · 15.000 t | ₹5,32,500.00 |
| 26/09 | Purchase | Patel Scrap Co. | Brass honey · 2.140 t | ₹10,52,880.00 |
| 24/09 | Delivery | PO-0142 · Bharat Castings Pvt Ltd | HMS 1 · 4.500 t | ₹1,73,250.00 |

A footer link reads "View all purchases · View all deliveries".

**Tablet and phone.** The KPI cards become a 2 × 2 grid. The attention card becomes full width, and the charts stack below it (see S7).

### S3 — Purchases list

**Desktop (1440 × 900)**

**Page header.** The title is "Purchases" and the description reads "Scrap bought from suppliers. Stock goes up when you save a purchase." On the right are the secondary action "Export ▾" (outline; the menu offers "Excel (current filters)" and "CSV (current filters)") and the primary action "+ New purchase" with `Kbd` "Alt P".

**FilterBar.** The bar is one row, 36 px tall, with 8 px gaps:

| Order | Control | Size | Content |
|---|---|---|---|
| 1 | Search InputGroup | 280 px | `Search` icon, placeholder "Supplier, vehicle or invoice no." |
| 2 | Date button | — | `CalendarDays` + "This month · 01/09/2026 – 30/09/2026" |
| 3 | Supplier combobox | — | "Supplier: All" |
| 4 | Material select | — | "Material: All" |
| 5 | Flexible space | — | — |
| 6 | "Columns" dropdown | — | `Columns3` icon |
| 7 | Density toggle | — | Comfortable / Compact |

The date popover has a preset list on the left (Today, Yesterday, This week, This month ✓, Last month, This quarter (Jul–Sep), This FY 2026-27, Last FY 2025-26, Custom) and a two-month calendar on the right, showing September and October 2026.

**Chip row.** It appears only when filters are active. Example: `Supplier: Shree Ganesh Metals ✕` followed by the text button "Clear all".

**Summary strip.** Text is 14 px, a count in 500 weight followed by 400 weight, with `role="status"`: "**46 purchases** · 412.380 t · ₹1,84,62,310.00". An "Updated 1 min ago" note sits at the right.

**Table.** The sticky header is 40 px tall, and rows are 40 px tall with a bottom border and `hover:bg-muted/50`.

| # | Header | Width | Align | Cell format | Row 1 | Row 2 | Row 3 | Row 4 | Row 5 | Row 6 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Date | 112 | left | DD/MM/YYYY; sortable (default desc, `aria-sort`) | 27/09/2026 | 27/09/2026 | 26/09/2026 | 26/09/2026 | 25/09/2026 | 25/09/2026 |
| 2 | Supplier | 220 | left | link-styled, truncate + tooltip | Shree Ganesh Metals | Sharma Traders | Patel Scrap Co. | Shree Ganesh Metals | Jai Ambe Steel | Noor Metal Mart |
| 3 | Material | 180 | left | text | HMS 1 | Copper wire (Berry) | Brass honey | MS turnings | HMS 1 | Aluminium extrusion |
| 4 | Tons (t) | 104 | right | 3 dp, tabular | 12.450 | 1.275 | 2.140 | 8.900 | 18.600 | 3.420 |
| 5 | Rate (₹/t) | 128 | right | 2 dp, en-IN | 34,500.00 | 7,85,000.00 | 4,92,000.00 | 29,800.00 | 34,200.00 | 1,72,500.00 |
| 6 | Amount (₹) | 144 | right | 2 dp, en-IN, 500 weight | 4,29,525.00 | 10,00,875.00 | 10,52,880.00 | 2,65,220.00 | 6,36,120.00 | 5,89,950.00 |
| 7 | Vehicle | 132 | left | spaced plate | GJ 03 AX 4521 | GJ 01 BT 9087 | GJ 10 TT 1144 | GJ 03 AX 4521 | MH 04 KL 2210 | GJ 05 CZ 7702 |
| 8 | Invoice | 128 | left | truncate | INV-2291 | ST/26-27/418 | PSC-771 | INV-2287 | JAS/1093 | — |
| 9 | (actions) | 48 | right | `⋯` icon button 32 px, `aria-label="Actions for purchase 27/09/2026 Shree Ganesh Metals"` | ⋯ | ⋯ | ⋯ | ⋯ | ⋯ | ⋯ |

The row menu offers: View · Edit · Repeat purchase · separator · Copy link. VIEWERs see only View and Copy link.

Clicking a row opens `/purchases/$id`. Row 1 shows the "just saved" highlight state (`bg-success/12`, fading out).

**Pagination bar** (48 px): "Showing 1–25 of 46" on the left; on the right, "Rows per page [25 ▾]" followed by `‹ Previous` `1` `2` `Next ›`.

**Mobile card (360 px wide; card is 328 px with 16 px padding, 12 px radius and 1 px border; minimum 112 px tall; the whole card is tappable)**

```
┌──────────────────────────────────────────┐
│ Shree Ganesh Metals                   ⋯  │  16/600 · ⋯ = 44px button
│ HMS 1 · 27/09/2026                       │  14/400 muted
│                                          │
│ Tons            Amount                   │  12/400 muted (dl labels)
│ 12.450 t        ₹4,29,525.00             │  18/600 tabular
│ ₹34,500.00/t · GJ 03 AX 4521             │  13/400 muted
└──────────────────────────────────────────┘
```

For the Sales Orders card, the header row holds "PO-0142" plus the "Partly delivered" badge. The body shows "Left 11.750 t" with a 6 px progress bar at 61% and the caption "18.250 of 30.000 t". The footer shows "Bharat Castings Pvt Ltd · 09/09/2026" and a full-width "Deliver" button, 44 px tall.

### S4 — New Delivery form with live limits panel (desktop Sheet)

The form is a right `Sheet`, 768 px wide and full height. It opened from "Deliver" on PO-0142, and its URL is `/sales/new?poId=0142`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Record delivery                                                          ✕   │ 64px
│ PO-0142 · Bharat Castings Pvt Ltd                                            │
├───────────────────────────────────────────────┬──────────────────────────────┤
│ SALES ORDER                                   │ ┌ Delivery limits  ⓘ ──────┐ │
│ 🔒 PO-0142  Bharat Castings Pvt Ltd  Change   │ │ Left on PO-0142          │ │
│ Material  HMS 1 (Heavy Melting Scrap)         │ │ 11.750 t   ████░░░░ 51%  │ │
│ Rate      ₹38,500.00/t                        │ │ HMS 1 in yard            │ │
│ Ordered 30.000 t · Delivered 18.250 t         │ │ 71.500 t   █░░░░░░░  8%  │ │
│                                               │ │ Shree Ganesh Metals stock│ │
│ DELIVERY DETAILS                              │ │ 9.200 t    █████░░░ 65%  │ │
│ Date        [27/09/2026  📅]                  │ │   ◀ tightest limit       │ │
│ Stock from  [Shree Ganesh Metals — 9.200 t ▾] │ │ ──────────────────────── │ │
│ Tons        [      6.000 | t]  Use max 9.200 t│ │ You can deliver up to    │ │
│             Up to 9.200 t                     │ │ 9.200 t                  │ │
│ Amount      ₹2,31,000.00                      │ │ Limited by Shree Ganesh  │ │
│             6.000 t × ₹38,500.00              │ │ Metals stock             │ │
│                                               │ │ ──────────────────────── │ │
│ TRANSPORT                                     │ │ After this delivery      │ │
│ Vehicle no. [GJ 03 BW 7810]                   │ │ PO left      5.750 t     │ │
│ Challan no. (optional) [DC-0352]              │ │ Supplier     3.200 t     │ │
│ Notes (optional) [                        ]   │ │ Yard (HMS 1) 65.500 t    │ │
│                                               │ └──────────────────────────┘ │
├───────────────────────────────────────────────┴──────────────────────────────┤
│ Cancel                                   [Save & add another] [Save delivery Ctrl↵]│ 72px sticky
└──────────────────────────────────────────────────────────────────────────────┘
      form column 440px (24px padding)               panel 264px, sticky top 16px
```

| Section | Field | Component | Value shown | Notes |
|---|---|---|---|---|
| Sales order (read-only block, `bg-muted/40`, 12 px radius, 16 px padding) | PO | Read-only row with `Lock` icon + text button "Change order" | PO-0142 · Bharat Castings Pvt Ltd | Locked because opened from the PO; "Change order" swaps in an `EntityCombobox` of open POs |
| | Material | `KeyValueList` row | HMS 1 (Heavy Melting Scrap) | From PO |
| | Rate | row | ₹38,500.00/t | From PO |
| | Progress | row + 6 px bar | Ordered 30.000 t · Delivered 18.250 t (61%) | |
| Delivery details | Date | `DateInput` w-40 | 27/09/2026 | Default today; changing refetches limits |
| | Stock from | `Combobox` full width | Shree Ganesh Metals — 9.200 t available | Options sorted by stock: "Jai Ambe Steel — 38.000 t", "Patel Scrap Co. — 24.300 t", "Shree Ganesh Metals — 9.200 t · Last used". Suppliers with 0 t hidden, with note "3 suppliers have no HMS 1 in stock" |
| | Tons | `TonsInput` w-36, `t` suffix, right-aligned | 6.000 | Helper "Up to 9.200 t"; ghost button "Use max (9.200 t)" to the right; `enterkeyhint="next"` |
| | Amount | Read-only, 18/600, `aria-live="polite"` | ₹2,31,000.00 | Sub-line "6.000 t × ₹38,500.00" 12 muted |
| Transport | Vehicle no. | `VehicleInput` w-44 | GJ 03 BW 7810 | Uppercase, soft mask |
| | Challan no. (optional) | Input w-48 | DC-0352 | Duplicate → 409 field error |
| | Notes (optional) | Textarea 3 rows | — | |
| Footer (sticky, top border, 72 px) | — | Ghost "Cancel" (left) · outline "Save & add another" · primary "Save delivery" + `Kbd` "Ctrl ↵" | — | Save never disabled; pending → spinner + "Saving…" at the same width |

**Limits panel.** A `Card` with 16 px padding holds three `LimitMeter` rows, each 56 px tall. Every row shows a 12/500 muted label, an 18/600 tabular value, and an 8 px-tall meter whose fill is typed tons ÷ that limit. The row with the smallest limit gets a 1.5 px primary ring and the tag "Tightest limit".

The panel moves through these states:

| Scenario | Typed tons | Panel appearance | Tons field | Copy |
|---|---|---|---|---|
| Default (mockup) | 6.000 | Neutral fills in `primary`; binding row ringed | Normal | "You can deliver up to **9.200 t** · Limited by Shree Ganesh Metals stock" · After: PO left 5.750 t, Supplier 3.200 t, Yard 65.500 t |
| Near limit (≥ 80%) | 8.500 (92% of 9.200) | Binding row fill and value turn `warning`; `TriangleAlert` icon | Helper turns warning-foreground | "Close to the limit — 0.700 t to spare" |
| Over limit | 10.000 | Binding row `destructive` fill (clamped at 100%) + `CircleX`; result box `destructive/12` | `aria-invalid`, red border, error below | "Only 9.200 t of HMS 1 from Shree Ganesh Metals is left. Enter 9.200 t or less, or choose another supplier." + buttons [Use 9.200 t] [Choose another supplier]. On submit, a "There is a problem" summary also appears at the top |
| Checking | — | Three skeleton rows + "Checking limits…" (after 500 ms) | Normal | — |
| Limits unavailable | — | Muted card with `CloudOff` | Normal | "Couldn't check limits right now. We'll still check when you save." [Try again] |
| Server 409 after save | e.g. 9.200 but another user delivered 1.000 t meanwhile | Panel refreshes from `details`; destructive Alert at form top | Error on Tons | "Only 8.200 t of HMS 1 from Shree Ganesh Metals is left now. Enter 8.200 t or less." [Use 8.200 t] |

**Success.** The Sheet closes and the PO page's Deliveries table gains a row highlighted in `success/12`. The PO header numbers update to "Delivered 24.250 t · Left 5.750 t". A toast reads "Delivery saved · 6.000 t of HMS 1 to Bharat Castings Pvt Ltd" with the actions [View] and [Add another].

### S5 — Sales PO detail (`/sales-orders/0142`, desktop)

| Region | Contents |
|---|---|
| Breadcrumb | Sales Orders › PO-0142 |
| DetailHeader | Title "PO-0142" (24/600) + `StatusBadge` "Partly delivered"; subtitle "Bharat Castings Pvt Ltd · HMS 1 (Heavy Melting Scrap) · Ordered on 09/09/2026". Right: `‹ ›` prev/next order icon buttons (tooltips "Previous order PO-0141", "Next order PO-0143"), outline "Edit", primary "Record delivery" `Alt D`, `⋯` menu (Copy link · Print · separator · Cancel order in destructive text). VIEWER: only prev/next and Copy link/Print. |
| Stat cards (5 across, `@container` grid) | Ordered **30.000 t** · Delivered **18.250 t** ("61% of order") · Left to deliver **11.750 t** (primary text) · Rate **₹38,500.00/t** · Value delivered **₹7,02,625.00** ("of ₹11,55,000.00") |
| Progress strip | Full-width 10 px bar, 61% `info` fill; label left "18.250 of 30.000 t delivered"; right "11.750 t left" |
| Main column (2/3): "Deliveries (3)" card with `DataTable` | Columns: Date · Challan no. · Stock from · Tons (t) · Amount (₹) · Vehicle · ⋯. Rows: 24/09/2026 · DC-0340 · Shree Ganesh Metals · 4.500 · 1,73,250.00 · GJ 03 AX 4521 — 18/09/2026 · DC-0327 · Jai Ambe Steel · 6.250 · 2,40,625.00 · MH 04 KL 2210 — 12/09/2026 · DC-0311 · Shree Ganesh Metals · 7.500 · 2,88,750.00 · GJ 03 AX 4521. Footer row "Total · 18.250 · 7,02,625.00". Card action: "+ Record delivery". |
| Side column (1/3): "Order details" card | `KeyValueList`: Customer → Bharat Castings Pvt Ltd (link) · Material → HMS 1 · PO date → 09/09/2026 · Notes → "Deliver to Rajkot yard, gate 2" · Created → Rajesh Patel, 09/09/2026, 11:42 am · Last change → 24/09/2026, 5:10 pm |
| Side column: "Stock for this order" card | "HMS 1 in yard 71.500 t" · top suppliers: Jai Ambe Steel 38.000 t · Patel Scrap Co. 24.300 t · Shree Ganesh Metals 9.200 t · link "See supplier stock →" |
| Variant — Completed | Badge "Completed"; primary action removed; stat "Left to deliver 0.000 t"; info Alert "All 30.000 t delivered on 26/09/2026." |
| Variant — Cancelled | Non-dismissible muted Alert under header: `Ban` "This order was cancelled on 14/09/2026 by Rajesh Patel. Deliveries can't be recorded against it."; Edit and Record delivery hidden |

### S6 — State examples

| # | State | Screen / location | Visual spec | Exact copy | Actions |
|---|---|---|---|---|---|
| L1 | Loading — first load | Purchases list | Header, FilterBar and table header render immediately; summary strip = 320 × 16 skeleton; 10 skeleton rows, 40 px, bars sized per column (date 80, supplier 160, material 120, numbers 72 right-aligned); static `bg-muted` or slow 2 s pulse; appears only after 500 ms | (sr-only) "Loading purchases" | — |
| L2 | Loading — refetch | Purchases after changing supplier filter | Old rows stay at 60% opacity; 2 px indeterminate `primary` line under the toolbar; "Next" disabled | Summary `role="status"`: "Updating…" then "12 purchases · 118.400 t · ₹41,20,380.00" | — |
| L3 | Loading — dashboard | Dashboard | 4 StatCard skeletons (label 96 × 12, value 120 × 28, footnote 160 × 12); attention card with 5 × 44 px skeleton rows; charts as muted blocks of final height | — | — |
| L4 | Loading — saving | Any form footer | Primary button keeps its width; 16 px `Spinner` + "Saving…"; `aria-busy="true"`; focus stays on the button | "Saving…" | — |
| L5 | Loading — long export | Toast or inline banner | Determinate `Progress` 240 px | "Preparing Excel file… 32 of 120 rows" | Cancel |
| E1 | Empty — first use (OWNER) | Deliveries | `Empty` centred in content, 48 px muted circle with `Truck` icon | Title "No deliveries yet" · "When scrap goes out to a buyer, record it here. Stock updates automatically." | [+ Record delivery] primary · "How deliveries work" link |
| E2 | Empty — no results | Purchases (filters: Copper wire, 01/08–15/08/2026, Sharma Traders) | `Empty` outline variant inside the table body; header and filters stay | "No purchases match these filters" · "Showing: Copper wire (Berry) · 01/08/2026 – 15/08/2026 · Supplier: Sharma Traders" | [Clear filters] primary · [Change dates] outline |
| E3 | Empty — search | Companies | same | "No results for "bras"" · "Check the spelling, or search by GSTIN or phone number." | [Clear search] |
| E4 | Empty — all done | Dashboard "Buy needed" sub-list | Inline, `CircleCheck` success icon | "All materials are stocked. Nothing needs to be purchased for open orders right now." | none |
| E5 | Empty — VIEWER first use | Companies | as E1 without button | "No companies added yet" · "Companies will appear here once the owner adds them." | none |
| Er1 | Error — section | Dashboard stock chart card | Card body replaced; `CloudOff` 24 px; keeps card title | "Couldn't load stock by material. Check your connection and try again." | [Try again] |
| Er2 | Error — validation (422 or client) | New purchase Sheet | Destructive `Alert` at top, focused, heading "There is a problem", linked list; each field red border + `CircleAlert` + message | "Choose a supplier" · "Enter tons as a number, like 12.450" | Links focus the fields |
| Er3 | Error — business (409) | New delivery | See S4 "Over limit" | "Only 9.200 t of HMS 1 from Shree Ganesh Metals is left…" | [Use 9.200 t] [Choose another supplier] |
| Er4 | Error — server (500) | New purchase Sheet | Destructive `Alert` at top, persistent; reference in mono 12 px with copy icon | Title "Purchase not saved" · "Something went wrong on our side and this purchase was not saved. Try again. If it keeps happening, share this reference with support." · "Reference: 7f3a9c2e" | [Try again] [Copy reference] |
| Er5 | Error — offline | Global, under header | 40 px warning banner, `WifiOff`, not dismissible; on reconnect 3 s "Back online" status | "You're offline. Changes can't be saved until the connection is back." | — |
| Er6 | Error — not found (404) | `/sales-orders/0999` | Centred `Empty` with `FileQuestion` | "We couldn't find this sales order" · "The link may be wrong, or the order number was typed incorrectly." | [Go to Sales Orders] |
| Er7 | Error — session ended (401) | Over any open form | Small Dialog (not redirect), form kept underneath | "Your session has ended" · "Log in again to save this delivery — your entries are kept." | Password field + [Log in] |
| Er8 | Error — page crash | Route error boundary | Centred, `TriangleAlert` | "This page stopped working" · "Reload the page. Your saved records are safe." · "Reference: 7f3a9c2e" | [Reload page] [Go to Dashboard] |
| C1 | Confirm — cancel order | PO-0151 detail | `AlertDialog` 448 px, 24 px padding; `Ban` icon in destructive tint | Title "Cancel order PO-0151?" · "Kutch Foundry Works ordered 20.000 t of Brass honey. Nothing has been delivered yet. After cancelling, no deliveries can be recorded against this order." | [Keep order] outline, initial focus · [Cancel order] destructive → "Cancelling…" |
| C2 | Confirm — backdated edit | Edit purchase dated 12/09/2026 | `AlertDialog` with impact line in a muted box | Title "Save changes to this 12/09/2026 purchase?" · "This changes HMS 1 stock from 12/09/2026 onward. Stock in yard will go from 71.500 t to 68.300 t." | [Go back] · [Save changes] primary |
| C3 | Confirm — unsaved changes | Closing a dirty Sheet | `AlertDialog` | "Leave without saving?" · "Your changes to this delivery will be lost." | [Stay on page] initial focus · [Leave] destructive |
| C4 | Confirm — deactivate | Company Noor Metal Mart | `AlertDialog` | "Deactivate Noor Metal Mart?" · "It will no longer appear when you record purchases or deliveries. Past records stay unchanged. You can reactivate it later." | [Keep active] · [Deactivate] destructive |
| S1 | Success — save | After delivery | Toast bottom-right (bottom-centre above nav on phones), `CircleCheck` success; row highlight `success/12` holds 1000 ms then fades over 1500 ms; focus moves to the new row | "Delivery saved" · "6.000 t of HMS 1 to Bharat Castings Pvt Ltd" | [View] [Add another]; stays 10 s, close button |
| S2 | Success — inline | Company edit page | Save button shows `Check` + "Saved" for 1200 ms, then reverts | "Saved" (`role="status"`) | — |
| S3 | Success — copy | PO header "Copy link" | Icon swaps `Link` → `Check`, tooltip "Copied" for 1500 ms | "Link copied" (`role="status"`) | — |

### S7 — Mobile layout (phone, 360 × 800)

```
┌────────────────────────────────────┐
│ [M] Purchases            🔍  (RP)  │ 56px header
├────────────────────────────────────┤
│ [🔍 Supplier, vehicle, invoice…  ] │ 44px sticky search
│ [⚙ Filters (1)] [This month ✕]     │
│ 46 purchases · 412.380 t           │
│ ₹1,84,62,310.00                    │
│ ┌────────────────────────────────┐ │
│ │ Shree Ganesh Metals          ⋯ │ │
│ │ HMS 1 · 27/09/2026             │ │
│ │ 12.450 t      ₹4,29,525.00     │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ Sharma Traders               ⋯ │ │
│ │ ...                            │ │
│ [ Load more (21 more) ]            │
├────────────────────────────────────┤
│  ▣      ⇩       (＋)     ☰14    ⋯  │ 64px + safe area
│ Home Purchases  New   Orders  More │
└────────────────────────────────────┘
```

| Region | Spec |
|---|---|
| **App header** (56 px, sticky, `z-20`) | 28 px logo mark · page title 18/600 · right: search icon button 44 px (opens full-screen `CommandDialog`) · avatar 32 px (opens user Sheet: role badge, Theme incl. Sunlight, Reduce animations, Log out). No hamburger. |
| **Bottom nav** (64 px + `env(safe-area-inset-bottom)`, `bg-background`, top border, `z-30`) | Five 72 px slots: **Home** (`LayoutDashboard`) · **Purchases** (`ArrowDownToLine`) · **New** (centre: 48 px `primary` circle with white `Plus`, raised 8 px above the bar, label "New") · **Orders** (`ClipboardList` + badge "14") · **More** (`Ellipsis`). Labels 12 px. Active: icon and label `primary`, label 600, 56 × 28 `bg-accent` pill behind icon, `aria-current="page"`. Inactive: `muted-foreground`, label 500. VIEWER: Home · Purchases · Orders · Stock · More (no centre button). |
| **"New" action Drawer** | Bottom Drawer, handle 32 × 4, title "What are you recording?"; three 64 px rows with 24 px icons: **Purchase** "Scrap coming in from a supplier" · **Delivery** "Scrap going out against an order" · **Sales order** "A new order from a buyer"; [Cancel] text button |
| **"More" Sheet** | Sheet from bottom (snap 0.6): Deliveries · Supplier stock · Company report · Companies · Materials · Help & shortcuts |
| **Dashboard (phone)** | Title "Dashboard" + period chip "This month ▾" (opens Drawer with presets). KPI 2 × 2 grid, each 156 × 112, value 24/600: 286.5 t · 38.8 t ⚠ · 14 · ₹1.96 Cr. Then "Needs attention" card full width (rows 56 px, buttons 44 px). Then "Stock vs open orders" (bars with end labels, no tooltips), then "Bought vs delivered". |
| **List (phone)** | Sticky search 44 px (16 px text); row with [Filters (1)] outline button 44 px + active chips (horizontal scroll); summary on two lines; cards per S3 with 12 px gaps; [Load more (21 more)] full-width 44 px. Pull-to-refresh not used; Refresh is in the header ⋯ when needed. |
| **Filter Drawer** | Snap 0.85; sections: **Date** (preset chips in a 2-column grid, 44 px each: Today, Yesterday, This week, This month ✓, Last month, This quarter, This FY, Last FY, Custom… → one-month calendar); **Supplier** (`EntityCombobox`, full-screen list on focus); **Material** (`NativeSelect`). Sticky footer: [Reset] outline · [Show 46 purchases] primary (count updates live). |
| **New purchase Drawer** | Full height (snap 1), handle, header "New purchase" + close ✕ 44 px. Fields full width, h-11, 16 px text, 16 px gaps: Date "27/09/2026" · Supplier "Shree Ganesh Metals" + tag "Last used" · Material "HMS 1" + tag "Last used" · Tons `[     ] t` (`inputmode="decimal"`, `enterkeyhint="next"`) · Rate `₹ [34,500.00] /t` + helper "Last rate from Shree Ganesh Metals on 24/09/2026" · Amount read-only "₹0.00" updating live · Vehicle no. (`autocapitalize="characters"`) · Invoice no. (optional). Sticky footer above keyboard: [Save purchase] full-width primary 48 px; text button "Save & add another" below. |
| **New delivery Drawer** | Same pattern; the limits panel collapses into a 48 px strip pinned directly above the footer: "Max **9.200 t** · limited by Shree Ganesh stock  [Details ▴]"; the strip turns amber/red with icon and text in the near/over states; "Details" expands the full panel (S4) as a second snap point. "Use max" sits inside the Tons input's trailing addon. |
| **Dialogs on phone** | Every `ResponsiveDialog` (inline create company/material, confirmations) renders as a bottom Drawer with a two-column footer of 48 px buttons: the safe option on the left (first in DOM, initial focus) and the primary or destructive option on the right. |
| **Tablet (768–1023)** | Icon-rail sidebar (48 px) with tooltips; no bottom nav; tables with horizontal scroll and a pinned first column; Sheets 512–576 px; KPI grid 2 × 2. |

### S8 — Component-state specification

Desktop sizes are shown first; `pointer-coarse:` sizes follow in brackets. The focus ring is the same everywhere: `outline-2 outline-offset-2 outline-ring`, applied on `:focus-visible` only.

| Component | Default | Hover (pointer only) | Focus-visible | Active / pressed | Disabled | Loading | Invalid |
|---|---|---|---|---|---|---|---|
| **Button — primary** | `bg-primary text-primary-foreground` h-9 [h-11] px-4 `rounded-lg` 14/500 | `bg-primary/90`, 100 ms | 2 px ring, offset 2 | `translate-y-px`, instant | Avoided; if unavoidable `aria-disabled` + `opacity-50 cursor-not-allowed` + visible reason text | `Spinner` 16 px + "Saving…", width locked (`min-w`), `aria-busy`, focus kept (`focusableWhenDisabled`) | n/a (Save stays enabled; invalid form → summary) |
| **Button — outline / secondary** | `border border-input bg-background` | `bg-muted` | ring | `translate-y-px`; `aria-expanded:bg-muted` | as above | as above | n/a |
| **Button — destructive** | `bg-destructive text-white` | `bg-destructive/90` | ring in `destructive` | `translate-y-px` | as above | "Cancelling…" | n/a |
| **Icon button** | `size-8` [size-11], `aria-label`, tooltip | `bg-muted` | ring | `bg-muted/80` | as above | icon replaced by spinner | n/a |
| **Text input / TonsInput / MoneyInput** | h-9 [h-11] `border-input` (≥ 3:1) `bg-background` 14 px [16 px]; numbers `text-right tabular-nums`; addons muted | `border-foreground/40` | `border-ring` + ring | caret; no transform | Prefer read-only; else `bg-muted opacity-60` | Trailing `Spinner` in addon (e.g. duplicate check) | `aria-invalid`: `border-destructive` + `ring-destructive/20`; `CircleAlert` + 14 px `text-destructive` message below, linked by `aria-describedby`; value kept |
| **Combobox / Select trigger** | As input + `ChevronsUpDown`; placeholder muted ("Choose a supplier") | `border-foreground/40` | ring; open → `border-ring` + `aria-expanded` | `bg-muted` while open | as input | List shows "Searching…" row with spinner; trigger unchanged | as input |
| **Combobox option** | 32 px [44 px] row, label + right-aligned muted meta ("9.200 t") | `bg-accent` (also keyboard highlight `data-highlighted`) | via highlight | — | `data-disabled` muted, not selectable ("0.000 t — no stock") | — | — |
| **Checkbox / Switch** | 16 px box / 36 × 20 switch, `border-input`; hit area ≥ 24 px [44 px] via label | `border-primary` | ring | — | `opacity-50` | — | `border-destructive` |
| **Table row** | 40 px [48], `border-b`, text 14 | `bg-muted/50`, 100 ms, `cursor-pointer` | Inset 2 px ring on the row link | `bg-muted` | n/a; cancelled records `text-muted-foreground` + badge | Refetch: `tbody` opacity 60% + top progress line | Row with negative stock value: `−` + `text-destructive` + icon |
| **Sidebar item** | 32 px [44], icon 16 + label 14 `text-sidebar-foreground` | `bg-sidebar-accent` | ring (`sidebar-ring`) | `bg-sidebar-accent` | n/a (hidden for VIEWER) | n/a | n/a |
| **Tabs / ToggleGroup (quick views, period)** | 32 px, `text-muted-foreground` | `text-foreground` | ring | — | `opacity-50` | — | — |
| **StatCard / mobile card (link)** | `bg-card border rounded-xl` | `border-foreground/20 bg-muted/30` | ring on card | `bg-muted/50` (touch feedback) | n/a | Skeleton of identical size | n/a (values carry their own state colour) |
| **LimitMeter** | Label 12/500 muted, value 18/600, 8 px track `bg-muted`, fill `primary` | — | n/a | — | — | Skeleton row | ≥ 80% `warning` fill + icon + "Close to the limit"; > 100% `destructive` + `CircleX` + message |

The **Selected** and **Read-only** states apply only to some components:

| Component | Selected | Read-only |
|---|---|---|
| Sidebar item | `bg-sidebar-accent` + 500 weight + 2 px left `primary` bar + `aria-current="page"` | — |
| Tabs / ToggleGroup | `bg-background shadow-sm text-foreground` 500 + `aria-selected` / `aria-pressed`; indicator slides 150 ms | — |
| Combobox option | `Check` icon at right + 500 weight + `aria-selected` | — |
| Table row (only if selection is added) | `bg-accent` + checked checkbox + `aria-selected` | — |
| Checkbox / Switch | `bg-primary` + `Check` / thumb right | — |
| Form fields (VIEWER or locked PO) | — | Render as `KeyValueList` text, or `readOnly` input with `bg-muted/40`, no border emphasis, `Lock` icon for locked values; focusable and copyable; no hover or focus border change |

### S9 — Motion tokens and per-component motion

```css
@theme {
  --duration-instant: 0ms;     /* reduced motion; press transform */
  --duration-fast: 100ms;      /* hover/press colour, checkbox, switch, row hover, small exits */
  --duration-base: 150ms;      /* tooltip, popover, dropdown, select, combobox enter; tab indicator; route fade */
  --duration-moderate: 200ms;  /* dialog enter, accordion, sidebar width, sheet/drawer exit */
  --duration-slow: 300ms;      /* sheet/drawer enter, progress/meter fill, toast enter */
  --duration-max: 400ms;       /* hard ceiling for any UI motion */
  --ease-standard: cubic-bezier(0.2, 0, 0.38, 0.9);   /* Carbon productive standard */
  --ease-enter: cubic-bezier(0, 0, 0.38, 0.9);        /* Carbon productive entrance (decelerate) */
  --ease-exit: cubic-bezier(0.2, 0, 1, 0.9);          /* Carbon productive exit (accelerate) */
  --ease-emphasized-enter: cubic-bezier(0.05, 0.7, 0.1, 1); /* M3; full-height sheets/drawers only */
}
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after { transition-property: color, background-color, border-color, opacity !important;
                         transition-duration: 100ms !important; animation-duration: 1ms !important;
                         animation-iteration-count: 1 !important; }
  ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
/* the same rules apply under html[data-motion="reduced"] (in-app "Reduce animations" switch) */
```

| Token | Value | Source basis |
|---|---|---|
| `--duration-instant` | 0 ms | Reduced-motion target |
| `--duration-fast` | 100 ms | NN/g ~100 ms for simple feedback; Carbon fast-01/02 (70/110 ms) |
| `--duration-base` | 150 ms | Carbon moderate-01 "default transition speed" |
| `--duration-moderate` | 200 ms | M3 short4; NN/g 200–300 ms for modals |
| `--duration-slow` | 300 ms | M3 medium2; NN/g "popup 300 ms to appear" |
| `--duration-max` | 400 ms | NN/g: 500 ms feels like "a real drag" |
| `--ease-standard` | cubic-bezier(0.2, 0, 0.38, 0.9) | Carbon productive standard |
| `--ease-enter` | cubic-bezier(0, 0, 0.38, 0.9) | Carbon productive entrance |
| `--ease-exit` | cubic-bezier(0.2, 0, 1, 0.9) | Carbon productive exit |
| `--ease-emphasized-enter` | cubic-bezier(0.05, 0.7, 0.1, 1) | M3 emphasized decelerate |

The timing tokens below are not animations. They are JavaScript constants that live in `lib/timing.ts`.

| Token | Value | Use |
|---|---|---|
| `LOADER_DELAY` | 500 ms | Wait before showing any skeleton/spinner for a query (convention) |
| `LOADER_MIN` | 500 ms | Minimum time a loader stays once shown, to avoid flashes (convention) |
| `DEBOUNCE_SEARCH` | 300 ms | Table search, palette search, combobox async search |
| `DEBOUNCE_LIMITS` | 300 ms | Capacity refetch after tons/supplier/date change |
| `TOOLTIP_OPEN_DELAY` | 500 ms (0 ms when moving between adjacent tooltips) | Icon-button tooltips |
| `HIGHLIGHT_HOLD` / `HIGHLIGHT_FADE` | 1000 ms / 1500 ms | New/edited row tint (colour only, allowed under reduced motion) |
| `SUCCESS_HOLD` | 1200 ms | Button "Saved" check before reverting |
| `COPIED_HOLD` | 1500 ms | "Copied" icon + text |
| `TOAST_SUCCESS` | 4000 ms | Plain success toast (Sonner default) |
| `TOAST_WITH_ACTION` | 10000 ms + close button | Toasts with View / Add another / Undo |
| `TOAST_ERROR` | persistent until dismissed | Rare; errors belong inline |
| `DASHBOARD_REFETCH` | 60000 ms | Dashboard stock summary interval |
| `SKELETON_PULSE` | 2000 ms cycle, opacity only; off under reduced motion | Skeletons |

| Element | Property | Enter | Exit | Easing (enter / exit) | Reduced motion |
|---|---|---|---|---|---|
| Button hover / press | background, border colour; press `translateY(1px)` | 100 ms; press 0 ms | 100 ms | standard | colour only |
| Row, sidebar item, option hover | background colour | 100 ms | 100 ms | standard | same |
| Tooltip | opacity 0→1, scale 0.96→1 | 150 ms | 100 ms | enter / exit | opacity 100 ms |
| Dropdown, Popover, Select, Combobox list | opacity, scale 0.95→1, 4 px slide from trigger side | 150 ms | 100 ms | enter / exit | opacity 100 ms |
| Dialog / AlertDialog | backdrop opacity; panel opacity + scale 0.95→1 | 200 ms | 150 ms | enter / exit | opacity 100 ms; no backdrop blur below `md` |
| Sheet (right) | translateX(100%→0) + backdrop opacity | 300 ms | 200 ms | emphasized-enter / exit | opacity 100 ms |
| Drawer (bottom) | translateY(100%→0); snap changes 200 ms | 300 ms | 200 ms | emphasized-enter / exit | opacity 100 ms |
| Accordion / Collapsible | height via tw-animate `accordion-down/up` | 200 ms | 150 ms | standard | instant |
| Sidebar collapse | width 256↔48 px | 200 ms | 200 ms | standard | instant |
| Tab / ToggleGroup indicator | transform (translateX, scaleX) | 150 ms | — | standard | instant |
| Toast | translateY + opacity (Sonner's own motion, ≤ 400 ms) | ~300 ms | ~200 ms | library | opacity only |
| Progress / LimitMeter fill | transform scaleX on value change | 300 ms | — | standard | instant |
| LimitMeter state colour | background/text colour | 150 ms | — | standard | same |
| Copy → "Copied" icon swap | opacity + scale 0.8→1 | 150 ms | 100 ms | enter / exit | opacity |
| Save → check | icon cross-fade | 150 ms | 150 ms | standard | same |
| New-row highlight | background colour `success/12` → transparent | instant | 1500 ms after 1000 ms hold | ease-out | same (colour is not motion) |
| Route change | `<ViewTransition>` cross-fade via `startTransition` | 150 ms | 150 ms | standard | none |
| Skeleton → content | `<ViewTransition update="auto" default="none">` fade | 150 ms | — | standard | none |
| Refetch dimming | opacity 1→0.6 | 150 ms (after `LOADER_DELAY`) | 100 ms | standard | same |
| Never animated | typing, keyboard focus moves, table sort/reorder of large tables, KPI numbers, validation (no shake) | — | — | — | — |
