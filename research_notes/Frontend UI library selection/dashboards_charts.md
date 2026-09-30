# Dashboards & Charts for the Metal Scrap Management System (React, as of Sept 2026)

Research date: 2026-09-27. npm figures = weekly downloads for 2026-09-19..2026-09-25 (api.npmjs.org). GitHub figures = stars / last push, fetched 2026-09-27 via api.github.com. Bundle sizes = bundlephobia full-package min / min+gzip (they do NOT account for tree-shaking; real app cost for a few chart types is usually lower, especially for ECharts, MUI X and AntV).

## 1. Charting libraries: health, size, performance, mobile, a11y, theming, licensing

### Takeaway
Recharts 3.x is the clear mainstream default in 2026: about 66.7M weekly downloads, active releases (3.10.1 on 2026-07-25, 3.11 canaries in Sept 2026), MIT license, and it powers shadcn/ui Charts (now on Recharts v3) and Mantine Charts. Its weak spot is touch tooltips on phones. Apache ECharts 6 is the strongest alternative for canvas performance and mobile/touch, but it is heavier and less "React-native". Tremor's npm package has effectively stalled: its last release was Jan 2025 and it supports React 18 only. Avoid it for a new React 19 app.

### Cited Findings

**Summary table (fetched 2026-09-27)**

| Library | Latest (date) | Weekly npm DLs | GitHub stars / last push | License | Bundlephobia min / gzip | React peer |
|---|---|---|---|---|---|---|
| recharts | 3.10.1 (2026-07-25); v3.0.0 released 2025-06-23 | 66,662,413 | 27,590 / 2026-09-26 | MIT | 553.0 KB / 148.0 KB | 16.8–19 |
| echarts (+ echarts-for-react) | 6.1.0 (2026-05-19); v6.0.0 2025-07-30. Wrapper 3.0.6 (2026-01-21) | 5,871,898 (wrapper 1,554,828) | 67,402 / 2026-09-16 (wrapper 5,008 / 2026-01-21) | Apache-2.0 (wrapper MIT) | 1,088.7 KB / 359.3 KB (wrapper 3.5 KB gz) | wrapper >=16 |
| Nivo (@nivo/bar) | 0.99.0 (2025-05-23) | @nivo/core 1,838,407 | 14,102 / 2026-07-21 | MIT | @nivo/bar 262.9 KB / 87.6 KB | 16.14–19 |
| visx (@visx/xychart) | 4.0.0 (2026-06-11) | 534,804 | 21,063 / 2026-06-22 | MIT | 147.9 KB / 48.8 KB | 18–19 |
| chart.js + react-chartjs-2 | 4.5.1 (2025-10-13) / 5.3.1 (2025-10-27) | 14,297,039 / 5,429,673 | 67,719 / 2026-09-14; wrapper 6,940 / 2026-09-25 | MIT | 196.1 KB / 66.8 KB (+1.0 KB wrapper) | wrapper 16.8–19 |
| @tremor/react (npm) | 3.18.7 (2025-01-13) | 456,740 | tremor-npm 16,487 / last push 2025-01-13 | Apache-2.0 | 800.5 KB / 217.3 KB | **^18.0.0 only** |
| Tremor Raw (copy-paste, repo tremorlabs/tremor) | n/a (source) | n/a | 3,636 / last push 2025-10-10 | Apache-2.0 | n/a | repo uses react ^18.3.1, **recharts ^2.15.2** |
| @mantine/charts | 9.6.3 (2026-09-26); v9.0.0 2026-03-31 | 428,010 | Mantine 31,770 / 2026-09-26 | MIT | 90.3 KB / 21.5 KB (excludes recharts peer) | ^19.2.0; peers recharts >=3.2.1 |
| @mui/x-charts | 9.14.0 (2026-09-17); v9.0.0 2026-04-08 | 1,206,304 | mui-x 5,855 / 2026-09-26 | MIT (Community); Pro/Premium commercial | 397.4 KB / 120.7 KB | 17–19 |
| @ant-design/charts (G2) | 2.6.7 (2025-12-23); @antv/g2 5.4.8 | 152,994 (@antv/g2 407,642) | 2,238 / 2026-03-26; G2 12,620 / 2026-09-24 | MIT | 1,814.8 KB / 533.3 KB | >=16.8.4 |

