# React UI Component Libraries for an Internal ERP-style App (state as of 27 Sep 2026)

Scope: shadcn/ui (Radix / Base UI + Tailwind v4), Mantine, Ant Design, MUI Material UI (+ MUI X, Joy UI), Chakra UI v3, HeroUI (ex-NextUI), PrimeReact, and newer entrants (Base UI, React Aria Components, Ark UI / Park UI, Radix Themes). Judged for a Metal Scrap Management System frontend (CRUD, data tables, date-range filters, searchable selects, live-limit forms, KPI dashboard, toasts; desktop-first but usable on tablet/phone; non-technical users; owner wants simple + smooth).

Method note: version numbers, release dates, licenses, React peer ranges and weekly downloads were pulled live from the npm registry API (registry.npmjs.org / api.npmjs.org) on 2026-09-27; GitHub stars/last-push from the GitHub REST API the same day. Qualitative claims come from official docs/blogs/changelogs fetched in this session. Where a statement relies on prior knowledge not re-verified in this session, it is placed under Inferences/Gaps and flagged.

## Q1. Current version, release cadence, maintenance health, ownership/funding (2025-2026)

### Takeaway
Every library in scope is actively maintained except Joy UI (on hold, stuck at 5.0.0-beta.52) and Radix Themes / Park UI (slow, last pushes Apr 2026). The big 2025-2026 shifts: Base UI 1.0 (Dec 2025) and shadcn/ui switching its default primitives from Radix to Base UI (3 Jul 2026); MUI jumping v7 -> v9 (Apr 2026); Mantine 9 (Mar 2026, React 19.2+ only); HeroUI v3 ground-up rewrite (Mar 2026); Ant Design 6 (Nov 2025); and PrimeReact 11 (Jul 2026) moving from MIT to a commercial "PrimeUI License".

### Cited Findings

Raw numbers (npm registry + GitHub API, fetched 2026-09-27; downloads = last 7 days):

| Package | Latest version (date) | Major release dates | Weekly npm downloads | GitHub repo stars (last push) | License (npm) | React peer |
|---|---|---|---|---|---|---|
| shadcn (CLI) | 4.21.0 (2026-09-04) | v3.0 2025-08-27; v4.0 2026-03-06 | 10,890,568 | shadcn-ui/ui 124,656 (2026-09-24) | MIT | n/a (copy-paste) |
| @base-ui/react | 1.8.0 (2026-09-04) | 1.0.0 2025-12-11 | 16,114,005 | mui/base-ui 11,001 (2026-09-26) | MIT | ^17/^18/^19 |
| radix-ui (umbrella) | 1.6.7 (2026-07-24) | 1.0.0 2022-12-21 | 15,853,135 (@radix-ui/react-dialog: 83,684,615) | radix-ui/primitives 19,335 (2026-08-08) | MIT | 16.8-19 |
| @mantine/core | 9.6.3 (2026-09-26) | v7 2023-09-18; v8 2025-05-05; v9 2026-03-31 | 2,743,549 (@mantine/dates 1,340,689) | mantinedev/mantine 31,770 (2026-09-26) | MIT | ^19.2.0 |
| antd | 6.6.5 (2026-09-20) | v5 2022-11-18; v6 2025-11-21 | 4,252,395 | ant-design/ant-design 99,619 (2026-09-27) | MIT | >=18 |
| @mui/material | 9.4.0 (2026-08-27) | v6 2024-08-27; v7 2025-03-26; (no v8); v9 2026-04-07 | 11,699,548 | mui/material-ui 99,091 (2026-09-27) | MIT | ^17/^18/^19 |
| @mui/x-data-grid | 9.14.0 (2026-09-17) | v8 2025-04-17; v9 2026-04-08 | 3,474,252 | mui/mui-x 5,855 (2026-09-26) | MIT (Community pkg) | ^17/^18/^19 |
| @mui/joy | 5.0.0-beta.52 (2025-03-18) | never left beta | 131,604 | (in mui/material-ui) | MIT | ^17/^18/^19 |
| @chakra-ui/react | 3.37.0 (2026-08-28) | v3.0 2024-10-22 | 1,879,701 | chakra-ui/chakra-ui 40,668 (2026-09-24) | MIT | >=18 |
| @heroui/react | 3.2.6 (2026-09-17) | v3.0 2026-03-21 | 719,267 | heroui-inc/heroui 30,827 (2026-09-26) | MIT | >=19 |
| primereact | 11.1.0 (2026-08-05) | v10 2023-09-28; v11 2026-07-15 | 386,292 | primefaces/primereact 8,311 (2026-09-24) | "SEE LICENSE IN LICENSE.md" (v10.x was MIT) | >=19 |
| react-aria-components | 1.21.1 (2026-09-04) | 1.0 2023-12-20 | 5,186,686 | adobe/react-spectrum 15,892 (2026-09-26) | Apache-2.0 | 16.8-19 |
| @ark-ui/react | 5.39.2 (2026-09-13) | v5 2025-03-06 | 1,093,170 | chakra-ui/ark 5,397 (2026-09-25); chakra-ui/park-ui 2,368 (2026-04-10) | MIT | >=18 |
| @radix-ui/themes | 3.3.0 (2026-01-31) | v3 2024-03-23 | 1,044,530 | radix-ui/themes 8,726 (2026-04-11) | MIT | 16.8-19 |
| Related: tailwindcss 4.3.3 (4.0.0 2025-01-21; 147.6M/wk); @tanstack/react-table 9.2.4 (9.0.0 2026-08-04; 24.2M/wk); sonner 2.0.8 (59.9M/wk) | | | | | | |

