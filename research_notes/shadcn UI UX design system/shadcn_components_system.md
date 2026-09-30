# shadcn/ui components, blocks, theming and a reusable design system (state as of Sept 2026) for the Metal Scrap Management System

Research date: 2026-09-27. Sources are mostly ui.shadcn.com (docs + dated changelog entries), plus a few secondary articles. Where a claim comes only from my own knowledge rather than a fetched source, it is placed under "Inferences" or "Gaps" and flagged.

---

## 1. Current shadcn/ui catalogue, new 2025-2026 components, Base UI switch, CLI, registries, create/presets, blocks

### Takeaway
As of Sept 2026 shadcn/ui ships about 65-76 components in 8 visual styles, and each component comes in Base UI, Radix and React Aria versions. Base UI became the default for new projects in July 2026 (Base UI 1.6.0). Radix is **not** deprecated. Forms now use the library-agnostic **Field** family (Oct 2025) with React Hook Form's `Controller`. Base UI projects get a new Base UI **Toast** (July 2026) where Radix projects use **Sonner**. CLI v4 (March 2026) added presets, `--dry-run/--diff/--view`, a Vite template, and `-b/--base radix|base`. September 2026 added a standalone `cn` package.

### Cited Findings

**Catalogue (docs index, fetched Sept 2026)**
- The components index lists these names: Accordion, Alert, Alert Dialog, Aspect Ratio, Attachment, Avatar, Badge, Breadcrumb, Bubble, Button, Button Group, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Dialog, Direction, Drawer, Dropdown Menu, Empty, Field, Hover Card, Input, Input Group, Input OTP, Item, Kbd, Label, Marker, Menubar, Message, Message Scroller, Native Select, Navigation Menu, Pagination, Popover, Progress, Questionnaire, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle, Toggle Group, Tooltip, Typography. The page header says "76 total", so the extraction missed some names. Sonner and Form did not show up in the extracted list, though a Radix Sonner page still exists (see Toast below). — [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- Components added in 2025-2026 include Field, Input Group, Button Group, Empty, Spinner, Kbd, Item, Marker, Attachment, Bubble, Message, Message Scroller, Direction, Resizable and Questionnaire. The Attachment, Bubble and Message components are chat/AI-oriented. — [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog)
- **October 2025 new components** (library-agnostic: "work with every component library, Radix, Base UI, React Aria"): — [Oct 2025 changelog](https://ui.shadcn.com/docs/changelog/2025-10-new-components)
  - **Spinner**: loading indicator. It can sit inside buttons.
  - **Kbd** (+ `KbdGroup`): shows keyboard keys, e.g. in tooltips, buttons and input groups.
  - **Button Group** (+ `ButtonGroupSeparator` for split buttons, `ButtonGroupText`): groups can be nested.
  - **Input Group** (+ `InputGroupAddon`, `InputGroupInput`, and text/label/tooltip/button addons): puts icons, buttons and labels around an input or textarea.
  - **Field** (+ `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldContent`): "works with all your form libraries: Server Actions, React Hook Form, TanStack Form, Bring Your Own Form".
  - **Item** (+ `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemGroup`): a flex row for lists and cards. It supports `asChild` so it can render as a link (in Base UI this becomes `render`).
  - **Empty** (+ `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`): empty states.
- **Questionnaire** (Aug 2026): a multi-step question flow with single/multi select, freeform answers, conditional questions and keyboard shortcuts. It is "available for Base UI, React Aria, and Radix across all eight styles". — [Changelog](https://ui.shadcn.com/docs/changelog)

**Base UI as default (July 2026)**
- "Starting today, Base UI is the default component library in shadcn/ui." Base UI "is at 1.6.0 with 6M+ weekly downloads". Projects created on shadcn/create already picked Base UI over Radix by 2 to 1. — [July 2026 Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- "Radix is not being deprecated… every update and new component will ship for both libraries (unless a component only exists in Base UI). You do not need to migrate." To start on Radix, run `pnpm dlx shadcn init -b radix`. The docs open on the Base UI tab. — [July 2026 Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- Migration uses an agent skill, not a codemod: `pnpm dlx skills add shadcn/ui`, then ask the agent to "migrate accordion to base-ui". It writes per-component reports to `.migration/` and makes one commit per component. — [July 2026 Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- Base UI docs arrived in January 2026 as an option next to Radix and React Aria. React Aria is also a supported primitive set, with its own July 2026 entry. — [Changelog](https://ui.shadcn.com/docs/changelog); [July 2026 React Aria](https://ui.shadcn.com/docs/changelog/2026-07-react-aria)
- Base UI has primitives Radix never shipped: **Combobox, Autocomplete, Number Field**. — [OpenReplay blog](https://blog.openreplay.com/shadcn-ui-radix-base-ui-switch/) (secondary source)

**Forms: Form component vs Field**
- The current React Hook Form guide uses `useForm` + `zodResolver`. Each input is wrapped in `<Controller>` and rendered as `<Field data-invalid={fieldState.invalid}>` → `<FieldLabel htmlFor={field.name}>` → the control with `{...field}`, `id` and `aria-invalid={fieldState.invalid}` → `<FieldDescription>` → `{fieldState.invalid && <FieldError errors={[fieldState.error]} />}`. The guide does not use the old `<Form>/<FormField>/<FormItem>/<FormControl>/<FormMessage>` wrapper and does not say it is deprecated. — [shadcn React Hook Form guide](https://ui.shadcn.com/docs/forms/react-hook-form)

**Toast / Sonner**
- July 2026: "A new Toast component is now available for Base UI projects", with actions, status types, promises, stacking and swipe dismissal. The changelog entry does not say anything about Sonner's status. — [July 2026 Toast](https://ui.shadcn.com/docs/changelog/2026-07-toast)
- Base UI Toast API: `toast.add({title, description})`, `toast.promise()`, `toast.close(id)`, `actionProps`, and status types success/info/warning/error/loading. It needs `<Toaster />` in the root layout. Install with `pnpm dlx shadcn@latest add toast`. — [Toast (Base)](https://ui.shadcn.com/docs/components/base/toast)
- The new Toast "does not use the same API as Sonner". The Toaster only accepts Toast.Provider props. — [GitHub Discussion #11317](https://github.com/shadcn-ui/ui/discussions/11317) (via search snippet)
- A Radix Sonner docs page still exists. — [Sonner (Radix)](https://ui.shadcn.com/docs/components/radix/sonner)

**CLI v4 (March 2026), presets, apply, registries**
- CLI v4 adds project templates for Next.js, **Vite**, TanStack Start, React Router, Astro and Laravel, plus `--monorepo`. `add` gained `--dry-run`, `--diff` and `--view`. New commands: `info` (framework, CSS vars, installed components) and `docs`. Other additions: **presets** (the whole design-system config — colors, theme, icons, fonts, radius — as a shareable code, applied with `init --preset`), `--base radix`, **skills** (`pnpm dlx skills add shadcn/ui`), and the new registry types `registry:base` (a full design system) and `registry:font`. — [CLI v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4); [DEV Community summary](https://dev.to/codedthemes/shadcnui-march-2026-update-cli-v4-ai-agent-skills-and-design-system-presets-1gp1)
- April 2026: `shadcn apply` applies a design-system/preset config, including partial presets, and the `shadcn preset` commands arrived. — [shadcn apply](https://ui.shadcn.com/docs/changelog/2026-04-shadcn-apply); [shadcn preset](https://ui.shadcn.com/docs/changelog/2026-04-preset-commands)
- Earlier CLI milestones: `shadcn init` (Aug 2024), monorepo (Dec 2024), Tailwind v4 support (Feb 2025), shadcn 2.5.0 (Apr 2025), radix-ui single-package migration (Jun 2025), universal registry items and local files (Jul 2025), CLI v3.0 with namespaced registries and MCP server (Aug 2025). — [Changelog](https://ui.shadcn.com/docs/changelog)
- Registries in 2026: dynamic server-side search (Jul 2026, `GET /r/registry.json?q=button&limit=50&offset=0`) and private GitHub registries via GitHub CLI or token (Aug 2026). — [Changelog](https://ui.shadcn.com/docs/changelog)
- **`cn` package (Sept 2026)**: "a drop-in replacement for `twMerge(clsx(...))`… smaller, faster and ships the same API". New `init` installs it. Existing projects run `pnpm dlx shadcn@latest migrate cn`. The old `lib/utils.ts` keeps working and re-exports `cn`. Registry components now import from `"cn"`. — [Sept 2026 cn](https://ui.shadcn.com/docs/changelog/2026-09-cn)

**shadcn create and styles**
- `npx shadcn create` / shadcn/create launched in December 2025. It launched with 5 styles: **Vega** ("classic shadcn/ui look"), **Nova** ("reduced padding and margins for compact layouts"), **Maia** ("soft and rounded, generous spacing"), **Lyra** ("boxy and sharp, pairs with mono fonts") and **Mira** ("compact, made for dense interfaces"). Options: component library, icon library, base color, theme, font, radius and menu. The config "rewrites the component code to match your setup". Supported targets are Next.js, Vite, TanStack Start and v0. — [Dec 2025 shadcn create](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create)
- There are now "eight styles". Luma appears in the site navigation. — [Changelog](https://ui.shadcn.com/docs/changelog)

**Blocks**
- Blocks include `dashboard-01` ("sidebar, charts and data table"), sidebar blocks (e.g. `sidebar-07` "collapses to icons", `sidebar-03` "with submenus"), login blocks (e.g. `login-03` muted background, `login-04` form + image), signup, calendar and chart blocks. — [shadcn Blocks](https://ui.shadcn.com/blocks)

### Inferences
- For a new Vite + React 19 project in late 2026, the lowest-friction path is `pnpm dlx shadcn@latest init` (Vite template, Base UI default). Pick a compact style (**Nova** or **Mira**) for dense business tables, or **Vega** for the familiar look.
- There is a conflict here: **satnaing/shadcn-admin is Radix-based** (Section 4). Starting from it means either (a) staying on Radix, which is supported, simpler and still gets new components, or (b) migrating component by component with the skill. For a small team building quickly, staying on Radix for the template-derived UI is the lower-risk choice. If the team wants Base UI's Combobox and Number Field, it should decide at project start, not mid-build. Mixing both libraries' `components/ui` in one app would create inconsistent APIs (`asChild` vs `render`).
- Sonner is a standalone library, so it still works in a Base UI project. The project spec says Sonner, and Sonner's `toast.success()/toast.promise()` API is simpler for developers. On Base UI the "native" choice is now Base UI Toast, with a different API. Pick one and wrap it in `lib/notify.ts` so the choice can be swapped later.
- Use `Native Select` for simple, mobile-friendly selects in forms (e.g. unit, status). Use Combobox for searchable, async entity pickers.

### Gaps
- I could not get a clean list of all 76 component names. The extracted list had about 65 and missed Sonner, Form, and possibly Autocomplete / Number Field / Toggle etc. Check the docs sidebar directly.
- I did not find an explicit statement that the legacy `Form` component (`form.tsx`) is deprecated. The docs simply now teach Field + Controller.
- The names of 2 of the 8 styles (beyond Vega/Nova/Maia/Lyra/Mira/Luma) were not confirmed.
- The exact CLI version number (e.g. 4.x) as of Sept 2026 was not confirmed.

---

## 2. Mapping each UI need in the app to shadcn components

### Takeaway
Nearly every screen in the app has a matching shadcn primitive or block. Start the shell from the sidebar/dashboard blocks, build forms from Field + Input Group + Combobox/Select, use Empty/Spinner/Skeleton for states, and use Chart (Recharts v3) for the dashboard.

### Cited Findings
- `dashboard-01` gives a sidebar + charts + data table starting point. `sidebar-07` gives an icon-collapsible sidebar. `login-03`/`login-04` give login screens. — [shadcn Blocks](https://ui.shadcn.com/blocks)
- Field, Input Group, Button Group, Empty, Spinner, Kbd and Item exist for forms, input adornments, action groups, empty states, loading and shortcuts. — [Oct 2025 changelog](https://ui.shadcn.com/docs/changelog/2025-10-new-components)
- Calendar is built on React DayPicker with `mode="range"`, a presets example (Today, Tomorrow, In a week…) and a `timeZone` prop. The Date Picker is composed from Calendar (Popover + Calendar). — [Calendar (Base)](https://ui.shadcn.com/docs/components/base/calendar)
- The Chart component uses **Recharts v3** with `ChartContainer`, `ChartTooltip/ChartTooltipContent`, `ChartLegend/ChartLegendContent` and the `accessibilityLayer` prop. — [Chart (Base)](https://ui.shadcn.com/docs/components/base/chart)
- The shadcn-admin template has a global command search (Command), a sidebar, light/dark mode and 10+ pages. — [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)

### Inferences (recommended mapping; component names are from the catalogue above)
| App need | shadcn components |
|---|---|
| App shell / nav | `Sidebar` (block `sidebar-07`, collapsible to icons; `SidebarProvider`, `SidebarTrigger`, `SidebarInset`), `Breadcrumb`, `Separator`, `DropdownMenu` (user menu), `Avatar` |
| Mobile nav | The `Sidebar` renders as an offcanvas `Sheet` on mobile. `Drawer` for bottom sheets |
| Global search / shortcuts | `Command` (inside `CommandDialog`) + `Kbd`/`KbdGroup` for hints such as Ctrl+K |
| Dashboard KPI tile | `Card` (`CardHeader/CardTitle/CardDescription/CardAction/CardContent/CardFooter`) + `Badge` for trend; `Skeleton` while loading |
| Dashboard charts | `Chart` (`ChartContainer` + Recharts Area/Bar/Pie), `Tabs` or `ToggleGroup` for the period switch |
| List page filter bar | `InputGroup` (search with icon), `Popover` + `Command` (faceted multi-select), `Popover` + `Calendar mode="range"` (date range), `Select`/`NativeSelect`, `Button` (reset), `ButtonGroup` |
| Server-paginated table | `Table` + the Data Table guide (TanStack Table), `Pagination` or custom pager with `Select` (page size), `Checkbox` (row select), `DropdownMenu` (row actions / column visibility), `ScrollArea` |
| Mobile list | `Item`/`ItemGroup` or `Card` per row; `Drawer` for filters on mobile |
| Status | `Badge` (with semantic variants, see §3) |
| Delivery live-limit panel | `Progress` (limit meter), `Alert` (over-limit warning), `Card` |
| Create/edit forms | `Field*` family, `Input`, `InputGroup` (₹ prefix / "MT" suffix), `Textarea`, `Select`/`NativeSelect`, `Combobox` (company/material), `RadioGroup`, `Switch`, `Checkbox`, date `Popover+Calendar`; `Spinner` in the submit `Button` |
| Mobile forms / quick add | `Drawer` (bottom sheet) on mobile, `Dialog`/`Sheet` on desktop |
| Confirmation (delete/cancel PO) | `AlertDialog` |
| Toasts | Sonner or Base UI `Toast` (see §1) |
| Empty/no results | `Empty` |
| Loading | `Skeleton` (layout), `Spinner` (inline) |
| Detail pages | `Card`, `Tabs`, `Separator`, `Item` (key/value rows), `Badge`, `DropdownMenu` (actions), `ButtonGroup` |
| Help text / hints | `Tooltip`, `HoverCard` (desktop only) |
| Reports | `Tabs`, `Chart`, `Table`, date range picker, `DropdownMenu` (export) |
| Login | `login-03` / `login-04` block (`Card` + `Field` + `Input`) |
| Wide screens | `Resizable` (optional, for a master/detail layout) |

### Gaps
- I did not fetch the current Data Table guide page, so it is unconfirmed whether it now covers server-side pagination or TanStack Table v9 specifically. The Data Table guide has historically targeted TanStack Table v8. TanStack Table v9 compatibility of shadcn's guide and of third-party data-table registries is **unverified** and should be checked.

---

## 3. Theming: tokens, Tailwind v4 `@theme inline`, OKLCH, base colours, radius, semantic tokens, dark mode, tweakcn, fonts, tabular numbers

### Takeaway
Theming is CSS variables in `:root`/`.dark` (OKLCH), exposed to Tailwind v4 with `@theme inline`. The default set has no success/warning/info tokens, so the app must add them the documented way. `--radius` drives a calculated radius scale. Chart colours are now referenced as `var(--chart-n)` (not `hsl(...)`), with per-theme overrides. tweakcn is the main free visual editor, and CLI presets/`apply` can package the result.

### Cited Findings
- Token pairs: `background/foreground`, `card/-foreground`, `popover/-foreground`, `primary/-foreground`, `secondary/-foreground`, `muted/-foreground`, `accent/-foreground`, `destructive`, `border`, `input`, `ring`, `chart-1..5`, `sidebar`, `sidebar-foreground`, `sidebar-primary/-foreground`, `sidebar-accent/-foreground`, `sidebar-border`, `sidebar-ring`, `radius`. — [shadcn Theming](https://ui.shadcn.com/docs/theming)
- `@theme inline { --color-background: var(--background); … }` exposes the tokens to Tailwind. Radius scale: `--radius-sm: calc(var(--radius) * 0.6)`, `md 0.8`, `lg = var(--radius)`, `xl 1.4`, `2xl 1.8`, `3xl 2.2`, `4xl 2.6`. — [shadcn Theming](https://ui.shadcn.com/docs/theming)
- All default tokens are OKLCH, e.g. `oklch(0.205 0 0)`. — [shadcn Theming](https://ui.shadcn.com/docs/theming)
- Base colours on init are **Neutral, Stone, Zinc, Mauve, Olive, Mist, Taupe**, set by `baseColor` in `components.json`. — [shadcn Theming](https://ui.shadcn.com/docs/theming). Note: Slate and Gray did not appear in this list. They may have been dropped or renamed; see Gaps.
- Official recipe for a custom token (their example is `warning`): define it in `:root` and `.dark`, map it in `@theme inline`, then use `bg-warning text-warning-foreground`:
  ```css
  :root { --warning: oklch(0.84 0.16 84); --warning-foreground: oklch(0.28 0.07 46); }
  .dark { --warning: oklch(0.41 0.11 46); --warning-foreground: oklch(0.99 0.02 95); }
  @theme inline { --color-warning: var(--warning); --color-warning-foreground: var(--warning-foreground); }
  ```
  — [shadcn Theming](https://ui.shadcn.com/docs/theming)
- Dark mode works by overriding tokens under `.dark`, with `tailwind.cssVariables: true` in `components.json` and a theme provider toggling the class. — [shadcn Theming](https://ui.shadcn.com/docs/theming)
- Charts: "Use `var(--chart-1)` instead of `hsl(var(--chart-1))`". `ChartConfig` accepts `theme: { light, dark }` per series. `ChartContainer` needs a `min-h-*`, `h-*` or `aspect-*` class to be responsive. — [Chart (Base)](https://ui.shadcn.com/docs/components/base/chart)
- tweakcn: a free, open-source visual theme editor for shadcn/ui. It supports Tailwind v4 export in OKLCH or HSL, colors/fonts/radius/shadows/spacing editing, a contrast checker, presets, and AI generation from a text or image prompt. — [tweakcn GitHub](https://github.com/jnsahaj/tweakcn); [tweakcn.com](https://tweakcn.com/)
- CLI v4 presets store colors, theme, icons, fonts and radius as a shareable code. `registry:font` is a first-class registry type. — [CLI v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)

### Inferences
- Recommended tokens for this app. Add `success`, `warning`, `info` (plus `-foreground`) using the documented recipe. Optionally add a `-muted`/`-subtle` tint of each for badge backgrounds, e.g. `--success-subtle` for soft badges; this is my suggestion, not a shadcn default. Map Purchase/Sale/Delivery statuses to these, never to raw Tailwind colours such as `bg-green-500`.
- Base colour: **Neutral** or **Zinc** for a clean, businesslike UI. Use one brand `primary` hue (e.g. a steel blue/teal suits "metal"). Keep `destructive` for delete/over-limit only.
- Radius: about `0.5rem`–`0.625rem`. Smaller radius and a compact style (Nova/Mira) fit data-dense screens.
- Charts: define `--chart-1..5` for both themes and always reference `var(--chart-n)` or `theme:{light,dark}`. Avoid hard-coded hex colours so dark mode works.
- Fonts (my recommendation, not from fetched sources): Geist or Inter for Latin UI text. Add **Noto Sans Devanagari / Noto Sans Gujarati** as fallbacks in the `--font-sans` stack for future Hindi/Gujarati i18n. Use Tailwind's `tabular-nums` (`font-variant-numeric: tabular-nums`) on all money and weight columns and KPI numbers so digits line up. Install fonts via Fontsource or as a `registry:font` item.
- Fix the theme once in tweakcn. Paste it into `src/styles/theme.css`, or save it as a CLI preset so future projects can reuse it via `init --preset`.

### Gaps
- It is not confirmed whether Slate/Gray were removed as base colours or just not extracted.
- I found no official shadcn guidance on semantic success/info tokens beyond the `warning` example.
- Font and tabular-number guidance is not backed by a fetched 2026 source.

---

## 4. Reusable component architecture: layering, owning ui files, variants, cn, composition, composites, community registries

### Takeaway
Use three layers: `components/ui` (shadcn primitives, mostly unmodified, upgraded via `shadcn add --diff`) → `components/common` (the app's composites) → `features/*` (screen-specific). Put styling variants in cva on composites, route all toasts/formatting through wrappers, and keep the Base UI vs Radix choice consistent across the app. Favour MIT registries (Dice UI, Kibo UI, data-table-filters) and be careful with coss/Origin UI's AGPL default.

### Cited Findings
- CLI v4 `add --diff` compares registry updates with local changes, `--dry-run` simulates, and `--view` shows the payload before writing. This is the supported upgrade path for owned `components/ui` files. — [CLI v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- The Base UI migration skill "preserve[s] custom variants and modifications while flagging behavioral differences". — [July 2026 Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- Radix uses `asChild` where Base UI uses a `render` prop. Radix `Portal > Content` becomes Base UI `Portal > Positioner > Popup`. `Overlay` becomes `Backdrop`. `data-[state=open]:` becomes `data-open:`. `onOpenChange(open)` + `event.preventDefault()` becomes `onOpenChange(open, details)` + `details.cancel()`. — [OpenReplay](https://blog.openreplay.com/shadcn-ui-radix-base-ui-switch/)
- `cn` is now a standalone package; `lib/utils.ts` re-exports it. — [Sept 2026 cn](https://ui.shadcn.com/docs/changelog/2026-09-cn)
- **satnaing/shadcn-admin**: MIT. Built on Vite, TanStack Router, TypeScript, Tailwind, **Radix** shadcn, Lucide + Tabler icons, and partial Clerk auth. It modifies `scroll-area`, `sonner` and `separator`, and has RTL-adjusted `alert-dialog`, `calendar`, `command`, `dialog`, `dropdown-menu`, `select`, `table`, `sheet`, `sidebar` and `switch`. Features: global search command, light/dark mode, 10+ pages. The README describes it as "not a starter project (template)" but a UI collection. — [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)
- **openstatus data-table-filters**: MIT, about 2.3k stars. TanStack Table, four filter types, infinite and cursor pagination, URL state via **nuqs**, and one schema driving columns, filters, row sheet, Drizzle handler and MCP tool schema. Installed via `npx shadcn@latest add @data-table-filters/data-table`. CI tests against both Radix and Base UI nightly. — [openstatusHQ/data-table-filters](https://github.com/openstatusHQ/data-table-filters)
- **Kibo UI**: MIT (now at `shadcnblocks/kibo`). Adds Gantt, Kanban, code editor, dropzone, QR code and AI primitives. — [GitHub shadcnblocks/kibo](https://github.com/shadcnblocks/kibo); [DesignRevision](https://designrevision.com/compare/shadcn-vs-kibo-ui)
- **Dice UI** (sadmann7): accessible shadcn-style components, installable through the registry. — [registry.directory Dice UI](https://www.registry.directory/sadmann7/diceui)
- **Origin UI → coss.com/ui**: now Cal.com's design system, about 508 "particles" built on **Base UI**. The repo is **AGPL-3.0 by default with MIT on two directories**. — [Untitled UI blog](https://www.untitledui.com/blog/shadcn-alternatives) (secondary, verify licence on the repo before copying)
- registry.directory is an explorer for community registries. — [registry.directory](https://registry.directory/)

### Inferences
**Folder conventions** (adapted from shadcn-admin's `src/components/ui` + `src/features/*` layout; verify the exact tree in the repo):
```
src/
  components/
    ui/            # shadcn CLI output only. kebab-case files (button.tsx). Edit sparingly.
    common/        # app composites: page-header.tsx, data-table/, filter-bar/, stat-card.tsx …
    layout/        # app-shell, app-sidebar, nav-user, top-bar (from sidebar block)
  features/
    purchases/  sales-pos/  deliveries/  companies/  materials/  dashboard/  reports/  auth/
      components/  (feature-only UI: purchase-form.tsx, purchase-columns.tsx, purchase-card.tsx)
      api/ hooks/ schemas/ (zod) types.ts
  lib/  (utils.ts→cn, format.ts [INR/lakh, tons], fy.ts [Indian FY], notify.ts [toast wrapper])
  hooks/ (use-mobile, use-debounce, use-table-url-state)
  styles/ (index.css with @import "tailwindcss", theme tokens)
```
- Naming: kebab-case file names and PascalCase exports, matching shadcn. Composites are named by domain role (`StatusBadge`, `MoneyInput`), not by look. One folder per complex composite (`data-table/data-table.tsx`, `data-table-toolbar.tsx`, `data-table-pagination.tsx`, `data-table-view-options.tsx`, `data-table-faceted-filter.tsx`), which follows the shadcn Data Table guide / shadcn-admin naming.
- **Rules for `components/ui`**:
  - Treat it as vendored.
  - Allowed edits: add variants (e.g. `Badge` `success/warning/info`, `Button` `size="xs"`) and fix a11y/RTL.
  - Record every edit in a short `components/ui/CHANGES.md` or top-of-file comment.
  - Upgrade with `shadcn add <c> --diff` and review.
  - Never put business logic or data fetching in `ui/`.
- **Variants**: use `cva` (already used by shadcn) for composites so the pattern matches the primitives. `tailwind-variants` is an alternative but adds a second system. Always merge `className` via `cn()`. Expose `data-slot` attributes (as shadcn components do) for targeted styling.
- **Composition**: accept `children`/slots (e.g. `PageHeader` with `title`, `description`, `actions` slot). Pass polymorphism through to the primitive's `render` (Base UI) or `asChild` (Radix) prop, and **pick one convention app-wide** based on the chosen primitive library.
- **Composites to build** (built from these shadcn primitives):
  - `PageHeader`: Breadcrumb + h1 + description + actions ButtonGroup.
  - `DetailHeader`: PageHeader variant with StatusBadge, key meta via Item, and an actions DropdownMenu.
  - `DataTable`:
    - TanStack Table + Table + toolbar + pagination.
    - Props: `mode="server"`, `pageCount`, `onStateChange`, `renderMobileCard`.
    - Uses `useMediaQuery` to switch to the card list below md.
    - Row actions via DropdownMenu.
    - Built-in `Empty`/`Skeleton` states.
  - `FilterBar`: search InputGroup, faceted filters (Popover + Command + Checkbox + Badge count), `DateRangePicker`, and a reset Button. On mobile, filters collapse into a Drawer. State is synced to TanStack Router search params, validated by Zod.
  - `DateRangePicker`: Popover + Calendar `mode="range"` + preset list: This FY (1 Apr–31 Mar), Last FY, This quarter (Indian FY quarters Q1 Apr–Jun), This month, Last 30 days.
  - `EntityCombobox<T>`: Base UI Combobox (or Popover + Command on Radix) with async search via TanStack Query and debounce. Used for companies and materials.
  - `MoneyInput` / `TonsInput`:
    - `react-number-format` `NumericFormat` inside InputGroup with ₹ / "MT" addons.
    - `thousandsGroupStyle="lakh"`, fixed decimals (2 for ₹, 3 for tons).
    - Store as string/decimal to avoid float errors.
    - Base UI's Number Field is an alternative, but it lacks lakh grouping out of the box (unverified).
  - `StatCard`: Card + label + tabular-nums value + delta Badge + optional sparkline Chart.
  - `StatusBadge`: a map of status → Badge semantic variant + label, for a consistent vocabulary.
  - `LimitMeter`: Progress + used/limit text + colour thresholds (success < 80% ≤ warning < 100% ≤ destructive) + Alert when exceeded.
  - `EmptyState`: Empty wrapper with icon, title, description and a primary CTA.
  - `ConfirmDialog`: AlertDialog wrapper with an imperative `confirm()` helper or props, a destructive variant, and a Spinner on pending.
  - `FormSection`: FieldSet + FieldLegend + FieldDescription + FieldGroup grid.
  - Form field wrappers (`FormTextField`, `FormSelectField`, `FormMoneyField`): wrap `Controller` + `Field` so each form line is one component.
  - `ResponsiveDialog`: Dialog on desktop, Drawer on mobile.
- **Registry choice**: the openstatus data-table-filters patterns (nuqs URL state, faceted filters) are the best reference for FilterBar/DataTable. Since the stack uses TanStack Router, adapt the URL state to router search params instead of adding nuqs. Borrow from Dice UI and Kibo UI (MIT) freely. Avoid copying coss/Origin UI AGPL code into a closed commercial app unless it comes from the MIT-licensed directories.

### Gaps
- The shadcn-admin version pins (React 19? Tailwind v4? latest commit date) and whether it has moved to Base UI were not confirmed.
- I found no authoritative 2025-2026 article on "scaling shadcn in production" within the tool budget, so the layering guidance above is inference.
- It is unverified whether Dice UI's data-table and Kibo components support Base UI and TanStack Table v9.

---

## 5. Design consistency: tokens, documentation (Storybook vs /dev page vs Ladle), lint rules, accessibility

### Takeaway
Primitives bring accessibility (keyboard, ARIA, focus) and must not be bypassed. Consistency comes from tokens, a small set of composites, and enforcement: a lint rule against raw colour utilities and a single living showcase page. I found no fetched 2026 source comparing Storybook with Ladle for shadcn projects.

### Cited Findings
- The Field + Controller pattern relies on `data-invalid` on `Field` and `aria-invalid` on the control for accessible error styling. — [shadcn React Hook Form guide](https://ui.shadcn.com/docs/forms/react-hook-form)
- Chart `accessibilityLayer` gives keyboard access and screen-reader support. — [Chart (Base)](https://ui.shadcn.com/docs/components/base/chart)
- tweakcn has a built-in contrast checker. — [tweakcn GitHub](https://github.com/jnsahaj/tweakcn)
- CLI v4 `shadcn info` reports the installed components and CSS vars, and skills give coding agents the correct component APIs. Both help AI-assisted development stay on-pattern. — [CLI v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)

### Inferences
- **Tokens**:
  - Use only semantic colour classes (`bg-primary`, `text-muted-foreground`, `bg-success`).
  - Use Tailwind's default spacing scale in fixed steps: page padding `p-4 md:p-6`, section gap `gap-4/6`, form grid `gap-4`.
  - Define a typography scale: page title `text-2xl font-semibold tracking-tight`, section `text-lg font-medium`, body `text-sm`, meta `text-xs text-muted-foreground`. Encode it in `PageHeader`/`FormSection`, not ad hoc.
- **Docs**: for a small team, a route-gated `/dev/components` page (dev builds only) listing every composite with its variants and states is cheaper than Storybook and uses the real providers (router, query, theme). Use Storybook 9/10 only if a separate designer or visual regression testing is needed. Ladle is a lighter Storybook-compatible option.
- **Lint**:
  - `eslint-plugin-tailwindcss` may lag behind Tailwind v4, so verify support. Prettier's `prettier-plugin-tailwindcss` handles class sorting.
  - Use `no-restricted-imports` to block feature code from importing Radix/Base UI directly (it must go through `components/ui`) and to block `sonner` outside `lib/notify.ts`.
  - Use a custom regex lint or grep in CI to ban raw palette classes (`bg-(red|green|…)-\d+`) outside `components/ui`.
  - Add `eslint-plugin-jsx-a11y`.
- **a11y**: keep `FieldLabel htmlFor` on every input and 44px touch targets on mobile cards and buttons, and never render icon-only buttons without `aria-label`/`sr-only` text. Add `Kbd` hints only as a supplement.

### Gaps
- No fetched source compared Storybook, Ladle and a dev page for shadcn in 2026, or covered the current Tailwind v4 status of eslint-plugin-tailwindcss.

---

## 6. Known pitfalls (2025-2026)

### Takeaway
The biggest risks are: mixing the Radix-based template with Base UI defaults; Base UI's silent behaviour changes; Calendar breakage with react-day-picker v10; old `hsl(var(--chart-n))` chart configs; and Sonner vs Base UI Toast API confusion.

### Cited Findings
- **Base UI build-breaking differences**:
  - `asChild`→`render`
  - `Content`→`Positioner > Popup`
  - `Overlay`→`Backdrop`
  - `data-[state=open]`→`data-open`
  - `onOpenChange(open, details)` with `details.cancel()`
  - Select values are `Value | null`
  - Accordion and ToggleGroup values are always arrays (`value={["a"]}`)

  — [OpenReplay](https://blog.openreplay.com/shadcn-ui-radix-base-ui-switch/)
- **Base UI silent behaviour changes**:
  - Tabs arrow keys move focus without switching panels unless `activateOnFocus` is set.
  - Menu checkbox/radio items stay open (`closeOnClick` defaults to false).
  - NavigationMenu hover delay drops from 200ms to 50ms.

  — [OpenReplay](https://blog.openreplay.com/shadcn-ui-radix-base-ui-switch/)
- **react-day-picker v10** (released 2026):
  - It is a cleanup major that removes APIs deprecated since v9.
  - The preferred package is now `@daypicker/react` (`react-day-picker` is still published).
  - Non-Gregorian calendars moved to standalone `@daypicker/*` packages.
  - Upgrading to `react-day-picker@10.0.1` breaks the shadcn Calendar build: the `classNames` type changed, causing a TS error on `table`. Older copied Calendars use deprecated v9 keys (`table`, `nav_button`, `day_selected`).
  - Fix: regenerate the Calendar or update the mappings.

  — [DayPicker v10 discussion](https://github.com/gpbl/react-day-picker/discussions/2993); [shadcn issue #10914](https://github.com/shadcn-ui/ui/issues/10914); [Upgrading to v10](https://daypicker.dev/upgrading)
- The docs' Calendar page does not state which DayPicker version it targets. The Persian calendar is loaded via `react-day-picker/persian`, which is v9-style; v10 moves this to `@daypicker/persian`. — [Calendar (Base)](https://ui.shadcn.com/docs/components/base/calendar); [DayPicker v10 discussion](https://github.com/gpbl/react-day-picker/discussions/2993)
- **Charts**: `hsl(var(--chart-1))` is no longer correct with OKLCH tokens; use `var(--chart-1)`. `ChartContainer` needs an explicit height/aspect class. Recharts v3 upgrade note: remove `layout` from `<Bar>` when `<BarChart>` sets it. — [Chart (Base)](https://ui.shadcn.com/docs/components/base/chart)
- **Toast**: Base UI Toast's API differs from Sonner, and its `<Toaster>` only takes Provider props. — [Discussion #11317](https://github.com/shadcn-ui/ui/discussions/11317)
- **Registry components import from `cn`** after Sept 2026, so projects that have not run `migrate cn` may see mismatched imports when adding new registry items. — [Sept 2026 cn](https://ui.shadcn.com/docs/changelog/2026-09-cn)
- **CI scripts expecting Radix** must pass `-b radix`, now that the default is Base UI. — [July 2026 Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)

### Inferences
- **Template/primitive mismatch**: running `shadcn add` in a shadcn-admin (Radix) project whose `components.json` does not pin Radix could pull Base UI variants. Check `components.json` and use `--dry-run`/`--diff` before every add.
- **Pin versions**: `react-day-picker` (stay on v9 until you regenerate Calendar for v10), `recharts@3`, and the `@base-ui/react` or `radix-ui` versions.
- **Tailwind v4 migration issues** (from general knowledge, not fetched this session):
  - There is no `tailwind.config.js` by default; the config is CSS-first (`@theme`).
  - `tailwindcss-animate` was replaced by `tw-animate-css` in shadcn's v4 setup.
  - Default border colour changed to `currentColor`, which shadcn's base layer handles.
  - Arbitrary `hsl(var())` references break with OKLCH.
- **Numbers**: never format currency with float math. Keep `MoneyInput` values as strings/decimals and format with `Intl.NumberFormat('en-IN')` for lakh/crore grouping.

### Gaps
- It is not confirmed whether the current shadcn Calendar source has been updated to DayPicker v10. The issue exists, but I did not verify its resolution.
- TanStack Table v9 breaking changes and their effect on shadcn's Data Table guide were not researched within the budget. This is a high-priority check, since the project stack specifies Table v9.
- React 19 specific pitfalls (e.g. `forwardRef` removal in shadcn components, which happened in 2025) were not re-verified this session.
