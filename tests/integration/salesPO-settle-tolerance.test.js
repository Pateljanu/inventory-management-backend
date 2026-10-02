import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures, unwrap } from '../helpers/fixtures.js';
import { ROLES } from '../../src/constants/roles.js';
import { reconciliationService } from '../../src/services/reconciliation.service.js';

const clearDatabase = useTestDatabase();
let owner;
let f;
let supplier;
let customer;
let material;

const getPO = async (po) => unwrap(await owner.get(`/api/v1/sales-pos/${po._id}`), 200);

beforeEach(async () => {
  await clearDatabase();
  owner = await authedClient();
  f = fixtures(owner);
  supplier = await f.company('Akshar Ispat', 'PURCHASE');
  customer = await f.company('RM Technocast', 'SALE');
  material = await f.material('Fish Cut');
  await f.purchase({ company: supplier, material, qty: '100' });
});

describe('order tolerance', () => {
  it('defaults to none, so an order without one keeps its exact limit', async () => {
    const po = await f.po({ customer, material, qty: '30' });
    expect(po.tolerancePercent).toBe('0.00');
    const res = await f.sale({ po, source: supplier, qty: '30.001' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PO_QUANTITY_EXCEEDED');
  });

  it('allows delivering up to ordered + tolerance and shows the extra', async () => {
    const po = await f.po({ customer, material, qty: '30', rate: '43200.00', tolerancePercent: '5' });

    const capacity = unwrap(
      await owner.get(`/api/v1/sales/capacity?poId=${po._id}&saleDate=2026-09-10&sourceCompanyId=${supplier._id}`),
      200
    );
    expect(capacity).toMatchObject({
      remainingQuantityTons: '30.000',
      tolerancePercent: '5.00',
      poAllowanceTons: '31.500',
      maxAllowedTons: '31.500',
      limitedBy: 'PO'
    });

    const over = await f.sale({ po, source: supplier, qty: '31.501' });
    expect(over.status).toBe(409);
    expect(over.body.error.code).toBe('PO_QUANTITY_EXCEEDED');
    expect(over.body.error.details).toMatchObject({ remainingQuantityTons: '30.000', maxAllowedTons: '31.500' });

    const sale = await f.saleOk({ po, source: supplier, qty: '31.2' });
    expect(sale.totalAmount).toBe('1347840.00'); // 31.2 x 43,200: extra tons at the same rate

    expect(await getPO(po)).toMatchObject({
      soldQuantityTons: '31.200',
      remainingQuantityTons: '0.000',
      extraQuantityTons: '1.200',
      displayStatus: 'COMPLETED'
    });
    const audit = await reconciliationService.run();
    expect(audit.issues.filter((i) => i.type === 'PO_OVER_DELIVERED')).toEqual([]);
  });

  it('lets an order be edited down only as far as its tolerance still covers the deliveries', async () => {
    const po = await f.po({ customer, material, qty: '35', tolerancePercent: '5' });
    await f.saleOk({ po, source: supplier, qty: '31' });

    const ok = await owner.patch(`/api/v1/sales-pos/${po._id}`, { quantityTons: '30' });
    expect(ok.status).toBe(200);

    const tooLow = await owner.patch(`/api/v1/sales-pos/${po._id}`, { quantityTons: '29' });
    expect(tooLow.status).toBe(409);
    expect(tooLow.body.error.code).toBe('PO_QTY_BELOW_SOLD');

    const noTolerance = await owner.patch(`/api/v1/sales-pos/${po._id}`, { tolerancePercent: '0' });
    expect(noTolerance.status).toBe(409);
    expect(noTolerance.body.error.code).toBe('PO_QTY_BELOW_SOLD');
  });

  it('rejects a tolerance above 50%', async () => {
    const res = await owner.post('/api/v1/sales-pos', {
      poNumber: 'PO-X',
      poDate: '2026-09-01',
      companyId: customer._id,
      materialId: material._id,
      quantityTons: '10',
      ratePerTon: '1',
      tolerancePercent: '51'
    });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('settle a sales order', () => {
  it('sets the order to what was delivered, keeps the rate and stops counting it as open', async () => {
    const po = await f.po({ customer, material, qty: '30', rate: '43200.00' });
    await f.saleOk({ po, source: supplier, qty: '28' });

    const settled = unwrap(await owner.post(`/api/v1/sales-pos/${po._id}/settle`), 200);
    expect(settled).toMatchObject({
      quantityTons: '28.000',
      originalQuantityTons: '30.000',
      ratePerTon: '43200.00',
      totalPOAmount: '1209600.00',
      soldQuantityTons: '28.000',
      remainingQuantityTons: '0.000',
      displayStatus: 'COMPLETED'
    });

    const dashboard = unwrap(await owner.get('/api/v1/reports/dashboard?to=2026-12-31'), 200);
    expect(dashboard.po).toMatchObject({ remainingQuantityTons: '0.000', openPOCount: 0 });

    // Sending more later: edit the quantity back up and the order is open again.
    const reopened = unwrap(await owner.patch(`/api/v1/sales-pos/${po._id}`, { quantityTons: '30' }), 200);
    expect(reopened.originalQuantityTons).toBe('30.000');
    expect((await getPO(po)).displayStatus).toBe('PARTIALLY_SUPPLIED');
  });

  it('refuses orders with nothing to settle', async () => {
    const empty = await f.po({ customer, material, qty: '10' });
    const none = await owner.post(`/api/v1/sales-pos/${empty._id}/settle`);
    expect(none.status).toBe(409);
    expect(none.body.error.code).toBe('NOTHING_TO_SETTLE');

    const full = await f.po({ customer, material, qty: '10' });
    await f.saleOk({ po: full, source: supplier, qty: '10' });
    const done = await owner.post(`/api/v1/sales-pos/${full._id}/settle`);
    expect(done.status).toBe(409);
    expect(done.body.error.code).toBe('NOTHING_TO_SETTLE');

    const cancelled = await f.po({ customer, material, qty: '10' });
    await f.saleOk({ po: cancelled, source: supplier, qty: '4' });
    await owner.patch(`/api/v1/sales-pos/${cancelled._id}`, { lifecycleStatus: 'CANCELLED' });
    const res = await owner.post(`/api/v1/sales-pos/${cancelled._id}/settle`);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PO_NOT_AVAILABLE');
  });

  it('is for the OWNER only', async () => {
    const po = await f.po({ customer, material, qty: '10' });
    await f.saleOk({ po, source: supplier, qty: '4' });
    const viewer = await authedClient({ email: 'viewer@example.com', role: ROLES.VIEWER });
    const res = await viewer.post(`/api/v1/sales-pos/${po._id}/settle`);
    expect(res.status).toBe(403);
  });
});
