import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures } from '../helpers/fixtures.js';
import { Sale } from '../../src/models/Sale.js';

const clearDatabase = useTestDatabase();
let owner;
let f;
let akshat;
let customer;
let material;

beforeEach(async () => {
  await clearDatabase();
  owner = await authedClient();
  f = fixtures(owner);
  akshat = await f.company('Akshat TMT', 'PURCHASE');
  customer = await f.company('Shree Steel', 'SALE');
  material = await f.material('MS Scrap Fish Cut');
});

describe('create sale: the three limits', () => {
  it('reproduces the specification example: 40 purchased, 10 used, 35 requested -> max 30', async () => {
    // Another supplier's stock keeps overall material stock above 35 T, so the Akshat pool is
    // the binding limit exactly as in the specification.
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: other, material, qty: '60', date: '2026-09-01' });
    await f.purchase({ company: akshat, material, qty: '40', date: '2026-09-01' });
    const earlierPO = await f.po({ customer, material, qty: '10' });
    await f.saleOk({ po: earlierPO, source: akshat, qty: '10', date: '2026-09-05' });
    const po = await f.po({ customer, material, qty: '50' });

    const rejected = await f.sale({ po, source: akshat, qty: '35' });
    expect(rejected.status).toBe(409);
    expect(rejected.body.error).toMatchObject({
      code: 'INSUFFICIENT_SOURCE_STOCK',
      message: 'Sale quantity exceeds stock available from the selected purchase company',
      details: {
        sourceCompanyId: akshat._id,
        materialId: material._id,
        remainingQuantityTons: '50.000',
        availableStockTons: '90.000',
        availableSourceStockTons: '30.000',
        maxAllowedTons: '30.000'
      }
    });

    const accepted = await f.sale({ po, source: akshat, qty: '30' });
    expect(accepted.status).toBe(201);
  });

  it('derives customer, material and rate from the PO and ignores client overrides', async () => {
    const intruder = await f.company('Intruder', 'BOTH');
    const otherMaterial = await f.material('Other');
    await f.purchase({ company: akshat, material, qty: '40' });
    const po = await f.po({ customer, material, qty: '50', rate: '42100' });

    const res = await f.sale({
      po,
      source: akshat,
      qty: '20',
      companyId: intruder._id,
      materialId: otherMaterial._id,
      poRateAtSale: '1',
      totalAmount: '1',
      vehicleNumber: 'gj01 xy 5678',
      challanNumber: 'ch-202'
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      companyId: customer._id,
      sourceCompanyId: akshat._id,
      materialId: material._id,
      quantityTons: '20.000',
      poRateAtSale: '42100.00',
      totalAmount: '842000.00',
      vehicleNumber: 'GJ01XY5678',
      normalizedChallanNumber: 'CH-202'
    });
  });

  it('rejects quantity above the PO remaining', async () => {
    await f.purchase({ company: akshat, material, qty: '100' });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: akshat, qty: '45' });
    const res = await f.sale({ po, source: akshat, qty: '5.001' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'PO_QUANTITY_EXCEEDED',
      details: { remainingQuantityTons: '5.000', maxAllowedTons: '5.000' }
    });
  });

  it('uses stock as of the sale date: a later purchase does not count', async () => {
    await f.purchase({ company: akshat, material, qty: '100', date: '2026-09-20' });
    const po = await f.po({ customer, material, qty: '50' });
    const res = await f.sale({ po, source: akshat, qty: '10', date: '2026-09-10' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      details: { availableStockTons: '0.000', maxAllowedTons: '0.000' }
    });
    expect((await f.sale({ po, source: akshat, qty: '10', date: '2026-09-20' })).status).toBe(201);
  });

  it('never lets opening stock count toward a supplier pool', async () => {
    const withOpening = await f.material('Opening Only', '100');
    const po = await f.po({ customer, material: withOpening, qty: '50' });
    const res = await f.sale({ po, source: akshat, qty: '10' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_SOURCE_STOCK');
    expect(res.body.error.details.sourceFirstPurchaseDate).toBeNull();
  });

  it("names the supplier's first purchase date when its stock only arrives after the sale date", async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: other, material, qty: '50', date: '2026-09-01' });
    await f.purchase({ company: akshat, material, qty: '30', date: '2026-09-15' });
    const po = await f.po({ customer, material, qty: '50' });

    const res = await f.sale({ po, source: akshat, qty: '10', date: '2026-09-10' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'INSUFFICIENT_SOURCE_STOCK',
      details: { availableSourceStockTons: '0.000', sourceFirstPurchaseDate: '2026-09-15' }
    });
    expect((await f.sale({ po, source: akshat, qty: '10', date: '2026-09-15' })).status).toBe(201);
  });

  it('rejects a backdated sale that fits on its own date but starves a later delivery', async () => {
    await f.purchase({ company: akshat, material, qty: '10', date: '2026-09-01' });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: akshat, qty: '10', date: '2026-09-05' });

    // As of Sept 3 there are 10 T, but selling them would leave Sept 5 at -10.
    const res = await f.sale({ po, source: akshat, qty: '10', date: '2026-09-03' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'NEGATIVE_STOCK_HISTORY',
      details: { at: '2026-09-05T00:00:00.000Z' }
    });
    expect(await Sale.countDocuments()).toBe(1);
  });

  it('validates the PO state, the source company and the sale date', async () => {
    await f.purchase({ company: akshat, material, qty: '100' });
    const po = await f.po({ customer, material, qty: '50', date: '2026-09-05' });

    const beforePO = await f.sale({ po, source: akshat, qty: '1', date: '2026-09-04' });
    expect(beforePO.body.error.code).toBe('SALE_BEFORE_PO_DATE');

    const wrongSource = await f.sale({ po, source: customer, qty: '1' });
    expect(wrongSource.status).toBe(422);
    expect(wrongSource.body.error.code).toBe('INVALID_SOURCE_COMPANY');

    await owner.patch(`/api/v1/sales-pos/${po._id}`, { lifecycleStatus: 'CANCELLED' });
    const cancelled = await f.sale({ po, source: akshat, qty: '1' });
    expect(cancelled.status).toBe(422);
    expect(cancelled.body.error.code).toBe('PO_NOT_AVAILABLE');

    const missing = await owner.post('/api/v1/sales', {
      saleDate: '2026-09-10',
      poId: '66f000000000000000000999',
      sourceCompanyId: akshat._id,
      quantityTons: '1'
    });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('PO_NOT_FOUND');
  });

  it('rejects a duplicate challan for the same customer', async () => {
    await f.purchase({ company: akshat, material, qty: '100' });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: akshat, qty: '1', challanNumber: 'CH-1' });
    const dup = await f.sale({ po, source: akshat, qty: '1', challanNumber: 'ch 1' });
    expect(dup.status).toBe(201); // "CH1" normalizes differently from "CH-1"
    const realDup = await f.sale({ po, source: akshat, qty: '1', challanNumber: 'ch-1' });
    expect(realDup.status).toBe(409);
    expect(realDup.body.error.code).toBe('DUPLICATE_VALUE');
  });
});

