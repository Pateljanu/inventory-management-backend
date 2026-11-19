import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures, unwrap } from '../helpers/fixtures.js';
import { ROLES } from '../../src/constants/roles.js';
import { SalesPO } from '../../src/models/SalesPO.js';
import { Sale } from '../../src/models/Sale.js';
import { reconciliationService } from '../../src/services/reconciliation.service.js';

const clearDatabase = useTestDatabase();
let owner;
let f;
let akshar;
let buyer;
let material;

beforeEach(async () => {
  await clearDatabase();
  owner = await authedClient();
  f = fixtures(owner);
  akshar = await f.company('Akshar Ispat', 'PURCHASE');
  buyer = await f.company('RM Techno Cast', 'SALE');
  material = await f.material('MS Fish Cut');
});

const newPO = (body) =>
  owner.post('/api/v1/sales-pos', {
    companyId: buyer._id,
    materialId: material._id,
    quantityTons: '30',
    ratePerTon: '42150',
    ...body
  });

const newSale = (body) => owner.post('/api/v1/sales', { sourceCompanyId: akshar._id, ...body });

/**
 * The real case: one order typed twice, one truck saved on each copy, then one copy cancelled.
 * Built the way older data holds it (cancelling with deliveries is now blocked).
 */
async function duplicateTruckScenario() {
  await f.purchase({ company: akshar, material, qty: '100', date: '2026-10-20', rate: '39000' });
  const real = await f.po({
    customer: buyer,
    material,
    qty: '30',
    rate: '42150',
    date: '2026-10-28',
    poNumber: 'RM-TELE-27/10',
    tolerancePercent: '10'
  });
  const copy = await f.po({
    customer: buyer,
    material,
    qty: '30',
    rate: '42150',
    date: '2026-10-25',
    poNumber: 'RM Tele 25/10',
    tolerancePercent: '10'
  });
  const truck = { qty: '30.565', vehicleNumber: 'GJ10TX5819' };
  await f.saleOk({ po: real, source: akshar, date: '2026-10-30', ...truck });
  const mistake = await f.saleOk({ po: copy, source: akshar, date: '2026-10-31', ...truck });
  await SalesPO.updateOne({ _id: copy._id }, { lifecycleStatus: 'CANCELLED' });
  return { real, copy, mistake };
}

