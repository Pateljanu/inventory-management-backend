import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures } from '../helpers/fixtures.js';
import { ROLES } from '../../src/constants/roles.js';

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
  material = await f.material('MS Scrap Fish Cut', '10');
});

const dashboard = (query) => owner.get(`/api/v1/reports/dashboard?${new URLSearchParams(query)}`).then((r) => r.body);

describe('historical as-of semantics', () => {
  beforeEach(async () => {
    await f.purchase({ company: akshat, material, qty: '100', rate: '100', date: '2026-09-01' });
    await f.purchase({ company: akshat, material, qty: '50', rate: '100', date: '2026-10-01' });
    const po = await f.po({ customer, material, qty: '100', rate: '150', date: '2026-09-01' });
    await f.saleOk({ po, source: akshat, qty: '30', date: '2026-09-15' });
    await f.saleOk({ po, source: akshat, qty: '40', date: '2026-10-10' });
  });

  it('a report ending Sept 30 ignores October sales (specification example)', async () => {
    const { data } = await dashboard({ from: '2026-09-01', to: '2026-09-30' });
    expect(data.period).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(data.po).toMatchObject({
      poQuantityTons: '100.000',
      deliveredQuantityTons: '30.000',
      remainingQuantityTons: '70.000',
      activePOCount: 1
    });
    expect(data.materials[0]).toMatchObject({
      currentStockTons: '80.000', // 10 opening + 100 bought - 30 sold
      remainingPOQuantityTons: '70.000',
      purchaseRequiredTons: '0.000',
      extraStockTons: '10.000'
    });
    expect(data.purchases.quantityTons).toBe('100.000');
    expect(data.sales.quantityTons).toBe('30.000');
  });

  it('a report ending Oct 31 sees both deliveries, while October activity counts only October', async () => {
    const { data } = await dashboard({ from: '2026-10-01', to: '2026-10-31' });
    expect(data.po).toMatchObject({ deliveredQuantityTons: '70.000', remainingQuantityTons: '30.000' });
    expect(data.sales).toEqual({ quantityTons: '40.000', value: '6000.00', averageSellingRate: '150.00' });
    expect(data.purchases.quantityTons).toBe('50.000');
    expect(data.materials[0].currentStockTons).toBe('90.000'); // 10 + 150 - 70
  });

  it('source-stock respects asOf', async () => {
    const sept = await owner.get('/api/v1/reports/source-stock?asOf=2026-09-30');
    expect(sept.body.data).toEqual([
      {
        sourceCompanyId: akshat._id,
        sourceCompanyName: 'Akshat TMT',
        materialId: material._id,
        materialName: 'MS Scrap Fish Cut',
        purchasedTons: '100.000',
        usedForSalesTons: '30.000',
        availableTons: '70.000'
      }
    ]);
    const before = await owner.get('/api/v1/reports/source-stock?asOf=2026-09-10');
    expect(before.body.data[0]).toMatchObject({
      purchasedTons: '100.000',
      usedForSalesTons: '0.000',
      availableTons: '100.000'
    });
  });
});