describe('edit sale', () => {
  let po;

  beforeEach(async () => {
    await f.purchase({ company: akshat, material, qty: '40', date: '2026-09-01' });
    po = await f.po({ customer, material, qty: '50', rate: '42100' });
  });

  it('keeps the original rate snapshot when an unrelated field is edited after a PO rate change', async () => {
    const sale = await f.saleOk({ po, source: akshat, qty: '10' });
    await owner.patch(`/api/v1/sales-pos/${po._id}`, { ratePerTon: '50000' });
    const res = await owner.patch(`/api/v1/sales/${sale._id}`, { vehicleNumber: 'GJ05ZZ0001', quantityTons: '12' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      poRateAtSale: '42100.00',
      totalAmount: '505200.00',
      vehicleNumber: 'GJ05ZZ0001'
    });
  });

  it('excludes the sale itself when re-checking capacity', async () => {
    const sale = await f.saleOk({ po, source: akshat, qty: '40' });
    // Pool is fully used by this very sale; editing its date must still be allowed.
    const res = await owner.patch(`/api/v1/sales/${sale._id}`, { saleDate: '2026-09-12' });
    expect(res.status).toBe(200);
    const tooMuch = await owner.patch(`/api/v1/sales/${sale._id}`, { quantityTons: '40.001' });
    expect(tooMuch.status).toBe(409);
    expect(tooMuch.body.error.details.maxAllowedTons).toBe('40.000');
  });

  it('re-validates a new source company', async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: other, material, qty: '5', date: '2026-09-01' });
    const sale = await f.saleOk({ po, source: akshat, qty: '10' });
    const res = await owner.patch(`/api/v1/sales/${sale._id}`, { sourceCompanyId: other._id });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'INSUFFICIENT_SOURCE_STOCK',
      details: { availableSourceStockTons: '5.000' }
    });

    expect(
      (await owner.patch(`/api/v1/sales/${sale._id}`, { sourceCompanyId: other._id, quantityTons: '5' })).status
    ).toBe(200);
  });

  it('moving to another PO takes that PO customer and rate', async () => {
    const newCustomer = await f.company('New Customer', 'BOTH');
    const otherPO = await f.po({ customer: newCustomer, material, qty: '20', rate: '43000' });
    const sale = await f.saleOk({ po, source: akshat, qty: '10' });
    const res = await owner.patch(`/api/v1/sales/${sale._id}`, { poId: otherPO._id });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      companyId: newCustomer._id,
      poRateAtSale: '43000.00',
      totalAmount: '430000.00'
    });
  });

  it('allows corrections on a cancelled PO but not increases', async () => {
    const sale = await f.saleOk({ po, source: akshat, qty: '10' });
    await owner.patch(`/api/v1/sales-pos/${po._id}`, { lifecycleStatus: 'CANCELLED' });
    expect((await owner.patch(`/api/v1/sales/${sale._id}`, { notes: 'weighbridge slip attached' })).status).toBe(200);
    expect((await owner.patch(`/api/v1/sales/${sale._id}`, { quantityTons: '9' })).status).toBe(200);
    const increase = await owner.patch(`/api/v1/sales/${sale._id}`, { quantityTons: '11' });
    expect(increase.body.error.code).toBe('PO_NOT_AVAILABLE');
  });
});

