import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures, unwrap } from '../helpers/fixtures.js';

const clearDatabase = useTestDatabase();
let owner;
let f;
let supplier;
let customer;
let material;

const pool = () => ({ companyId: supplier._id, materialId: material._id });
const capacity = async (po, date = '2026-09-10') =>
  unwrap(
    await owner.get(`/api/v1/sales/capacity?poId=${po._id}&saleDate=${date}&sourceCompanyId=${supplier._id}`),
    200
  );
const sourceStock = async () =>
  unwrap(await owner.get(`/api/v1/reports/source-stock?asOf=2026-12-31&sourceCompanyId=${supplier._id}`), 200);
const getPurchase = async (p) => unwrap(await owner.get(`/api/v1/purchases/${p._id}`), 200);

beforeEach(async () => {
  await clearDatabase();
  owner = await authedClient();
  f = fixtures(owner);
  supplier = await f.company('Rehatan TMT', 'PURCHASE');
  customer = await f.company('Buyer', 'SALE');
  material = await f.material('Fish Cut');
});

describe('purchase tolerance', () => {
  it('stores the tolerance and validates its range', async () => {
    const purchase = await f.purchase({ company: supplier, material, qty: '20', tolerancePercent: '10' });
    expect(purchase.tolerancePercent).toBe('10.00');

    const tooHigh = await owner.post('/api/v1/purchases', {
      purchaseDate: '2026-09-01',
      companyId: supplier._id,
      materialId: material._id,
      quantityTons: '20',
      ratePerTon: '100',
      tolerancePercent: '51'
    });
    expect(tooHigh.status).toBe(422);
  });

  it('lets deliveries take up to the bought tons plus the tolerance, and no more', async () => {
    await f.purchase({ company: supplier, material, qty: '20', tolerancePercent: '10' });
    const po = await f.po({ customer, material, qty: '50' });

    expect(await capacity(po)).toMatchObject({
      availableStockTons: '22.000',
      availableSourceStockTons: '22.000',
      maxAllowedTons: '22.000',
      sources: [{ purchasedTons: '20.000', toleranceTons: '2.000', availableTons: '22.000' }]
    });

    const over = await f.sale({ po, source: supplier, qty: '22.001' });
    expect(over.status).toBe(409);
    expect(over.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(over.body.error.details.maxAllowedTons).toBe('22.000');

    await f.saleOk({ po, source: supplier, qty: '21.5' });
    // Reported stock keeps the bought tons: 1.5 t more was delivered than bought.
    expect(await sourceStock()).toEqual([
      expect.objectContaining({
        purchasedTons: '20.000',
        usedForSalesTons: '21.500',
        availableTons: '-1.500',
        toleranceTons: '2.000'
      })
    ]);
    expect((await capacity(po, '2026-09-11')).availableSourceStockTons).toBe('0.500');
  });

  it('allows none on a purchase without a tolerance', async () => {
    await f.purchase({ company: supplier, material, qty: '20' });
    const po = await f.po({ customer, material, qty: '50' });
    const res = await f.sale({ po, source: supplier, qty: '20.001' });
    expect(res.status).toBe(409);
  });

  it('refuses to lower a tolerance that deliveries already use', async () => {
    const purchase = await f.purchase({ company: supplier, material, qty: '20', tolerancePercent: '10' });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: supplier, qty: '21.5' });

    const res = await owner.patch(`/api/v1/purchases/${purchase._id}`, { tolerancePercent: '5' });
    expect(res.status).toBe(409);
    unwrap(await owner.patch(`/api/v1/purchases/${purchase._id}`, { tolerancePercent: '7.5' }), 200);
  });

  it('settle raises the purchase to what the supplier really sent', async () => {
    const purchase = await f.purchase({
      company: supplier,
      material,
      qty: '20',
      rate: '30.00',
      tolerancePercent: '10'
    });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: supplier, qty: '21.5' });

    const settled = unwrap(await owner.post('/api/v1/purchases/settle', pool()), 200);
    expect(settled).toMatchObject({
      purchasedTons: '20.000',
      usedTons: '21.500',
      leftTons: '0.000',
      extraTons: '1.500',
      changes: [{ purchaseId: purchase._id, fromTons: '20.000', toTons: '21.500', toAmount: '645.00' }]
    });
    expect(await getPurchase(purchase)).toMatchObject({
      quantityTons: '21.500',
      totalAmount: '645.00',
      bookedTons: '20.000',
      tolerancePercent: '0.00'
    });
    expect(await sourceStock()).toEqual([
      expect.objectContaining({ purchasedTons: '21.500', availableTons: '0.000', toleranceTons: '0.000' })
    ]);
    // A settled purchase is final: nothing more can be drawn from it.
    expect((await f.sale({ po, source: supplier, date: '2026-09-11', qty: '0.1' })).status).toBe(409);
  });

  it('settle raises the over-filled purchase and trims a later unused one', async () => {
    const first = await f.purchase({
      company: supplier,
      material,
      date: '2026-09-01',
      qty: '20',
      tolerancePercent: '10'
    });
    const po = await f.po({ customer, material, qty: '50' });
    await f.saleOk({ po, source: supplier, date: '2026-09-02', qty: '21' });
    const second = await f.purchase({
      company: supplier,
      material,
      date: '2026-09-03',
      qty: '10',
      tolerancePercent: '10'
    });
    await f.saleOk({ po, source: supplier, date: '2026-09-04', qty: '4' });

    const settled = unwrap(await owner.post('/api/v1/purchases/settle', pool()), 200);
    expect(settled).toMatchObject({ leftTons: '6.000', extraTons: '1.000' });
    expect((await getPurchase(first)).quantityTons).toBe('21.000');
    expect((await getPurchase(second)).quantityTons).toBe('4.000');
  });
});
