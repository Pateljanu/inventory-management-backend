import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures, unwrap } from '../helpers/fixtures.js';
import { ROLES } from '../../src/constants/roles.js';

const clearDatabase = useTestDatabase();
let owner;
let f;
let supplier;
let other;
let customer;
let material;

const pool = () => ({ companyId: supplier._id, materialId: material._id });
const sourceStock = async () =>
  unwrap(await owner.get(`/api/v1/reports/source-stock?asOf=2026-12-31&sourceCompanyId=${supplier._id}`), 200);

beforeEach(async () => {
  await clearDatabase();
  owner = await authedClient();
  f = fixtures(owner);
  supplier = await f.company('Rehatan TMT', 'PURCHASE');
  other = await f.company('Vinayak TMT', 'PURCHASE');
  customer = await f.company('Buyer', 'SALE');
  material = await f.material('Fish Cut');
});

describe('settle a supplier pool', () => {
  it('trims the purchase to what was delivered, keeps the rate and recalculates the amount', async () => {
    const purchase = await f.purchase({ company: supplier, material, qty: '30', rate: '30.00' });
    const po = await f.po({ customer, material, qty: '30' });
    await f.saleOk({ po, source: supplier, qty: '28' });

    const preview = unwrap(
      await owner.get(`/api/v1/purchases/settle?companyId=${supplier._id}&materialId=${material._id}`),
      200
    );
    expect(preview).toMatchObject({
      purchasedTons: '30.000',
      usedTons: '28.000',
      leftTons: '2.000',
      changes: [
        {
          purchaseId: purchase._id,
          bookedTons: '30.000',
          fromTons: '30.000',
          toTons: '28.000',
          ratePerTon: '30.00',
          fromAmount: '900.00',
          toAmount: '840.00'
        }
      ]
    });
    // The preview changes nothing.
    expect((await sourceStock())[0].availableTons).toBe('2.000');

    const settled = unwrap(await owner.post('/api/v1/purchases/settle', pool()), 200);
    expect(settled.leftTons).toBe('2.000');

    const after = unwrap(await owner.get(`/api/v1/purchases/${purchase._id}`), 200);
    expect(after).toMatchObject({
      quantityTons: '28.000',
      ratePerTon: '30.00',
      totalAmount: '840.00',
      bookedTons: '30.000'
    });
    expect(await sourceStock()).toEqual([
      expect.objectContaining({ purchasedTons: '28.000', usedForSalesTons: '28.000', availableTons: '0.000' })
    ]);
    const stock = unwrap(await owner.get(`/api/v1/materials/${material._id}`), 200);
    expect(stock.currentStockTons).toBe('0.000');
  });

  it('takes the leftover off the latest purchases first and leaves other suppliers alone', async () => {
    const first = await f.purchase({ company: supplier, material, date: '2026-09-01', qty: '20' });
    const second = await f.purchase({ company: supplier, material, date: '2026-09-05', qty: '10' });
    const third = await f.purchase({ company: supplier, material, date: '2026-09-08', qty: '3' });
    const untouched = await f.purchase({ company: other, material, qty: '40' });
    const po = await f.po({ customer, material, qty: '100' });
    await f.saleOk({ po, source: supplier, date: '2026-09-10', qty: '25' });

    const settled = unwrap(await owner.post('/api/v1/purchases/settle', pool()), 200);
    expect(settled.leftTons).toBe('8.000');
    expect(settled.changes.map((c) => [c.purchaseId, c.fromTons, c.toTons])).toEqual([
      [third._id, '3.000', '0.000'],
      [second._id, '10.000', '5.000']
    ]);

    const qty = async (p) => unwrap(await owner.get(`/api/v1/purchases/${p._id}`), 200).quantityTons;
    expect(await qty(first)).toBe('20.000');
    expect(await qty(second)).toBe('5.000');
    expect(await qty(third)).toBe('0.000');
    expect(await qty(untouched)).toBe('40.000');
    expect((await sourceStock())[0].availableTons).toBe('0.000');
  });

  it('keeps the original booking when a pool is settled again', async () => {
    const purchase = await f.purchase({ company: supplier, material, qty: '30' });
    const po = await f.po({ customer, material, qty: '30' });
    await f.saleOk({ po, source: supplier, qty: '20' });
    unwrap(await owner.post('/api/v1/purchases/settle', pool()), 200);

    // More arrived after all: the owner corrects the purchase, then settles again.
    unwrap(await owner.patch(`/api/v1/purchases/${purchase._id}`, { quantityTons: '25' }), 200);
    await f.saleOk({ po, source: supplier, date: '2026-09-11', qty: '4' });
    unwrap(await owner.post('/api/v1/purchases/settle', pool()), 200);

    const after = unwrap(await owner.get(`/api/v1/purchases/${purchase._id}`), 200);
    expect(after).toMatchObject({ quantityTons: '24.000', bookedTons: '30.000' });
  });

  it('answers NOTHING_TO_SETTLE when nothing is left', async () => {
    await f.purchase({ company: supplier, material, qty: '10' });
    const po = await f.po({ customer, material, qty: '10' });
    await f.saleOk({ po, source: supplier, qty: '10' });

    const res = await owner.post('/api/v1/purchases/settle', pool());
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NOTHING_TO_SETTLE');
  });

  it('lets a VIEWER preview but not settle, and validates ids', async () => {
    await f.purchase({ company: supplier, material, qty: '10' });
    const viewer = await authedClient({ email: 'viewer@example.com', role: ROLES.VIEWER });

    const preview = await viewer.get(`/api/v1/purchases/settle?companyId=${supplier._id}&materialId=${material._id}`);
    expect(preview.status).toBe(200);
    expect(preview.body.data.leftTons).toBe('10.000');

    const denied = await viewer.post('/api/v1/purchases/settle', pool());
    expect(denied.status).toBe(403);

    const invalid = await owner.post('/api/v1/purchases/settle', { companyId: 'nope', materialId: material._id });
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });
});