describe('dashboard calculations', () => {
  it('computes weighted average rates, not averages of rates', async () => {
    await f.purchase({ company: akshat, material, qty: '10', rate: '100', date: '2026-09-02' });
    await f.purchase({ company: akshat, material, qty: '30', rate: '200', date: '2026-09-03' });
    const { data } = await dashboard({ from: '2026-09-01', to: '2026-09-30' });
    // (10*100 + 30*200) / 40 = 175, not (100+200)/2 = 150
    expect(data.purchases).toEqual({ quantityTons: '40.000', value: '7000.00', averageBuyingRate: '175.00' });
    expect(data.sales).toEqual({ quantityTons: '0.000', value: '0.00', averageSellingRate: '0.00' });
  });

  it('shows purchase required when open PO demand exceeds stock (100 stock vs 115 demand)', async () => {
    await f.purchase({ company: akshat, material, qty: '90', date: '2026-09-01' }); // 10 opening + 90
    await f.po({ customer, material, qty: '60', date: '2026-09-02' });
    await f.po({ customer, material, qty: '55', date: '2026-09-03' });
    const cancelled = await f.po({ customer, material, qty: '500', date: '2026-09-04' });
    await owner.patch(`/api/v1/sales-pos/${cancelled._id}`, { lifecycleStatus: 'CANCELLED' });

    const { data } = await dashboard({ to: '2026-09-30' });
    expect(data.po).toMatchObject({ poQuantityTons: '115.000', activePOCount: 2, openPOCount: 2 });
    expect(data.materials[0]).toMatchObject({
      currentStockTons: '100.000',
      remainingPOQuantityTons: '115.000',
      purchaseRequiredTons: '15.000',
      extraStockTons: '0.000'
    });
  });

  it('breaks activity down per material and filters by material', async () => {
    const copper = await f.material('Copper');
    await f.purchase({ company: akshat, material, qty: '5', rate: '100', date: '2026-09-02' });
    await f.purchase({ company: akshat, material: copper, qty: '2', rate: '500', date: '2026-09-02' });

    const all = await dashboard({ from: '2026-09-01', to: '2026-09-30' });
    expect(all.data.materials.map((m) => [m.materialName, m.purchasedTons, m.averageBuyingRate])).toEqual([
      ['Copper', '2.000', '500.00'],
      ['MS Scrap Fish Cut', '5.000', '100.00']
    ]);

    const one = await dashboard({ from: '2026-09-01', to: '2026-09-30', materialId: copper._id });
    expect(one.data.purchases.quantityTons).toBe('2.000');
    expect(one.data.materials).toHaveLength(1);
  });

  it('totals the period per supplier and per buyer, biggest value first', async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: akshat, material, qty: '10', rate: '100', date: '2026-09-02' });
    await f.purchase({ company: akshat, material, qty: '30', rate: '200', date: '2026-09-03' });
    await f.purchase({ company: other, material, qty: '5', rate: '1000', date: '2026-09-04' });
    await f.purchase({ company: other, material, qty: '99', date: '2026-10-02' }); // outside the period
    const po = await f.po({ customer, material, qty: '20', rate: '300', date: '2026-09-05' });
    await f.saleOk({ po, source: akshat, qty: '4', date: '2026-09-10' });
    await f.saleOk({ po, source: other, qty: '2', date: '2026-09-11' });

    const { data } = await dashboard({ from: '2026-09-01', to: '2026-09-30' });
    expect(data.companies).toEqual({
      suppliers: [
        {
          companyId: akshat._id,
          companyName: 'Akshat TMT',
          quantityTons: '40.000',
          value: '7000.00',
          averageRate: '175.00'
        },
        {
          companyId: other._id,
          companyName: 'Other Supplier',
          quantityTons: '5.000',
          value: '5000.00',
          averageRate: '1000.00'
        }
      ],
      buyers: [
        {
          companyId: customer._id,
          companyName: 'Shree Steel',
          quantityTons: '6.000',
          value: '1800.00',
          averageRate: '300.00'
        }
      ]
    });
  });

  it('hides inactive materials unless they still hold stock or activity', async () => {
    const empty = await f.material('Retired Empty');
    const holding = await f.material('Retired Holding', '3');
    await owner.patch(`/api/v1/materials/${empty._id}`, { isActive: false });
    await owner.patch(`/api/v1/materials/${holding._id}`, { isActive: false });
    const names = (await dashboard({ to: '2026-09-30' })).data.materials.map((m) => m.materialName);
    expect(names).toContain('Retired Holding');
    expect(names).not.toContain('Retired Empty');
  });

  it('defaults `to` to today and validates the range', async () => {
    const { data } = await dashboard({});
    expect(data.period.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.period.from).toBeNull();
    const bad = await owner.get('/api/v1/reports/dashboard?from=2026-10-01&to=2026-09-01');
    expect(bad.status).toBe(422);
  });
});

describe('company report', () => {
  it('scopes activity to the company and includes its supplier pools', async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: akshat, material, qty: '40', rate: '100', date: '2026-09-01' });
    await f.purchase({ company: other, material, qty: '25', rate: '120', date: '2026-09-01' });
    const po = await f.po({ customer, material, qty: '50', date: '2026-09-01' });
    await f.saleOk({ po, source: akshat, qty: '10', date: '2026-09-05' });

    const res = await owner.get(`/api/v1/reports/companies/${akshat._id}?from=2026-09-01&to=2026-09-30`);
    expect(res.status).toBe(200);
    expect(res.body.data.company).toMatchObject({ name: 'Akshat TMT', type: 'PURCHASE' });
    expect(res.body.data.purchases).toMatchObject({ quantityTons: '40.000', value: '4000.00' });
    expect(res.body.data.sourceStock).toEqual([
      expect.objectContaining({ purchasedTons: '40.000', usedForSalesTons: '10.000', availableTons: '30.000' })
    ]);

    const customerReport = await owner.get(`/api/v1/reports/companies/${customer._id}?to=2026-09-30`);
    expect(customerReport.body.data.sales.quantityTons).toBe('10.000');
    expect(customerReport.body.data.po).toMatchObject({ poQuantityTons: '50.000', remainingQuantityTons: '40.000' });
    expect(customerReport.body.data.sourceStock).toEqual([]);
  });

  it('returns 404 for an unknown company', async () => {
    const res = await owner.get('/api/v1/reports/companies/66f000000000000000000999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('COMPANY_NOT_FOUND');
  });
});