describe('list sales', () => {
  it('filters by source company and shows display names for both company roles', async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: akshat, material, qty: '40' });
    await f.purchase({ company: other, material, qty: '40' });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: akshat, qty: '10' });
    await f.saleOk({ po, source: other, qty: '5' });

    const res = await owner.get(`/api/v1/sales?sourceCompanyId=${other._id}`);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      quantityTons: '5.000',
      companyId: { name: 'Shree Steel' },
      sourceCompanyId: { name: 'Other Supplier', type: 'PURCHASE' },
      poId: { poNumber: po.poNumber }
    });
  });
});

describe('concurrency', () => {
  it('two simultaneous sales cannot together exceed the supplier pool', async () => {
    await f.purchase({ company: akshat, material, qty: '40' });
    const poA = await f.po({ customer, material, qty: '100' });
    const poB = await f.po({ customer, material, qty: '100' });

    const results = await Promise.all([
      f.sale({ po: poA, source: akshat, qty: '30' }),
      f.sale({ po: poB, source: akshat, qty: '30' })
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409).body.error.details.availableSourceStockTons).toBe('10.000');
    expect(await Sale.countDocuments()).toBe(1);
  });

  it('two simultaneous sales cannot together exceed the PO quantity', async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: akshat, material, qty: '40' });
    await f.purchase({ company: other, material, qty: '40' });
    const po = await f.po({ customer, material, qty: '50' });

    const results = await Promise.all([
      f.sale({ po, source: akshat, qty: '30' }),
      f.sale({ po, source: other, qty: '30' })
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409).body.error.code).toBe('PO_QUANTITY_EXCEEDED');
  });

  it('many parallel small sales never overdraw the pool', async () => {
    await f.purchase({ company: akshat, material, qty: '10' });
    const po = await f.po({ customer, material, qty: '100' });
    const results = await Promise.all(Array.from({ length: 8 }, () => f.sale({ po, source: akshat, qty: '3' })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    const [total] = await Sale.aggregate([{ $group: { _id: null, qty: { $sum: '$quantityTons' } } }]);
    expect(total.qty.toString()).toBe('9.000');
  });
});

