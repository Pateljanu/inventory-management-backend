import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures } from '../helpers/fixtures.js';
import { Purchase } from '../../src/models/Purchase.js';

const clearDatabase = useTestDatabase();
let owner;
let f;
let supplier;
let material;

beforeEach(async () => {
  await clearDatabase();
  owner = await authedClient();
  f = fixtures(owner);
  supplier = await f.company('Akshat TMT', 'PURCHASE');
  material = await f.material('MS Scrap Fish Cut');
});

describe('create purchase', () => {
  it('calculates totalAmount on the backend and ignores a client-sent total', async () => {
    const res = await owner.post('/api/v1/purchases', {
      purchaseDate: '2026-09-20',
      companyId: supplier._id,
      materialId: material._id,
      quantityTons: '30.250',
      ratePerTon: '39269.23',
      totalAmount: '1.00',
      vehicleNumber: 'gj01 ab 1234',
      invoiceNumber: ' inv-102 ',
      notes: 'Received at yard'
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      purchaseDate: '2026-09-20T00:00:00.000Z',
      quantityTons: '30.250',
      ratePerTon: '39269.23',
      totalAmount: '1187894.21',
      vehicleNumber: 'GJ01AB1234',
      invoiceNumber: 'inv-102',
      normalizedInvoiceNumber: 'INV-102',
      createdBy: owner.user._id.toString()
    });
  });

  it('requires an active PURCHASE/BOTH company and an active material', async () => {
    const customer = await f.company('Only Customer', 'SALE');
    const res1 = await owner.post('/api/v1/purchases', {
      purchaseDate: '2026-09-20',
      companyId: customer._id,
      materialId: material._id,
      quantityTons: '1',
      ratePerTon: '1'
    });
    expect(res1.status).toBe(422);
    expect(res1.body.error.code).toBe('INVALID_PURCHASE_COMPANY');

    await owner.patch(`/api/v1/materials/${material._id}`, { isActive: false });
    const res2 = await owner.post('/api/v1/purchases', {
      purchaseDate: '2026-09-20',
      companyId: supplier._id,
      materialId: material._id,
      quantityTons: '1',
      ratePerTon: '1'
    });
    expect(res2.status).toBe(422);
    expect(res2.body.error.code).toBe('INVALID_MATERIAL');
  });

  it('rejects a duplicate invoice for the same supplier, whatever its spacing or case', async () => {
    await f.purchase({ company: supplier, material, qty: '1', invoiceNumber: 'INV-7' });
    const dup = await owner.post('/api/v1/purchases', {
      purchaseDate: '2026-09-02',
      companyId: supplier._id,
      materialId: material._id,
      quantityTons: '2',
      ratePerTon: '1',
      invoiceNumber: 'inv - 7'
    });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('DUPLICATE_VALUE');

    const other = await f.company('Other Supplier', 'BOTH');
    await f.purchase({ company: other, material, qty: '1', invoiceNumber: 'INV-7' });
  });

  it('validates decimals and dates', async () => {
    const res = await owner.post('/api/v1/purchases', {
      purchaseDate: '2026-02-30',
      companyId: supplier._id,
      materialId: material._id,
      quantityTons: '1.2345',
      ratePerTon: '0'
    });
    expect(res.status).toBe(422);
    expect(res.body.error.details.issues.map((i) => i.path)).toEqual(
      expect.arrayContaining(['body.purchaseDate', 'body.quantityTons', 'body.ratePerTon'])
    );
  });
});

