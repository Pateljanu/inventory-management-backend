# Framework and App Architecture for the Metal Scrap Management System Frontend (React + TypeScript, 2026)

Research date: 2026-09-27. Scope: an internal, login-only SPA that calls an existing Express 5 REST API at /api/v1 (15-min JWT access token, rotating opaque refresh token returned in JSON, `{ success, data, meta }` envelope, paginated lists, decimal strings). No SEO. Users are on desktop, tablets and phones in the yard, sometimes on weak mobile data.

## 1. Application framework: Vite SPA vs Next.js 16 vs React Router v7/v8 vs TanStack Start/Router

### Takeaway
For a login-only dashboard that talks to an external REST API, a **plain Vite (v8) + React 19 SPA with a client-side router** is the simplest fit. It deploys as static files, needs no Node server, builds fast (Rolldown), and can use the React Compiler. Next.js 16 and TanStack Start mostly add server features (SSR, server functions, RSC) that this app does not need. Next.js static export also has limits that clash with an ERP-style app, such as dynamic routes like `/purchases/:id`. React Router v8 in library or SPA mode is a safe, conservative alternative to TanStack Router.

### Cited Findings
**Vite**
- Vite 8 shipped stable on **12 March 2026**. It uses **Rolldown**, a Rust bundler that replaces both esbuild and Rollup. — [Vite blog: Vite 8.0 is out](https://vite.dev/blog/announcing-vite8); secondary summary [Certificates.dev migration guide](https://certificates.dev/blog/migrating-to-vite-8-rolldown)
- The Vite 8 beta with Rolldown shipped in December 2025. Rolldown 1.0 stable was reported on **7 May 2026** (secondary source only, not verified on rolldown.rs). — [Vite 8 beta post](https://vite.dev/blog/announcing-vite8-beta); [buildmvpfast](https://www.buildmvpfast.com/blog/rolldown-vite-8-rust-bundler-2026)
- One community write-up says Rolldown makes production *builds* much faster (headline "13x") but does not speed up the dev server. Treat this as anecdotal. — [DEV Community](https://dev.to/curioustore_48788631d0e2e/vite-8s-rolldown-makes-builds-13x-faster-not-the-dev-server-2l3a)
- State of React 2025 (published 13 Feb 2026): Vite leads build tools at **92% usage**. `create-vite` is growing as the replacement for Create React App, which was sunset in **February 2025**. **84%** of respondents build SPAs (SSR 61%, SSG 44%). **48%** use React 19 daily and 41% use React 18. — [Certificates.dev breakdown of State of React 2025](https://certificates.dev/blog/breaking-down-state-of-react-2025-results)

**React Compiler**
- React Compiler **1.0** went stable on **7 October 2025**. It works on React and React Native, ships as a Babel plugin, and its lint rules are in `eslint-plugin-react-hooks` (recommended / recommended-latest presets). React worked with Vite, Expo and Next.js so that new apps can start with the compiler enabled, and Vite has compiler-enabled starters. — [React blog: React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- 62% of State of React 2025 respondents said they were excited about adopting the React Compiler. — [Certificates.dev](https://certificates.dev/blog/breaking-down-state-of-react-2025-results)

**Next.js 16**
- Next.js 16 made Turbopack stable and the default for `next dev` and `next build`. It also added Cache Components, React 19.2 features, and **stable React Compiler support that is not on by default** ("as we continue gathering build performance data"). The claimed gains are 2–5x faster builds and up to 5–10x faster Fast Refresh. — [Next.js 16 blog](https://nextjs.org/blog/next-16); [Next.js 16.3 Turbopack post](https://nextjs.org/blog/next-16-3-turbopack)
- Next.js can run as an SPA through `output: 'export'`, which produces static HTML per route. The docs list these as **unsupported** under static export (docs version 16.3.6, updated 2026-08-25): dynamic routes with `dynamicParams: true`; **dynamic routes without `generateStaticParams()`**; Route Handlers that rely on Request; cookies; rewrites; redirects; headers; Proxy (middleware); ISR; default image optimisation; Draft Mode; **Server Actions**; intercepting routes. — [Next.js docs: Static Exports](https://nextjs.org/docs/app/guides/static-exports)
- The Next.js docs suggest fetching client-side data in a static export with SWR or React Query from Client Components. — [Next.js docs: Static Exports](https://nextjs.org/docs/app/guides/static-exports); [Next.js SPA guide](https://nextjs.org/docs/app/guides/single-page-applications)
- Community view: if you do not need a server, use Vite and a static host (Cloudflare Pages, GitHub Pages). — [DEV: You might not need Next.js](https://dev.to/paripsky/you-might-not-need-nextjs-4ejg). State of React 2025 respondents named "lock-in fears and complexity" as Next.js criticisms. — [Certificates.dev](https://certificates.dev/blog/breaking-down-state-of-react-2025-results)

**React Router**
- **React Router v8 was released on 17 June 2026.** It is ESM-only and requires **Node 22.22.0+, React 19.2.7+ and Vite 7+**. The `react-router-dom` package is removed (install `react-router`). Middleware is on by default. Every breaking change could already be adopted in v7 through future flags. The project now makes a **yearly major release** each June (v9 expected June 2027). v7 still gets security updates, and **v6 and Remix v2 are End of Life**. It keeps three modes: declarative/library (client routing only), Data Mode, and Framework Mode (Vite plugin, SSR or `ssr:false` SPA mode). — [Remix blog: React Router v8](https://remix.run/blog/react-router-v8); [InfoQ, Aug 2026](https://www.infoq.com/news/2026/08/react-route-v8/)
- React Router v8.2.0 was reported as released on 8 July 2026 (secondary source; check on npm). — [Stackmaven](https://stackmaven.io/news/react-router-8-ga/)
- Most of React Router v7's type-safety features (typegen) only work in framework mode. A plain library-mode SPA gets weaker typing. — [PkgPulse](https://www.pkgpulse.com/blog/tanstack-router-vs-react-router-v7-2026); [ekino Medium](https://medium.com/ekino-france/tanstack-router-vs-react-router-v7-32dddc4fcd58)
- Real-world example: an open-source team opened an issue to migrate from React Router v7 Framework Mode to TanStack Router "for true client-side SPA". — [DiamondLightSource/smartem-devtools #101](https://github.com/DiamondLightSource/smartem-devtools/issues/101)

**TanStack Start / Router**
- TanStack Start reached **v1.0 Release Candidate on 22–23 Sep 2025**. It is built on TanStack Router and Vite and offers SSR, streaming, server functions and an SPA mode, which prerenders a shell at build time. — [TanStack blog: Start v1 RC](https://tanstack.com/blog/announcing-tanstack-start-v1); [InfoQ Nov 2025](https://www.infoq.com/news/2025/11/tanstack-start-v1/); [Start SPA mode docs](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode)
- TanStack's 2026 blog shows commercial momentum (Vercel became a Gold partner with TanStack Start integrations on 8 Sep 2026; Render partnership on 1 Sep 2026), but the listing did not show a "Start 1.0 stable" post. — [TanStack blog index](https://tanstack.com/blog)
- A community report says SPA mode still server-rendered even with prerendering disabled, a sign of early rough edges. — [AnswerOverflow thread](https://www.answeroverflow.com/m/1435298135986409562)

**Expert and community sentiment (treat as opinion)**
- "Use TanStack Router for client-heavy SPAs and dashboards, use React Router v7 (framework mode) when you want SSR and data mutations baked in." "React Router v7 is the safer default for most React teams in 2026." — [PkgPulse guide](https://www.pkgpulse.com/guides/react-router-v7-vs-tanstack-router-2026); [devtoolbox.blog](https://devtoolbox.blog/tanstack-router-vs-react-router-v7-2026/)
- 2026 comparisons of full-stack options (React Router v7 vs TanStack Start vs Next.js) position all three as server-capable meta-frameworks. — [Kanopy Labs](https://kanopylabs.com/blog/react-router-v7-vs-tanstack-start-vs-nextjs)

### Inferences
- **Recommended stack: Vite 8 + React 19.2 + TypeScript strict + TanStack Router (code-based or file-based routes) + TanStack Query v5.** Deploy the `dist/` folder to any static host or CDN (Nginx, Cloudflare Pages, S3+CloudFront, Netlify) with an SPA fallback to `index.html`. Nothing needs a Node runtime, which keeps operations simple for a small team.
- Next.js adds a server mental model (RSC, "use client" boundaries, caching semantics) that brings no benefit here. Its static-export limits, especially no dynamic routes without `generateStaticParams`, are a real problem for record-detail pages like `/sales/:id`. You would end up using query-string IDs or running a Node server.
- The React Compiler can be turned on with the Vite React plugin + Babel plugin. It is optional; start with it on, since the lint rules help new developers anyway.
- TanStack Start in SPA mode would work, but it adds a framework layer (server functions, prerender step) that is not needed, and its stable release timing is less clear than Vite + Router. Only reconsider it if you later want a BFF (see token storage in section 3).

### Gaps
- I did not confirm whether TanStack Start has shipped a final "1.0" (non-RC) tag. The blog listing showed no such post. Check on npm or GitHub releases.
- Exact current patch versions (Vite 8.x, React 19.2.x, Next 16.x) were not checked on npm. The docs page reports Next.js 16.3.6.
- No official Vite benchmark numbers for Rolldown build speed were fetched. The "13x" figure comes from a blog.

## 2. Routing: TanStack Router vs React Router, and URL state for filters

### Takeaway
TanStack Router is the stronger fit for a filter- and pagination-heavy CRUD dashboard. Search params are validated with a schema (Zod/Valibot), fully typed, and treated as first-class state, with built-in middlewares to strip defaults and keep params across navigation. React Router v8 works too, but keeping `from/to/company/page` in the URL then needs manual `useSearchParams` parsing, or framework mode for stronger types.

### Cited Findings
- TanStack Router parses search strings into JSON, keeping arrays and nested objects. Each route validates them with `validateSearch` using Zod (v4) or any Standard Schema library (Valibot, ArkType, Effect Schema). They are read with a typed `Route.useSearch()` and updated through updater functions, e.g. `navigate({ search: prev => ({ ...prev, page: 1 }) })` or `<Link search={prev => ({...prev, page: prev.page + 1})}>`. — [TanStack Router docs: Search Params](https://tanstack.com/router/latest/docs/guide/search-params)
- Search middlewares: `retainSearchParams([...])` keeps params across navigation, and `stripSearchParams(defaults)` removes params that equal their defaults (keeps URLs clean, e.g. `page=1`). — [TanStack Router docs: Search Params](https://tanstack.com/router/latest/docs/guide/search-params)
- "TanStack Router wins on type safety — search params, path params, and loader data are all fully typed with zero configuration." It is the better choice when a team is TypeScript-first and wants typed search params and data dependencies alongside TanStack Query. — [PkgPulse](https://www.pkgpulse.com/guides/react-router-v7-vs-tanstack-router-2026)
- Upgrading React Router v6 to v7 library mode is described as "a one-day job" with the codemod. Moving to framework mode takes "a week or more". — [devtoolbox.blog](https://devtoolbox.blog/tanstack-router-vs-react-router-v7-2026/)
- TkDodo (TanStack Query maintainer) recommends a pattern: the router loader pre-fills the React Query cache with `ensureQueryData`, and the component still uses `useQuery`, so "the router is responsible for fetching data early and React Query is responsible for caching and keeping the data fresh". — [TkDodo: React Query meets React Router](https://tkdodo.eu/blog/react-query-meets-react-router)
- TanStack published a deep dive (14 Aug 2026) on how the router coordinates matching, loaders, pending UI, redirects and caching. — [TanStack blog index](https://tanstack.com/blog)

### Inferences
- Suggested pattern for list pages, e.g. `/purchases`: define `searchSchema = z.object({ from: z.string().date().optional(), to: ..., companyId: z.string().optional(), page: z.number().int().min(1).default(1), limit: z.number().default(25) })`, then `validateSearch: searchSchema` and `search.middlewares: [stripSearchParams({ page: 1, limit: 25 })]`. The TanStack Query key becomes `['purchases', 'list', search]`, and `loaderDeps: ({search}) => search` plus `ensureQueryData` in the loader prefetches data. Reset `page` to 1 whenever a filter changes.
- URL-held filters give users shareable and bookmarkable links ("send me the link to this month's purchases from company X"), and the back button works on phones. This helps non-technical users.
- Put auth guards in a `beforeLoad` on an `_authenticated` layout route, which redirects to `/login?redirect=...`.

### Gaps
- No primary TanStack Router doc page was fetched for `beforeLoad` auth guards or `loaderDeps`. These come from general knowledge of the API and should be checked against the current docs.
- React Router v8's own search-param typing story (typegen in framework mode) was not examined in depth.

## 3. Server state and auth: TanStack Query v5 vs SWR vs RTK Query; 15-min access token plus rotating refresh token

### Takeaway
TanStack Query v5 is the clear default for REST server state in 2026, with the best community sentiment and the best fit with TanStack Router and OpenAPI codegen. For auth, use one HTTP client wrapper (axios or ky/fetch) with a **single-flight refresh lock**. That means one shared in-flight refresh promise, which all 401s and any proactive timer wait on. This lock is required because the refresh token rotates and reuse fails. Keep the access token in memory. The refresh token is the hard part: the API returns it in JSON today, so safe storage means either (a) a backend change to an HttpOnly Secure SameSite cookie (preferred), or (b) accepting localStorage with its XSS risk.

### Cited Findings
**Data fetching library choice**
- State of React 2025: "TanStack Query continues to lead in data fetching with strong positive sentiment". Axios is the top HTTP client, followed by TanStack Query and SWR. "Caching issues (24%)" is the top data-loading pain point. — [Certificates.dev](https://certificates.dev/blog/breaking-down-state-of-react-2025-results)
- Refine v5 (an admin framework) is itself built on TanStack Query v5, which shows it has become the ecosystem default. — [Refine v5 announcement](https://refine.dev/blog/refine-v5-announcement/)
- TkDodo describes React Query as an "async state manager" that can manage any Promise-based state. — [TkDodo: React Query as a State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager)

**Refresh race conditions with rotating refresh tokens**
- With rotation, "if two requests try to use the same refresh token simultaneously, only one can succeed; the second will receive an error because the token was already rotated". Without coordination, a dashboard that fires several requests at once gets several 401s and several refresh calls, and users are "logged out randomly". — [DEV: The JWT Refresh Race Condition Nobody Talks About](https://dev.to/devil_21cf096c1059553286d/the-jwt-refresh-race-condition-nobody-talks-about-and-how-i-fixed-it-pid); [SpiritCode.blog](https://spiritcode.blog/jwt-refresh-token-race-conditions-how-i-finally-fixed-it/)
- Recommended fix: **a single in-flight refresh Promise plus a queue of failed requests**. The first 401 triggers the refresh, later 401s wait on the same promise, and all queued requests are replayed with the new token. — [CyberAngles](https://www.cyberangles.org/blog/axios-interceptor-refresh-token-for-multiple-requests/); [Medium: Repeating failed requests after token refresh](https://medium.com/@sina.alizadeh120/repeating-failed-requests-after-token-refresh-in-axios-interceptors-for-react-js-apps-50feb54ddcbc)
- Axios itself has an open issue noting "no built-in coordination between proactive token refresh timers and reactive 401 interceptors". Both paths must share one lock or they race with the same rotating token. — [axios/axios #10701](https://github.com/axios/axios/issues/10701)
- Library option: an axios-auth-refresh-style interceptor queues requests, calls refresh once, and retries. — [Eden1711/axios-auth-refresh](https://github.com/Eden1711/axios-auth-refresh)

**Token storage**
- Current best practice as stated by security write-ups: short-lived **access token in JavaScript memory only**, **refresh token in an HttpOnly + Secure + SameSite cookie** set by the API on `/auth/login` and `/auth/refresh` and scoped by Path (e.g. `/api/v1/auth`). Add refresh-token rotation with reuse detection, plus CSRF protection for endpoints that use the cookie. — [Safeguard.sh: Secure Token Storage for SPAs](https://safeguard.sh/resources/blog/single-page-application-token-storage-security)
- "localStorage (and sessionStorage, and any cookie without the HttpOnly flag) is fully readable by JavaScript, and XSS is JavaScript execution in your origin". The OWASP community guidance is not to store session identifiers in local storage. — [Safeguard.sh](https://safeguard.sh/resources/blog/single-page-application-token-storage-security); background [DEV: LocalStorage vs Cookies](https://dev.to/cotter/localstorage-vs-cookies-all-you-need-to-know-about-storing-jwt-tokens-securely-in-the-front-end-15id)
- A real-world audit issue flags "Refresh + access tokens persisted in localStorage" as a security finding. — [GitHub issue example](https://github.com/dmitry-malykhin/handmade-jewelry-store/issues/556)

### Inferences
- **Implementation sketch (framework-agnostic):**
  - `authStore` (a plain module or tiny store) holds `accessToken` in memory, plus `refreshPromise: Promise | null`.
  - `refreshOnce()`: if `refreshPromise` exists, return it. Otherwise set it to `POST /auth/refresh` → save the new pair → `finally` clear it. Every 401 handler and any proactive "refresh ~60 s before `exp`" timer must call `refreshOnce()`, never the endpoint directly.
  - The response interceptor, on 401 with `error.code === 'TOKEN_EXPIRED'` (or similar) and `!config._retry`, calls `await refreshOnce()`, sets `_retry`, and retries. If the refresh fails, clear the session, run `queryClient.clear()`, and redirect to `/login`.
  - **Multi-tab**: two tabs sharing a localStorage refresh token will race across tabs, and an in-memory lock does not cover other tabs. Use `navigator.locks.request('auth-refresh', ...)` or a BroadcastChannel so only one tab refreshes and the others take the new tokens. The HttpOnly cookie design does not remove this race either (both tabs send the same cookie), so the backend should allow a short grace window or the client should use a cross-tab lock.
  - Unwrap the envelope in the client layer: return `data` (+ `meta` for lists) and throw a typed `ApiError { code, message, details, requestId }` so TanStack Query's `error` is typed and UI toasts can show `requestId` for support.
- **Storage decision for this backend (it returns tokens in JSON today):**
  - *Best*: change the backend to set the refresh token as an `HttpOnly; Secure; SameSite=Strict/Lax; Path=/api/v1/auth` cookie and return only the access token in JSON. Add `credentials: 'include'` on the refresh call, keep the CORS allow-list with `Access-Control-Allow-Credentials: true`, and add CSRF protection (SameSite plus an Origin check is usually enough for a same-site deployment). This works best if the frontend and API share a registrable domain (e.g. `app.example.in` and `api.example.in`). Otherwise third-party-cookie blocking can break it.
  - *Acceptable interim*: access token in memory, refresh token in localStorage, with a strict CSP, no `dangerouslySetInnerHTML`, careful dependency hygiene, and backend reuse detection. It is simpler but open to XSS theft.
- **Axios vs ky vs fetch**: axios has the most tutorials for the interceptor pattern and top usage (State of React). ky (fetch-based) has `beforeRequest` / `afterResponse` hooks that also work. Either works if the single-flight lock lives in your own code, not in a library.
- **SWR** is lighter but has weaker mutation and invalidation tooling. **RTK Query** only makes sense if the team already uses Redux. Neither appears to beat TanStack Query for this app (weak evidence, see Gaps).

### Gaps
- I did not fetch a primary source comparing SWR vs RTK Query vs TanStack Query features in 2026, so the SWR/RTK statements above are inference.
- I did not confirm the current TanStack Query patch version or whether a v6 is planned. The TanStack blog listing showed no Query v6 announcement in 2025–2026.
- No TkDodo post specifically about auth or token refresh was found in this session.
- No primary OWASP cheat-sheet page was fetched. The OWASP stance is quoted via the Safeguard.sh write-up.

## 4. API typing: OpenAPI generation vs shared Zod schemas

### Takeaway
If the Express backend can produce an OpenAPI 3.x spec (hand-written, or generated from existing Zod/Joi validators), then **openapi-typescript + openapi-fetch (+ openapi-react-query)** is the lowest-effort, lowest-lock-in route: types only, about 1 kB runtime. **Hey API** or **Orval** can also generate TanStack Query options, hooks and even mocks. Without a spec, a shared `packages/contracts` of Zod schemas (same repo or npm package) is the alternative. It fits better if the backend already validates with Zod.

### Cited Findings
- **Hey API** (`@hey-api/openapi-ts`) is called "the current frontrunner", the spiritual successor to openapi-typescript-codegen, with plugins for SDKs, **TanStack Query** (generates query/mutation options and query keys), and **Zod**. — [DEV: Which OpenAPI codegen should you choose?](https://dev.to/nyaomaru/which-openapi-codegen-should-you-choose-openapi-typescript-vs-hey-api-vs-orval-vs-kubb-100p); [Hey API TanStack Query plugin docs](https://heyapi.dev/openapi-ts/plugins/tanstack-query); [hey-api GitHub](https://github.com/hey-api/hey-api)
- **Orval** generates custom hooks by default (e.g. `useListPets()`), supports React Query, SWR and others, and has built-in **mock generation** (MSW) as its differentiator. — [Orval](https://orval.dev/); [Sascha Becker: Typesafe API Codegen 2026](https://www.saschb2b.com/blog/typesafe-api-codegen-2026)
- **openapi-typescript** produces TypeScript types only. `openapi-fetch` is a typed fetch client, and `openapi-react-query` is "a type-safe tiny wrapper (1 kb) around @tanstack/react-query". — [openapi-react-query docs](https://openapi-ts.dev/openapi-react-query/)
- "If your goal is mainly API clients and types, openapi-typescript or hey-api may be enough; if your goal is to generate a broader frontend ecosystem from OpenAPI, Orval or Kubb becomes more interesting." — [DEV: nyaomaru](https://dev.to/nyaomaru/which-openapi-codegen-should-you-choose-openapi-typescript-vs-hey-api-vs-orval-vs-kubb-100p)

### Inferences
- **Effort**: the main cost is producing and maintaining the OpenAPI spec for the existing Express 5 API. If the backend already has Zod request schemas, a tool such as zod-to-openapi can build the spec from them. Otherwise a hand-written YAML file for about 30–60 endpoints is a few days of work. After that, running `npx openapi-typescript spec.yaml -o src/api/schema.d.ts` in CI is nearly free.
- **Decimal strings**: keep decimals as `string` in generated types and never parse them into JS `number` for money or weight maths. Format for display with `Intl.NumberFormat.format(string)` (see section 8). If you need arithmetic on the client (live totals in forms), use a decimal library (e.g. decimal.js / big.js).
- Model the envelope once as a generic, e.g. `ApiSuccess<T> = { success: true; data: T; meta?: PageMeta }`, and unwrap it in the fetch layer so hooks return `T`.

### Gaps
- I did not check whether the backend already has an OpenAPI spec or Zod validators (outside this web research). That decides which option costs least.
- No benchmark or maturity data (release dates, versions) was fetched for Hey API, Orval or Kubb.

## 5. Admin frameworks: Refine, React-Admin, low-code (Retool / Appsmith)

### Takeaway
Refine v5 (headless, TanStack Query v5 under the hood, shadcn/ui registry, AntD/MUI/Mantine/Chakra integrations) can speed up plain list/create/edit/show pages. But this app's core value is custom business logic: stock rules, weighbridge, purchases and sales, decimal maths, envelope and pagination. A thin in-house layer (TanStack Router + Query + a shared DataTable/Form kit) is about as fast to build after week 1, and avoids a second abstraction to learn and a custom data provider to maintain. React-Admin v5 is mature, but its best features (e.g. editable datagrid, RBAC, audit log) sit behind a paid Enterprise Edition. Low-code tools (Retool, Appsmith) are the wrong fit for a customer-facing, branded, mobile-first app for non-technical users.

### Cited Findings
**Refine**
- **Refine v5 released on 18 Sep 2025**: React 19 support (React 18 still works), **TanStack Query v5** integration, restructured hook return shape (`result: { data }, query: { isLoading, isError }`), removal of deprecated APIs, and codemod `npx @refinedev/codemod@latest refine4-to-refine5`. UI packages: `@refinedev/antd` v6, `@refinedev/mui` v7, `@refinedev/mantine` v3, `@refinedev/chakra-ui` v3. — [Refine v5 announcement](https://refine.dev/blog/refine-v5-announcement/)
- Refine v5 offers **shadcn/ui** integration through a registry. Components are copied into your source (not an npm dependency) and work with Refine's data hooks, auth, routing and forms. — [Refine docs: shadcn/ui introduction](https://refine.dev/core/docs/ui-integrations/shadcn/introduction/); [Refine shadcn Edit](https://refine.dev/core/docs/ui-integrations/shadcn/components/basic-views/edit/); [Refine blog: CRUD app with shadcn](https://refine.dev/blog/shadcn-ui/)
- Refine is described as "headless", so it works with any design system. — [Refine headless example](https://refine.dev/core/docs/examples/authentication/headless/); [package list](https://refine.dev/core/docs/packages/list-of-packages/)

**React-Admin Enterprise Edition (Marmelab) pricing (fetched 2026-09-27)**
- **Team**: €145/month billed annually, up to 2 developers. **Business**: €290/month billed annually, up to 10 developers. **Corporate**: from €590/month billed annually, unlimited developers, optional phone support. Every plan includes all private modules on unlimited projects, unlimited support requests, and a 50% discount on professional services. — [React-Admin Enterprise](https://react-admin-ee.marmelab.com/)
- License terms: one-month minimum, cancel any time, and you "continue using the code you already developed with the private modules for as long as you like". Client projects are allowed, but not competing derivative products. Modules come from a private npm registry. — [React-Admin Enterprise](https://react-admin-ee.marmelab.com/)
- A Lemon Squeezy store listing shows price ranges (Team €170–€1,750; Business €340–€3,500), probably monthly vs annual totals, which differs from the page above. Treat the marmelab page as authoritative. — [react-admin.lemonsqueezy.com](https://react-admin.lemonsqueezy.com/)
- Professional services were quoted at €1,650/day (€825/day with the EE discount) in a **2023** Marmelab post, so this may be outdated. — [Marmelab: Anatomy of a profitable open-source project (Nov 2023)](https://marmelab.com/blog/2023/11/13/open-source-profit-2.html)

### Inferences
- **Speed vs lock-in**: Refine's simple-rest data provider expects particular pagination and filter conventions (e.g. `_start/_end`, `x-total-count`). This API uses a `{ data, meta }` envelope with its own pagination, so a **custom data provider** is required anyway, roughly 150–300 lines. After that, every list, filter and form still needs custom UI for scrap-specific flows. For a small team, learning Refine's concepts (resources, data providers, `useTable`/`useForm` wrappers, access control provider) as well as TanStack Query is extra cognitive load. The time saved is mostly generic CRUD scaffolding, which a shared `<DataTable>` + `useListQuery` hook also gives.
- **When Refine would pay off**: dozens of near-identical master-data CRUD screens (materials, companies, vehicles, users) and a team happy to follow its conventions. Its shadcn registry reduces UI lock-in because components live in your repo.
- **React-Admin** has an MUI look and conventions that are harder to make "simple and touch-friendly" for yard staff. The paid EE is affordable (about €1.7k/yr for 2 devs) but not needed.
- **Retool / Appsmith** (low-code): good for back-office tools used by technical staff, but they bring per-user pricing or hosting, weak offline and mobile UX, and limited branding. Not suitable as the main product UI.

### Gaps
- I did not verify Refine's license (believed MIT for core) or React-Admin core's license (believed MIT). Neither was fetched in this session.
- I did not confirm React-Admin's current major version (believed v5) or its 2026 release notes.
- No Retool or Appsmith pricing or features were researched (contrast only).
- No independent survey data on Refine or React-Admin adoption or satisfaction was found.

## 6. Client state: is Zustand/Jotai needed?

### Takeaway
Probably not at the start. TanStack Query covers server state, the router's typed search params cover filters and pagination, and React Hook Form (or TanStack Form) covers form state. What is left (access token, current user, UI prefs like sidebar collapsed or locale) fits in a small module store or React context. Add Zustand (about 1 kB) only if cross-cutting client state grows, e.g. a multi-step weighbridge wizard or an offline draft queue.

### Cited Findings
- State of React 2025: **34% of respondents use no state management library**. Redux Toolkit, Zustand and Jotai are the main options. Top pain points are "excessive complexity (20%)" and "boilerplate (15%)". — [Certificates.dev](https://certificates.dev/blog/breaking-down-state-of-react-2025-results)
- TkDodo: React Query is an async state manager, so server data should not be copied into a client store. He also advises against using React Context as a general state manager. — [TkDodo: React Query as a State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager); [TkDodo: React Query and React Context](https://tkdodo.eu/blog/react-query-and-react-context)
- Forms: React Hook Form has **74%** usage and TanStack Form **21%** (up 8 positions) in State of React 2025. TanStack Form v2 alpha was announced on 6 Aug 2026. — [Certificates.dev](https://certificates.dev/blog/breaking-down-state-of-react-2025-results); [TanStack blog index](https://tanstack.com/blog)
- A 2025 overview argues most apps need far less client state once server cache and URL state are separated. — [Developer Way: React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025)

### Inferences
- Suggested split: **server state** in TanStack Query; **URL state** (filters, page, selected tab, open record id) in TanStack Router search params; **form state** in React Hook Form + Zod resolver (the most common, stable choice; TanStack Form v2 is still alpha); **session/UI state** in a tiny store or `useSyncExternalStore` module. Use Zustand only if that module grows.

### Gaps
- No primary data on Zustand vs Jotai usage percentages was captured (the breakdown article gave qualitative mentions only).

## 7. PWA and offline for yard use

### Takeaway
An **installable PWA with an app-shell cache plus offline *read* caching** is worth doing and cheap with `vite-plugin-pwa`. It gives a home-screen icon, fast start on weak networks, and "last known" lists. **Offline writes** (queued purchases or sales) are risky with stock rules and rotating auth, and should be excluded from v1. At most, save *drafts* locally and require an online submit that the server validates.

### Cited Findings
- `vite-plugin-pwa` (latest as of 5 May 2026) supports **Vite 3.1.0 through 8.0.0** and uses **workbox-build 7.4.1**. It is still a 0.x version (no 1.x found). — [npm: vite-plugin-pwa](https://www.npmjs.com/package/vite-plugin-pwa); [GitHub](https://github.com/vite-pwa/vite-plugin-pwa); [Guide](https://vite-pwa-org.netlify.app/guide/)
- The Vite PWA team is preparing a Workbox fork that cuts dependencies from 340+ to about 20, with a new build strategy based on Vite 8 / Rolldown 1. Users below Vite 8 will need `rolldown` as a direct dependency. — [vite-plugin-pwa issue #933](https://github.com/vite-pwa/vite-plugin-pwa/issues/933)
- TanStack Query supports offline mutations: mutations pause when offline, can be persisted with `persistQueryClient`, and resume with `queryClient.resumePausedMutations()`. But **only mutation state is persisted (functions can't be serialized)**, so `queryClient.setMutationDefaults()` must supply the `mutationFn`, or you get "No mutationFn found" after a reload. `networkMode: 'offlineFirst'` is available for queries and mutations. — [TanStack Query docs: Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations); [Discussion #7355](https://github.com/TanStack/query/discussions/7355); [Discussion #9585 (PWA offline)](https://github.com/TanStack/query/discussions/9585); [Offline example](https://tanstack.com/query/v4/docs/framework/react/examples/offline)
- Known bugs where paused mutations did not resume (v4.24–4.32) show the offline-write path is fragile. — [TanStack/query #5847](https://github.com/TanStack/query/issues/5847); [#4170](https://github.com/TanStack/query/issues/4170)

### Inferences
- **v1 PWA scope**: `registerType: 'prompt'` (show a "New version available – Reload" toast), precache the app shell, `NetworkFirst` or `StaleWhileRevalidate` for a few GET list endpoints if you want them offline, and **never cache auth endpoints**. Persist the TanStack Query cache to IndexedDB (`@tanstack/query-async-storage-persister`) with a short `maxAge` (e.g. 24 h), and clear it on logout, because it may contain business data on shared tablets.
- **Why avoid offline writes**: stock checks (can't sell more than on hand), price and rate changes, and document numbering all need server authority. Replaying queued mutations hours later can break invariants. With a rotating refresh token, a replay after the refresh token has expired also fails. If needed later, add an idempotency key (client UUID) on create endpoints and a visible "Pending sync" queue with explicit user confirmation.
- Weak-connectivity UX matters more than full offline: keep `retry` modest, show clear online/offline banners (TanStack Query's `onlineManager`), keep previous data while refetching (`placeholderData: keepPreviousData` for pagination), and keep bundles small with route-level code splitting.

### Gaps
- iOS/Safari PWA install and storage-eviction limits in 2026 were not researched.
- No field data was found on PWA use in Indian SMB or yard contexts.

## 8. Internationalisation (English + Hindi/Gujarati) and Indian formatting

### Takeaway
Plan for i18n from day one even if you launch in English only. Wrapping strings early is cheap, and retrofitting is expensive. **react-i18next** is the safe, widely known default with the most community help. **Lingui** is smaller and compile-time (about 2 kB core) and lets you write the source text inline, which is nice for a small team. Either works. Use the built-in `Intl` APIs with `en-IN` / `hi-IN` / `gu-IN` for lakh/crore grouping, ₹ currency and dates. No extra library is needed.

### Cited Findings
- Architecture difference: with i18next "you invent a key for each string, put the text in a JSON file and look the key up at runtime"; with Lingui "you write the text where it is displayed, the IDs are generated from it and the catalogs are compiled at build time". — [Lingui docs: Lingui vs i18next](https://lingui.dev/misc/i18next)
- Bundle size: `@lingui/core` about **2.0 kB gzip**, zero dependencies, vs `i18next` about **13.8 kB gzip** (reported as measured with bundlejs, Sept 2026, @lingui/core 6.6 and i18next 26.4; versions not independently verified). Another source says react-i18next + i18next is about 8 kB core and 15–20 kB with plugins, vs Lingui about 3 kB. The sources disagree on exact figures. — [devpick](https://devpick.co/i18next-vs-lingui-core); [PkgPulse](https://www.pkgpulse.com/guides/next-intl-vs-react-i18next-vs-lingui-react-i18n-2026); [Tolgee comparison](https://tolgee.io/blog/react-i18n-libraries-comparison)
- Guidance: react-i18next is "best for large existing teams since community knowledge and plugin ecosystem are unmatched". LinguiJS is "best for performance purists with compile-time guarantees and minimal bundles". — [PkgPulse](https://www.pkgpulse.com/guides/next-intl-vs-react-i18next-vs-lingui-react-i18n-2026); [auto18n](https://www.auto18n.com/en/blog/react-i18n-2026)
- **Verified locally (Node v22.18.0, ICU)**:
  - `new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(12345678.5)` gives `₹1,23,45,678.50`.
  - `en-IN`, `hi-IN` and `gu-IN` all group 1234567 as `12,34,567`.
  - `{notation:'compact'}` in `en-IN` gives `1.2Cr`.
  - Dates: `en-IN` medium gives `27 Sept 2026`, and `hi-IN` long gives `27 सितंबर 2026`.
  - **Decimal-string precision**: `Intl.NumberFormat.format('12345678901234567.125')` (string input) keeps every digit: `12,34,56,78,90,12,34,567.125`. The same value passed through `Number()` loses precision (`...568.000`).
  - (Local experiment in this session; no URL. Behaviour matches ECMA-402 Intl.NumberFormat v3 string-input support.)

### Inferences
- Pass the API's decimal strings **directly** to `Intl.NumberFormat.format()` for display. Never `parseFloat` money or weights. Create formatters once (memoised per locale), e.g. `formatINR`, `formatKg`, `formatDate` with `timeZone: 'Asia/Kolkata'`.
- Hindi/Gujarati UI needs fonts with Devanagari/Gujarati glyphs (e.g. Noto Sans Devanagari/Gujarati) and room for longer labels on tablets. Numerals can stay Latin (the Node test shows `hi-IN` defaults to Latin digits).
- Translating domain words (scrap grades, "kanta"/weighbridge terms) needs a native-speaker glossary. Lingui's inline source text makes review by non-developers easier. i18next's ecosystem (TMS integrations, ICU plugin) is bigger.

### Gaps
- No user research on whether Indian scrap-yard staff prefer Hindi/Gujarati UI over English with local number formats.
- Lingui and i18next version numbers are from a secondary comparison site and were not checked on npm.

## 9. Testing and tooling

### Takeaway
Use **Vitest + React Testing Library** for units and components (it shares the Vite config), **MSW** for API mocking (or Orval-generated mocks), and **Playwright** for a few end-to-end smoke flows (login → create purchase → stock view, including the token-refresh path). Turn on **TypeScript `strict`**. For linting, the lowest-risk choice is **ESLint 9 flat config + typescript-eslint + eslint-plugin-react-hooks** (which carries the React Compiler rules), with Prettier or Biome for formatting. Biome v2 alone is faster but lacks some React and type-aware coverage.

### Cited Findings
- State of React 2025: **Vitest 60%** usage, close behind Jest at 62%. **Playwright 52%**, overtaking Cypress (34%). — [Certificates.dev](https://certificates.dev/blog/breaking-down-state-of-react-2025-results)
- React Compiler's lint rules ship in `eslint-plugin-react-hooks` (recommended / recommended-latest). — [React blog: React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- Biome v2 adds type-aware rules through its own type inference, without running `tsc`. One source says its `noFloatingPromises` catches "about 85% of cases" compared with typescript-eslint. — [Reintech](https://reintech.io/blog/typescript-biome-vs-eslint-linting-formatting-comparison-2026). A case study reports a type-aware lint dropping from 44 s to 5 s, and CI from 1m14s to 7s, after the switch. — [Abrarqasim blog](https://abrarqasim.com/blog/biome-vs-eslint-2026-the-linter-switch-i-kept-putting-off/)
- "If your project depends on @typescript-eslint, eslint-plugin-react-hooks, … accessibility, security, testing, or custom organization rules, keep ESLint in the pipeline". Hybrid setups run Biome for formatting and basic linting and ESLint for specific checks. — [PkgPulse: Biome vs ESLint vs Oxlint 2026](https://www.pkgpulse.com/guides/biome-vs-eslint-vs-oxlint-2026); [Better Stack](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/)
- ESLint 9 uses flat config (`eslint.config.js`) in place of cascading `.eslintrc`. — [PkgPulse](https://www.pkgpulse.com/guides/biome-vs-eslint-vs-oxlint-2026)

### Inferences
- Small-team setup: `tsc --noEmit` (strict, `noUncheckedIndexedAccess`), `eslint` (flat config: typescript-eslint recommendedTypeChecked, react-hooks recommended-latest, jsx-a11y, @tanstack/eslint-plugin-query), Prettier (or Biome as formatter only), Vitest + RTL + MSW, and Playwright on Chromium plus one mobile viewport (e.g. Pixel/iPhone emulation) for the yard use case.
- Write a dedicated unit test for the single-flight refresh: fire 5 parallel requests that all get 401, and assert exactly 1 call to `/auth/refresh` and 5 successful retries. This is the riskiest piece of client code given the rotating token.

### Gaps
- No primary Biome, ESLint or Playwright release notes or version numbers were fetched.
- The TanStack Query ESLint plugin and MSW version and compatibility with Vite 8 / Vitest were not checked.
