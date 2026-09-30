import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures } from '../helpers/fixtures.js';
import { Sale } from '../../src/models/Sale.js';

const clearDatabase = useTestDatabase();
let owner;
let f;
let supplier;
let customer;
let material;

beforeEach(async () => {
  await clearDatabase();
  owner = await authedClient();
  f = fixtures(owner);
  supplier = await f.company('Akshat TMT', 'PURCHASE');
  customer = await f.company('Shree Steel', 'SALE');
  material = await f.material('MS Scrap Fish Cut');
  await f.purchase({ company: supplier, material, qty: '200', date: '2026-09-01' });
});

describe('create sales PO', () => {
  it('calculates the PO total and starts ACTIVE / PENDING', async () => {
    const res = await owner.post('/api/v1/sales-pos', {
      poNumber: ' po-1205 ',
      poDate: '2026-09-25',
      companyId: customer._id,
      materialId: material._id,
      quantityTons: '100',
      ratePerTon: '42100',
      totalPOAmount: '1'
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      poNumber: 'po-1205',
      normalizedPoNumber: 'PO-1205',
      quantityTons: '100.000',
      ratePerTon: '42100.00',
      totalPOAmount: '4210000.00',
      lifecycleStatus: 'ACTIVE'
    });

    const detail = await owner.get(`/api/v1/sales-pos/${res.body.data._id}`);
    expect(detail.body.data).toMatchObject({
      soldQuantityTons: '0',
      remainingQuantityTons: '100.000',
      displayStatus: 'PENDING'
    });
    expect(detail.body.data.companyId).toEqual({ _id: customer._id, name: 'Shree Steel' });
  });

  it('requires a SALE/BOTH customer', async () => {
    const res = await owner.post('/api/v1/sales-pos', {
      poNumber: 'PO-X',
      poDate: '2026-09-25',
      companyId: supplier._id,
      materialId: material._id,
      quantityTons: '1',
      ratePerTon: '1'
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_SALE_COMPANY');
  });

  it('allows the same PO number at different customers but not twice for one customer', async () => {
    const other = await f.company('Other Customer', 'BOTH');
    await f.po({ customer, material, qty: '1', poNumber: 'PO-001' });
    await f.po({ customer: other, material, qty: '1', poNumber: 'PO-001' });
    const dup = await owner.post('/api/v1/sales-pos', {
      poNumber: 'po-001',
      poDate: '2026-09-25',
      companyId: customer._id,
      materialId: material._id,
      quantityTons: '1',
      ratePerTon: '1'
    });
    expect(dup.status).toBe(409);
  });
});

describe('PO position and derived status', () => {
  it('derives PENDING / PARTIALLY_SUPPLIED / COMPLETED / CANCELLED from deliveries', async () => {
    const pending = await f.po({ customer, material, qty: '10', poNumber: 'P-PENDING' });
    const partial = await f.po({ customer, material, qty: '10', poNumber: 'P-PARTIAL' });
    const complete = await f.po({ customer, material, qty: '10', poNumber: 'P-COMPLETE' });
    const cancelled = await f.po({ customer, material, qty: '10', poNumber: 'P-CANCELLED' });
    await f.saleOk({ po: partial, source: supplier, qty: '4' });
    await f.saleOk({ po: complete, source: supplier, qty: '10' });
    await owner.patch(`/api/v1/sales-pos/${cancelled._id}`, { lifecycleStatus: 'CANCELLED' });

    const res = await owner.get('/api/v1/sales-pos');
    const byNumber = Object.fromEntries(res.body.data.map((po) => [po.poNumber, po]));
    expect(byNumber['P-PENDING'].displayStatus).toBe('PENDING');
    expect(byNumber['P-PARTIAL']).toMatchObject({
      displayStatus: 'PARTIALLY_SUPPLIED',
      soldQuantityTons: '4.000',
      remainingQuantityTons: '6.000'
    });
    expect(byNumber['P-COMPLETE']).toMatchObject({ displayStatus: 'COMPLETED', remainingQuantityTons: '0.000' });
    expect(byNumber['P-CANCELLED'].displayStatus).toBe('CANCELLED');

    const open = await owner.get('/api/v1/sales-pos?status=PARTIALLY_SUPPLIED');
    expect(open.body.data.map((po) => po.poNumber)).toEqual(['P-PARTIAL']);
    expect(open.body.meta.total).toBe(1);
    expect(pending._id).toBeTruthy();

    const openOrders = await owner.get('/api/v1/sales-pos?status=PENDING,PARTIALLY_SUPPLIED');
    expect(openOrders.body.data.map((po) => po.poNumber).sort()).toEqual(['P-PARTIAL', 'P-PENDING']);
    expect(openOrders.body.meta.total).toBe(2);

    expect((await owner.get('/api/v1/sales-pos?status=PENDING,NOPE')).status).toBe(422);
  });
});

describe('edit sales PO', () => {
  it('cannot reduce quantity below what was delivered', async () => {
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: supplier, qty: '30' });
    const res = await owner.patch(`/api/v1/sales-pos/${po._id}`, { quantityTons: '29.999' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ code: 'PO_QTY_BELOW_SOLD', details: { soldQuantityTons: '30.000' } });
    expect((await owner.patch(`/api/v1/sales-pos/${po._id}`, { quantityTons: '30' })).status).toBe(200);
  });

  it('keeps the rate snapshot on existing sales and applies a new rate only to future sales', async () => {
    const po = await f.po({ customer, material, qty: '50', rate: '42100' });
    const first = await f.saleOk({ po, source: supplier, qty: '10' });
    const edit = await owner.patch(`/api/v1/sales-pos/${po._id}`, { ratePerTon: '45000' });
    expect(edit.body.data.totalPOAmount).toBe('2250000.00');

    const second = await f.saleOk({ po, source: supplier, qty: '10' });
    const stored = await Sale.findById(first._id).lean();
    expect(stored.poRateAtSale.toString()).toBe('42100.00');
    expect(stored.totalAmount.toString()).toBe('421000.00');
    expect(second).toMatchObject({ poRateAtSale: '45000.00', totalAmount: '450000.00' });
  });

  it('cascades a customer change to its deliveries', async () => {
    const newCustomer = await f.company('New Customer', 'BOTH');
    const po = await f.po({ customer, material, qty: '50' });
    const sale = await f.saleOk({ po, source: supplier, qty: '5' });
    await owner.patch(`/api/v1/sales-pos/${po._id}`, { companyId: newCustomer._id });
    expect(String((await Sale.findById(sale._id).lean()).companyId)).toBe(newCustomer._id);
  });

  it('rolls back a material change when the new material cannot cover existing deliveries', async () => {
    const other = await f.material('Copper Scrap');
    await f.purchase({ company: supplier, material: other, qty: '3', date: '2026-09-01' });
    const po = await f.po({ customer, material, qty: '50' });
    const sale = await f.saleOk({ po, source: supplier, qty: '5' });

    const res = await owner.patch(`/api/v1/sales-pos/${po._id}`, { materialId: other._id });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NEGATIVE_STOCK_HISTORY');
    expect(String((await Sale.findById(sale._id).lean()).materialId)).toBe(material._id);

    await f.purchase({ company: supplier, material: other, qty: '10', date: '2026-09-01' });
    const ok = await owner.patch(`/api/v1/sales-pos/${po._id}`, { materialId: other._id });
    expect(ok.status).toBe(200);
    expect(String((await Sale.findById(sale._id).lean()).materialId)).toBe(other._id);
  });

  it('checks the per-supplier pool of the new material too', async () => {
    const other = await f.material('Copper Scrap');
    const otherSupplier = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: otherSupplier, material: other, qty: '100', date: '2026-09-01' });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: supplier, qty: '5' });

    // Plenty of copper overall, but none of it came from Akshat TMT.
    const res = await owner.patch(`/api/v1/sales-pos/${po._id}`, { materialId: other._id });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NEGATIVE_SOURCE_STOCK_HISTORY');
  });

  it('cannot move the PO date after its first delivery', async () => {
    const po = await f.po({ customer, material, qty: '50', date: '2026-09-01' });
    await f.saleOk({ po, source: supplier, qty: '5', date: '2026-09-10' });
    const res = await owner.patch(`/api/v1/sales-pos/${po._id}`, { poDate: '2026-09-11' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PO_DATE_AFTER_SALES');
  });
});
