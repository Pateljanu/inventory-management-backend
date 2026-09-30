# Tables, Forms and Specialised Inputs for the Metal Scrap Management System (React, as of 27 Sep 2026)

Method note: versions and weekly downloads come from the npm registry API (`registry.npmjs.org/<pkg>/latest`, `api.npmjs.org/downloads/point/last-week/<pkg>`), read on 2026-09-27. Bundle sizes come from the bundlephobia API on the same day. Those numbers are minified and gzipped and include non-peer dependencies. They are not tree-shaken, so real app cost is often lower. The "Inferences" sections hold my own judgement; the "Cited Findings" sections hold only sourced facts.

Snapshot table (npm, 2026-09-27):

| Package | Latest | Weekly downloads | Bundlephobia min+gz |
|---|---|---|---|
| @tanstack/react-table | 9.2.4 (v9.0.0 published 2026-08-04) | 24.2M | 31.8 kB |
| ag-grid-community / ag-grid-react | 36.2.0 | 3.73M / 2.74M | 376.9 kB (community, all modules) |
| @mui/x-data-grid | 9.14.0 | 3.47M | 123.7 kB |
| mantine-datatable | 9.4.0 | 143K | 14.7 kB (+ Mantine peers) |
| mantine-react-table | 1.3.4 (v2 still beta) | 107K | n/a |
| antd | 6.6.5 | 4.25M | n/a |
| primereact | 11.1.0 (v11.0.0 published 2026-07-15) | 386K | n/a |
| react-hook-form | 7.89.0 | 66.4M | 14.8 kB |
| @hookform/resolvers | 5.9.1 | 56.0M | 0.6 kB (entry) |
| zod | 4.6.5 | 333M | 88.6 kB (full; tree-shakes lower) |
| @tanstack/react-form | 1.33.5 | 3.55M | 17.9 kB |
| @conform-to/react | 1.21.1 | 294K | n/a |
| @mantine/form / @mantine/core / @mantine/dates | 9.6.3 | 867K / 2.74M / 1.34M | n/a |
| react-day-picker | 10.0.1 (v10.0.0 published 2026-05-08) | 52.8M | 19.3 kB |
| @mui/x-date-pickers | 9.14.0 | 5.73M | n/a |
| react-aria-components | 1.21.1 | 5.19M | n/a |
| cmdk | 1.1.1 | 52.3M | 14.9 kB |
| downshift | 9.4.0 | 5.45M | 15.2 kB |
| react-select | 5.10.2 | 10.5M | 29.8 kB |
| react-number-format | 5.4.5 (published 2026-03-22) | 5.93M | 6.6 kB |
| decimal.js | 10.6.0 | 100.5M | 12.7 kB |
| big.js | 7.0.1 | 43.1M | 3.0 kB |