describe('edit purchase', () => {
  let customer;
  let po;

  beforeEach(async () => {
    customer = await f.company('Customer Ltd', 'SALE');
    po = await f.po({ customer, material, qty: '100' });
  });

  it('recalculates the amount and records who edited it', async () => {
    const p = await f.purchase({ company: supplier, material, qty: '10', rate: '100' });
    const res = await owner.patch(`/api/v1/purchases/${p._id}`, { quantityTons: '12.5' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      quantityTons: '12.500',
      totalAmount: '1250.00',
      updatedBy: owner.user._id.toString()
    });
  });

  it('refuses to reduce a purchase below what was already sold from that supplier', async () => {
    const p = await f.purchase({ company: supplier, material, qty: '40', date: '2026-09-01' });
    await f.saleOk({ po, source: supplier, qty: '10', date: '2026-09-05' });

    const res = await owner.patch(`/api/v1/purchases/${p._id}`, { quantityTons: '5' });
    expect(res.status).toBe(409);
    expect(['NEGATIVE_STOCK_HISTORY', 'NEGATIVE_SOURCE_STOCK_HISTORY']).toContain(res.body.error.code);
    expect((await Purchase.findById(p._id).lean()).quantityTons.toString()).toBe('40.000');
  });

  it('refuses to move a purchase after the sale that consumed it (backdated-edit protection)', async () => {
    const p = await f.purchase({ company: supplier, material, qty: '40', date: '2026-09-01' });
    await f.saleOk({ po, source: supplier, qty: '10', date: '2026-09-05' });
    const res = await owner.patch(`/api/v1/purchases/${p._id}`, { purchaseDate: '2026-09-10' });
    expect(res.status).toBe(409);
    expect(res.body.error.details.at).toBe('2026-09-05T00:00:00.000Z');
  });

  it('protects the supplier pool even when total material stock would stay positive', async () => {
    const other = await f.company('Second Supplier', 'PURCHASE');
    const p = await f.purchase({ company: supplier, material, qty: '40', date: '2026-09-01' });
    await f.purchase({ company: other, material, qty: '40', date: '2026-09-01' });
    await f.saleOk({ po, source: supplier, qty: '10', date: '2026-09-05' });

    // Re-attributing Akshat's purchase to the other supplier keeps overall stock at 70 T, but
    // Akshat's pool would be 0 purchased - 10 used.
    const res = await owner.patch(`/api/v1/purchases/${p._id}`, { companyId: other._id });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'NEGATIVE_SOURCE_STOCK_HISTORY',
      details: { sourceCompanyId: supplier._id, balanceTons: '-10.000' }
    });
  });

  it('still allows harmless edits after the supplier is deactivated', async () => {
    const p = await f.purchase({ company: supplier, material, qty: '5' });
    await owner.patch(`/api/v1/companies/${supplier._id}`, { isActive: false });
    const res = await owner.patch(`/api/v1/purchases/${p._id}`, { notes: 'corrected note', invoiceNumber: 'INV-99' });
    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe('corrected note');

    const cleared = await owner.patch(`/api/v1/purchases/${p._id}`, { invoiceNumber: '' });
    expect(cleared.body.data.invoiceNumber).toBeUndefined();
    expect(cleared.body.data.normalizedInvoiceNumber).toBeUndefined();
  });

  it('returns 404 for a missing purchase', async () => {
    const res = await owner.patch('/api/v1/purchases/66f000000000000000000999', { notes: 'x' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PURCHASE_NOT_FOUND');
  });
});

describe('list purchases', () => {
  it('filters by inclusive date range, company and search, with display names', async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: supplier, material, qty: '1', date: '2026-08-31', invoiceNumber: 'A-1' });
    await f.purchase({ company: supplier, material, qty: '2', date: '2026-09-01', invoiceNumber: 'A-2' });
    await f.purchase({ company: supplier, material, qty: '3', date: '2026-09-30', invoiceNumber: 'B-3' });
    await f.purchase({ company: other, material, qty: '4', date: '2026-09-15' });

    const sept = await owner.get(`/api/v1/purchases?from=2026-09-01&to=2026-09-30&companyId=${supplier._id}`);
    expect(sept.body.data.map((p) => p.quantityTons)).toEqual(['3.000', '2.000']);
    expect(sept.body.data[0].companyId).toEqual({ _id: supplier._id, name: 'Akshat TMT' });
    expect(sept.body.data[0].materialId.name).toBe('MS Scrap Fish Cut');

    expect((await owner.get('/api/v1/purchases?search=b-3')).body.data).toHaveLength(1);
    expect((await owner.get('/api/v1/purchases?from=2026-09-30&to=2026-09-01')).status).toBe(422);
  });
});