describe('void a delivery', () => {
  it('fixes stock, supplier stock, the order and every report at once', async () => {
    const { real, copy, mistake } = await duplicateTruckScenario();
    const dashboard = () => owner.get('/api/v1/reports/dashboard?from=2026-10-01&to=2026-10-31');
    const before = (await dashboard()).body.data;
    expect(before.sales.quantityTons).toBe('61.130');
    expect((await reconciliationService.run()).issues.map((i) => i.type)).toEqual(['CANCELLED_PO_WITH_DELIVERIES']);

    const res = await owner.post(`/api/v1/sales/${mistake._id}/void`, { reason: 'Same truck saved twice' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      _id: mistake._id,
      voidReason: 'Same truck saved twice',
      quantityTons: '30.565'
    });

    // Gone from deliveries, kept in the voided list.
    expect((await owner.get(`/api/v1/sales/${mistake._id}`)).status).toBe(404);
    const list = await owner.get('/api/v1/sales');
    expect(list.body.data.map((s) => s._id)).not.toContain(mistake._id);
    const voided = await owner.get('/api/v1/sales/voided');
    expect(voided.body.data).toHaveLength(1);
    expect(voided.body.data[0]).toMatchObject({ _id: mistake._id, poId: { poNumber: 'RM Tele 25/10' } });
    expect(voided.body.meta.total).toBe(1);

    const after = (await dashboard()).body.data;
    expect(after.sales).toEqual({ quantityTons: '30.565', value: '1288314.75', averageSellingRate: '42150.00' });
    expect(after.materials[0].currentStockTons).toBe('69.435'); // 100 bought - 30.565 delivered once

    const pools = (await owner.get('/api/v1/reports/source-stock?asOf=2026-10-31')).body.data;
    expect(pools[0]).toMatchObject({ usedForSalesTons: '30.565', availableTons: '69.435' });

    const copyPO = (await owner.get(`/api/v1/sales-pos/${copy._id}`)).body.data;
    expect(copyPO).toMatchObject({ soldQuantityTons: '0', displayStatus: 'CANCELLED' });
    const realPO = (await owner.get(`/api/v1/sales-pos/${real._id}`)).body.data;
    expect(realPO).toMatchObject({ soldQuantityTons: '30.565', displayStatus: 'COMPLETED' });

    expect((await reconciliationService.run()).ok).toBe(true);
  });

  it('needs a reason, an existing delivery and the OWNER role', async () => {
    const { mistake } = await duplicateTruckScenario();
    const noReason = await owner.post(`/api/v1/sales/${mistake._id}/void`, { reason: ' ' });
    expect(noReason.status).toBe(422);

    const viewer = await authedClient({ email: 'viewer@example.com', role: ROLES.VIEWER });
    expect((await viewer.post(`/api/v1/sales/${mistake._id}/void`, { reason: 'mistake' })).status).toBe(403);
    expect((await viewer.get('/api/v1/sales/voided')).status).toBe(200);

    expect((await owner.post(`/api/v1/sales/${mistake._id}/void`, { reason: 'mistake' })).status).toBe(200);
    const again = await owner.post(`/api/v1/sales/${mistake._id}/void`, { reason: 'mistake' });
    expect(again.status).toBe(404);
    expect(again.body.error.code).toBe('SALE_NOT_FOUND');
    expect(await Sale.countDocuments()).toBe(1);
  });

  it('frees the challan number and the order allowance', async () => {
    await f.purchase({ company: akshar, material, qty: '100' });
    const po = await f.po({ customer: buyer, material, qty: '10' });
    const sale = await f.saleOk({ po, source: akshar, qty: '10', challanNumber: 'CH-1' });
    expect((await f.sale({ po, source: akshar, qty: '1' })).body.error.code).toBe('PO_QUANTITY_EXCEEDED');

    await owner.post(`/api/v1/sales/${sale._id}/void`, { reason: 'wrong order' });
    expect((await f.sale({ po, source: akshar, qty: '10', challanNumber: 'CH-1' })).status).toBe(201);
  });
});

describe('cancelling an order', () => {
  it('is blocked once it has deliveries, and allowed again after they are voided', async () => {
    await f.purchase({ company: akshar, material, qty: '100' });
    const po = await f.po({ customer: buyer, material, qty: '30' });
    const sale = await f.saleOk({ po, source: akshar, qty: '5' });

    const blocked = await owner.patch(`/api/v1/sales-pos/${po._id}`, { lifecycleStatus: 'CANCELLED' });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error).toMatchObject({ code: 'PO_HAS_DELIVERIES', details: { soldQuantityTons: '5.000' } });

    await owner.post(`/api/v1/sales/${sale._id}/void`, { reason: 'entered on the wrong order' });
    expect((await owner.patch(`/api/v1/sales-pos/${po._id}`, { lifecycleStatus: 'CANCELLED' })).status).toBe(200);
  });

  it('still lets an older cancelled order be reopened', async () => {
    const { copy } = await duplicateTruckScenario();
    expect((await owner.patch(`/api/v1/sales-pos/${copy._id}`, { lifecycleStatus: 'ACTIVE' })).status).toBe(200);
  });
});