Sources: [npm registry](https://registry.npmjs.org/), [npm downloads API](https://api.npmjs.org/downloads/point/last-week/react-hook-form), [bundlephobia](https://bundlephobia.com/package/@tanstack/react-table).

## (1) Data tables and grids: which handle server-side pagination, sorting, filtering, column visibility, sticky headers, row actions and mobile layouts, and at what cost?

### Takeaway
There are two workable picks, one for each UI-kit direction:
- **shadcn/ui users:** TanStack Table (now v9, stable since 4 Aug 2026) with the shadcn data-table pattern.
- **Mantine users:** Mantine DataTable (icflorescu), which is actively kept in step with Mantine 9.

Both handle server-side pagination, sorting and filtering well for a list capped at 100 rows. Several others are worse fits:
- **Mantine React Table:** effectively stalled.
- **AG Grid:** large bundle, and it is a spreadsheet-style grid, which is too much for this app.
- **MUI X DataGrid Community:** workable (server modes are free, and the 100-row page limit matches the API cap), but it ties you to MUI.

### Cited Findings

**TanStack Table + shadcn/ui data-table**
- TanStack Table v9 went stable on **4 Aug 2026** (npm shows `9.0.0` published 2026-08-04T06:29Z; latest is 9.2.4). The rebuild uses TanStack Store with fine-grained reactivity. It claims a 79% lower average processing time for the core row model and up to 86% less retained JS heap than v8. The package grew from 14 kB to 25 kB, but features are opt-in and tree-shakeable. It supports React 18+ and works under the React Compiler. No v8 end-of-life date was announced. — [TanStack blog: Announcing Table v9](https://tanstack.com/blog/announcing-tanstack-table-v9); [InfoQ, Jul 2026](https://www.infoq.com/news/2026/07/tanstack-table-v9-beta/)
- The v9 beta was announced around 8 Jun 2026, after more than two years of work. — [TanStack on X](https://x.com/tan_stack/status/2063956390633181404); [InfoQ](https://www.infoq.com/news/2026/07/tanstack-table-v9-beta/)
- The shadcn/ui data-table docs now say "This guide uses TanStack Table v9". The guide shows sorting, filtering, pagination, column visibility (dropdown), row selection and row-action dropdown menus. It is "a guide on how to build your own", not a packaged component. Server-side use goes through TanStack's manual pagination APIs. — [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table)
- @tanstack/react-table: 24.2M weekly downloads, 31.8 kB min+gz on bundlephobia (whole package, before tree-shaking). — [npm API](https://api.npmjs.org/downloads/point/last-week/@tanstack/react-table), [bundlephobia](https://bundlephobia.com/package/@tanstack/react-table)

**Mantine DataTable (icflorescu) and Mantine React Table (MRT)**
- mantine-datatable v9.x targets Mantine v9.x. Recent releases: 9.3.0 (2026-06-12), 9.3.1 (2026-06-19) and 9.4.0 (2026-07-15), tracking Mantine 9.3 and 9.4. The feature list: async data loading, column sorting, custom cell rendering, context menus, nesting, Gmail-style batch row selection and dark theme. — [mantine-datatable CHANGELOG](https://github.com/icflorescu/mantine-datatable/blob/main/CHANGELOG.md); [GitHub repo](https://github.com/icflorescu/mantine-datatable)
- mantine-datatable 9.4.0 is 14.7 kB min+gz (Mantine is a peer dependency) and has 143K weekly downloads. — [bundlephobia](https://bundlephobia.com/package/mantine-datatable), [npm API](https://api.npmjs.org/downloads/point/last-week/mantine-datatable)
- Mantine React Table has no v2 stable release. Its most recent GitHub release is **v2.0.0-beta.9 from 17 Feb 2025**. The npm `latest` tag is still 1.3.4. A community discussion asks for Mantine v8 support, because MRT v2 lists Mantine v7 as a peer. Mantine itself is now at 9.6.3. — [MRT releases](https://github.com/KevinVandy/mantine-react-table/releases); [Discussion #514](https://github.com/KevinVandy/mantine-react-table/discussions/514); [Mantine changelog](https://mantine.dev/changelog/all-releases/)

**MUI X DataGrid**
- The MIT (Community) DataGrid supports `paginationMode="server"`, `sortingMode="server"` and `filterMode="server"`, with a `rowCount` prop for the total. MIT is "limited to pages of up to 100 rows"; larger pages need Pro. — [MUI X pagination docs](https://mui.com/x/react-data-grid/pagination/)
- The pricing page lists "Pagination > 100 rows per page" as a Pro feature. Pro adds header filters, multi-column filtering, row and column pinning, Excel export and clipboard. — [MUI pricing](https://mui.com/pricing/)
- The fetched MUI pricing page listed **Pro $299/yr, Premium $599/yr, Enterprise $1,399/yr per developer**. The page showed no date. **Flag:** these figures differ from older MUI prices I remember, so re-check before quoting. — [MUI pricing](https://mui.com/pricing/)
- Current MUI X version is 9.14.0. @mui/x-data-grid is 123.7 kB min+gz with 3.47M weekly downloads. — [npm registry](https://registry.npmjs.org/@mui/x-data-grid/latest), [bundlephobia](https://bundlephobia.com/package/@mui/x-data-grid)
- The Data Source (server-side data) docs page did not say which tier the `dataSource` API belongs to. — [MUI server-side data](https://mui.com/x/react-data-grid/server-side-data/)

**AG Grid**
- Enterprise costs **$999 per developer**: a perpetual licence with 1 year of updates. Community is MIT and free for commercial use. Enterprise-only features include Set Filter, Multi Filter, row grouping, pivoting, aggregation, the server-side row model features (grouping, pivot, tree data, master-detail), Excel and PDF export, clipboard, and column and context menus with tool panels. — [AG Grid pricing](https://www.ag-grid.com/license-pricing/)
- The latest version is 36.2.0. `ag-grid-community` is **376.9 kB min+gz** on bundlephobia (all modules). AG Grid says registering only the modules you need cuts bundle size by up to 43%. In v36, the ValidationModule is no longer in AllCommunityModule, and `createTheme()` no longer bundles button styles. — [bundlephobia](https://bundlephobia.com/package/ag-grid-community); [AG Grid bundle blog](https://www.ag-grid.com/blog/minimising-bundle-size/); [Upgrading to AG Grid 36](https://www.ag-grid.com/angular-data-grid/upgrading-to-ag-grid-36/)

**Ant Design and PrimeReact**
- antd latest is 6.6.5 (4.25M weekly downloads). PrimeReact released a new major, 11.0.0, on 2026-07-15 (now 11.1.0, 386K weekly). — [npm registry](https://registry.npmjs.org/antd/latest); [npm registry](https://registry.npmjs.org/primereact)

### Inferences
- **Server-side fit.** The API returns `meta {page, limit, total, totalPages}` with a limit of 100. Every candidate maps onto this:
  - TanStack: `manualPagination/manualSorting/manualFiltering` plus `rowCount`/`pageCount`.
  - Mantine DataTable: `page`, `recordsPerPage`, `totalRecords` and `sortStatus` props.
  - MUI Community: server modes plus `rowCount`.

  MUI Community's 100-row cap is not a problem here because the backend cap is also 100.
- **Mobile card view.** None of the libraries gives you a phone card view for free. With headless TanStack or a simple Mantine DataTable, it is easy to render the same row data as `<Card>` lists below a breakpoint. With AG Grid or MUI DataGrid, that means dropping the grid on phones. For yard staff on phones, a headless or lightweight option makes it easier to build a "table on desktop, cards on phone" pattern.
- **Stack choice.**
  - **shadcn/ui (Tailwind, own-the-code):** TanStack Table v9 with the shadcn data-table guide. Wrap it once in a reusable `<ServerDataTable>` that handles query-string state, the page-size select (10/25/50/100), a column-visibility menu, a sticky header (`position: sticky` on `thead`) and a row-actions dropdown.
  - **Mantine:** mantine-datatable is the simplest ready-made table, with sticky header, pagination, sorting, column toggling and row actions largely built in. Avoid Mantine React Table: the last release was a Feb 2025 beta and it has no Mantine 8/9 support.
- **v9 migration risk.** Because v9 is only about 8 weeks old, some third-party shadcn table blocks and examples may still use the v8 API. The official shadcn guide already targets v9, so start directly on v9.
- **AG Grid.** About 377 kB gzipped (full) and a spreadsheet UX are overkill for "very simple" lists of at most 100 rows. The useful Enterprise features (set filters, grouping, Excel export) cost $999 per developer. Not recommended.
- **Ant Design and PrimeReact tables.** Both are full-featured (server pagination through `onChange`, fixed headers, column settings), but they pull in the whole design system. Only consider them if that kit is chosen for the app overall. PrimeReact v11 is only about 2 months old.

### Gaps
- I did not get bundle sizes for antd or PrimeReact because the bundlephobia calls were not run. I also did not verify PrimeReact v11's DataTable changes.
- MUI X pricing figures are unverified against an independent dated source (see flag above). The tier for MUI's `dataSource` API is unconfirmed.
- I found no benchmark comparing these grids at 100 rows; at that size, performance differences are negligible in practice.
- Mantine DataTable's built-in responsive or mobile behaviour was not verified beyond its feature list.

## (2) Form state and validation: which is simplest and most robust for dependent fields and 422 `details.issues[{path, message}]` errors mapped to fields?

### Takeaway
**React Hook Form 7 + Zod 4 + @hookform/resolvers 5** is the safest default. It has by far the largest ecosystem (66M weekly downloads), it is what the shadcn `<Form>` pattern uses, and Zod v4 support is resolved in resolvers v5. Server issues map directly with `setError(path, {message})`. TanStack Form v1 is a strong, type-safer alternative with built-in field-level server errors. For a Mantine stack, `@mantine/form` is the simplest option.

### Cited Findings
- react-hook-form latest is **7.89.0** (66.4M weekly downloads, 14.8 kB min+gz). A **v8 is in beta** (migration guide labelled "BETA"). It adds first-class React Compiler support and flat field-array types. — [npm registry](https://registry.npmjs.org/react-hook-form/latest); [RHF migrate v7→v8 (beta)](https://react-hook-form.com/migrate-v7-to-v8); [RHF releases](https://github.com/react-hook-form/react-hook-form/releases)
- @hookform/resolvers v5 was released in April 2025. Zod v4 support was added through a PR by Zod's author. v5.2.2 (2025-09-14) fixed the Zod 4 resolver's output type. The npm README shows importing from `zod` or `zod/v4`. The latest is 5.9.1 (56M weekly). — [HookForm on X](https://x.com/HookForm/status/1907006048298578033); [resolvers PR #777](https://github.com/react-hook-form/resolvers/pull/777); [resolvers releases](https://github.com/react-hook-form/resolvers/releases); [npm](https://www.npmjs.com/package/@hookform/resolvers)
- There were compatibility complaints while Zod v4 was new (Zod issue #4992, RHF issue #12829). — [zod #4992](https://github.com/colinhacks/zod/issues/4992); [RHF #12829](https://github.com/react-hook-form/react-hook-form/issues/12829)
- zod latest is 4.6.5 (333M weekly downloads). — [npm registry](https://registry.npmjs.org/zod/latest)
- RHF's `setError(name, { type, message })` sets an error on a named field, including nested paths. — [RHF setError docs](https://react-hook-form.com/docs/useform/seterror)
- TanStack Form v1 went stable on **3 Mar 2025** for React, Vue, Angular, Solid and Lit. It is now at 1.33.5 (3.55M weekly, 17.9 kB min+gz). — [TanStack blog](https://tanstack.com/blog/announcing-tanstack-form-v1); [InfoQ](https://www.infoq.com/news/2025/05/tanstack-form-v1-released/); [npm registry](https://registry.npmjs.org/@tanstack/react-form/latest)
- TanStack Form's `onSubmitAsync` validator can return `{ form: '...', fields: { age: '...' } }` to spread one server response across fields, including nested paths such as `'details.email'` and `'socials[0].url'`. It accepts Standard Schema validators (Zod, Valibot and others) directly. — [TanStack Form validation guide](https://tanstack.com/form/latest/docs/framework/react/guides/validation)
- @mantine/form is 9.6.3 (867K weekly). @conform-to/react is 1.21.1 (294K weekly). — [npm registry](https://registry.npmjs.org/@mantine/form/latest); [npm registry](https://registry.npmjs.org/@conform-to/react/latest)

### Inferences
- **Mapping 422 errors with RHF.** A 10-line helper is enough: `issues.forEach(i => setError(i.path.join('.'), { message: i.message }))`, plus `setError('root.server', ...)` for issues with no path. The backend's `path` arrays are presumably Zod-style (`['items', 0, 'qty']`), and RHF's dot paths (`items.0.qty`) match them.
- **Shared schemas.** If the backend also uses Zod, you could share the schemas. Check that the backend and frontend use the same Zod major version.
- **Dependent fields and live limits** (PO remaining, stock, supplier stock):
  - In RHF, use `useWatch` on the selected PO or material, fetch limits with TanStack Query, and pass the limit into a `superRefine`, or validate on submit and let the server's 422 be the final authority.
  - In TanStack Form, listener-based linked validation handles this natively. The fetched guide page did not document `onChangeListenTo`; that is unverified here.
- **Why RHF as default.** It has more examples and shadcn integration, and team familiarity is higher. TanStack Form is technically elegant but more verbose (render-prop `form.Field`). Avoid RHF v8 until it is stable. Conform suits server-action and progressive-enhancement apps (Remix/Next), which this client-side SPA against a REST API does not need.
- **Mantine stack.** `@mantine/form` with `zod4Resolver` (from `mantine-form-zod-resolver`) and `form.setErrors({...})` for server issues is the least-glue option. Mantine-form resolver support for Zod 4 was not verified.

### Gaps
- Conform: I did not research its current feature state beyond the version number.
- I did not verify that TanStack Form's linked-field API (`onChangeListenTo`) is in the current docs.
- I did not verify Mantine form's Zod 4 resolver package status.

## (3) Date and date-range pickers: which give the simplest range UX with presets (Today, This month, Last month, This FY Apr–Mar) and DD/MM/YYYY?

### Takeaway
All the main options support ranges and presets except MUI's free tier: **MUI X DateRangePicker is Pro-only**. For shadcn, use **react-day-picker** (now **v10**, which renamed the package to `@daypicker/react`) in `mode="range"` inside a Popover with a preset side-list. For Mantine, `DatePickerInput type="range"` has a built-in `presets` prop, `valueFormat="DD/MM/YYYY"`, and a modal dropdown for phones. That makes it the simplest out-of-the-box range UX.

### Cited Findings
- The MUI X Date Range Picker page carries a **Pro plan badge**, so it is commercial. It supports shortcuts such as "This Week" and "Last 7 Days". MUI X version on the page is 9.14.0. — [MUI Date Range Picker](https://mui.com/x/react-date-pickers/date-range-picker/)
  - **Conflict:** the summary of MUI's pricing page listed "Date and Time Range Pickers" under all tiers. The component's own docs show the Pro badge, so Pro-only is the reliable reading. — [MUI pricing](https://mui.com/pricing/)
- react-day-picker latest is **10.0.1**; v10.0.0 was published 2026-05-08. v10 removed deprecated v9 compatibility APIs (old navigation props such as `fromMonth`/`toYear`, `onDay*` handlers, old classNames keys) and moved non-Gregorian calendars to add-on packages. The recommended package name is now `@daypicker/react`; `react-day-picker` stays as a compatibility name. Upgrade notes say shadcn users with a copied Calendar need to update their class-name mappings. — [DayPicker upgrading to v10](https://daypicker.dev/upgrading); [npm registry](https://registry.npmjs.org/react-day-picker)
- v9 (Jul 2024) moved date-fns into dependencies, added UTC and Jalali support, improved WCAG 2.1 accessibility, and improved range selection logic. — [v9 release discussion](https://github.com/gpbl/react-day-picker/discussions/2280)
- react-day-picker: 52.8M weekly downloads, 19.3 kB min+gz. — [npm API](https://api.npmjs.org/downloads/point/last-week/react-day-picker), [bundlephobia](https://bundlephobia.com/package/react-day-picker)
- Mantine `DatePickerInput` (v9.6.3) features:
  - `type="range"`
  - a `presets` prop of `{label, value}` shown next to the calendar
  - `valueFormat` with dayjs formats such as `DD/MM/YYYY`
  - `dropdownType="modal"`
  - values as `YYYY-MM-DD` strings (`[string|null, string|null]` for ranges)

  — [Mantine DatePickerInput](https://mantine.dev/dates/date-picker-input/)
- Ant Design RangePicker (antd 6.6.5) has a `presets` prop (callback values since 5.8.0), a dayjs `format` prop, and `inputReadOnly` to stop the virtual keyboard on touch devices. — [antd DatePicker](https://ant.design/components/date-picker)
- react-aria-components is at 1.21.1 (5.19M weekly). — [npm registry](https://registry.npmjs.org/react-aria-components/latest)

### Inferences
- Mantine's `YYYY-MM-DD` string value maps directly onto the API's `from`/`to` query params with no timezone conversion. That avoids the classic off-by-one-day bug with `Date` objects in IST. With react-day-picker, which uses `Date`, format with date-fns `format(d, 'yyyy-MM-dd')` before sending. Never use `toISOString()`, which converts to UTC and shifts IST dates.
- **Presets.** Build one shared preset helper, since no library ships an Indian FY preset: Today, Yesterday, This week, This month, Last month, This quarter, **This financial year** (1 Apr to 31 Mar: if the month is Jan–Mar, FY started 1 Apr of last year) and **Last financial year**.
- **Phones.** Use a modal or bottom sheet (Mantine `dropdownType="modal"`, or a shadcn Drawer for the Calendar), show one month on phones and two on desktop, and use read-only text inputs so the keyboard does not pop up.
- **React Aria DateRangePicker.** Strongest for accessibility and typed segment entry, but more assembly work, and segment inputs can confuse non-technical users. It is not the simplest choice here.

### Gaps
- I did not confirm whether the current shadcn Calendar or date-picker registry item has moved to DayPicker v10 or `@daypicker/react`.
- I did not fetch React Aria DatePicker docs for preset or locale specifics.
- I did not check en-IN locale default formats for each library; all accept explicit `DD/MM/YYYY` format strings.

## (4) Searchable select / combobox: async search, keyboard and touch friendliness

### Takeaway
Use your UI kit's own combobox:
- **shadcn:** the shadcn Combobox, now offered on **Base UI, React Aria or Radix** variants. The classic cmdk + Popover recipe is still widely used.
- **Mantine:** `Select`/`Autocomplete` with `searchable`, or the `Combobox` primitives for async.

For async search over companies or materials, pair either one with debounced TanStack Query calls to the list endpoint's `search` param. react-select is a heavier kit-agnostic fallback; Downshift is low-level.

### Cited Findings
- The shadcn Combobox docs offer separate **Base UI**, **React Aria** and **Radix UI** implementations, with the default built on Base UI's Combobox. They show multiple selection with chips and a popup variant. They do not document async search or a mobile drawer. — [shadcn Combobox](https://ui.shadcn.com/docs/components/combobox)
- Package facts:

  | Package | Latest | Weekly downloads | min+gz |
  |---|---|---|---|
  | cmdk | 1.1.1 | 52.3M | 14.9 kB |
  | downshift | 9.4.0 | 5.45M | 15.2 kB |
  | react-select | 5.10.2 | 10.5M | 29.8 kB |
  | react-aria-components | 1.21.1 | 5.19M | n/a |

  — [npm registry](https://registry.npmjs.org/cmdk/latest); [bundlephobia](https://bundlephobia.com/package/react-select)

### Inferences
- For a list endpoint capped at 100 per page, async search is the right model:
  - debounce about 250 ms
  - send `?search=term&limit=20`
  - show a "Loading…" and a "No results — check spelling" empty state
  - keep the selected item's label cached so edit forms render before the options load
- **Touch.** On phones, a full-screen or modal combobox (Mantine `Select` in a modal, or shadcn Combobox inside a Drawer) avoids the on-screen keyboard covering the list.
- cmdk is a command palette primitive. It is fine for a Ctrl+K "jump to" launcher, which is a nice extra for power users, but a form combobox built on Base UI, React Aria or Mantine has better form semantics.
- react-select's version has sat at 5.10.x. It still works, but styling it to match a Tailwind or Mantine design takes effort.

### Gaps
- I did not verify react-select's release cadence or maintenance activity in 2026.
- I did not verify Mantine Combobox async examples in this session. They are standard in Mantine docs, but not re-checked.

## (5) Numeric and currency input: Indian lakh/crore grouping and exact decimals

### Takeaway
Use **react-number-format `NumericFormat`** (or Mantine `NumberInput`, which wraps it) with `thousandsGroupStyle="lakh"`, `decimalScale` of 3 for tons or 2 for ₹, and `prefix="₹ "`. Keep the form value as the **unformatted string** (`values.value`), never as `floatValue`. Compare and compute limits with **big.js** (3 kB) and display with `Intl.NumberFormat('en-IN')`. It formats decimal strings exactly, with no float conversion.

### Cited Findings
- react-number-format `NumericFormat` supports `thousandsGroupStyle` values `"thousand"`, `"lakh"` (12,34,56,789) and `"wan"`, plus `decimalScale`, `fixedDecimalScale` (pads with trailing zeros) and `prefix`. The latest is 5.4.5 (2026-03-22), with 5.93M weekly downloads and 6.6 kB min+gz. — [react-number-format NumericFormat docs](https://s-yadav.github.io/react-number-format/docs/numeric_format/); [npm registry](https://registry.npmjs.org/react-number-format)
- Mantine `NumberInput` is built on react-number-format. It supports `thousandsGroupStyle: 'thousand' | 'lakh' | 'wan' | 'none'`, `decimalScale`, `fixedDecimalScale`, `prefix` and `suffix`. **But** `onChange` returns a **number** whenever the value can be represented as one; strings are returned only for empty values, a lone "-", or values beyond `MAX_SAFE_INTEGER`. It also supports `bigint`. — [Mantine NumberInput](https://mantine.dev/core/number-input/)
- `Intl.NumberFormat.prototype.format()` accepts strings and "will use the exact value that the string represents, avoiding loss of precision during implicitly conversion to a number". — [MDN Intl.NumberFormat.format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format)
- Local check in Node v22.18.0 on 2026-09-27:
  - `new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', minimumFractionDigits:2, maximumFractionDigits:2}).format("1187894.21")` returns `₹11,87,894.21`
  - the 3-decimal en-IN formatter returns `"30.250"` for input `"30.250"`
  - `0.1 + 0.2` gives `0.30000000000000004`
  - compact en-IN notation gives `1.2KCr` for 11,878,942,100

  — (local test, no URL)
- Decimal libraries: big.js 7.0.1 (3.0 kB min+gz, 43.1M weekly); decimal.js 10.6.0 (12.7 kB, 100.5M weekly). — [bundlephobia big.js](https://bundlephobia.com/package/big.js); [bundlephobia decimal.js](https://bundlephobia.com/package/decimal.js)

### Inferences
- **Keep the value a string.** With react-number-format, set `valueIsNumericString` and store `values.value` (for example `"30.250"`) in form state. Mantine NumberInput returns JS numbers for normal values, so for exact-decimal fields either use react-number-format directly or convert immediately to a fixed string. A float like 30.25 would lose the API's `"30.250"` shape, and tiny float errors can creep into `qty × rate`. `valueIsNumericString` and the `onValueChange` `{value, floatValue, formattedValue}` object were not shown on the fetched docs page and are unverified in this session; check the API page.
- **Validation.** Validate with a Zod string regex such as `/^\d+(\.\d{1,3})?$/` for quantity or `/^\d+(\.\d{1,2})?$/` for money, then compare with `new Big(qty).lte(poRemaining)` for live limits. Show the limit in plain words, for example "Max available: 12.500 tons". Send the string back unchanged; the API already uses strings.
- **Display.** Create two cached formatters, `inr2 = new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', minimumFractionDigits:2, maximumFractionDigits:2})` and `qty3` (3 fixed decimals), and pass the API strings in directly. For dashboards, `notation:'compact'` with en-IN gives the "Cr"/"L" style. Test on target browsers, because the output ("1.2KCr") may confuse users; a custom "₹1,187.89 Cr" formatter may be clearer.
- **big.js vs decimal.js.** big.js is enough for add, subtract, multiply, compare and round at 2–3 decimals, and it is about 4× smaller than decimal.js.

### Gaps
- I did not verify browser (Safari, Chrome Android) consistency of en-IN compact notation, or exact-string `format()` support on older Android WebViews. String input with exact decimals is part of Intl.NumberFormat v3 (ES2023). Older engines convert to Number first; at 2–3 decimals and values below about 10^13 that is visually harmless.
- react-number-format's `valueIsNumericString` behaviour and caret handling with the lakh style on mobile keyboards were not tested in this session.

---

### Overall verdict for this app (inference, based on the findings above)

| Need | If UI kit = shadcn/ui (Tailwind) | If UI kit = Mantine 9 |
|---|---|---|
| Tables | TanStack Table **v9** + shadcn data-table guide, wrapped as one reusable server table (manual pagination, sorting and filters; card list on phones) | **mantine-datatable 9.x** (not Mantine React Table) |
| Forms | **React Hook Form 7.x + Zod 4 + @hookform/resolvers 5**; one `applyServerIssues(setError, issues)` helper | @mantine/form + Zod (or RHF, which also works with Mantine) |
| Date range | react-day-picker **v10** (`mode="range"`) in Popover/Drawer + custom preset list incl. Indian FY | `DatePickerInput type="range" presets valueFormat="DD/MM/YYYY"` (`dropdownType="modal"` on mobile) |
| Combobox | shadcn Combobox (Base UI/React Aria) + debounced async query | Mantine `Select searchable` / `Combobox` + debounced async query |
| Numbers | react-number-format `NumericFormat` (lakh, decimalScale, string value) + big.js + `Intl.NumberFormat('en-IN')` on strings | Same; do not rely on Mantine NumberInput's number output for exact fields |

Do not use for this app:
- **AG Grid:** about 377 kB gzipped full, $999 per developer for Enterprise, and a spreadsheet UX.
- **MUI X DateRangePicker:** Pro licence required.
- **Mantine React Table:** stalled since the Feb 2025 beta.
- **RHF v8:** still beta.
