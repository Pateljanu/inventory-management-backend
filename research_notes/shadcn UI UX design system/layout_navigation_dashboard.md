# Layout, Navigation, Information Architecture, User Flows and Dashboard Design for the Metal Scrap Management System (shadcn/ui, 2026)

Scope note: research run 2026-09-27. About 22 tool calls. Several primary pages (Carbon create-flows and data-table pages, Polaris Page and Layout pages, Material 3 guideline pages, Stephen Few's "Common Pitfalls" PDF) could not be fetched in full: they were truncated, the socket closed, or the PDF could not be rendered. For those, findings rely on search-result snippets of the official page and are marked "(snippet)". Older research (NN/g 2005–2018) is flagged with its date. Where it is still the accepted standard, the notes say so.

## 1. App shell layout: sidebar vs top nav, shadcn Sidebar patterns, header, width/density, page-header anatomy

### Takeaway
Use a persistent, visible left sidebar. Build it with shadcn `Sidebar` using `collapsible="icon"` and `variant="inset"`, the same setup as the official dashboard-01 block. It is 16rem expanded, 3rem as an icon rail, and an 18rem Sheet on phones below 768px. NN/g's evidence says visible navigation beats hidden navigation on desktop, and 8 sections is too many for a top bar with room to grow. Each page header should have a title, an optional one-line description, and one primary action at top right, with no more than 3 secondary actions (Polaris).

### Cited Findings
- shadcn Sidebar defaults: `SIDEBAR_WIDTH = "16rem"`, `SIDEBAR_WIDTH_MOBILE = "18rem"`, `SIDEBAR_WIDTH_ICON = "3rem"`, `SIDEBAR_KEYBOARD_SHORTCUT = "b"` (Cmd+B / Ctrl+B). The expanded/collapsed state is saved in the cookie `sidebar_state` for 7 days (`60*60*24*7`). — [shadcn sidebar.tsx source](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx)
- `SidebarMenuButton` shows a tooltip only when the sidebar is collapsed on desktop, never on mobile. Size variants: `default` h-8 (32px), `sm` h-7 (28px), `lg` h-12 (48px). — [shadcn sidebar.tsx source](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx)
- Mobile detection uses `useIsMobile()` with `MOBILE_BREAKPOINT = 768` (px). Below that width the sidebar renders inside a `Sheet`, with separate `openMobile` state. — [shadcn use-mobile.ts](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/hooks/use-mobile.ts); [shadcn Sidebar docs](https://ui.shadcn.com/docs/components/sidebar)
- The `collapsible` prop takes `offcanvas | icon | none`. The `variant` prop takes `sidebar | floating | inset`, and `inset` wraps the content in `SidebarInset`. The structure is SidebarProvider → Sidebar → SidebarHeader / SidebarContent (SidebarGroup → SidebarGroupLabel + SidebarMenu → SidebarMenuItem → SidebarMenuButton / SidebarMenuBadge / SidebarMenuSub) / SidebarFooter. The `useSidebar` hook exposes `state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar`. The docs offer Base UI, React Aria and Radix implementations. — [shadcn Sidebar docs](https://ui.shadcn.com/docs/components/sidebar)
- The official `dashboard-01` block combines KPI "section cards" with trend badges, an interactive area chart, a data table, an inset-variant sidebar and a site header. `sidebar-07` is the "collapses to icons" sidebar. — [shadcn Blocks](https://ui.shadcn.com/blocks)
- NN/g (2016, still the standard reference): hidden navigation cut discoverability by more than 20%. Desktop users were at least 39% slower and mobile users 15% slower with a hamburger, and perceived difficulty rose 21%. On desktop, hidden menus were used in only 27% of tasks, against 48–50% for visible nav. Recommendation: "Display top-level navigation visibly across the top or left sidebar" on desktop. — [NN/g, Hamburger Menus and Hidden Navigation Hurt UX Metrics](https://www.nngroup.com/articles/hamburger-menus/)
- Polaris Page (snippet): always give a title; give breadcrumbs when the page has a parent; organise the page around one primary activity and show it as a primary button in the header; use "no more than one primary action and 3 secondary actions per page"; detail pages should have pagination and breadcrumbs. — [Polaris Page component](https://polaris-react.shopify.com/components/layout-and-structure/page?example=page-with-custom-primary-action); [polaris.shopify.com Page](https://polaris.shopify.com/components/structure/page)
- NN/g breadcrumbs (2018, re-reviewed 1 Sept 2026): show hierarchy, not history. The current page is not a link. Place breadcrumbs at the top below the global nav. On mobile avoid wrapping, keep tap targets at least 1cm × 1cm, and consider showing only the last level(s). Breadcrumbs supplement primary navigation and do not replace it. — [NN/g Breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/)
- Carbon data tables (snippet) come in five row-height sizes: roughly 24px (xs), 32px (sm), 40px (md, new in Carbon 11), 48px (lg) and 64px (xl). The column header and toolbar heights should match the row size. — [Carbon data table (search result)](https://v11.carbondesignsystem.com/components/data-table/usage/); [Carbon issue #6262](https://github.com/carbon-design-system/carbon/issues/6262)

### Inferences
- Shell: `SidebarProvider` + `Sidebar collapsible="icon" variant="inset"` + `SidebarInset`. The header strip should be about 48–56px tall (dashboard-01 style) and contain, from left to right: `SidebarTrigger`, a vertical separator, breadcrumbs, flexible space, a search button showing a "Ctrl K" chip, an optional global date-range chip (Dashboard and Reports only), and the user menu (avatar, name, role badge OWNER/VIEWER, theme toggle, logout). The logo/business name goes in `SidebarHeader`. `SidebarFooter` holds the user menu, following the shadcn `nav-user` pattern.
- Content width: list and table pages should use the full width, because data tables need horizontal room. Forms should be narrow, about `max-w-2xl` (672px), so labels and inputs stay together. Detail pages can use a 2/3 + 1/3 split on screens 1024px and wider. A page padding of `p-4 lg:p-6` with `gap-4`/`gap-6` between sections matches the dashboard-01 spacing. This is an inference, because the Polaris layout page with exact widths could not be fetched.
- Density: use shadcn's default table row height (about 40px, Carbon "md") on desktop. On touch devices use 48px or more, which matches NN/g's 1cm tap target. Offer a density toggle later, not at launch.
- The shadcn defaults (Cmd+B toggle, cookie persistence, tooltips when collapsed, Sheet on mobile) cover most of the shell requirements without custom code.

### Gaps
- The Polaris Layout foundations page and the exact page-width tokens could not be fetched, so the concrete max-widths above are my own recommendations, not sourced.
- No 2025–2026 quantitative study was found comparing a collapsible sidebar with top navigation specifically for about 8 sections.

## 2. Information architecture: grouping, labels, icons with text, role-based hiding for VIEWER

### Takeaway
Arrange the sidebar in labelled groups (`SidebarGroupLabel`): **Overview** (Dashboard), **Daily work** (Purchases, Sales Orders, Deliveries), **Stock & Reports** (Stock, Reports), and **Setup / Masters** (Companies, Materials). Every item gets an icon and a visible text label. When the rail is collapsed, the labels appear as tooltips, which shadcn provides. For VIEWER, hide create/edit/delete controls rather than showing them and then refusing, and enforce the same rule on the server.

### Cited Findings
- shadcn Sidebar supports grouping with `SidebarGroup` + `SidebarGroupLabel`, count badges with `SidebarMenuBadge` (for example, open POs), and nested items with `SidebarMenuSub`. — [shadcn Sidebar docs](https://ui.shadcn.com/docs/components/sidebar)
- Collapsed icon-only buttons automatically get tooltips showing the text label. — [shadcn sidebar.tsx source](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx)
- Material 3 bottom navigation bars need text labels on 3–5 destinations (snippet). — [Material 3 Navigation bar](https://m3.material.io/components/navigation-bar/guidelines)
- Tally Prime, which Indian accountants already know, uses "Sales" and "Purchase" vouchers (F8/F9) and "masters" (Alt+C, "Create Master"). That makes "Masters", "Sales" and "Purchase" familiar words for this audience. — [Tally shortcut guides (secondary)](https://tallymantra.com/tally-prime-shortcut-keys-complete-2026-reference-guide/); [Internshala Tally shortcuts](https://trainings.internshala.com/blog/tally-shortcut-keys/)

### Inferences
- Suggested labels and icon names (lucide-react, shadcn's default icon set):
  - Overview: Dashboard (`LayoutDashboard`)
  - Daily work: Purchases (`ArrowDownToLine` / `Truck`), Sales Orders (`ClipboardList`, badge = open POs), Deliveries (`PackageCheck` / `Truck`)
  - Stock & Reports: Stock (supplier stock and material stock, `Warehouse`), Reports (`BarChart3`)
  - Setup: Companies (`Building2`), Materials (`Layers`)
- Use "Sales Orders" or "Sales POs" for the PO module and "Deliveries" for the sale/dispatch transactions. In yard vocabulary a "sale" happens when material is dispatched, so the label should be "Deliveries (Sales)" or "Dispatches". Validate this with the owner: the backend calls it "Sales", and Tally users call the invoice "Sales". A subtitle such as "Deliveries — dispatches against a PO" in the page description removes ambiguity.
- Put "Masters/Setup" last. Masters are rarely edited, while daily transactions need to be near the top.
- VIEWER role: hide primary actions ("New purchase"), row-action menu items (Edit/Delete) and quick-create buttons, and render detail pages read-only. Show a small "View only" badge in the user menu so missing buttons do not look like a bug. Drive this from a single `can('write')` helper and also guard the routes (a TanStack Router `beforeLoad` redirect for `/purchases/new`). Hiding reduces clutter. Visible-but-disabled buttons invite "why can't I?" questions. This is an inference, as I found no source that settles hide vs disable specifically.

### Gaps
- I found no NN/g or Baymard source from 2025–2026 comparing hiding and disabling for permission-restricted actions. The recommendation above is reasoned, not evidence-backed.
- No source validated plain-language labels with Indian scrap-yard users. A 5-user card-sort or first-click test is recommended.

## 3. Navigation aids: command palette, Tally-style shortcuts, recent items, breadcrumbs, deep-linkable URLs, mobile bottom bar vs hamburger

### Takeaway
Add a Ctrl+K command palette (shadcn `Command` in a `CommandDialog`) with sections for Go to, Create, and Search (companies, materials, POs), plus a visible "Search… Ctrl K" button in the header so users can find it. Offer Tally-style function keys as optional accelerators. Keep every filter, tab and date range in the URL through TanStack Router search params. On phones, use a bottom navigation bar with 4 destinations plus "More". NN/g found hidden navigation slows users and cuts discoverability, and Material 3 limits bottom bars to 3–5 destinations.

### Cited Findings
- Cmd/Ctrl+K palettes are now a de-facto standard (Linear, Vercel, GitHub, Slack, Raycast). They grew out of code editors (VS Code, Sublime), and they help new or infrequent users discover features. Advice for enterprise apps: put a small ⌘K chip in the search bar or header and mention it once during onboarding. — [Mobbin glossary](https://mobbin.com/glossary/command-palette); [MacStories](https://www.macstories.net/linked/command-k-bars-as-a-modern-interface-pattern/); [uxpatterns.dev](https://uxpatterns.dev/patterns/advanced/command-palette); [buildmvpfast 2026](https://www.buildmvpfast.com/blog/how-to-add-cmd-k-command-palette-saas-2026) (secondary/blog sources)
- Tally Prime shortcuts familiar to Indian accountants: F2 change date, F5 Payment, F6 Receipt, F8 Sales, F9 Purchase, Alt+C create master (works inside a field to create a missing ledger or stock item without leaving the voucher), Ctrl+A save. — [Tally shortcut guides (secondary, several agree)](https://tallymantra.com/tally-prime-shortcut-keys-complete-2026-reference-guide/); [aiaccountant](https://www.aiaccountant.com/blog/all-tally-prime-shortcut-keys-list); [Vyapar TaxOne](https://taxone.vyapar.com/post/shortcut-keys-for-tally-prime)
- shadcn Sidebar already reserves Ctrl+B for toggling the sidebar. — [shadcn Sidebar docs](https://ui.shadcn.com/docs/components/sidebar)
- NN/g (2016): on mobile, show navigation links if there are four or fewer; hide them only when there are more. Hidden navigation was used in 57% of mobile tasks and made users 15% slower. — [NN/g Hamburger Menus](https://www.nngroup.com/articles/hamburger-menus/)
- Material 3 (snippet): a navigation bar shows 3–5 destinations and should not be used for more than 5. Compact windows under 600dp should always use a navigation bar, not a rail. Medium windows (600–839dp) suit a rail or horizontal items. — [Material 3 Navigation bar](https://m3.material.io/components/navigation-bar/guidelines); [Material 3 Navigation rail](https://m3.material.io/components/navigation-rail/guidelines)
- NN/g breadcrumbs: they show hierarchy, and on mobile they can be truncated to the last level. — [NN/g Breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/)

### Inferences
- Command palette groups: "Create" (New purchase, New sales order, New delivery, New company, New material; OWNER only), "Go to" (all 8 sections), "Recent" (last 5 opened companies/POs kept in localStorage per user), and "Search" (server-side company/material/PO number search with a 250ms debounce through TanStack Query).
- Shortcut map, suitable for Tally users and not clashing with browser keys: `Ctrl+K` palette, `Ctrl+B` sidebar, `Alt+P` new purchase, `Alt+O` new sales order, `Alt+D` new delivery, `Alt+C` inside a Combobox to create a missing company or material (mirrors Tally), `Ctrl+Enter` / `Ctrl+S` save the form, `Esc` close a sheet or dialog, `/` focus the table search. F8/F9 can be offered as aliases, but browsers and OSes capture some F-keys (F5 reload, F11 fullscreen), so the Alt combos should be the primary set. List all shortcuts in a "?" help dialog and in palette item hints (`CommandShortcut`).
- Deep links: every list page keeps `?q=&status=&from=&to=&companyId=&materialId=&page=&sort=` in TanStack Router validated search params (Zod). That makes dashboard drill-downs, "Copy link" and browser Back work for free. Examples: `/sales-orders?status=PENDING`, `/purchases?companyId=…&from=2026-09-01&to=2026-09-30`.
- Mobile (below 768px): a fixed bottom bar with 4 items plus More: Home (Dashboard), Purchases, Deliveries, Stock, More (a Sheet with Sales Orders, Companies, Materials, Reports, Settings). Add a floating or central "+" that opens a "What are you recording?" action sheet (Purchase / Delivery), since yard staff mainly record transactions. Keep the shadcn Sidebar Sheet for the "More" menu. Total visible destinations stay at 5 or fewer (Material 3), and the most-used items stay visible (NN/g).
- Recent items: show "Recently viewed" in the palette and optionally a small "Recent" SidebarGroup (maximum 5) on desktop.

### Gaps
- NN/g has no dedicated research article on command palettes that I could find. The evidence for palettes comes from practitioner and blog sources, not usability studies.
- The Tally shortcut sources are secondary (training sites). They agree with each other, but Tally's official help page was not fetched.
- The NN/g hidden-navigation study is from 2016. No newer NN/g replication was found, but it is still widely cited as the reference.

## 4. Reducing clicks: quick-create, smart defaults, inline creation, Save & add another; modal vs sheet vs full page

### Takeaway
Use each container for a specific job:
- Right-side **Sheet** for create and edit forms of short records: purchase, company, material, and a delivery started from a PO. The list stays in view behind it.
- Small **Dialog** only for confirmations and tiny inline creates, such as a new company from inside a select.
- **Full page** for complex, multi-section or multi-step work: the sales order detail with its deliveries, and reports.

Pre-fill today's date and the last-used supplier, material and rate. Offer "Save & add another" on Purchase and Delivery forms. Carbon's create-flow pattern and NN/g's modal guidance support this split.

### Cited Findings
- NN/g (2017, still standard): modals suit critical errors, missing information needed to continue, simplifying a workflow into steps, and preventing irreversible actions. Avoid them for complex decisions that need outside information. Drawbacks: they interrupt, lose context ("users may forget some of the details"), add a dismiss step and hide background content. Nonmodal alternatives (such as Gmail compose) let users refer to other content while working. — [NN/g Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/)
- Carbon create flows (snippet): for simple creation with one or two options, use a small standard modal over the content, and avoid scrolling inside a modal. For more complex flows, use a side panel, which gains screen space while keeping the user in context. For flows with many fields or supporting imagery, consider a full page. On the last step the primary button changes from "Next" to "Create". — [Carbon Create flows](https://carbondesignsystem.com/community/patterns/create-flows/); [Carbon Create flows (experimental)](https://www.carbondesignsystem.com/experimental/create-flows/)
- NN/g on defaults (2005, principle still standard): "Pre-populate fields with the most common value if you can determine it in advance." Defaults act as just-in-time instructions and speed up completion, and most users keep defaults. — [NN/g The Power of Defaults](https://www.nngroup.com/articles/the-power-of-defaults/)
- In Tally, Alt+C inside a voucher field creates a missing ledger or stock item without leaving the voucher. This is the inline-create habit Indian accounting users already have. — [Tally shortcut guides (secondary)](https://tallymantra.com/tally-prime-shortcut-keys-complete-2026-reference-guide/)
- "Add another" patterns in UK government design systems (MoJ, DWP): the choice is between adding many items on one page and a loop that builds a summary list. Research found internal services need speed, while public services need clarity. Repeated fields with identical labels are an accessibility risk. — [MoJ Add another](https://design-patterns.service.justice.gov.uk/components/add-another); [DWP Add another thing – design notes](https://f-new-site.design-system.dwp.gov.uk/patterns/add-another-thing/design-notes)

### Inferences
- Container choice for this app:
  - New/Edit Purchase: right Sheet (`sm:max-w-lg` to `xl`, about 512–576px), about 8 fields in one column, sticky footer "Save" and "Save & add another".
  - New/Edit Company, Material: Sheet (or Dialog when launched inline from a Combobox; about 3–4 fields, no scrolling, per Carbon).
  - New Sales Order: Sheet for about 5 fields (customer, material, quantity, rate, date). Use a full page only if POs later get multiple lines.
  - New Delivery: Sheet opened from the PO row or PO detail page, with the PO pre-selected and locked. Show live limits (PO remaining, overall stock, the selected supplier's stock) as helper text or a small summary box, with a validation error if the quantity exceeds the smallest limit. Delivery needs context (remaining quantity), so a side panel beats a modal (NN/g context-loss drawback).
  - Detail views: full pages with their own URLs, not modals, so they can be deep-linked and have Back behaviour.
  - Delete/Cancel PO: AlertDialog confirmation (NN/g: irreversible action).
  - Make Sheets deep-linkable (`?create=purchase` or the route `/purchases/new` rendered as a Sheet over the list) so a refresh does not lose the form. This is optional but improves robustness.
- Smart defaults: date = today. Supplier, material and rate = last used by this user, stored in localStorage and shown as "Last used". Better still, fetch the supplier's last rate for the chosen material from the API and pre-fill it as an editable value. Also pre-fill the vehicle number from that supplier's last purchase. For a delivery started from a PO: customer, material and rate come from the PO, and quantity defaults to min(PO remaining, available stock).
- Inline creation: `Combobox` (Popover + Command) for company and material, with a final item "+ Add ‘<typed text>’" (plus `Alt+C`) that opens a small Dialog pre-filled with the typed name. On save, auto-select the new record and invalidate the TanStack Query list. Company type filtering: the purchase form lists PURCHASE/BOTH companies, and the delivery or sales form lists SALE/BOTH.
- "Save & add another" keeps the date and supplier, clears quantity, vehicle and invoice, and moves focus to the first cleared field. Show a toast with "View" and "Undo/Edit" links. The main save closes the Sheet and highlights the new row in the list.
- Row quick actions: on the Sales Orders list, each PENDING or PARTIALLY_SUPPLIED row gets a visible "Deliver" button (not hidden in a menu, since it is the most frequent action), plus a "…" menu for Edit/Cancel. On a company row: "New purchase" or "New order", depending on type.

### Gaps
- The full Carbon create-flow page was truncated, so exact Carbon widths for side panels could not be confirmed (Carbon side panels are commonly 320/480/640px; not verified).
- No quantitative study was found measuring time saved by "Save & add another" in internal tools. The DWP note that internal services prioritise speed is the closest evidence.

## 5. Master–detail: list → detail page vs side panel; record detail page anatomy

### Takeaway
Use list → full detail page (a real URL) for records with related records: Company, Sales Order and Material. Optionally, show a peek Sheet for quick look-ups of simple rows (a purchase or a delivery). A detail page should have a header with the name, status badge and primary action, then a row of 3–4 summary stat cards, then tabs or sections listing related records in the same data-table component used elsewhere.

### Cited Findings
- Polaris (snippet): detail pages should have breadcrumbs and pagination (previous/next record) and often have several actions. Use at most 1 primary and 3 secondary actions. — [Polaris Page](https://polaris.shopify.com/components/structure/page)
- NN/g: breadcrumbs reflect hierarchy (for example Sales Orders > PO-0142). — [NN/g Breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/)
- Carbon: side panels keep the user in the context of where they are working. — [Carbon Create flows (snippet)](https://carbondesignsystem.com/community/patterns/create-flows/)
- NN/g modal drawbacks (context loss, obscured content) apply to detail views shown as overlays. — [NN/g Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/)

### Inferences
- **Sales Order detail** (`/sales-orders/$id`):
  - Header: "PO-0142 · Acme Steel", status Badge (PENDING amber, PARTIALLY_SUPPLIED blue, COMPLETED green, CANCELLED grey), primary "Record delivery", secondary Edit / Cancel PO.
  - Stat cards: Ordered (t), Delivered (t), Remaining (t) with a Progress bar, Rate (₹/t), Value delivered (₹).
  - Section: the Deliveries table (date, supplier stock used, tons, vehicle, invoice).
- **Company detail** (`/companies/$id`):
  - Header: name, type badge, contact, primary "New purchase" or "New order", depending on type.
  - Stat cards for the period: total purchased (t/₹), total sold (t/₹), open POs, stock held from this supplier.
  - Tabs: Purchases | Sales orders | Deliveries | Stock. Tabs are URL search params (`?tab=purchases`).
- **Material detail**: stock on hand, opening stock, bought/sold this period, stock by supplier (table), recent movements.
- Use a peek Sheet (row click → Sheet with a "Open full page" link) only for flat records such as a single purchase, to save a page load when checking invoice or vehicle details.
- Mobile: tables turn into stacked cards (key figure on the right, secondary line below). The detail page's stat cards use a 2-column grid.

### Gaps
- No 2025–2026 primary source was found giving evidence-based guidance on "detail as page vs split-view" for ERP apps. The recommendation rests on the Polaris/Carbon conventions and NN/g's modal findings.

## 6. Dashboard design for operational decisions

### Takeaway
Build one operational dashboard that fits on a single desktop screen (Few). Order it top to bottom:
1. A period selector with comparison to the previous period.
2. 4 KPI cards with deltas.
3. A "Needs attention" list (purchase required, pending POs, low supplier stock).
4. At most 2 simple charts (bar/line only).
5. Recent transactions.

Every number drills down to a filtered, deep-linked list. Avoid pies and gauges, and give every metric context such as the previous period (NN/g, Few, Linear).

### Cited Findings
- Stephen Few's definition: "A visual display of the most important information needed to achieve one or more objectives; consolidated and arranged on a single screen so the information can be monitored at a glance." — [Data Rocks review of Few](https://www.datarocks.co.nz/blog/data-viz-bookshelf_information-dashboard-design-stephen-few); [Perceptual Edge course PDF](https://www.perceptualedge.com/files/Dashboard_Design_Course.pdf)
- Few lists 13 pitfalls, including ineffective measures, **inadequate context** (users cannot tell whether a number is good or bad), excessive detail or precision, colour misuse and poor arrangement. He also advocates minimising non-data ink and decoration. — [Data Rocks review](https://www.datarocks.co.nz/blog/data-viz-bookshelf_information-dashboard-design-stephen-few); [search summary of Few](https://www.goodreads.com/book/show/336258.Information_Dashboard_Design)
- NN/g (Laubheimer, 2017, still standard): dashboards are "collections of data visualizations, presented in a single-page view that imparts at-a-glance information on which users can act quickly". It distinguishes **operational** dashboards (time-sensitive) from **analytical** ones. Use length and 2D position encodings (bar, line, scatter). Avoid pie and donut charts, treemaps, gauges and 3D. Colour hue should be a secondary grouping cue. — [NN/g Dashboards: Preattentive attributes](https://www.nngroup.com/articles/dashboards-preattentive/)
- Linear (Oct 2025, usage data from their Dashboards launch): the median workspace creates just 2 dashboards, and more than a third go unused when there are too many. Operational dashboards should "highlight unexpected changes and help teams react quickly". Dashboards checked daily or weekly should be "denser, more glanceable, and optimized for speed". Pair metrics with context, such as this week vs last week and historical highs/lows, so viewers "instantly see if something was good, bad, or in line with expectations". — [Linear: Best practices for designing dashboards](https://linear.app/now/dashboards-best-practices); [Linear Dashboards changelog Jul 2025](https://linear.app/changelog/2025-07-24-dashboards)
- shadcn dashboard-01 layout: KPI section cards with trend badges → interactive area chart with range toggle → data table. — [shadcn Blocks](https://ui.shadcn.com/blocks)

### Inferences
- **Layout (desktop, 1280px or wider):**
  - Row 0: page header "Dashboard" plus a period Select/ToggleGroup (Today · This week · This month · Custom range) and a "vs previous period" switch. The period lives in the URL (`?from=&to=`).
  - Row 1: 4 KPI cards (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`), each showing the value, a delta badge vs the previous period (▲/▼ with colour plus the sign, not colour alone) and a one-line footnote.
  - Row 2: "Needs attention" Card (left, about 2/3 width) with lists of materials where purchase is required (shortfall t), POs pending or partially supplied (oldest first, with a "Deliver" button), and suppliers with low remaining stock. Next to it (1/3), a "Stock by material" horizontal bar chart.
  - Row 3: one line or bar chart of "Purchases vs deliveries (tons) by day/week" and the recent-transactions table (last 10).
  - Total: about 8–9 elements, fitting in roughly 1–1.5 screens. That respects Few's single-screen ideal for the top section, with the lower sections as secondary.
- **KPIs for a scrap business** (pick 4 for the cards):
  1. Stock on hand (t), with a link to the stock report.
  2. Purchase required (t). This is the shortfall = open PO remaining minus available stock, summed where positive. It is the most actionable number.
  3. Open sales orders (count and remaining t).
  4. Margin: average sell rate minus average buy rate (₹/t) for the period, with a delta vs the previous period.
  Secondary (in reports, not cards): purchase value ₹, sales value ₹, tons bought, tons delivered, top suppliers and customers.
- **Drill-down**: every KPI card and every attention item is a link, e.g. Open POs → `/sales-orders?status=PENDING,PARTIALLY_SUPPLIED`; Purchase required → `/reports/stock?view=shortfall`; a chart bar → `/purchases?materialId=…&from=…&to=…`.
- **Avoid vanity charts**: no pie or donut of materials (use sorted horizontal bars), no gauges, no 3D, no decorative sparklines without axes. Use one accent colour and grey, and red or amber only for items needing attention (Few, NN/g). Format with Indian conventions: ₹ with lakh/crore grouping (`Intl.NumberFormat('en-IN')`), and tons with 2–3 decimals.
- **VIEWER dashboard**: the same layout, but the "Deliver" and "Record purchase" buttons in the attention list are hidden.
- **Mobile**: the KPI cards become a 2×2 grid, the attention list comes next (most useful in the yard), and charts collapse below the fold.

### Gaps
- Stripe dashboard design writing and Shopify Polaris analytics/"comparison period" guidance could not be retrieved in this session. Those references are unverified here.
- Few's "Common Pitfalls" PDF (2006) could not be parsed, so the full 13-item list is reported only in part, from a secondary review.
- No source gives a hard maximum element count. "5–9 elements" is a common heuristic, but I found no primary citation, so it is not asserted.

## 7. Main user flows with ideal step sequence and click counts

### Takeaway
With a sidebar plus header quick actions, row-level actions, a Ctrl+K palette and smart defaults, each core flow can be done in about 3–6 clicks plus typing. The biggest savings come from opening the delivery form from the PO row with the PO pre-filled, and from pre-filling the last-used supplier/material/rate on purchases.

### Cited Findings
- Defaults reduce effort and errors because most users keep them. — [NN/g The Power of Defaults](https://www.nngroup.com/articles/the-power-of-defaults/)
- Side panels keep the user in context for multi-field creation, and modals should stay short and non-scrolling. — [Carbon Create flows (snippet)](https://carbondesignsystem.com/community/patterns/create-flows/)
- Tally users expect keyboard-first entry (F8/F9, Alt+C, Ctrl+A). — [Tally shortcut guides (secondary)](https://tallymantra.com/tally-prime-shortcut-keys-complete-2026-reference-guide/)
- Visible navigation is faster than hidden navigation. — [NN/g Hamburger Menus](https://www.nngroup.com/articles/hamburger-menus/)

### Inferences
Click counts exclude typing and assume desktop and the OWNER role. "Clicks" includes selecting an option.

1. **Record a purchase** (target 4 clicks)
   1. Click "New purchase" (header "+ New" menu, Purchases page primary button, dashboard quick action or `Alt+P`). Opens a Sheet. Date = today. Supplier, material and rate are pre-filled with the last used values.
   2. Pick or confirm the supplier (Combobox; type to filter; "+ Add supplier" inline if missing).
   3. Pick or confirm the material (Combobox; the rate auto-fills from the supplier's last rate for that material).
   4. Type tons, vehicle and invoice (Tab through), then click "Save" or "Save & add another".
   - With defaults matching: 2 clicks (open + save). Keyboard: `Alt+P` → type → `Ctrl+Enter`.
2. **Create a sales PO** (target 4 clicks)
   1. "New sales order" (Sales Orders page, a customer's detail page with the customer pre-filled, or `Alt+O`). Opens a Sheet.
   2. Customer Combobox (SALE/BOTH only).
   3. Material Combobox. Type quantity and rate. The date defaults to today.
   4. Save. A toast offers "Record delivery now".
3. **Record a delivery against a PO** (target 3 clicks)
   1. On the Sales Orders list, which is filtered to open orders by default, click "Deliver" on the row. You can also click it on the PO detail page or on the dashboard attention list. Opens a Sheet with the PO locked and customer, material and rate shown.
   2. Choose a supplier stock source (Select listing suppliers with available stock of that material, sorted by most stock, each showing its available tons). Quantity defaults to min(PO remaining, supplier stock, overall stock), with the limits shown live.
   3. Save. If the PO is fully delivered, its status updates to COMPLETED and the row disappears from the open filter.
   - If one delivery is split across two suppliers, use "Save & add another" and the PO stays selected.
4. **Check what to buy** (target 1–2 clicks)
   1. Dashboard → "Needs attention: Purchase required" shows the shortfall per material. That is 0 clicks if the dashboard is the home page.
   2. Click a material to open the stock report filtered to shortfall, or click "New purchase" beside it to open the purchase Sheet with the material pre-filled.
5. **Look up a company's history** (target 2–3 clicks)
   1. `Ctrl+K` (or click the header search) → type part of the name → Enter. You land on the company detail page.
   2. The summary cards show totals for the default period (this financial year, April–March, which suits Indian users). Tabs show Purchases / Sales orders / Deliveries / Stock.
   3. Optionally change the period or export. All of this is kept in the URL, so it can be shared.
   - Alternative: sidebar → Companies → search box → row (3 clicks).

### Gaps
- These click counts are design targets derived from the patterns above. They have not been measured with users. A quick usability test with 3–5 yard and office users (desktop and phone) is recommended to validate them, especially the delivery supplier-selection step.
- Backend support needs confirming for "last rate for supplier + material" and "supplier stock for material" lookups. The research did not inspect the API.
