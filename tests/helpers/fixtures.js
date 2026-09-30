/**
 * Readable business-scenario builders that go through the real API (validation, services,
 * transactions), so tests exercise exactly what a client would.
 */
function unwrap(res, expected = 201) {
  if (res.status !== expected) throw new Error(`Expected ${expected}, got ${res.status}: ${JSON.stringify(res.body)}`);
  return res.body.data;
}

export function fixtures(client) {
  let seq = 0;
  return {
    company: (name, type = 'PURCHASE', extra = {}) =>
      client.post('/api/v1/companies', { name, type, ...extra }).then((r) => unwrap(r)),
    material: (name, openingStockTons = '0') =>
      client.post('/api/v1/materials', { name, openingStockTons }).then((r) => unwrap(r)),
    purchase: ({ company, material, date = '2026-09-01', qty, rate = '100.00', ...extra }) =>
      client
        .post('/api/v1/purchases', {
          purchaseDate: date,
          companyId: company._id,
          materialId: material._id,
          quantityTons: qty,
          ratePerTon: rate,
          ...extra
        })
        .then((r) => unwrap(r)),
    po: ({ customer, material, date = '2026-09-01', qty, rate = '150.00', poNumber = `PO-${++seq}`, ...extra }) =>
      client
        .post('/api/v1/sales-pos', {
          poNumber,
          poDate: date,
          companyId: customer._id,
          materialId: material._id,
          quantityTons: qty,
          ratePerTon: rate,
          ...extra
        })
        .then((r) => unwrap(r)),
    /** Returns the raw response so tests can assert on rejections. */
    sale: ({ po, source, date = '2026-09-10', qty, ...extra }) =>
      client.post('/api/v1/sales', {
        saleDate: date,
        poId: po._id,
        sourceCompanyId: source._id,
        quantityTons: qty,
        ...extra
      }),
    saleOk: (args) =>
      fixtures(client)
        .sale(args)
        .then((r) => unwrap(r))
  };
}

export { unwrap };