Sources: [npm registry](https://registry.npmjs.org/), [npm downloads API](https://api.npmjs.org/downloads/point/last-week/@mantine/core), [GitHub API](https://api.github.com/repos/shadcn-ui/ui)

- Base UI shipped stable v1.0.0 on 11 Dec 2025; several engineers who built Radix now work on Base UI; Base UI ships monthly releases with a full-time team (MUI-backed). — [PkgPulse / ShadcnDeck summaries via search](https://www.shadcndeck.com/blog/radix-vs-base-ui); corroborated by npm time data (1.0.0 = 2025-12-11) — [npm](https://registry.npmjs.org/@base-ui%2Freact)
- Radix concerns: Radix was built by Modulz, acquired by WorkOS; many original maintainers left and contribution cadence slowed, with long-standing issues (e.g., combobox) moving slowly. The repo describes itself as "Maintained by @workos". — [Medium: Is your shadcn UI project at risk?](https://mashuktamim.medium.com/is-your-shadcn-ui-project-at-risk-a-deep-dive-into-radixs-future-91af267c4bec); [radix-ui/primitives GitHub](https://github.com/radix-ui/primitives) (treat the Medium piece as sentiment)
- shadcn/ui made Base UI the default for new projects on 3 Jul 2026. Reasons given: projects on shadcn/create picked Base UI over Radix 2:1; Base UI stable (1.6.0 at the time, 6M+ weekly downloads); "Every new project we've started runs on Base UI". Radix is NOT deprecated: "every update and new component will ship for both libraries (unless a component only exists in Base UI)"; `shadcn init -b radix` keeps Radix. — [shadcn changelog: Base UI as the Default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- shadcn changelog timeline: React 19 support (Oct 2024); Tailwind v4 (Feb 2025); radix-ui umbrella-package migration (Jun 2025); CLI v3 + MCP server (Aug 2025); `npx shadcn create` / styles (Dec 2025); Base UI docs (Jan 2026); Blocks for Radix and Base UI (Feb 2026); CLI v4 (Mar 2026); Base UI default (Jul 2026); standalone `cn` package (Sep 2026). — [shadcn changelog](https://ui.shadcn.com/docs/changelog)
- MUI 2026 strategy post (1 Jan 2026): Material UI remains core priority; Base UI getting substantial investment; Pigment CSS (zero-runtime styling) "remains in alpha and paused"; Joy UI inactive with no timeline; Toolpad unmaintained; MUI Sync ceased 2024. — [MUI blog: 2026 and beyond](https://mui.com/blog/2026-and-beyond/)
- Joy UI: "in beta and development is currently on hold"; MUI recommends Material UI for new projects. — [Joy UI docs](https://v7.mui.com/joy-ui/getting-started/); [GitHub issue #44977](https://github.com/mui/material-ui/issues/44977)
- MUI v9: Material UI jumped from v7 straight to v9 to align with MUI X v9 ("single shared major for the suite"); adds NumberField and Menubar, roving-tabindex accessibility work, sx prop performance, CSS-variables theme with color-mix(), removal of deprecated APIs. — [Introducing MUI v9](https://mui.com/blog/introducing-mui-v9/); [Material UI v9 blog](https://mui.com/blog/introducing-material-ui-v9/)
- Mantine 9.0 released 31 Mar 2026; requires React 19.2+ for all @mantine/* packages, Tiptap 3+, Recharts 3+; new @mantine/schedule package (day/week/month/year/mobile calendar views, drag-and-drop); all Input-based components gain a `loading` prop; default radius changed sm->md, medium font weight 500->600. Mantine is essentially a single-maintainer-led project (Vitaly Rtishchev) — ownership detail not re-verified here. — [Mantine 9.0.0 changelog](https://mantine.dev/changelog/9-0-0/); [GitHub release 9.0.0](https://github.com/mantinedev/mantine/releases/tag/9.0.0)
- Ant Design v6 (2025-11-21): requires React 18+, React-19 patch package no longer needed, CSS variables on by default, modern browsers only (no IE), DOM structure upgrades, 100+ API deprecations (dropdown* -> popup*, unified `styles`/`classNames`, `direction` -> `orientation`, size enums), @ant-design/icons must be 6.x; a CLI tool helps find deprecated usages. — [Ant Design v6 migration guide](https://ant.design/docs/react/migration-v6)
- HeroUI v3 stable March 2026 (npm 3.0.0 = 2026-03-21): ground-up rewrite, 75+ web components (21 new) plus a new React Native library (37 components); built on React Aria Components + Tailwind CSS v4; animations moved entirely to CSS (no JS runtime); compound component API, no provider wrapper; ships MCP server, agent skills, llms.txt; styles split into standalone @heroui/styles. v2 and v3 cannot coexist; some v2 features (input label animations, autocomplete, Navbar) reported missing; users questioned transparency. HeroUI (formerly NextUI) is backed by Y Combinator, created by Junior Garcia. — [InfoQ, Jul 2026](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/); [HeroUI v3 release notes](https://heroui.com/en/docs/react/releases/v3-0-0)
- PrimeReact v11 landed (11.0.0 on 2026-07-15; current 11.1.0). — [GitHub discussion #4290](https://github.com/orgs/primefaces/discussions/4290); [npm](https://www.npmjs.com/package/primereact)
- Chakra UI v3 (Oct 2024) was a near-total rewrite; community reports the v2->v3 migration as "a nightmare" with many breaking changes, gaps in migration docs, and no way to gradually run v2 and v3 providers side by side. — [GitHub discussion #9853](https://github.com/chakra-ui/chakra-ui/discussions/9853); [dev.to migration write-up](https://dev.to/theoforger/sprint-5-chakra-ui-v3-migration-4pfi)

### Inferences
- @base-ui/react's 16.1M weekly downloads (above radix-ui's 15.9M umbrella package) is largely driven by shadcn's July 2026 default switch; momentum in the shadcn ecosystem is now clearly toward Base UI.
- Mantine's React ^19.2.0 peer and HeroUI/PrimeReact's React >=19 peers are fine for a greenfield Vite/React 19 app; no library in scope blocks React 19.
- Mantine's release cadence is very high (9.6.3 six months after 9.0) but is concentrated on a small core team; bus-factor is a residual risk compared with company-backed MUI/Ant/Adobe.
- Radix Themes (last push Apr 2026) and Park UI (last push Apr 2026) look low-activity; not recommended as foundations for a new 2026 app.

### Gaps
- Exact funding/revenue of Mantine, Chakra (Chakra Systems), and HeroUI Inc. beyond "YC-backed" for HeroUI was not verified.
- Ant Design is maintained by Ant Group (Alibaba affiliate) — well known, but not re-fetched this session.
- The npm "latest" field for antd's package.json-derived version failed via one endpoint; the value 6.6.5 comes from the full registry document (dist-tags.latest).

## Q2. Component coverage for business apps (data table, date & date-range picker, combobox, number input, forms, modal/drawer, toast, stepper, skeleton, empty state, tabs, AppShell)

### Takeaway
Ant Design is the most complete "ERP kit" out of the box (powerful Table, RangePicker, Select with search, InputNumber, Form with validation, Steps, Empty, Result) — all MIT. Mantine is nearly as complete (DatePickerInput type="range", Select/Combobox, NumberInput, AppShell, Stepper, notifications) but has no official data grid. MUI's best pieces (DateRangePicker, multi-filter/pinning in DataGrid) are paid. shadcn/ui now covers Combobox, Data Table (TanStack recipe), Date Picker, Field, Input Group, Empty, Spinner, but many are recipes you assemble.

### Cited Findings
- shadcn/ui added Spinner, Empty, Combobox, Data Table, Date Picker, Field and Input Group during 2025-2026; blocks exist for both Radix and Base UI. — [shadcn changelog](https://ui.shadcn.com/docs/changelog)
- MUI v9 adds NumberField and Menubar to Material UI core. — [MUI v9 blog](https://mui.com/blog/introducing-material-ui-v9/)
- MUI X Community (MIT) includes basic Data Grid, Date Pickers, Charts, Tree View and Scheduler; Pro adds Data Grid multi-filtering, multi-sorting, column resizing (per current licensing doc) and column pinning, plus Date and Time **Range** Pickers; Premium adds row grouping and Excel export. — [MUI X licensing](https://mui.com/x/introduction/licensing/)
- Mantine 9 adds @mantine/schedule (calendar), OverflowList, FloatingWindow, BarsList; all inputs support `loading`. — [Mantine 9.0.0 changelog](https://mantine.dev/changelog/9-0-0/)
- HeroUI v3: 75+ components; v2 features such as autocomplete and Navbar were reported missing at v3 launch. — [InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/)
- State of React 2025: React Hook Form is the dominant form library (1,964 respondents; 74% usage per Strapi summary), TanStack Form rising (567). — [State of React 2025 libraries](https://2025.stateofreact.com/en-US/libraries/component-libraries/); [Strapi summary](https://strapi.io/blog/state-of-react-2025-key-takeaways)

### Inferences (prior knowledge, not re-fetched this session — verify before relying)
- Coverage matrix (Y = first-party; R = recipe/composed; P = paid; - = none):

| Need | shadcn/ui | Mantine | Ant Design | MUI (+X Community) | Chakra v3 | HeroUI v3 | PrimeReact 11 |
|---|---|---|---|---|---|---|---|
| Data table w/ sort/filter/paginate | R (TanStack Table) | - core (Table is plain; community mantine-react-table / mantine-datatable) | Y (Table) | Y DataGrid (Pro/Premium for multi-filter, pinning, grouping, Excel) | R (Table primitive) | Y basic Table | Y DataTable (very rich) |
| Date picker | R (Calendar + Popover) | Y (@mantine/dates) | Y | Y | Y (added in 3.x; verify) | Y | Y |
| Date-range picker | R (Calendar mode="range") | Y (type="range") | Y (RangePicker) | P (Pro) | verify | Y (React Aria DateRangePicker) | Y (selectionMode="range") |
| Searchable select/combobox | Y (Combobox) | Y (Select searchable / Combobox) | Y (Select showSearch) | Y (Autocomplete) | Y (Combobox) | verify (autocomplete gap reported) | Y (Dropdown filter / AutoComplete) |
| Number input | R/Input | Y NumberInput | Y InputNumber | Y NumberField (v9) | Y NumberInput | Y NumberField | Y InputNumber |
| Form + validation | Y Field + RHF/zod | Y @mantine/form | Y Form (built-in rules) | R (RHF) | Y Field + RHF | Y Form (React Aria validation) | R |
| Toasts | Y (Sonner) | Y @mantine/notifications | Y message/notification | Y Snackbar (one at a time) | Y Toaster | Y Toast | Y Toast |
| Modal/Drawer | Y | Y | Y | Y | Y | Y | Y |
| Stepper | - / R | Y Stepper | Y Steps | Y Stepper | Y Steps | verify | Y Steps/Stepper |
| Skeleton | Y | Y | Y | Y | Y | Y | Y |
| Empty state | Y Empty | R | Y Empty/Result | R | Y EmptyState | verify | R |
| AppShell/layout | Y Sidebar block | Y AppShell | Y Layout/Sider | R (Drawer + AppBar; Toolpad unmaintained) | R | R | R |
| Charts | Y (Recharts wrapper) | Y @mantine/charts (Recharts 3) | separate @ant-design/charts | Y MUI X Charts (MIT basic) | Y (Recharts wrapper) | - | Y (Chart.js wrapper) |

- For the "live limits" form (PO remaining / stock / max allowed), every library can render it; the differentiator is a good NumberInput with min/max clamping and inline description/error slots — strongest out of the box in Mantine (NumberInput + description/error props) and Ant Design (InputNumber + Form.Item help/extra).

### Gaps
- Could not fetch the MUI X per-feature tier table directly (page is interactive); the licensing doc confirms tiers only at summary level. Community-tier 100-rows-per-page pagination cap is prior knowledge, unverified here.
- Chakra v3 and HeroUI v3 exact component lists (date-range picker, stepper, autocomplete in v3.2) not verified this session.

## Q3. Out-of-the-box visual quality, smoothness (animations, transitions), simplicity for non-technical users

### Takeaway
For a "simple, clean, smooth" feel, shadcn/ui (neutral, minimal, Tailwind animations; Base UI/Radix handle enter/exit) and HeroUI v3 (polished, CSS-only animations) lead on aesthetics; Mantine is clean and modern with sensible transitions; Ant Design is functional and dense but looks "enterprise/Chinese-admin"; MUI looks unmistakably Material/Google; PrimeReact is feature-rich but visually busier.

### Cited Findings
- HeroUI v3 moved every animation to CSS with no JavaScript runtime and markets itself as "Beautiful by default, customizable by design". — [InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/); [heroui.com](https://heroui.com/)
- Mantine 9 changed defaults to radius `md` and medium font weight 600 (a softer, bolder default look). — [Mantine 9.0.0](https://mantine.dev/changelog/9-0-0/)
- State of React 2025: Motion (ex-Framer Motion) is by far the top animation library (1,443 users) — relevant if extra page/list animations are added on top of any library. — [State of React 2025](https://2025.stateofreact.com/en-US/libraries/component-libraries/)

### Inferences
- For non-technical scrap-yard users, large touch targets, high contrast, obvious labels and few visual flourishes matter more than brand polish. shadcn and Mantine defaults are the least visually noisy; Ant Design's density suits data-heavy desktop screens but is small on phones (default control height ~32px, prior knowledge).
- "Smoothness" is mostly determined by (a) no runtime CSS-in-JS style recalculation, (b) CSS-based transitions, and (c) virtualization in large tables. Libraries without runtime CSS-in-JS (shadcn/Tailwind, Mantine CSS modules, HeroUI v3 CSS) have an edge over Emotion-based MUI/Chakra.

### Gaps
- No objective benchmark of animation quality exists; this is necessarily subjective. No 2026 user-testing study with non-technical users comparing these libraries was found.

## Q4. Learning curve, developer speed, documentation, TypeScript

### Takeaway
Mantine and Ant Design give the fastest "batteries-included" developer speed for CRUD apps; shadcn/ui is fast for Tailwind users and extremely AI-assistant friendly (MCP server, registry) but you own and maintain the component code. All are TypeScript-first.

### Cited Findings
- shadcn CLI v3 (Aug 2025) added an MCP server; `npx shadcn create` (Dec 2025) generates a styled project; registry supports GitHub/private registries. — [shadcn changelog](https://ui.shadcn.com/docs/changelog)
- HeroUI v3 ships MCP server, agent skills and llms.txt for AI-assisted development. — [InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/)
- Ant Design v6 provides a CLI to detect deprecated APIs during migration. — [antd v6 migration](https://ant.design/docs/react/migration-v6)
- MUI X v9 coordinated major across Material UI and MUI X to make upgrades easier. — [MUI v9](https://mui.com/blog/introducing-mui-v9/)
- Chakra v3 migration lacked a codemod and thorough guide per users. — [GitHub discussion #9853](https://github.com/chakra-ui/chakra-ui/discussions/9853)

### Inferences
- Upgrade churn risk ranking (lowest to highest), based on 2024-2026 history: shadcn (code is copied; no forced upgrades) < Ant Design (v5 lasted 3 years) < MUI (majors roughly yearly but gradual) < Mantine (majors ~yearly; v9 forced React 19.2) < Chakra (v3 near-rewrite) ~ HeroUI (v3 rewrite, v2/v3 cannot coexist) ~ PrimeReact (v11 relicensing + redesign).

### Gaps
- No quantitative "time to build CRUD screen" comparison found.

## Q5. Accessibility and primitive quality

### Takeaway
Best-in-class primitives: React Aria Components (Adobe; used by HeroUI v3), Base UI (ex-Radix/MUI team; now shadcn default), Radix, and Ark UI/Zag (Chakra v3). MUI v9 invested heavily in roving-tabindex/keyboard work. Ant Design and PrimeReact are adequate but historically weaker.

### Cited Findings
- HeroUI v3 is built on React Aria Components for accessibility. — [InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/)
- MUI v9 updated keyboard navigation, focus management and DOM structure to match web-platform a11y expectations; roving tabindex for Menu, Stepper, Tabs. — [Material UI v9](https://mui.com/blog/introducing-material-ui-v9/)
- Base UI is built by several of the original Radix engineers with a full-time team. — [ShadcnDeck: Radix vs Base UI](https://www.shadcndeck.com/blog/radix-vs-base-ui)
- React Aria Components 1.21.1 (Sep 2026), Apache-2.0, 5.19M weekly downloads. — [npm](https://registry.npmjs.org/react-aria-components)

### Inferences
- For a Hindi/English, non-technical audience, accessibility mostly matters through keyboard entry speed for data-entry staff and clear focus states; all top candidates are sufficient. React Aria's date/number fields also give strong locale handling (Indian numbering like 1,00,000 via Intl) — prior knowledge, verify.

### Gaps
- No 2026 independent audit comparing a11y scores across these libraries was found.

## Q6. Theming, customization approach, runtime cost, dark mode

### Takeaway
Zero-runtime styling has won: Tailwind v4 (shadcn, HeroUI v3), CSS modules + CSS variables (Mantine since v7), CSS variables by default (Ant Design v6, still cssinjs-generated). MUI and Chakra still depend on Emotion runtime CSS-in-JS; MUI's zero-runtime Pigment CSS is paused.

### Cited Findings
- MUI Pigment CSS "remains in alpha and paused". — [MUI blog 2026](https://mui.com/blog/2026-and-beyond/)
- MUI v9 theme extends CSS variables with color-mix() derived colors. — [MUI v9](https://mui.com/blog/introducing-material-ui-v9/)
- Ant Design v6 enables CSS variables by default. — [antd v6 migration](https://ant.design/docs/react/migration-v6)
- HeroUI v3: Tailwind CSS v4, CSS variables, OKLCH colours, BEM modifiers; standalone @heroui/styles. — [InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/)
- State of React 2025: Tailwind CSS most-used styling tool (2,142), then CSS Modules (1,794), Sass (1,607), styled-components (1,594), Emotion (786); commentary: "CSS-in-JS had its 15 minutes of fame". — [State of React 2025](https://2025.stateofreact.com/en-US/libraries/component-libraries/)

### Inferences
- Dark mode is supported by all; for a scrap-yard app (outdoor, sunlight) a high-contrast light theme is more important than dark mode.
- Mantine uses CSS modules + PostCSS since v7 (prior knowledge, not re-fetched this session).

### Gaps
- Chakra v3 styling engine details (still Emotion-based with a recipe system) not re-verified this session.

## Q7. Bundle size, runtime performance, React 19, SSR/RSC

### Takeaway
All candidates support React 19 (Mantine 9, HeroUI 3, PrimeReact 11 require it). For a Vite SPA talking to an Express API, SSR/RSC is irrelevant. Runtime performance favors non-Emotion libraries; bundle size favors shadcn (only what you copy) and tree-shaken Mantine.

### Cited Findings
- React peer ranges: Mantine ^19.2.0; HeroUI >=19; PrimeReact >=19; antd >=18; MUI ^17-^19; Chakra >=18; Base UI ^17-^19. — [npm registry](https://registry.npmjs.org/@mantine%2Fcore)
- Ant Design v6 drops the React 19 compatibility patch (native support). — [antd v6 migration](https://ant.design/docs/react/migration-v6)
- MUI v9 highlighted sx prop performance improvements. — [MUI v9 search summary](https://mui.com/blog/introducing-material-ui-v9/)

### Inferences
- Ant Design and MUI+X are the heaviest bundles; for a desktop-first internal app on 4G phones this is acceptable with route-level code splitting.

### Gaps
- No fresh 2026 bundlephobia/benchmark numbers were collected; do not quote kB figures without re-measuring.

## Q8. Licensing and paid tiers

### Takeaway
MIT/free and complete: shadcn/ui, Mantine, Ant Design, Chakra, HeroUI (core), Base UI, Radix; React Aria is Apache-2.0. Paid friction: MUI X Pro ($299/dev/yr) needed for DateRangePicker and grid multi-filter/pinning; Premium ($599) for row grouping/Excel export. **PrimeReact 11 is no longer MIT**: a commercial PrimeUI License with a license key; free Community License only for orgs with <$1M revenue, <5 developers, <10 employees, <$3M funding.

### Cited Findings
- MUI X pricing: Community free; Pro $299/developer/year; Premium $599; Enterprise $1,399. — [MUI pricing](https://mui.com/pricing/)
- MUI X Pro: Data Grid multi-filtering, multi-sorting, column resizing, column pinning; Date and Time Range Pickers. Premium: row grouping, Excel export. Missing/invalid key shows watermarks and console warnings in dev and production; licenses must match number of concurrent front-end developers. — [MUI X licensing](https://mui.com/x/introduction/licensing/)
- PrimeReact 11 LICENSE.md (read from the published 11.1.0 npm package): "PrimeUI, a family of commercial UI libraries by PrimeTek Informatics"; Community License free only for orgs with <$1,000,000 annual gross revenue, <5 developers, <10 employees, <$3,000,000 outside funding (plus individuals/students/non-profits/non-commercial OSS), renewed annually; Commercial License per developer, perpetual with 1 year updates, includes PrimeBlocks, Theme Designer, PrimeUI Pro components; a license key is required (offline check, "missing, invalid, or expired key may cause the software to display a license notice"); distributed compiled, no reverse-engineering. — [unpkg primereact@11.1.0/LICENSE.md](https://unpkg.com/primereact@11.1.0/LICENSE.md). Note conflict: the GitHub master-branch LICENSE.md fetched in-session still showed MIT — [GitHub LICENSE.md](https://github.com/primefaces/primereact/blob/master/LICENSE.md) — and primereact 10.x on npm is MIT. The npm-published v11 file is authoritative for v11.
- HeroUI license: npm package @heroui/react 3.2.6 declares MIT — [npm](https://registry.npmjs.org/@heroui%2Freact); InfoQ says Apache 2.0 — [InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/). Either is permissive. HeroUI also sells HeroUI Pro (premium components). — [HeroUI Pro v3 page](https://heroui.pro/docs/react/releases/v3-0-0)
- Mantine UI (ui.mantine.dev) exists as a separate component-examples resource. — [Mantine 9.0.0](https://mantine.dev/changelog/9-0-0/)

### Inferences
- A Indian scrap business with turnover above ~₹8.3 crore (~$1M) would need a paid PrimeReact commercial license — and the license-key/notice mechanism adds operational risk. Avoid PrimeReact v11 unless pinned to MIT v10 (which is now a legacy line).
- Everything the Metal Scrap app needs (date-range filter, searchable select, table with pagination) is free in Mantine, Ant Design and shadcn; with MUI the date-range picker alone forces a Pro license (or a workaround with two DatePickers).

### Gaps
- HeroUI Pro and paid shadcn block marketplaces (e.g., shadcnblocks.com, third-party) pricing not captured; Mantine has no official paid tier as far as found.

## Q9. Mobile/touch responsiveness

### Takeaway
React Aria-based (HeroUI) and Base UI/Radix-based (shadcn) components handle touch/pointer interactions well; Mantine has explicit mobile support (e.g., mobile view in @mantine/schedule, AppShell collapsible navbar, dropdowns as modals via props). Ant Design and MUI DataGrid are desktop-oriented; wide tables need a card/list alternative on phones regardless of library.

### Cited Findings
- Mantine 9 @mantine/schedule includes a dedicated "Mobile" view level. — [Mantine 9.0.0](https://mantine.dev/changelog/9-0-0/)
- HeroUI v3 is based on React Aria Components and also ships a React Native library (37 components). — [InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/)

### Inferences
- React Aria's usePress/interaction model is widely regarded as the best cross-device touch handling (prior knowledge). For scrap-yard phones, plan responsive "card list" views for Purchases/Sales rather than relying on any grid.
- Ant Design's mobile sibling (antd-mobile) is a separate library, signaling antd core is desktop-first (prior knowledge).

### Gaps
- No systematic 2026 mobile-usability comparison found.

## Q10. Developer sentiment, surveys (State of React 2025, npm trends), common complaints

### Takeaway
MUI is still the most used, but shadcn/ui is the fastest riser and on the verge of taking the top spot; Base UI is the top write-in. Common complaints: MUI's Material look + paid X features; Chakra v3 migration pain; HeroUI v3 missing features/transparency; Radix maintenance slowdown; shadcn "you maintain the code"; PrimeReact's relicensing.

### Cited Findings
- State of React 2025 (3,760 responses, Nov 2025 - Jan 2026): MUI most used (57.2%); shadcn/ui rose from 20% to 56% in two years and is "on the verge of overtaking it for the top spot"; ~33% use no component library; avg 2.3 libraries per user. — [State of React 2025: UI Libraries](https://2025.stateofreact.com/en-US/libraries/component-libraries/); [Strapi summary](https://strapi.io/blog/state-of-react-2025-key-takeaways)
- Top write-ins: Base UI (49), daisyUI (19), Fluent UI (9), Ark UI (9), PrimeReact (8). Top pain points: styling & customization (34), Tailwind (17, divided opinions), CSS-in-JS issues (13). — [State of React 2025](https://2025.stateofreact.com/en-US/libraries/component-libraries/)
- Weekly downloads 2026-09-27: @mui/material 11.70M; shadcn CLI 10.89M; antd 4.25M; @mantine/core 2.74M; @chakra-ui/react 1.88M; @heroui/react 0.72M; primereact 0.39M; @mui/joy 0.13M. — [npm downloads API](https://api.npmjs.org/downloads/point/last-week/@mui/material)
- HeroUI v3 reaction mixed: praised themes/docs; complaints about missing v2 features and unclear timelines. — [InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/)

### Inferences
- The two ecosystems with the strongest 2026 momentum are shadcn/ui (+Base UI) and Mantine (steady growth, high satisfaction historically); Ant Design dominates in Asian enterprise admin UIs.

### Gaps
- Exact per-library satisfaction/retention percentages from State of React 2025 were not extractable (charts are interactive). State of JS 2025 UI-library data not fetched.

## Q11. Verdict on fit for the Metal Scrap Management System

### Takeaway
Top picks: **Mantine 9** (best balance: everything needed built-in and free — AppShell, DatePickerInput range, searchable Select, NumberInput, @mantine/form, notifications, charts, Stepper — clean look, CSS-modules performance, easy for a small team) and **shadcn/ui on Base UI + Tailwind v4** (best-looking, smoothest, most flexible, huge momentum, AI-friendly; more assembly work: TanStack Table, Sonner, react-hook-form + zod). **Ant Design 6** is the pragmatic runner-up for pure data-entry speed but looks dense/enterprise and is less phone-friendly. Avoid for this project: Joy UI (on hold), PrimeReact 11 (commercial license), MUI (paid DateRangePicker, Material look, Emotion runtime), Chakra v3 (churn), HeroUI v3 (new rewrite, feature gaps) unless the team specifically wants its aesthetic.

### Cited Findings
- Supporting facts are cited in Q1-Q10 above (Mantine 9 features/React 19.2 [Mantine changelog](https://mantine.dev/changelog/9-0-0/); shadcn Base UI default [shadcn](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default); MUI X pricing [MUI](https://mui.com/pricing/); PrimeReact 11 license [unpkg](https://unpkg.com/primereact@11.1.0/LICENSE.md); Joy UI on hold [MUI blog](https://mui.com/blog/2026-and-beyond/)).

### Inferences
Per-library fit summary:
- **shadcn/ui (Base UI default, Radix supported, Tailwind v4)** — Fit: Excellent for UX/smoothness and long-term ownership; Good for speed if the dev knows Tailwind. Needs assembling DataTable (TanStack Table 9), date-range (Calendar range + Popover), toasts (Sonner). No license cost. Risk: you maintain copied code; Radix vs Base UI split in docs/examples.
- **Mantine 9** — Fit: Excellent. Most built-in coverage for this exact screen list with zero license cost; clean default look; CSS modules (no runtime CSS-in-JS). Gap: no first-party data grid (use plain Table + TanStack Table or mantine-react-table/mantine-datatable — check those community packages' Mantine-9 compatibility). Requires React 19.2+.
- **Ant Design 6** — Fit: Very good functionally (best Table/Form/RangePicker/Select out of the box, all MIT); weaker on "very simple/modern" feel and phone ergonomics; heavier bundle.
- **MUI Material UI 9 + MUI X** — Fit: Moderate. Mature and accessible, but DateRangePicker and serious grid features are paid ($299-$599/dev/yr); Emotion runtime; Material look less "simple" for this audience. Joy UI: do not use (on hold since 2024-2025, beta).
- **Chakra UI v3** — Fit: Moderate. Good primitives (Ark/Zag), but recent breaking rewrite and smaller business-component coverage.
- **HeroUI v3** — Fit: Moderate-to-good visually (React Aria + Tailwind v4, CSS-only animations), but v3 is six months old with reported gaps (autocomplete, navbar) and a history of full rewrites.
- **PrimeReact 11** — Fit: Poor for this project due to the new commercial license (free only under $1M revenue/<10 employees) and license-key mechanism; otherwise the richest DataTable.
- **React Aria Components / Base UI / Ark UI (raw)** — Fit: Only as foundations; too much styling work for a small team directly. Park UI / Radix Themes: low activity in 2026, not recommended.

### Gaps
- No hands-on prototype comparison was performed; final choice should be validated by building the Sales/Delivery form with live limits and one filtered table in the top two candidates.