describe('duplicate warnings', () => {
  it('warns about an open order with the same buyer, material, tons and rate within a week', async () => {
    await f.po({
      customer: buyer,
      material,
      qty: '30',
      rate: '42150',
      date: '2026-10-25',
      poNumber: 'RM Tele 25/10',
      tolerancePercent: '10'
    });

    const res = await newPO({ poNumber: 'RM-TELE-27/10', poDate: '2026-10-28' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'POSSIBLE_DUPLICATE',
      details: {
        matches: [{ poNumber: 'RM Tele 25/10', poDate: '2026-10-25', quantityTons: '30.000', ratePerTon: '42150.00' }]
      }
    });

    const confirmed = await newPO({ poNumber: 'RM-TELE-27/10', poDate: '2026-10-28', allowDuplicate: true });
    expect(confirmed.status).toBe(201);
  });

  it('does not warn for a different rate, a far date or a cancelled order', async () => {
    const old = await f.po({ customer: buyer, material, qty: '30', rate: '42150', date: '2026-10-01' });
    const cancelled = await f.po({ customer: buyer, material, qty: '30', rate: '42150', date: '2026-10-20' });
    await owner.patch(`/api/v1/sales-pos/${cancelled._id}`, { lifecycleStatus: 'CANCELLED' });
    expect(old).toBeTruthy();

    expect((await newPO({ poNumber: 'A', poDate: '2026-10-22', ratePerTon: '42000' })).status).toBe(201);
    expect((await newPO({ poNumber: 'B', poDate: '2026-10-22' })).status).toBe(201);
  });

  it('warns about the same truck within 3 days, or the same buyer and exact tons', async () => {
    await f.purchase({ company: akshar, material, qty: '200', date: '2026-10-20' });
    const real = await f.po({
      customer: buyer,
      material,
      qty: '100',
      date: '2026-10-25',
      poNumber: 'RM-TELE-27/10',
      tolerancePercent: '10'
    });
    const other = await f.po({
      customer: buyer,
      material,
      qty: '100',
      date: '2026-10-25',
      poNumber: 'RM-2',
      rate: '1'
    });
    await f.saleOk({ po: real, source: akshar, qty: '30.565', date: '2026-10-30', vehicleNumber: 'GJ10TX5819' });

    const sameTruck = await newSale({
      poId: other._id,
      saleDate: '2026-10-31',
      quantityTons: '12',
      vehicleNumber: 'gj10 tx 5819'
    });
    expect(sameTruck.status).toBe(409);
    expect(sameTruck.body.error.code).toBe('POSSIBLE_DUPLICATE');
    expect(sameTruck.body.error.details.matches).toEqual([
      expect.objectContaining({
        saleDate: '2026-10-30',
        poNumber: 'RM-TELE-27/10',
        buyerName: 'RM Techno Cast',
        quantityTons: '30.565',
        vehicleNumber: 'GJ10TX5819',
        sameVehicle: true,
        sameTons: false
      })
    ]);

    const sameTons = await newSale({ poId: other._id, saleDate: '2026-11-01', quantityTons: '30.565' });
    expect(sameTons.body.error.details.matches[0]).toMatchObject({ sameVehicle: false, sameTons: true });

    // A different truck and weight, or the same truck a week later, is fine.
    expect(
      (await newSale({ poId: other._id, saleDate: '2026-10-31', quantityTons: '12', vehicleNumber: 'GJ01AA1111' }))
        .status
    ).toBe(201);
    expect(
      (await newSale({ poId: other._id, saleDate: '2026-11-06', quantityTons: '5', vehicleNumber: 'GJ10TX5819' }))
        .status
    ).toBe(201);

    // Confirmed: a truck can make two trips.
    const confirmed = await newSale({
      poId: other._id,
      saleDate: '2026-10-31',
      quantityTons: '12',
      vehicleNumber: 'GJ10TX5819',
      allowDuplicate: true
    });
    expect(unwrap(confirmed).vehicleNumber).toBe('GJ10TX5819');
  });

  it('checks the stock limits before the duplicate warning', async () => {
    await f.purchase({ company: akshar, material, qty: '10' });
    const po = await f.po({ customer: buyer, material, qty: '100' });
    await f.saleOk({ po, source: akshar, qty: '5', vehicleNumber: 'GJ10TX5819' });
    const res = await newSale({
      poId: po._id,
      saleDate: '2026-09-10',
      quantityTons: '50',
      vehicleNumber: 'GJ10TX5819'
    });
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });
});
