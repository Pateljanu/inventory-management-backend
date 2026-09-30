# Build the scrap-yard frontend on shadcn/ui

Build the Metal Scrap Management System frontend as a **Vite 8 + React 19 single-page app with shadcn/ui on Base UI and Tailwind CSS v4**. Add **TanStack Router** for typed URL filters, **TanStack Query v5** for server state, **TanStack Table v9** for server-paginated lists, **React Hook Form + Zod** for forms, **Recharts 3** (through shadcn Charts) for the dashboard, and **react-number-format + big.js + `Intl.NumberFormat('en-IN')`** for exact ₹ and tonnage values. Start from the MIT-licensed **satnaing/shadcn-admin** template, which already runs this exact stack. **Mantine 9 is a very close runner-up.** It has more ready-made parts: a range date picker with presets, a searchable Select, AppShell, forms and notifications. But the screens that decide whether this app feels simple to a scrap-yard owner need custom work in either kit. Those screens are the delivery form with live limits, exact-decimal inputs, Indian financial-year presets and phone card views. So Mantine's head start mostly disappears, while shadcn keeps its advantages: you own the component code, its ecosystem has the most momentum, its styling has no runtime cost, and it works well with AI coding assistants. Everything recommended is MIT or Apache-2.0. The main traps to avoid are licensing ones: **PrimeReact 11 is now commercial** and **MUI's date-range picker is paid**. On maintenance, avoid **Tremor's npm package**, **Mantine React Table** and **Joy UI**, which have stalled. Next.js adds server machinery this login-only app never uses. Before launch, the backend needs a few changes. The biggest are a read-only "delivery capacity" endpoint (the API only reveals the four limits when a delivery is *rejected*), a time-series endpoint for rate trends, moving the refresh token into an httpOnly cookie, and an OpenAPI spec generated from the existing Zod validators.

## shadcn/ui beats Mantine 9 for this app, narrowly and for specific reasons