describe('access', () => {
  it('VIEWER can read reports', async () => {
    const viewer = await authedClient({ email: 'viewer@example.com', role: ROLES.VIEWER });
    expect((await viewer.get('/api/v1/reports/dashboard')).status).toBe(200);
    expect((await viewer.get('/api/v1/reports/source-stock')).status).toBe(200);
  });
});

describe('GET /reports/trend', () => {
  const trend = (query) => owner.get(`/api/v1/reports/trend?${new URLSearchParams(query)}`);

  beforeEach(async () => {
    const other = await f.company('Other Supplier', 'PURCHASE');
    await f.purchase({ company: akshat, material, qty: '20', rate: '100', date: '2026-09-02' });
    await f.purchase({ company: akshat, material, qty: '5.5', rate: '200', date: '2026-09-06' });
    await f.purchase({ company: other, material, qty: '10', rate: '100', date: '2026-09-15' });
    const po = await f.po({ customer, material, qty: '30', rate: '150', date: '2026-09-01' });
    await f.saleOk({ po, source: akshat, qty: '12', date: '2026-09-08' });
    await f.saleOk({ po, source: other, qty: '4.25', date: '2026-09-30' });
  });

  it('totals bought and delivered per Monday-Sunday week, keeping empty weeks', async () => {
    const res = await trend({ from: '2026-09-01', to: '2026-09-27' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ from: '2026-09-01', to: '2026-09-27', bucket: 'week' });
    expect(res.body.data.points).toEqual([
      {
        start: '2026-09-01',
        end: '2026-09-06',
        purchasedTons: '25.500',
        purchaseValue: '3100.00',
        deliveredTons: '0.000',
        salesValue: '0.00'
      },
      {
        start: '2026-09-07',
        end: '2026-09-13',
        purchasedTons: '0.000',
        purchaseValue: '0.00',
        deliveredTons: '12.000',
        salesValue: '1800.00'
      },
      {
        start: '2026-09-14',
        end: '2026-09-20',
        purchasedTons: '10.000',
        purchaseValue: '1000.00',
        deliveredTons: '0.000',
        salesValue: '0.00'
      },
      {
        start: '2026-09-21',
        end: '2026-09-27',
        purchasedTons: '0.000',
        purchaseValue: '0.00',
        deliveredTons: '0.000',
        salesValue: '0.00'
      }
    ]);
  });

  it('scopes like the dashboard and honours an explicit bucket', async () => {
    const supplier = await trend({ from: '2026-09-01', to: '2026-09-30', companyId: akshat._id, bucket: 'month' });
    expect(supplier.body.data.points).toEqual([
      {
        start: '2026-09-01',
        end: '2026-09-30',
        purchasedTons: '25.500',
        purchaseValue: '3100.00',
        deliveredTons: '0.000',
        salesValue: '0.00'
      }
    ]);
    const buyer = await trend({ from: '2026-09-01', to: '2026-09-30', companyId: customer._id, bucket: 'month' });
    expect(buyer.body.data.points[0]).toMatchObject({ purchasedTons: '0.000', deliveredTons: '16.250' });

    const days = await trend({ from: '2026-09-29', to: '2026-09-30' });
    expect(days.body.data.bucket).toBe('day');
    expect(days.body.data.points.map((p) => p.deliveredTons)).toEqual(['0.000', '4.250']);
  });

  it('requires a valid range', async () => {
    expect((await trend({ from: '2026-09-01' })).status).toBe(422);
    expect((await trend({ from: '2026-09-30', to: '2026-09-01' })).status).toBe(422);
    expect((await trend({ from: '2020-01-01', to: '2026-01-01', bucket: 'day' })).status).toBe(422);
    expect((await trend({ from: '2026-09-01', to: '2026-09-30', bucket: 'year' })).status).toBe(422);
  });
});
