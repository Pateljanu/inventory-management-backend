# Metal Scrap Management — Backend

Production-oriented **Node.js + Express + MongoDB** API for a metal scrap business: companies, materials,
purchases, sales purchase orders (POs), sales/deliveries, purchase-company stock allocation, stock control,
dashboards and rate analysis. All quantities are in **tons**.

- Node.js 22 · Express 5 · Mongoose 8 · Zod · Decimal.js · Argon2 · JWT · Pino · Vitest
- MongoDB **must be a replica set** (Atlas clusters are): every stock/PO rule runs inside a transaction.

---

## Contents

1. [Quick start (MongoDB Atlas)](#1-quick-start-mongodb-atlas)
2. [Local MongoDB with Docker (optional)](#2-local-mongodb-with-docker-optional)
3. [npm scripts](#3-npm-scripts)
4. [Environment variables](#4-environment-variables)
5. [Business rules](#5-business-rules)
6. [API reference](#6-api-reference)
7. [Errors](#7-errors)
8. [Reporting semantics](#8-reporting-semantics)
9. [Project structure](#9-project-structure)
10. [Testing](#10-testing)
11. [Production deployment](#11-production-deployment)
12. [Operations](#12-operations)
13. [Differences from the reference code in the specification](#13-differences-from-the-reference-code-in-the-specification)

---

## 1. Quick start (MongoDB Atlas)

```bash
cp .env.example .env         # then edit .env (see below)
npm install
npm run migrate              # creates collections + indexes (safe to re-run)
node scripts/create-owner.js you@example.com "Your-Strong-Password"
npm run dev                  # http://localhost:4000
```

In `.env`:

- `MONGODB_URI` — your Atlas connection string **including the database name**, e.g.
  `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/metal_scrap?retryWrites=true&w=majority`
  (without `/metal_scrap` MongoDB silently uses a database called `test`).
- `JWT_ACCESS_SECRET` — at least 32 random characters:
  `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

In Atlas, the database user needs `readWrite` on `metal_scrap` only, and your IP must be in *Network Access*.

### Separate database for local testing

Your computer and the live server can share the same Atlas connection string and still use
different databases. In your **local** `.env` only, add:

```
MONGODB_DB_NAME=metal_scrap_dev
```

Everything run on this machine (`npm run dev`, `migrate`, `create-owner`, `reconcile`) then uses
`metal_scrap_dev`, and live data in `metal_scrap` is never read or changed. Set the new database
up once, then log in locally with this owner:

```bash
npm run migrate
node scripts/create-owner.js you@example.com "Your-Strong-Password"
```

The startup log line `MongoDB connected` shows which database is in use. Never set
`MONGODB_DB_NAME` on the live server. If the Atlas user is limited to `metal_scrap`, also give it
`readWrite` on `metal_scrap_dev`.

Check it is running:

```bash
curl http://localhost:4000/health/ready
curl -X POST http://localhost:4000/api/v1/auth/login -H "Content-Type: application/json" \
     -d '{"email":"you@example.com","password":"Your-Strong-Password"}'
```

`create-owner` resets the password if the email already exists. To keep the password out of shell
history: `OWNER_PASSWORD="..." node scripts/create-owner.js you@example.com`.

## 2. Local MongoDB with Docker (optional)

`docker-compose.dev.yml` starts a single-node **replica set** and the API with hot reload:

```bash
docker compose -f docker-compose.dev.yml up -d          # MongoDB + API (runs migrations first)
docker compose -f docker-compose.dev.yml up -d mongo    # only MongoDB
```

When running the API outside Docker against that MongoDB, use
`MONGODB_URI=mongodb://localhost:27017/metal_scrap?directConnection=true`.

## 3. npm scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm start` | Start (production) |
| `npm run migrate` / `npm run migrate:status` | Apply pending migrations / list applied ones |
| `npm run create-owner -- <email> <password>` | Create or reset the OWNER account |
| `npm run reconcile` | Read-only integrity audit of the whole database (exit 2 if issues) |
| `npm test` | All unit + integration tests (starts a throw-away replica set) |
| `npm run lint` / `npm run check` | ESLint / lint + tests |

## 4. Environment variables

Validated at startup — the process exits immediately if anything is missing or invalid.

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `production` in deployed environments |
| `PORT` | `4000` | |
| `MONGODB_URI` | — | Replica set / Atlas URI with database name. Secret. |
| `MONGODB_DB_NAME` | — | Optional. Uses this database instead of the one in `MONGODB_URI`. Local `.env` only (e.g. `metal_scrap_dev`), never on the live server |
| `JWT_ACCESS_SECRET` | — | ≥ 32 chars. Secret. Placeholder value is rejected in production. |
| `JWT_ACCESS_TTL` | `15m` | Access-token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | Refresh-session lifetime |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allow-list of frontend origins |
| `LOG_LEVEL` | `info` | `fatal`…`trace`, `silent` |
| `TRUST_PROXY` | `0` | Number of reverse-proxy hops (needed for correct client IPs / rate limits) |
| `RATE_LIMIT_PER_MINUTE` | `300` | Global per-IP request budget |
| `WEB_DIST_DIR` | — | Optional. Folder of the built frontend (`../Frontend/dist`) to serve from this same address; see [Production deployment](#11-production-deployment) |
| `BUSINESS_TIMEZONE` | `Asia/Kolkata` | Defines "today" for report defaults and current stock |

## 5. Business rules

**Masters.** Company and Material names are unique after normalization (`"AKSHAT  tmt"` = `"Akshat TMT"`).
Company `type` is `PURCHASE`, `SALE` or `BOTH`. Inactive masters stay on history but cannot be used by new
transactions. A company's type cannot drop a role it already has history in (switch to `BOTH` instead).

**Amounts** are always computed by the backend (`quantity × rate`, half-up to 2 dp). Client-sent totals,
customer, material or selling rate on a sale are ignored.

**Precision.** Quantities have 3 decimals, rates and money 2. Stored as `Decimal128`, computed with
Decimal.js, and returned as **strings** (`"30.250"`) so no floating-point loss occurs.

**Dates** are calendar days sent as `YYYY-MM-DD` and stored as UTC midnight.

**Sale (delivery).** The client sends `poId`, `sourceCompanyId`, `quantityTons`, `saleDate` (+ optional
vehicle/challan/notes). The backend copies customer, material and rate from the PO (`poRateAtSale`). A sale
must satisfy all three limits:

```
quantity ≤ PO remaining
quantity ≤ overall material stock as of saleDate
quantity ≤ stock of the selected source company for that material as of saleDate
```

Source-company stock = purchases from that company for the material − sales allocated to it
(pool accounting, not FIFO / per-invoice). **Opening stock never counts toward any source company** — record
supplier-traceable go-live stock as Purchase records instead.

**Settling a supplier pool.** A purchase is often booked on the supplier's estimate (say 30 t) while
the trucks load less (28 t), leaving stock that never existed. `POST /purchases/settle` sets one
supplier + material pool to zero: the leftover is taken off that supplier's purchases, **latest
first**, so each purchase ends at what was really delivered. The rate stays and the amount is
recalculated (`28 × rate`). The original quantity is kept in `bookedTons` the first time a purchase
is trimmed; a purchase may end at `0.000` t. Stock, supplier stock and every report follow
automatically because they are computed from purchases.

**History is protected.** Every create/edit of a purchase, sale, PO material change, or opening-stock change
replays the full ledger of each affected material *and* each affected source-company pool; if any past day
would go negative the whole change is rolled back (`NEGATIVE_STOCK_HISTORY` / `NEGATIVE_SOURCE_STOCK_HISTORY`).

**PO tolerance.** Each PO has an optional `tolerancePercent` (0–50, default 0 through the API; the web
form pre-fills 5). Deliveries may total up to `quantityTons × (1 + tolerance/100)`, rounded down to
3 dp, so an order of 30 t at 5% takes up to 31.5 t. Extra tons are billed at the same rate. An
over-delivered order shows `extraQuantityTons` and counts as `COMPLETED`.

**Settling a PO.** `POST /sales-pos/:id/settle` closes a short-delivered order (some delivered, less
than ordered): `quantityTons` becomes the delivered tons, the rate stays, `totalPOAmount` follows,
and the first ordered quantity is kept in `originalQuantityTons`. The order is then `COMPLETED` and
no longer counts as open demand. To deliver more later, edit the quantity back up.

**POs.** Quantity (plus its tolerance) cannot go below delivered; `poDate` cannot move after the first delivery; a rate change
affects only future sales (existing sales keep `poRateAtSale`); customer/material changes cascade to linked
sales. Status `PENDING / PARTIALLY_SUPPLIED / COMPLETED / CANCELLED` is **derived** from deliveries, never stored.

**Concurrency.** Stock-affecting transactions increment a `lockVersion` on the Material and PO documents
they depend on, so simultaneous requests are serialized by MongoDB and can never together oversell.

## 6. API reference

Base path `/api/v1`. All routes except `/auth/login`, `/auth/refresh`, `/auth/logout` and `/health/*`
require `Authorization: Bearer <accessToken>`. **OWNER** may read and write; **VIEWER** may only read.

Success: `{ "success": true, "data": ..., "meta"?: { page, limit, total, totalPages } }`
Lists accept `page` (default 1) and `limit` (default 25, max 100).

### Health

| Method | Path | |
|---|---|---|
| GET | `/health/live` | Process is up |
| GET | `/health/ready` | MongoDB connected (503 otherwise) |

### Auth

| Method | Path | Body | |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | → `{ accessToken, refreshToken, tokenType, expiresIn, user }` |
| POST | `/auth/refresh` | `{ refreshToken }` | Rotating: the old refresh token becomes invalid |
| POST | `/auth/logout` | `{ refreshToken }` | Revokes that session |
| GET | `/auth/me` | — | Current user |

Login is limited to 10 **failed** attempts per 15 minutes per IP.

### Resources

| Resource | List (GET) | Get (GET `/:id`) | Create (POST) | Edit (PATCH `/:id`) |
|---|---|---|---|---|
| `/companies` | `search, type, usage=purchase\|sale, isActive` | ✓ | ✓ | ✓ |
| `/materials` | `search, isActive` | ✓ (+ `currentStockTons`) | ✓ | ✓ |
| `/purchases` | `from, to, companyId, materialId, search` | ✓ | ✓ | ✓ |
| `/sales-pos` | `from, to, companyId, materialId, lifecycleStatus, status, search` | ✓ (+ position) | ✓ | ✓ |
| `/sales` | `from, to, companyId, sourceCompanyId, materialId, poId, search` | ✓ | ✓ | ✓ |

`GET /purchases/settle?companyId=&materialId=` (OWNER and VIEWER) previews a settle and
`POST /purchases/settle` with body `{ companyId, materialId }` (OWNER) applies it. Both return
`purchasedTons`, `usedTons`, `leftTons` and `changes[{ purchaseId, purchaseDate, invoiceNumber,
vehicleNumber, ratePerTon, bookedTons, fromTons, toTons, fromAmount, toAmount }]`.

PATCH accepts any subset of the create fields. On optional code fields (`gstNumber`, `vehicleNumber`,
`invoiceNumber`, `challanNumber`) an empty string `""` clears the value. There are no DELETE endpoints —
records are corrected by editing or deactivated with `isActive: false`.

Sales-PO list/detail rows include `soldQuantityTons`, `remainingQuantityTons`, `extraQuantityTons` and
`displayStatus`; `?status=PENDING,PARTIALLY_SUPPLIED` (a comma list) is convenient for a "select open PO" picker.
`POST /sales-pos/:id/settle` (OWNER) closes a short-delivered order and returns it with its position.

`GET /sales/capacity?poId=&saleDate=&sourceCompanyId=&excludeSaleId=` returns the live limits for the
delivery form before saving: `remainingQuantityTons`, `availableStockTons`, `availableSourceStockTons`,
`maxAllowedTons`, `limitedBy` (`PO | STOCK | SOURCE_STOCK`), `tolerancePercent`, `poAllowanceTons`
(ordered + tolerance − delivered: the PO limit; `remainingQuantityTons` stays ordered − delivered), `poOpen`, `poDate`, and `sources` (every
supplier pool of the PO's material with stock left, largest first). Stock figures are the headroom from
`saleDate` onward (the lowest balance on that day or any later day), so a backdated delivery within
`maxAllowedTons` also passes the historical ledger check. Pass `excludeSaleId` when editing a delivery.

### Examples

```jsonc
// POST /api/v1/companies
{ "name": "Akshat TMT", "type": "PURCHASE", "gstNumber": "24AAACA1234A1Z5",
  "contact": { "person": "Ravi", "phone": "+91 98765 43210", "email": "ravi@akshat.com" } }

// POST /api/v1/materials
{ "name": "MS Scrap Fish Cut", "openingStockTons": "25.500", "notes": "Primary MS scrap grade" }

// POST /api/v1/purchases                      -> totalAmount "1187894.21" computed by the backend
{ "purchaseDate": "2026-09-20", "companyId": "<company>", "materialId": "<material>",
  "quantityTons": "30.250", "ratePerTon": "39269.23", "vehicleNumber": "GJ01AB1234", "invoiceNumber": "INV-102" }

// POST /api/v1/sales-pos
{ "poNumber": "PO-1205", "poDate": "2026-09-25", "companyId": "<customer>", "materialId": "<material>",
  "quantityTons": "100.000", "ratePerTon": "42100.00" }

// POST /api/v1/sales                          -> customer, material, rate come from the PO
{ "saleDate": "2026-09-26", "poId": "<po>", "sourceCompanyId": "<supplier>",
  "quantityTons": "20.000", "vehicleNumber": "GJ01XY5678", "challanNumber": "CH-202" }
```

### Reports

| Method | Path | Query |
|---|---|---|
| GET | `/reports/dashboard` | `from, to, materialId, companyId` |
| GET | `/reports/companies/:id` | `from, to, materialId` |
| GET | `/reports/source-stock` | `asOf, sourceCompanyId, materialId` |
| GET | `/reports/trend` | `from, to` (required), `materialId, companyId, bucket` (`day`, `week` or `month`; chosen from the range when omitted) |

```jsonc
// GET /api/v1/reports/dashboard?from=2026-09-01&to=2026-09-30
{
  "period":    { "from": "2026-09-01", "to": "2026-09-30" },
  "purchases": { "quantityTons": "130.000", "value": "5105000.00", "averageBuyingRate": "39269.23" },
  "sales":     { "quantityTons": "30.000",  "value": "1263000.00", "averageSellingRate": "42100.00" },
  "po":        { "poQuantityTons": "145.000", "deliveredQuantityTons": "30.000",
                 "remainingQuantityTons": "115.000", "activePOCount": 3, "openPOCount": 3 },
  "materials": [{
    "materialId": "…", "materialName": "MS Scrap Fish Cut",
    "currentStockTons": "100.000", "remainingPOQuantityTons": "115.000",
    "purchaseRequiredTons": "15.000", "extraStockTons": "0.000",
    "purchasedTons": "130.000", "purchaseValue": "5105000.00", "averageBuyingRate": "39269.23",
    "soldTons": "30.000", "salesValue": "1263000.00", "averageSellingRate": "42100.00"
  }]
}

// GET /api/v1/reports/source-stock?asOf=2026-09-30
[{ "sourceCompanyId": "…", "sourceCompanyName": "Akshat TMT", "materialId": "…",
   "materialName": "MS Scrap Fish Cut", "purchasedTons": "40.000", "usedForSalesTons": "10.000",
   "availableTons": "30.000" }]
```

## 7. Errors

```json
{ "success": false, "error": { "code": "INSUFFICIENT_SOURCE_STOCK", "message": "…", "details": { }, "requestId": "…" } }
```

Every response carries an `x-request-id` header; the same id is in the error body and in the server logs.
Sale-capacity errors include `remainingQuantityTons`, `availableStockTons`, `availableSourceStockTons` and
`maxAllowedTons` so a client can show exactly how much may be delivered.

| HTTP | Codes |
|---|---|
| 400 | `INVALID_ID`, `INVALID_JSON` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `INVALID_REFRESH_TOKEN` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND`, `COMPANY_NOT_FOUND`, `MATERIAL_NOT_FOUND`, `PURCHASE_NOT_FOUND`, `PO_NOT_FOUND`, `SALE_NOT_FOUND` |
| 409 | `DUPLICATE_VALUE`, `PO_QUANTITY_EXCEEDED`, `INSUFFICIENT_STOCK`, `INSUFFICIENT_SOURCE_STOCK`, `NEGATIVE_STOCK_HISTORY`, `NEGATIVE_SOURCE_STOCK_HISTORY`, `PO_QTY_BELOW_SOLD`, `COMPANY_TYPE_IN_USE`, `NOTHING_TO_SETTLE` |
| 413 | `PAYLOAD_TOO_LARGE` (body > 1 MB) |
| 422 | `VALIDATION_ERROR` (with `details.issues[{ path, message }]`), `INVALID_PURCHASE_COMPANY`, `INVALID_SALE_COMPANY`, `INVALID_SOURCE_COMPANY`, `INVALID_MATERIAL`, `PO_NOT_AVAILABLE`, `SALE_BEFORE_PO_DATE`, `PO_DATE_AFTER_SALES` |
| 429 | `TOO_MANY_REQUESTS`, `TOO_MANY_AUTH_ATTEMPTS` |
| 500 | `INTERNAL_ERROR` |

## 8. Reporting semantics

- **Activity** (purchases, sales, average rates) uses transactions dated within `[from, to]`.
- **Positions** (stock, PO delivered/remaining, purchase required, extra stock, source stock) are balances
  **as of `to`**. A report ending 30 Sept ignores October sales even when run in November.
- `to` defaults to today in `BUSINESS_TIMEZONE`; `from` is optional (open start).
- Average rates are weighted: total value ÷ total quantity.
- `purchaseRequired = max(remaining active PO demand − stock, 0)`; `extraStock = max(stock − demand, 0)`.
- `companyId` scopes purchases to that supplier and sales/POs to that customer; stock stays material-wide.
- PO lifecycle (`ACTIVE`/`CANCELLED`) has no history, so historical reports use each PO's current lifecycle.

## 9. Project structure

```
src/
  app.js, server.js       Express app + process entry (graceful shutdown)
  config/                 env validation, logger (redacted), MongoDB connection
  constants/              roles, company types, PO statuses
  errors/AppError.js      typed business errors
  middleware/             request id, authenticate, authorize, validate, rate limits, error handler
  validations/            Zod request contracts
  routes/ → controllers/ → services/ → repositories/ → models/
  services/stock.service.js           stock as-of + historical ledger assertions
  services/sale.service.js            the three sale limits, rate snapshot, edits
  services/report.service.js          dashboard / company / source-stock reports
  services/reconciliation.service.js  full-database audit
  db/migrator.js, db/migrations/      versioned, locked, run-once migrations
scripts/                  migrate, create-owner, reconcile
tests/                    unit + integration (real replica set via mongodb-memory-server)
```

Dependencies flow one way: routes → controllers → services → repositories/models. Controllers never touch
MongoDB; services own business rules and transactions.

## 10. Testing

```bash
npm test
```

Integration tests start a throw-away MongoDB **replica set** (first run downloads a ~100 MB MongoDB binary)
with one database per test file. Covered: auth & roles, validation, every uniqueness constraint, decimal
exactness, the three sale limits (including the specification's 40/10/35 example), backdated-edit
rollback, rate snapshots, PO invariants, historical report cut-offs, concurrent sales, CORS, rate limiting,
migrations and the reconciliation audit.

## 11. Production deployment

- Use MongoDB Atlas (or another replica set) with TLS, a least-privilege user and **automated backups** —
  and practise a restore before the system becomes authoritative.
- Build the image in CI: `docker build -t metal-scrap-api .` (multi-stage, `npm ci` from the lockfile,
  runs as the non-root `node` user, has a `HEALTHCHECK`).
- Inject secrets from the platform's secret manager; never bake `.env` into an image (it is in `.dockerignore`).
- Run `npm run migrate` as a deployment step **before** switching traffic; the app never builds indexes itself
  in production.
- Put the API behind HTTPS / a reverse proxy and set `TRUST_PROXY` to the number of proxy hops.
- Set `CORS_ORIGINS` to the real frontend origin(s), `LOG_LEVEL=info`, and ship stdout JSON logs to a
  central store; alert on 5xx spikes, MongoDB disconnects and authentication spikes.
- Use separate databases and credentials for development, staging and production.
- Smoke test after deploy: `/health/ready`, login, list masters, open the dashboard.

### Serving the web app from the API (simplest setup)

One Node process can serve both the API and the built frontend, on one address:

```bash
cd ../Frontend && npm ci && npm run build      # produces Frontend/dist
cd ../Backend && npm ci --omit=dev
npm run migrate
WEB_DIST_DIR=../Frontend/dist NODE_ENV=production npm start
```

(On Windows, put `WEB_DIST_DIR=../Frontend/dist` and `NODE_ENV=production` in `.env` and run `npm start`.)
Then open `http://<server>:4000`. Because the page and `/api/v1` share one origin, no `CORS_ORIGINS`
entry is needed. Hashed files under `assets/` are cached for a year; `index.html` is revalidated on
every load, so a new build is picked up on the next page load (rebuild, then restart). Deep links such as
`/sales-orders/<id>` return the app, while `/api/*` and `/health/*` keep their JSON answers. The
Content-Security-Policy allows only the app's own scripts. It does not force https, so the app also works
over plain http on a local network; on the internet, still put it behind HTTPS.

To host the frontend elsewhere instead (any static host or nginx), build it with
`VITE_API_BASE_URL=https://api.example.com/api/v1`, add that site's origin to `CORS_ORIGINS`, and make
the host answer unknown paths with `index.html`.

## 12. Operations

| When | What |
|---|---|
| Every deploy | `npm run migrate`, `/health/ready` OK, no 5xx spike |
| After any manual data correction / restore | `npm run reconcile` (exit 0 = consistent) |
| Regularly | Backups succeed; review error logs; monthly restore test on a copy |
| Adding an index / data change | New file `src/db/migrations/00N-*.js`, append it to `migrations/index.js`; never edit an applied migration |

## 13. Differences from the reference code in the specification

The implementation follows the specification's architecture and rules. Where its Appendix A code was
incorrect or incomplete, this implementation deliberately differs:

| Area | Change |
|---|---|
| Aggregations | Ids are cast to `ObjectId` before `$match` (string ids silently matched nothing, making every source-stock check return 0) |
| JSON output | ObjectIds serialized as hex strings; internal fields (`passwordHash`, `lockVersion`) never returned |
| Query booleans | `isActive=false` means false (`z.coerce.boolean` turned `"false"` into `true`) |
| Sale edits | `poRateAtSale` is kept unless the sale moves to another PO (the reference re-copied the live PO rate on every edit) |
| PO material change | Also re-validates per-supplier pools of the new material |
| Edits of old records | Unchanged references may be inactive/cancelled (corrections stay possible); new references must be active |
| Extra guards | Sale date ≥ PO date; PO date ≤ first delivery; company type cannot drop a role it has history in |
| Performance | PO positions and dashboards use grouped aggregations instead of one query per PO/material |
| Dates | Strict `YYYY-MM-DD` business dates; "today" uses `BUSINESS_TIMEZONE` |
| Docker dev | Dev image target includes dev dependencies (the reference ran `npm run dev` on an image without nodemon); replica-set health check waits for PRIMARY |
| Operations | Migration lock, `migrate:status`, `/health/ready`, `reconcile` audit script |