In late 2026 the React component market has settled around two credible foundations for a new internal app, and the numbers show why. The State of React 2025 survey found **shadcn/ui rising from 20% to 56% usage in two years**, "on the verge of overtaking" MUI's 57.2% ([State of React 2025](https://2025.stateofreact.com/en-US/libraries/component-libraries/)). The shadcn CLI now pulls **10.9M weekly npm downloads against 2.7M for @mantine/core** ([npm downloads API](https://api.npmjs.org/downloads/point/last-week/@mantine/core)). The base layer shifted in 2026. Base UI, built by a full-time MUI-backed team that includes several original Radix engineers, reached **stable 1.0 on 11 December 2025**, and **shadcn made Base UI its default on 3 July 2026**. Radix stays supported through `shadcn init -b radix` ([shadcn changelog](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default); [ShadcnDeck](https://www.shadcndeck.com/blog/radix-vs-base-ui)). That switch removes the main 2025 worry about shadcn, which was Radix's slowing maintenance under WorkOS ([Medium](https://mashuktamim.medium.com/is-your-shadcn-ui-project-at-risk-a-deep-dive-into-radixs-future-91af267c4bec)).

Mantine's case is strong and deserves a fair hearing. **Mantine 9 (31 March 2026, now 9.6.3)** ships almost every widget this app lists, all under MIT: AppShell, a searchable Select and Combobox, NumberInput with `thousandsGroupStyle="lakh"`, `@mantine/form`, notifications, a Stepper, and `@mantine/charts` on Recharts 3 ([Mantine 9.0.0 changelog](https://mantine.dev/changelog/9-0-0/)). Its `DatePickerInput type="range"` has a built-in `presets` prop, `valueFormat="DD/MM/YYYY"`, a `dropdownType="modal"` mode for phones, and **plain `YYYY-MM-DD` string values that map straight onto the API's `from`/`to` params** without IST off-by-one bugs ([Mantine DatePickerInput](https://mantine.dev/dates/date-picker-input/)). For a developer who does not know Tailwind, Mantine gets the first ten screens built fastest.

The decision turns on which parts of this particular app are hard. Take the five components that most shape the owner's experience: the delivery form's live-limit panel, exact-decimal quantity and rate inputs, the date-range filter with Indian FY presets, the async party/material picker, and the table that becomes cards on a phone. In every one, Mantine's built-in part either has to be overridden or never existed:

- **Numeric inputs.** Mantine's NumberInput **returns a JavaScript number from `onChange`** whenever the value fits in one. That silently turns the API's `"30.250"` into `30.25` and invites float drift in qty × rate. Exact fields should therefore use react-number-format directly in *both* stacks ([Mantine NumberInput](https://mantine.dev/core/number-input/)).
- **FY presets.** No library ships an April–March preset, so that helper is custom either way.
- **Phone card views.** None of the table libraries reviewed turns rows into phone cards on its own. That view has to be built by hand in either kit.
- **The limit panel.** It is bespoke UI whichever kit you use.

With the gap closed on the hard parts, shadcn's structural advantages decide it:

- **Ownership.** You own copied source code, so no upstream major can force a migration. Mantine 9 required React 19.2+ for every package, and Mantine is led by a small core team ([npm registry](https://registry.npmjs.org/@mantine%2Fcore)).
- **A ready template.** **satnaing/shadcn-admin** (MIT, 14.5k stars, pushed September 2026) already pins React 19.2, Recharts 3.8, Tailwind 4.2, Vite 8 and TanStack Router, the exact stack recommended here ([package.json](https://raw.githubusercontent.com/satnaing/shadcn-admin/main/package.json)). Mantine's admin templates are small community projects, some stuck on Mantine 7 or 8 ([GitHub search](https://api.github.com/search/repositories?q=mantine+admin+dashboard&sort=stars)).
- **AI-assisted development.** shadcn ships an MCP server and a registry built for AI coding tools ([shadcn changelog](https://ui.shadcn.com/docs/changelog)). That matters for a small team working with Claude Code.
- **Smoothness.** Tailwind v4 plus CSS-only animations (tw-animate-css replaced the JavaScript plugin) adds no styling runtime ([shadcn Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4)).

There is an honest cost. With shadcn you assemble roughly five composite components once, and you maintain that code yourself.

Choose **Mantine 9 instead** under any of these conditions:

- the developer does not know Tailwind,
- the team wants a single dependency with stable, documented APIs rather than owned code,
- the first release must ship in days rather than weeks.

Pair it with **mantine-datatable 9.4** (kept in step with Mantine 9) and never with Mantine React Table ([mantine-datatable CHANGELOG](https://github.com/icflorescu/mantine-datatable/blob/main/CHANGELOG.md)). Choose **Ant Design 6** only when fast data entry on desktop matters far more than phone use and visual simplicity. It has the most complete MIT "ERP kit": Table, RangePicker with presets, `Select showSearch`, InputNumber, and a Form with rules. But it looks dense, uses 32px controls, and its mobile sibling is a separate library ([Ant Design v6 migration](https://ant.design/docs/react/migration-v6); [antd DatePicker](https://ant.design/components/date-picker)).

| Criterion (for this app) | **shadcn/ui + Base UI + Tailwind 4** | **Mantine 9** | Ant Design 6 | MUI 9 + MUI X | Chakra v3 | HeroUI v3 | PrimeReact 11 |
|---|---|---|---|---|---|---|---|
| Latest / licence | CLI 4.21.0, Base UI 1.8.0 / MIT | 9.6.3 / MIT | 6.6.5 / MIT | 9.4.0 / MIT core, **X Pro $299/dev/yr** | 3.37.0 / MIT | 3.2.6 / MIT | 11.1.0 / **commercial PrimeUI licence** |
| Weekly downloads | 10.9M (CLI) | 2.7M | 4.3M | 11.7M | 1.9M | 0.7M | 0.4M |
| Date-range + presets | Recipe (DayPicker `mode="range"` + preset list) | **Built-in** (`presets`, modal on phone) | Built-in (RangePicker `presets`) | **Paid (Pro)** | Unverified | Built-in (React Aria) | Built-in |
| Data table | TanStack Table v9 recipe | mantine-datatable (community) | Built-in Table | DataGrid (grid features paid) | Primitive | Basic | Richest DataTable |
| Styling runtime | None (Tailwind v4) | None (CSS modules) | CSS variables, cssinjs | Emotion runtime; Pigment paused | Emotion-based | None (Tailwind v4) | n/a |
| Phone/touch feel | Good (Base UI) | Good (modal dropdowns) | Desktop-first | Desktop-first grid | Good | Best (React Aria) | Busy |
| Upgrade risk | Lowest (you own code) | Yearly majors, small team | Low (v5 lasted 3 yrs) | Yearly majors | High (v3 rewrite) | High (v3 rewrite, gaps) | High (relicence) |
| Fit verdict | **Primary** | **Runner-up** | Desktop-only alternative | Avoid | Avoid | Avoid for now | Avoid |

Sources: [npm registry](https://registry.npmjs.org/), [MUI pricing](https://mui.com/pricing/), [MUI Date Range Picker](https://mui.com/x/react-date-pickers/date-range-picker/), [PrimeReact 11.1.0 LICENSE](https://unpkg.com/primereact@11.1.0/LICENSE.md), [InfoQ on HeroUI v3](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/), [Chakra v3 migration discussion](https://github.com/chakra-ui/chakra-ui/discussions/9853).

## Licensing and maintenance traps rule out most of the field

**PrimeReact 11** is the sharpest trap. The published 11.1.0 package's LICENSE.md makes it a commercial "PrimeUI" product. The free Community License applies only to organisations with **under $1M annual revenue, fewer than 5 developers and fewer than 10 employees**. It needs a license key, and a missing or expired key can show a licence notice in the app ([unpkg LICENSE.md](https://unpkg.com/primereact@11.1.0/LICENSE.md)). A scrap trader turning over more than roughly ₹8–9 crore crosses that line.

**MUI** is free at its core, but this app would hit its paywalls:

- the **Date Range Picker carries a Pro badge**,
- multi-column filtering and column pinning in the grid are Pro,
- a missing licence key shows watermarks in production ([MUI X licensing](https://mui.com/x/introduction/licensing/)),
- Pigment CSS, its zero-runtime styling engine, "remains in alpha and paused" ([MUI blog](https://mui.com/blog/2026-and-beyond/)),
- **Joy UI** has been on hold since 2024–25, stuck at 5.0.0-beta.52 ([Joy UI docs](https://v7.mui.com/joy-ui/getting-started/)).

**Chakra v3** was a near-total rewrite that users called "a nightmare" to migrate ([GitHub #9853](https://github.com/chakra-ui/chakra-ui/discussions/9853)). **HeroUI v3** is only six months old, is another ground-up rewrite, and shipped with v2 features such as autocomplete missing ([InfoQ](https://www.infoq.com/news/2026/07/heroui-v3-rewrite/)). A searchable select is exactly what this app needs most. Radix Themes and Park UI have barely moved since April 2026.

Below the component-library level, several popular packages have quietly stalled:

- **`@tremor/react`**, the KPI-card library many dashboard tutorials still recommend, last shipped in **January 2025 and only supports React 18**. Its copy-paste successor still pins Recharts 2 ([npm registry](https://registry.npmjs.org/@tremor%2Freact); [tremor package.json](https://raw.githubusercontent.com/tremorlabs/tremor/main/package.json)). Borrow its KPI card, BarList and ProgressBar *patterns* as copied code, but do not install it.
- **Mantine React Table**'s last release is a February 2025 v2 beta that pins Mantine 7 ([MRT releases](https://github.com/KevinVandy/mantine-react-table/releases)).
- **AG Grid** is **377 kB gzipped** in full, and its useful Enterprise features cost **$999 per developer**. That is a spreadsheet engine for lists capped at 100 rows ([AG Grid pricing](https://www.ag-grid.com/license-pricing/); [bundlephobia](https://bundlephobia.com/package/ag-grid-community)).
- **Nivo** has not released since May 2025.
- **Ant Design Charts** is 533 kB gzipped ([bundlephobia](https://bundlephobia.com/api/size?package=recharts)).
- **React Hook Form v8** is still in beta ([RHF migration guide](https://react-hook-form.com/migrate-v7-to-v8)).

Frameworks are the last category to rule out:

- **Next.js 16** adds React Server Components, server caching and a Node runtime to a login-only app that talks to an existing Express API. Its static-export mode **does not support dynamic routes without `generateStaticParams()`**, which blocks pages like `/purchases/:id` ([Next.js static exports](https://nextjs.org/docs/app/guides/static-exports)).
- **Admin frameworks** don't pay their way here. **Refine v5** is capable and even has a shadcn registry ([Refine v5](https://refine.dev/blog/refine-v5-announcement/)). But this API's `{success,data,meta}` envelope needs a custom data provider, and the app's value lies in scrap-specific flows rather than generic CRUD. So Refine adds a second abstraction without removing much work. **React-Admin**'s best modules sit behind a €145–590/month Enterprise Edition and look like MUI ([React-Admin EE](https://react-admin-ee.marmelab.com/)).

## Twenty-odd MIT packages cover every screen

Every choice below is MIT or Apache-2.0. Versions were read from the npm registry on 27 September 2026. Where a patch number was not checked, the table says so.

| Layer | Package | Version | Why |
|---|---|---|---|
| Build | `vite` + `@vitejs/plugin-react` | 8.x (stable 12 Mar 2026; patch unverified) | Rolldown bundler, static output, no Node server ([Vite 8](https://vite.dev/blog/announcing-vite8)) |
| Runtime | `react`, `react-dom` | 19.3.x (released 9 Sep 2026) | Stable `<ViewTransition>` ([React 19.3](https://react.dev/blog/2026/09/09/react-19-3)); template pins ^19.2.5, which also works |
| Compiler | `babel-plugin-react-compiler` | 1.x (stable Oct 2025) | Automatic memoisation; lint rules in `eslint-plugin-react-hooks` ([React Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1)) |
| UI kit | `shadcn` CLI → components on `@base-ui/react` | 4.21.0 / 1.8.0 | Owned code, Base UI default ([shadcn](https://ui.shadcn.com/docs/changelog)) |
| Styling | `tailwindcss`, `tw-animate-css` | 4.3.3 / latest | Zero-runtime CSS, CSS-only enter/exit animations |
| Starter | satnaing/shadcn-admin (fork, strip demo pages) | 2.2.1 | Sidebar, header, charts, dark mode, TanStack Router already wired |
| Routing | `@tanstack/react-router` | 1.16x (template pins ^1.168.22) | Zod-validated, typed search params ([TanStack Router](https://tanstack.com/router/latest/docs/guide/search-params)) |
| Server state | `@tanstack/react-query` (+ devtools) | 5.x (patch unverified) | Caching, `keepPreviousData`, prefetch |
| Tables | `@tanstack/react-table` | 9.2.4 | v9 stable 4 Aug 2026; shadcn data-table guide targets v9 ([TanStack blog](https://tanstack.com/blog/announcing-tanstack-table-v9)) |
| Forms | `react-hook-form`, `@hookform/resolvers`, `zod` | 7.89.0 / 5.9.1 / 4.6.5 | Largest ecosystem; `setError(path)` for 422s |
| Dates | `react-day-picker` (a.k.a. `@daypicker/react`), `date-fns` | 10.0.1 / latest | Range mode for the shadcn Calendar ([DayPicker v10](https://daypicker.dev/upgrading)) |
| Numbers | `react-number-format`, `big.js` | 5.4.5 / 7.0.1 | Lakh grouping on string values; 3 kB exact arithmetic |
| Charts | `recharts` via shadcn `chart` | 3.10.1 | 66.7M weekly downloads, accessibility layer on by default ([shadcn Chart](https://ui.shadcn.com/docs/components/chart)) |
| Toasts | `sonner` | 2.0.8 | shadcn's toast |
| Command palette | `cmdk` | 1.1.1 | Ctrl+K "Go to" for keyboard users |
| HTTP | `axios` (or `ky`) | latest | Interceptor for the single-flight refresh |
| PWA | `vite-plugin-pwa` | 0.x (supports Vite 8) | Install to home screen, app-shell cache ([npm](https://www.npmjs.com/package/vite-plugin-pwa)) |
| i18n | `react-i18next` (or `@lingui/react`) | latest | Wrap strings now so Hindi or Gujarati can be added later ([Lingui vs i18next](https://lingui.dev/misc/i18next)) |
| API types (after spec) | `openapi-typescript`, `openapi-fetch`, `openapi-react-query` | latest | Types only, about 1 kB runtime ([openapi-react-query](https://openapi-ts.dev/openapi-react-query/)) |
| Test / lint | `vitest`, `@testing-library/react`, `msw`, `@playwright/test`, ESLint 9 + `typescript-eslint` + `eslint-plugin-react-hooks` + `@tanstack/eslint-plugin-query` | latest | Vitest 60% and Playwright 52% adoption ([State of React breakdown](https://certificates.dev/blog/breaking-down-state-of-react-2025-results)) |

If you take the Mantine route, swap the UI, date, table, toast and chart rows for `@mantine/core`, `@mantine/dates`, `@mantine/form`, `@mantine/notifications` and `@mantine/charts` 9.6.3, plus `mantine-datatable` 9.4.0 and `dayjs`. Keep react-number-format and big.js for exact fields, and keep everything else unchanged.

Three version details need care:

- **DayPicker v10** renamed its package and removed v9 APIs. If the shadcn Calendar registry item still targets v9, either stay on v9 or update the copied Calendar's class mappings ([DayPicker upgrading](https://daypicker.dev/upgrading)).
- **Zod versions differ.** The backend pins Zod **^3.25.76** (backend `package.json`) and the frontend would use Zod 4, so validation schemas cannot be shared directly until the majors align. Generating types from OpenAPI avoids this problem.
- **Recharts on phones.** Recharts' tap-to-show tooltips have a long history of problems ([issue #3644](https://github.com/recharts/recharts/issues/3644)). Show values as data labels instead of relying on tooltips. Switch to tree-shaken Apache ECharts only if testing on a real phone shows the tooltips are unusable.

## A static SPA with URL-held filters and one refresh lock

The app deploys as a folder of static files. Put the `dist/` output behind Nginx, Cloudflare Pages or S3+CloudFront with a fallback to `index.html`. Ideally host it on a sibling subdomain of the API, such as `app.example.in` and `api.example.in`, so a first-party refresh cookie works later. Nothing runs on the server. Routes nest under an `_authenticated` layout whose `beforeLoad` guard sends signed-out users to `/login?redirect=…`. The API has two roles: `OWNER` can write and `VIEWER` can only read (backend `src/routes/index.js`). Read the role from `/auth/me` and **hide create and edit actions for viewers** rather than letting them hit a 403.

| Route | Screen | API |
|---|---|---|
| `/login` | Mobile number or username + password, "show password", paste allowed | `POST /auth/login` |
| `/` | Dashboard: date-range bar with FY presets, 4–6 KPI cards, stock-vs-PO-demand bars, "Buy now" action list, PO progress | `GET /reports/dashboard?from&to` |
| `/companies`, `/companies/new`, `/companies/$id` | Party list (search, type filter); form; detail with summary | `/companies`, `GET /reports/companies/:id` |
| `/materials`, `/materials/new`, `/materials/$id` | Material list and form | `/materials` |
| `/purchases`, `/purchases/new`, `/purchases/$id` | Purchase list (date range, supplier, material); purchase form | `/purchases` |
| `/sales-pos`, `/sales-pos/new`, `/sales-pos/$id` | Sales PO list with delivered/remaining progress; PO detail listing its deliveries | `/sales-pos`, `/sales?poId=` (already supported) |
| `/sales`, `/sales/new?poId=`, `/sales/$id` | Deliveries list; delivery form with the live-limit panel | `/sales` |
| `/reports/source-stock` | Supplier stock table with inline purchased/used/available bars | `GET /reports/source-stock` |

Editing happens in a side sheet on desktop and a full-screen page on phones. Either way the view is reachable by URL, so the back button always works.

**Server state and URL state.** Each list route declares a Zod `validateSearch` schema: `from`, `to`, `search`, `companyId`, `materialId`, `page` (default 1) and `limit` (default 25, max 100). Add `stripSearchParams` so default values stay out of the URL ([TanStack Router search params](https://tanstack.com/router/latest/docs/guide/search-params)). The query key is `['purchases', 'list', search]`. The route loader calls `ensureQueryData` so data starts loading before the component renders, and the component still reads through `useQuery` ([TkDodo](https://tkdodo.eu/blog/react-query-meets-react-router)). Every filter change resets `page` to 1. Because filters live in the URL, "this month's purchases from Sharma Traders" becomes a link staff can send on WhatsApp. On phones the back button restores the previous filter. Master data (companies, materials) gets a `staleTime` of about 60 s, so pickers open instantly.

**The API client.** One module unwraps the envelope. It returns `data`, plus `meta` for lists, and throws a typed `ApiError { status, code, message, details, requestId }`. From there, errors route by type:

- **422** errors map field by field with `issues.forEach(i => setError(i.path.join('.'), { message: i.message }))`. Issues with no path go to a form-level summary ([RHF setError](https://react-hook-form.com/docs/useform/seterror)).
- **409** capacity rejections carry all four limits in `details`: `remainingQuantityTons`, `availableStockTons`, `availableSourceStockTons` and `maxAllowedTons` (backend `src/services/sale.service.js`). The delivery form refreshes its limit panel from them instead of showing a generic toast.
- Toasts for unexpected errors show the `requestId` so support can trace them.

**Refresh-token handling.** This is the riskiest client code, because the refresh token rotates and **two concurrent refreshes with the same token make one of them fail**, logging users out at random ([DEV: JWT refresh race](https://dev.to/devil_21cf096c1059553286d/the-jwt-refresh-race-condition-nobody-talks-about-and-how-i-fixed-it-pid)). Axios does not coordinate proactive timers with reactive 401 handlers ([axios #10701](https://github.com/axios/axios/issues/10701)). Keep the access token in memory only, and route every refresh through one shared promise:

```ts
let refreshing: Promise<string> | null = null;
export function refreshOnce() {
  refreshing ??= navigator.locks.request('auth-refresh', () => callRefreshEndpoint())
    .finally(() => { refreshing = null; });
  return refreshing;
}
```

The 401 interceptor and the proactive timer (about 60 s before `exp`) both call `refreshOnce()`. They never call the refresh endpoint directly. `navigator.locks` extends the lock across browser tabs. If the refresh fails, clear the session, call `queryClient.clear()`, and redirect to `/login`. Until the backend moves the token into a cookie, store the refresh token in localStorage and protect it with a strict CSP and no `dangerouslySetInnerHTML`. Treat this as a known, temporary XSS exposure ([Safeguard.sh](https://safeguard.sh/resources/blog/single-page-application-token-storage-security)). Write a unit test that fires five parallel 401s and asserts exactly one refresh call.

**Decimals.** Values stay strings end to end:

- **Form state** holds the unformatted string from react-number-format (e.g. `"30.250"`).
- **Validation** uses regexes: `^\d+(\.\d{1,3})?$` for tons and `^\d+(\.\d{1,2})?$` for rates and money, matching the backend's `QTY_SCALE = 3` and `RATE_SCALE = 2`.
- **Arithmetic** runs through `big.js`.
- **Display** passes the string straight to `Intl.NumberFormat('en-IN').format()`. It preserves every digit of a string input, while `Number()` does not ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format)).
- **Dates** go to the API as `yyyy-MM-dd` via `date-fns format`. **Never use `toISOString()`**, which shifts IST dates back a day.

**Offline.** Ship an installable PWA with `registerType: 'prompt'` (a "New version – Reload" toast), the app shell precached, and auth endpoints never cached. **Do not queue offline writes.** Stock and PO limits need the server's authority at the moment of saving ([TanStack Query mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)). Instead, keep in-progress form drafts in localStorage so a dropped connection never loses a half-filled delivery.

## Scrap-yard UX means preventing errors, showing numbers and never blanking the screen

These users learned software from Tally and from simple, vernacular apps like Vyapar and Khatabook. Khatabook supports 11 languages and explicitly targets owners who "may not be educated" ([Khatabook](https://khatabook.com/blog/khatabook-app-features/)). Vyapar grew because Tally was "too complex for non-accountants" ([Vyapar history](https://businessmodelcanvastemplate.com/blogs/brief-history/vyapar-app-brief-history)). The design goal follows from both: big, obvious, plain-worded screens on phones, plus Tally-style keyboard speed on the office desktop.

### The delivery-limit panel turns rejections into guidance

The delivery form is where this app wins or loses the owner. The panel sits beside the fields on desktop and pins above the Save button on phones. It shows four figures in large tabular numerals: **PO remaining, Stock in yard, Stock from this supplier, and Max you can deliver**. The figures update as the user picks a PO, a source supplier and a date. The tons field pre-fills its maximum. Going over it produces an immediate, specific message in GOV.UK style, which never says "invalid" or "error occurred" and never clears the input: "Tons cannot be more than 12.500 t — only 12.500 t left on this PO" ([GOV.UK error message](https://design-system.service.gov.uk/components/error-message/)). Over-limit states pair red with an icon and words, because colour alone fails for up to about 8% of men ([NN/g](https://www.nngroup.com/articles/dashboards-preattentive/)).

Forms follow a few more rules:

- **Validation timing:** format checks run on blur, limit checks run live, and a full check on submit shows an error summary at the top.
- **Layout:** a single column on phones. On desktop, two columns only for tightly linked pairs such as tons + rate → amount, with the amount computed live.
- **Defaults:** the date defaults to today in DD/MM/YYYY, and supplier and material default to the last used.
- **Input aids:** vehicle numbers get an uppercase mask. Numeric fields use `inputmode="decimal"` so phones show the number pad.
- **Save button:** never disable it without explanation.
- **Confirmation:** confirm dialogs only for irreversible actions. Routine saves get a toast instead.

### Lists become cards on phones and keep their rows while loading

On desktop, lists are dense tables with **sticky headers**, right-aligned ₹ and ton columns, and a totals row ([NN/g Mobile Tables](https://www.nngroup.com/articles/mobile-tables/)). Below the tablet breakpoint, the same headless TanStack rows render as tappable cards showing party, material, tons, ₹ amount and date. Dates default to one-tap chips: Today, Yesterday, This week, This month, Last month, **This FY**, **Last FY** and Custom. The FY rule is simple: if the month is January to March, the year started on 1 April of the previous calendar year. The range calendar opens in a bottom drawer on phones (one month shown) and a popover on desktop (two months). Empty states separate "No purchases recorded yet — [+ Record purchase]" from "No purchases match — [Clear filters]", following Polaris's merchant-oriented guidance ([Polaris empty state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state?example=empty-state-with-full-width-layout)).

### Indian formats everywhere, compact only on tiles

Indian formats apply everywhere:

- **Full figures:** `Intl.NumberFormat('en-IN')` gives **₹1,23,45,678** in tables and forms, and tons show three decimals with a "t" suffix.
- **Dashboard tiles:** compact `en-IN` gives "₹1.2Cr" and "₹26L". Avoid `compactDisplay: 'long'`, which falls back to "million" and "billion" ([MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)).
- **Dates:** DD/MM/YYYY everywhere, through a controlled date input rather than the browser's locale-dependent `type=date`. Reports follow the April–March financial year.
- **Wording:** plain trade words such as "Party", "Rate" and "Stock in yard".
- **Language:** every string goes through i18n from day one.

The dashboard follows NN/g's evidence that length and position read accurately while angle and area do not ([NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/)). It fits on one screen with 4–6 KPI cards, which collapse to two columns on phones. Charts use horizontal bars for stock versus PO demand, labelled "Buy 12.5 t" or "Extra 3 t", plus a sorted "Buy now" list, a progress bar for PO delivery, and a buy-versus-sell rate line. **No pies, gauges or 3D.**

### Smoothness comes from data handling first, animation second

In a CRUD app, most of the smoothness users feel comes from data handling rather than animation. In priority order:

1. **Keep old rows visible.** Use `placeholderData: keepPreviousData` on every paged or filtered list, so old rows stay on screen, slightly dimmed, while new ones load ([TanStack Query v5 migration](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)).
2. **Prefetch.** Load data on hover or focus of nav links, and fetch the dashboard right after login.
3. **Update optimistically.** Insert new purchases into the list immediately, with rollback plus a toast if the save fails.
4. **Show loading indicators only when needed.** No indicator for loads under 2 s, a skeleton only for full-page loads, and a spinner inside the Save button while posting ([NN/g skeletons](https://www.nngroup.com/articles/skeleton-screens/)).
5. **Stop layout jumps.** Reserve fixed heights for tiles, charts and the limit panel, and use `tabular-nums` so live numbers do not jitter.

Animation stays short, at **150–300 ms** within NN/g's 100–500 ms range ([NN/g animation duration](https://www.nngroup.com/articles/animation-duration/)). Use tw-animate-css for dialogs and sheets, and React 19.3's stable `<ViewTransition>` for route changes. It costs no bundle size, and View Transitions are Baseline across browsers since October 2025 ([web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)). Honour `prefers-reduced-motion`.

### Big targets, strong contrast and Tally-style keys

For outdoor use:

- **Touch targets:** 44–48 px, well above WCAG 2.2's 24 px minimum ([WCAG 2.5.8 guide](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide)).
- **Contrast:** dark text on white, with no light-grey text on key figures.
- **Theme:** a high-contrast light theme matters more than dark mode.

Desktop accountants get Tally-style keys ([Suvit Tally tips](https://www.suvit.io/post/40-tips-for-tally)):

- Enter moves to the next field, and Ctrl+S saves.
- F9 opens a new purchase and F8 a new sales PO, with key hints printed on the buttons.
- Ctrl+K opens the cmdk "Go to" palette.
- Never rebind F5, F11 or F12, which browsers already use.

## Five backend follow-ups unlock the best frontend

**First and most important, add a read-only capacity endpoint.** Something like `GET /sales/capacity?poId&sourceCompanyId&saleDate&excludeSaleId` should return exactly the `details` object that `assertCapacity` already computes: PO remaining, overall stock, source-supplier stock and max allowed. Today those four figures exist only inside a 409 rejection. Without the endpoint, the "live" panel must either stitch together three report calls whose as-of semantics may not match, or wait for the user to fail. With it, the panel and the server enforce the same numbers. The panel calls it with a debounce whenever the PO, supplier or date changes.

**Second, add a time-series endpoint.** `GET /reports/rates?from&to&materialId&bucket=day|week|month` should return average buy and sell rates per bucket. The current dashboard endpoint returns only range totals, so the rate-trend line chart cannot be drawn. Having the dashboard also return the previous period's totals would let KPI cards show honest deltas.

**Third, move the refresh token into a cookie.** It should be an `HttpOnly; Secure; SameSite=Lax` cookie scoped to `Path=/api/v1/auth`, and `/auth/login` and `/auth/refresh` should return only the access token in JSON. This also needs:

- CORS switched from today's `credentials: false` (backend `src/app.js`) to `credentials: true` with an explicit origin allow-list,
- an Origin check on the cookie endpoints,
- a short grace window for rotated tokens, so two tabs refreshing together do not trip reuse detection ([Safeguard.sh](https://safeguard.sh/resources/blog/single-page-application-token-storage-security)).

**Fourth, publish an OpenAPI 3 spec.** Because every route already validates with Zod, a zod-to-openapi step can generate the spec rather than someone hand-writing it. The frontend then runs `openapi-typescript` in CI and gets typed requests with decimals kept as `string` ([DEV: OpenAPI codegen comparison](https://dev.to/nyaomaru/which-openapi-codegen-should-you-choose-openapi-typescript-vs-hey-api-vs-orval-vs-kubb-100p)). Upgrading the backend to Zod 4 at the same time would let small schemas, such as the decimal regexes, be shared.

**Fifth, a list of smaller items:**

- confirm that list endpoints accept a single `search` parameter covering party, vehicle, invoice and PO numbers,
- add an optional client-generated idempotency key on create endpoints, so a retried POST on a flaky connection cannot create a duplicate purchase.

## Conclusion

The expected answer to "which UI library" was "the one with the most components", and on that count Mantine or Ant Design would win. For this app the better question is which kit makes the *hard, domain-specific* screens easiest to get exactly right. Those screens are a delivery form that states its own limits, exact string decimals, Indian FY presets, and phone cards for yard staff. None of them comes ready-made in any library, which levels the field and lets ownership, ecosystem momentum and a matching template decide in shadcn's favour. The choice of component library also matters less than three decisions that are easy to overlook: keeping decimals as strings from API to screen, putting one lock around the rotating refresh token, and holding every filter in the URL.

The largest single UX gain does not come from the frontend at all. It comes from a capacity endpoint that exposes the four limits the backend already computes. The backend was built to explain rejections, so that "exactly how much can be delivered" is always knowable. The frontend should surface that number *before* the user types, which turns the app's strictest business rule into its most helpful feature. Validate the choice cheaply before committing: build the delivery form and one filtered list in the shadcn-admin fork in the first week, and test both on a real Android phone in sunlight. If that goes badly, switching to Mantine 9 at that point costs days, not months.