Sources for the table: [npm registry](https://registry.npmjs.org/recharts), [npm downloads API](https://api.npmjs.org/downloads/point/last-week/recharts), [GitHub API](https://api.github.com/repos/recharts/recharts), [bundlephobia API](https://bundlephobia.com/api/size?package=recharts). I queried each package the same way. Recent recharts releases (v3.11.0-canary.4 on 2026-09-21): [GitHub releases](https://github.com/recharts/recharts/releases).

**Recharts v3**
- 3.0 turns accessibility features on by default. It rewrote state management into smaller testable chunks and removed the `recharts-scale` and `react-smooth` dependencies, so animations are now handled in-house. It needs React 16.8+, TS 5.x and Node 18. Other additions: Tooltip portal rendering, `YAxis width="auto"`, and multiple axes on polar charts. The migration guide gives no performance numbers. — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- Mobile touch tooltips have a long history of problems. Tooltips are driven by touch-move, and a plain tap may not select a point. On iOS, tooltips can persist because there is no mouseleave, and some tooltips do not close after scrolling. Most of these issues predate v3, and I did not verify whether v3 fixes all of them. — [#444](https://github.com/recharts/recharts/issues/444), [#754](https://github.com/recharts/recharts/issues/754), [#1109](https://github.com/recharts/recharts/issues/1109), [#2100](https://github.com/recharts/recharts/issues/2100), [#3644](https://github.com/recharts/recharts/issues/3644)
- A 2026 issue in which Recharts charts rendered blank after upgrading to React 19.2.3 was closed on 2026-02-13. — [Issue #6857](https://github.com/recharts/recharts/issues/6857)
- An open a11y gap: PieChart tooltips are not activated by keyboard navigation, unlike other chart types. — [Issue #6338](https://github.com/recharts/recharts/issues/6338)

**shadcn/ui Charts**
- The docs state that the `chart` component now uses Recharts v3. Tokens are referenced as `var(--chart-1)`. `ChartContainer` needs a height, `min-h-*` or `aspect-*` to be responsive. The `accessibilityLayer` prop adds keyboard access and screen-reader support. Light/dark colours are set per series in `ChartConfig` (`theme: {light, dark}`). `ChartTooltipContent` supports `indicator`, `labelKey`, `nameKey` and `hideLabel`. It is copy-paste code under the MIT licence (shadcn-ui/ui has 124,656 stars and was last pushed 2026-09-24). — [shadcn/ui Chart docs](https://ui.shadcn.com/docs/components/chart), [GitHub API](https://api.github.com/repos/shadcn-ui/ui)

**Mantine Charts**
- Built on Recharts. The latest version peers `recharts >=3.2.1` and React ^19.2.0. — [npm registry](https://registry.npmjs.org/@mantine%2Fcharts/latest)
- One `valueFormatter` prop formats both tooltip and axis ticks. The docs example uses `Intl.NumberFormat('en-US')`. Colours come from theme references (e.g. `blue.6`), and `--chart-grid-color` / `--chart-text-color` CSS variables make it colour-scheme aware. Tooltip animation is off by default. It supports reference lines and areas, `orientation`, and stacked, percent and waterfall types. — [Mantine BarChart docs](https://mantine.dev/charts/bar-chart/)

**Tremor**
- Vercel announced the acquisition of Tremor on 2025-01-22. The founders joined Vercel's Design Engineering team to work on the Vercel Dashboard and v0, and Tremor Blocks became free and open source under MIT. At the time Tremor had 35 components, 300 blocks and more than 16,000 stars. — [Vercel blog](https://vercel.com/blog/vercel-acquires-tremor), [DeepNewz summary](https://deepnewz.com/software/vercel-acquires-tremor-on-january-22-2025-making-all-react-components-free-open-556da6ad)
- tremor.so now promotes copy-paste "Tremor Raw" components: 35+ components built on React, Tailwind CSS and Radix, plus 250+ blocks and templates. — [tremor.so](https://tremor.so/)
- Health signals: the npm package `@tremor/react` was last released on 2025-01-13, and its peer dependency is `react ^18.0.0`. A React 19 support request exists. The Tremor Raw repo was last pushed on 2025-10-10, and its package.json still pins `recharts ^2.15.2` and `react ^18.3.1`. — [npm registry](https://registry.npmjs.org/@tremor%2Freact), [tremor-npm #1072](https://github.com/tremorlabs/tremor-npm/issues/1072), [tremor package.json](https://raw.githubusercontent.com/tremorlabs/tremor/main/package.json)

**MUI X Charts**
- Free (MIT) charts: bar, line, area, pie/donut, scatter, sparkline and gauge, with tooltips, highlighting, legends and composition. Pro adds heatmap, funnel, radar, zoom and pan, and export. Premium adds WebGL rendering and candlestick/OHLC charts. — [MUI X Charts overview](https://mui.com/x/react-charts/)
- Licences are counted per concurrent front-end developer. Pro ships as `@mui/x-charts-pro` and Premium as `@mui/x-charts-premium`. I could not extract prices from the docs page. — [MUI X licensing](https://mui.com/x/introduction/licensing/)

**Apache ECharts**
- ECharts 5/6 supports tree-shaking: import from `echarts/core`, register only the charts and components you use with `echarts.use()`, and choose `CanvasRenderer` or `SVGRenderer` explicitly. The docs say this substantially reduces bundle size but give no numbers. — [ECharts handbook: import](https://echarts.apache.org/handbook/en/basics/import/)

### Inferences
- **Maintenance ranking (Sept 2026):** very active: Recharts, Mantine Charts, MUI X Charts, ECharts, shadcn. Active: visx (v4 in Jun 2026), react-chartjs-2. Slow: Chart.js core (last release Oct 2025), Nivo (no release since May 2025, though the repo was pushed Jul 2026), @ant-design/charts (last push Mar 2026). Stalled: Tremor npm and Tremor Raw.
- **Performance and smoothness:** the data here is small (tens of materials, dozens of suppliers), so SVG libraries (Recharts, Nivo, visx, MUI X) are more than fast enough. Canvas libraries (ECharts, Chart.js) only matter at thousands of points. "Smoothness" will depend more on skeleton loaders, stable layout heights and modest animation than on the choice of library. This is inference, not benchmarked.
- **Mobile tooltips:** tap-to-show tooltips are a known Recharts weak point. Mitigations: put exact values in data labels or a table under the chart instead of relying on tooltips, and use horizontal bar lists. ECharts and Chart.js have tap-driven tooltips by design (from general knowledge, not verified this session).
- **Accessibility:** Recharts v3 (accessibility on by default, and shadcn's `accessibilityLayer`) gives the best out-of-the-box a11y among SVG React libraries. Canvas libraries (Chart.js, ECharts) need extra ARIA/description work (general knowledge, not verified this session).
- **Ease of use for a small team:** shadcn Charts and Mantine Charts are the simplest. They are thin, opinionated wrappers over Recharts with theming and dark mode built in. visx is low-level (D3 primitives) and overkill here. AntV/Ant Design Charts is very heavy (533 KB gzip full package) and its docs and community lean Chinese.
- **Licensing:** everything considered is MIT or Apache-2.0 except MUI X Pro/Premium. None of the needed chart types (bar, line, donut, progress, sparkline) requires a paid tier.

### Gaps
- No independent 2025–2026 benchmark comparing rendering smoothness or FPS across these libraries was found or fetched.
- I did not confirm whether Recharts 3.x fully fixed tap-to-show tooltips on iOS/Android. Needs a hands-on test on a real phone.
- MUI X Pro/Premium prices were not captured, because the pricing page was not fetched successfully.
- Tree-shaken real-world sizes (e.g. ECharts with only bar+line on canvas) were not measured.
- Whether Vercel still actively develops Tremor Raw is unclear. The repo activity (last push Oct 2025, still on recharts v2) suggests it does not, but I found no official deprecation notice.

## 2. KPI/stat components and dashboard layout kits / free admin templates

### Takeaway
For a React 19 + Tailwind stack, the best free starting point is shadcn/ui plus the satnaing/shadcn-admin template: MIT, 14,455 stars, updated Sept 2026, React 19.2, Recharts 3.8, Tailwind 4.2, Vite 8, TanStack Router. It includes KPI cards, charts, dark mode, responsive layout and RTL. If the team prefers a batteries-included component library over Tailwind, Mantine 9 (Charts, plus the stats blocks on ui.mantine.dev) is the equivalent. Its admin templates are much smaller community projects.

### Cited Findings
- shadcn-admin (satnaing): MIT, 14,455 stars, last pushed 2026-09-10, 24 open issues. — [GitHub API](https://api.github.com/repos/satnaing/shadcn-admin)
- Its package.json (v2.2.1) lists react ^19.2.5, recharts ^3.8.1, tailwindcss ^4.2.2, vite ^8.0.8 and @tanstack/react-router ^1.168.22. — [package.json](https://raw.githubusercontent.com/satnaing/shadcn-admin/main/package.json)
- It offers light/dark mode, responsive design, 10+ pages, a sidebar, global search, RTL support, optional Clerk auth, and a live demo at shadcn-admin.netlify.app. — [GitHub repo](https://github.com/satnaing/shadcn-admin)
- Kiranism/next-shadcn-dashboard-starter: MIT, 7,068 stars, last pushed 2026-09-11. It is Next.js 16 + shadcn/ui + Tailwind, with tables, forms, auth and billing. — [GitHub API](https://api.github.com/repos/Kiranism/next-shadcn-dashboard-starter)
- Tremor's free dashboard template (tremorlabs/template-dashboard-oss) is Apache-2.0 with 518 stars, last pushed 2025-10-10. — [GitHub API](https://api.github.com/repos/tremorlabs/template-dashboard-oss)
- Mantine admin templates are small:
  - design-sparx/mantine-analytics-dashboard: MIT, 387 stars, pushed 2026-09-23. Described as "Next 16, React 18, Mantine 8".
  - jotyy/Mantine-Admin: MIT, 297 stars, last pushed 2025-01-24 (Mantine 7, Next 14, stale).
  - nedois/mantine-dashboard: 109 stars, pushed 2026-04-06.
  - Source: [GitHub search API](https://api.github.com/search/repositories?q=mantine+admin+dashboard&sort=stars)
- Tremor provides KPI cards, stat components, bar lists, trackers, spark charts, progress circles and data bars as copy-paste code. — [tremor.so](https://tremor.so/)

### Inferences
- Tremor's KPI card, BarList, ProgressBar and Tracker patterns suit this app's "at-a-glance" goals. Because Tremor Raw is copy-paste code under Apache-2.0, you can copy the few patterns you need into a shadcn codebase and restyle them, rather than depending on the stalled package. Check its recharts v2 assumptions when you port chart components.
- shadcn "blocks" (dashboard-01, sidebar and chart blocks) plus shadcn-admin cover the layout: sidebar, header, date-range picker, card grid and data table. For non-technical users, strip the template down to a few pages. Its demo pages (tasks, chats, apps) are irrelevant to an ERP.
- If the rest of the frontend is chosen as Mantine (which another researcher may be evaluating), Mantine Charts plus ui.mantine.dev "Stats" blocks give KPI cards with equal ease. Its template ecosystem is thinner, though.

### Gaps
- I did not fetch the shadcn blocks page or the ui.mantine.dev stats catalogue to enumerate exact KPI-card variants.
- No quality review (code quality, a11y audit) of the templates was done beyond repo metadata.

## 3. Chart types and dashboard design practice for non-technical Indian scrap-business users

### Takeaway
The research-backed guidance agrees: use one screen, a few big numbers, and bar and line charts, which encode length and position. Avoid pies/donuts, gauges and 3D. For this data, use:
- a row of 4–6 KPI cards,
- a horizontal bar or bullet-style "stock vs remaining PO demand" chart per material, with a red highlight on purchase-required rows,
- simple progress bars for PO delivery,
- a line chart for buy/sell rate trends (this needs time-bucketed data the API does not currently return),
- plain sortable tables with inline bars for the supplier stock report.

### Cited Findings
- NN/g (Page Laubheimer, 2017-06-18, older but still standard guidance): dashboards should be understood at a glance. Bar and line charts use length and 2D position, which people perceive preattentively and accurately. Pie and donut charts and treemaps rely on area and angle, which are judged poorly and slowly. Gauges waste space. 3D distorts values. Colour should be a secondary cue, because colour blindness affects up to about 8% of men. — [NN/g: Dashboards: Making Charts and Graphs Easier to Understand](https://www.nngroup.com/articles/dashboards-preattentive/)
- NN/g says both operational and analytical dashboards need an at-a-glance, single-screen view. — [NN/g](https://www.nngroup.com/articles/dashboards-preattentive/)
- Stephen Few: a dashboard should fit on a single screen with no scrolling, so that everything can be seen at once. — [UXmatters review of *Information Dashboard Design*](https://www.uxmatters.com/mt/archives/2007/04/book-review-information-dashboard-design.php), [Few course PDF](https://www.perceptualedge.com/files/Dashboard_Design_Course.pdf)
- Stephen Few's bullet graph (2005) shows one measure against a comparative target and qualitative ranges in a compact form. It was designed to replace gauges, which "display too little information, require too much space". — [Wikipedia: Bullet graph](https://en.wikipedia.org/wiki/Bullet_graph)
- A 2022 academic paper on dashboard design patterns catalogues layout and component patterns. I did not read it in depth. — [Bach et al., arXiv 2205.00757](https://arxiv.org/pdf/2205.00757)

### Inferences (mapping to this app's API)
- **KPI row (4–6 cards):**
  - Tons purchased
  - Tons sold
  - Avg buying rate vs avg selling rate (spread per ton as the headline)
  - Purchase value / sales value in ₹ (compact lakh/crore)
  - PO remaining tons, with active/open PO counts
  - "Materials needing purchase", a count shown red when greater than 0

  On phones these collapse to a 2-column grid. Show a delta or context line only if the API can supply the previous period.
- **Stock vs demand per material:** a horizontal grouped bar (current stock vs remaining PO demand), or bullet-style bars where stock is the bar and demand is a marker line. Horizontal orientation keeps material names readable on phones. Colour rows red (purchase required = demand − stock > 0) or green (extra stock). Always pair the colour with a text label ("Buy 12.5 t" / "Extra 3 t"), per NN/g's colour-blindness caution.
- **Purchase-required indicator:** a sorted list or table ("BarList" style) of materials with purchase required > 0, largest first, with red badges. A chart is not needed. Owners want an action list.
- **PO totals:** one progress bar (delivered / ordered, with remaining shown as a number). Avoid a gauge.
- **Purchased vs sold by material:** horizontal paired bars. A donut is acceptable only for a 2–4 slice share such as purchase value by top materials, and even then a bar list is clearer (NN/g).
- **Rate trend over time:** a line chart with two lines (buy vs sell). The current dashboard API returns only range aggregates, so this needs a new endpoint returning a daily/weekly/monthly series. This is a backend gap to raise.
- **Supplier stock report:** a table with inline mini-bars (purchased / used / available). With many suppliers × materials, a table beats a chart.
- **Numbers over charts on mobile:** because of Recharts' tap-tooltip weaknesses (section 1), show values as data labels at the ends of bars instead of hiding them in tooltips.
- **Simplicity:** use one date-range control with presets (Today, This week, This month, This FY starting 1 April). Use plain-language labels ("Stock in yard", "Still to receive on POs") and consistent units (tons, ₹).
- **Smoothness:** use short animations (about 300–500 ms) or none. Reserve fixed heights with skeletons so the layout does not jump.

### Gaps
- NN/g's 2017 article is the main NN/g source fetched. I did not find a 2025–2026 NN/g article with a specific "max number of KPIs" figure. The "4–6 KPI" guidance above is a common practitioner heuristic, not a sourced research number.
- I found no research specific to Indian SMB or non-technical users on dashboard literacy.

## 4. Indian number formatting (lakh/crore, ₹) and formatter support per library

### Takeaway
Use the built-in `Intl.NumberFormat('en-IN', …)`. It gives ₹1,23,45,678 grouping and compact "1.2Cr" / "1.5L" labels with no library needed. Every candidate library accepts a formatter callback for axes and tooltips. One gotcha: `compactDisplay: 'long'` in en-IN falls back to Western "million/billion", so use short compact or a small custom lakh/crore helper.

### Cited Findings
- Tested locally in Node v22.18.0 (ICU):

  | Input | `en-IN` currency (0 decimals) | `en-IN` compact | `en-IN` compact long | `en-IN` currency compact | `hi-IN` compact |
  |---|---|---|---|---|---|
  | 150000 | ₹1,50,000 | 1.5L | "150 thousand" | ₹1.5L | 1.5 लाख |
  | 2575000.5 | ₹25,75,001 | 26L | "2.6 million" | ₹26L | 26 लाख |
  | 12345678 | ₹1,23,45,678 | 1.2Cr | "12 million" | ₹1.2Cr | 1.2 क॰ |
  | 1234567890 | ₹1,23,45,67,890 | 123Cr | "1.2 billion" | ₹123Cr | – |
  | 12500 | ₹12,500 | 13K | "13 thousand" | ₹13K | – |

  Note the rounding: 12500 becomes "13K" in compact form.
  — local test via `node -e` with `Intl.NumberFormat` (no URL. Spec: [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat))
- Mantine Charts takes one `valueFormatter` prop for both tooltip and axis ticks. — [Mantine BarChart docs](https://mantine.dev/charts/bar-chart/)
- shadcn `ChartTooltipContent` supports customisation such as `labelKey`, `nameKey` and `indicator`. — [shadcn Chart docs](https://ui.shadcn.com/docs/components/chart)

### Inferences
- Formatter hooks in the other libraries. These are general knowledge I did not re-verify this session, but they are stable APIs:
  - Recharts: `<XAxis tickFormatter>`, `<Tooltip formatter>` and `<LabelList formatter>`
  - ECharts: `axisLabel.formatter`, `tooltip.valueFormatter` and `label.formatter`
  - Chart.js: `options.scales.y.ticks.callback` and `plugins.tooltip.callbacks.label`
  - MUI X Charts: `valueFormatter` on series and axes
  - Nivo: `valueFormat` / `axisLeft.format`
  - visx: `tickFormat`

  All of them work with the same `en-IN` helper.
- Recommended helpers:
  - `formatINR(v)`: full ₹ with 0–2 decimals, for KPI cards and tooltips.
  - `formatINRCompact(v)`: ₹1.2Cr / ₹26L, for axes and small tiles.
  - `formatTons(v)`: e.g. "12.35 t", with max 2–3 decimals.
- The backend returns decimals as strings. Parse with `Number()` only for charting and plain display. At tons/rupee scale, doubles are precise enough to display. Keep the strings for any arithmetic that must match the backend exactly, or compute derived values such as the buy-sell spread on the backend.
- Offer Hindi or other regional labels (hi-IN compact gives "1.5 लाख") only if the app is localised. Browser ICU data should match Node, but test on target Android and iOS devices.

### Gaps
- Cross-browser consistency of `en-IN` compact output (older Android WebView, Safari) was not tested.

---

## Verdict (synthesis for the report writer)

**Recommended combination:** shadcn/ui Charts on Recharts v3, with the shadcn-admin (satnaing) template as the layout shell. Borrow a few Tremor Raw patterns (KPI card, BarList, ProgressBar) and restyle them. Use `Intl.NumberFormat('en-IN')` helpers throughout.

Why:
- MIT everywhere.
- The most-used and best-maintained React charting stack in 2026 (Recharts about 66.7M weekly downloads, actively released).
- Accessibility layer on by default.
- Dark mode via CSS variables.
- A tiny API surface for bar, line and progress charts.
- The template already runs React 19.2, Recharts 3.8 and Tailwind 4.

**Equivalent alternative:** if the wider UI decision lands on Mantine, use Mantine 9 plus @mantine/charts. It is the same Recharts engine, and `valueFormatter` makes lakh/crore formatting trivial. The only downside is a thinner admin-template ecosystem.

**Use Apache ECharts (tree-shaken, via echarts-for-react) only if** on-device testing shows Recharts tap-tooltips are unacceptable on phones, or large time-series appear later.

**Avoid:**
- `@tremor/react`: stalled since Jan 2025, React 18 only.
- Ant Design Charts: very heavy, and its maintenance is slowing.
- visx: too low-level.
- Nivo: no release in 16 months.
- MUI X Charts: not needed unless the app adopts MUI. Its free tier covers everything needed here.

**Design rules:**
- One screen with 4–6 KPI cards.
- Horizontal bars for stock vs demand, with red "Buy X t" labels.
- An action list for materials needing purchase.
- A progress bar for PO delivery.
- A line chart for rates (needs a new time-series endpoint).
- Tables with inline bars for supplier stock.
- No pies, gauges or 3D.
- Visible data labels instead of relying on tooltips on phones.