describe('GET /sales/capacity: live limits for the delivery form', () => {
  const capacity = (query) => owner.get(`/api/v1/sales/capacity?${new URLSearchParams(query)}`);

  it('returns the three limits, the binding one, and supplier pools with stock (spec example)', async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    const buyerOnly = await f.company('Buyer Only', 'SALE');
    await f.purchase({ company: other, material, qty: '60', date: '2026-09-01' });
    await f.purchase({ company: akshat, material, qty: '40', date: '2026-09-01' });
    const earlierPO = await f.po({ customer, material, qty: '10' });
    await f.saleOk({ po: earlierPO, source: akshat, qty: '10', date: '2026-09-05' });
    const po = await f.po({ customer, material, qty: '50', poNumber: 'PO-CAP' });

    const res = await capacity({ poId: po._id, saleDate: '2026-09-10', sourceCompanyId: akshat._id });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      poId: po._id,
      poNumber: 'PO-CAP',
      poDate: '2026-09-01',
      poOpen: true,
      materialId: material._id,
      saleDate: '2026-09-10',
      remainingQuantityTons: '50.000',
      availableStockTons: '90.000',
      availableSourceStockTons: '30.000',
      maxAllowedTons: '30.000',
      limitedBy: 'SOURCE_STOCK'
    });
    expect(res.body.data.sources).toEqual([
      {
        sourceCompanyId: other._id,
        name: 'Other Supplier',
        isActive: true,
        availableTons: '60.000',
        purchasedTons: '60.000',
        usedTons: '0.000',
        firstPurchaseDate: '2026-09-01',
        lastPurchaseDate: '2026-09-01'
      },
      {
        sourceCompanyId: akshat._id,
        name: 'Akshat TMT',
        isActive: true,
        availableTons: '30.000',
        purchasedTons: '40.000',
        usedTons: '10.000',
        firstPurchaseDate: '2026-09-01',
        lastPurchaseDate: '2026-09-01'
      }
    ]);
    expect(res.body.data.sources.map((s) => s.sourceCompanyId)).not.toContain(buyerOnly._id);

    // Without a source the PO or overall stock decides.
    const noSource = await capacity({ poId: po._id, saleDate: '2026-09-10' });
    expect(noSource.body.data).toMatchObject({
      availableSourceStockTons: null,
      maxAllowedTons: '50.000',
      limitedBy: 'PO'
    });
  });

  it('uses headroom from the sale date onward, so what it allows also passes the ledger replay', async () => {
    await f.purchase({ company: akshat, material, qty: '20', date: '2026-09-01' });
    const po = await f.po({ customer, material, qty: '50' });
    const later = await f.saleOk({ po, source: akshat, qty: '15', date: '2026-09-20' });

    // 20 t are in the yard on the 10th, but 15 t of it is already promised on the 20th.
    const res = await capacity({ poId: po._id, saleDate: '2026-09-10', sourceCompanyId: akshat._id });
    expect(res.body.data).toMatchObject({
      remainingQuantityTons: '35.000',
      availableStockTons: '5.000',
      availableSourceStockTons: '5.000',
      maxAllowedTons: '5.000',
      limitedBy: 'STOCK'
    });
    expect((await f.sale({ po, source: akshat, qty: '5.001', date: '2026-09-10' })).status).toBe(409);
    expect((await f.sale({ po, source: akshat, qty: '5', date: '2026-09-10' })).status).toBe(201);

    // Editing a delivery does not count it against itself.
    const editing = await capacity({
      poId: po._id,
      saleDate: '2026-09-20',
      sourceCompanyId: akshat._id,
      excludeSaleId: later._id
    });
    expect(editing.body.data).toMatchObject({ remainingQuantityTons: '45.000', maxAllowedTons: '15.000' });
  });

  it('reports each supplier pool as of the sale date: bought, used and purchase dates', async () => {
    await f.purchase({ company: akshat, material, qty: '10', date: '2026-09-02' });
    await f.purchase({ company: akshat, material, qty: '15', date: '2026-09-08' });
    await f.purchase({ company: akshat, material, qty: '20', date: '2026-09-25' });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: akshat, qty: '4', date: '2026-09-09' });
    await f.saleOk({ po, source: akshat, qty: '6', date: '2026-09-26' });

    const res = await capacity({ poId: po._id, saleDate: '2026-09-10', sourceCompanyId: akshat._id });
    expect(res.body.data.sources).toEqual([
      expect.objectContaining({
        sourceCompanyId: akshat._id,
        availableTons: '21.000',
        // Only what happened on or before the 10th; the 25th's purchase and 26th's delivery wait.
        purchasedTons: '25.000',
        usedTons: '4.000',
        firstPurchaseDate: '2026-09-02',
        lastPurchaseDate: '2026-09-08'
      })
    ]);
  });

  it('lists the selected source even with no stock, and reports a cancelled PO', async () => {
    const empty = await f.company('Empty Yard', 'BOTH');
    await f.purchase({ company: akshat, material, qty: '20' });
    const po = await f.po({ customer, material, qty: '10' });
    expect((await owner.patch(`/api/v1/sales-pos/${po._id}`, { lifecycleStatus: 'CANCELLED' })).status).toBe(200);

    const res = await capacity({ poId: po._id, saleDate: '2026-09-10', sourceCompanyId: empty._id });
    expect(res.body.data).toMatchObject({
      poOpen: false,
      availableSourceStockTons: '0.000',
      maxAllowedTons: '0.000',
      limitedBy: 'SOURCE_STOCK'
    });
    expect(res.body.data.sources.map((s) => [s.name, s.availableTons])).toEqual([
      ['Akshat TMT', '20.000'],
      ['Empty Yard', '0.000']
    ]);
  });

  it('validates the query and reports an unknown PO', async () => {
    const po = await f.po({ customer, material, qty: '10' });
    expect((await capacity({ poId: po._id })).status).toBe(422);
    expect((await capacity({ poId: po._id, saleDate: '2026-02-30' })).status).toBe(422);
    const missing = await capacity({ poId: '0123456789abcdef01234567', saleDate: '2026-09-10' });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('PO_NOT_FOUND');
  });

  it('is readable by a viewer', async () => {
    const po = await f.po({ customer, material, qty: '10' });
    const viewer = await authedClient({ email: 'viewer@example.com', role: 'VIEWER' });
    const res = await viewer.get(`/api/v1/sales/capacity?poId=${po._id}&saleDate=2026-09-10`);
    expect(res.status).toBe(200);
  });
});
