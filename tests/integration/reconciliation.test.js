import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/db.js';
import { authedClient } from '../helpers/api.js';
import { fixtures } from '../helpers/fixtures.js';
import { reconciliationService } from '../../src/services/reconciliation.service.js';
import { Company, Purchase, Sale, SalesPO } from '../../src/models/index.js';
import { d128 } from '../../src/utils/decimal.js';

const clearDatabase = useTestDatabase();
let f;
let akshat;
let customer;
let material;
let purchase;
let po;
let sale;

beforeEach(async () => {
  await clearDatabase();
  f = fixtures(await authedClient());
  akshat = await f.company('Akshat TMT', 'PURCHASE');
  customer = await f.company('Shree Steel', 'SALE');
  material = await f.material('MS Scrap');
  purchase = await f.purchase({ company: akshat, material, qty: '40', date: '2026-09-01' });
  po = await f.po({ customer, material, qty: '20' });
  sale = await f.saleOk({ po, source: akshat, qty: '15', date: '2026-09-05' });
});

const types = (report) => report.issues.map((i) => i.type).sort();

describe('reconciliation audit', () => {
  it('reports a clean database as consistent', async () => {
    const report = await reconciliationService.run();
    expect(report.ok).toBe(true);
    expect(report.checked).toEqual({ materials: 1, sourcePools: 1, salesPOs: 1, amounts: 3 });
  });

  it('detects negative stock history introduced by a direct database edit', async () => {
    // Bypasses the API: the kind of manual correction the audit exists to catch.
    await Purchase.updateOne({ _id: purchase._id }, { quantityTons: d128('10'), totalAmount: d128('1000', 2) });
    const report = await reconciliationService.run();
    expect(types(report)).toEqual(['NEGATIVE_MATERIAL_STOCK', 'NEGATIVE_SOURCE_STOCK']);
    expect(report.issues.find((i) => i.type === 'NEGATIVE_MATERIAL_STOCK')).toMatchObject({ balanceTons: '-5.000' });
  });

  it('detects over-delivered POs, PO/sale mismatches, wrong amounts and invalid source companies', async () => {
    await SalesPO.updateOne({ _id: po._id }, { quantityTons: d128('10') });
    const other = await Company.create({ name: 'Elsewhere', normalizedName: 'elsewhere', type: 'SALE' });
    await Sale.updateOne({ _id: sale._id }, { companyId: other._id, totalAmount: d128('1', 2) });
    await Company.updateOne({ _id: akshat._id }, { type: 'SALE' });

    const report = await reconciliationService.run();
    expect(types(report)).toEqual(
      [
        'INVALID_SOURCE_COMPANY_TYPE',
        'PO_AMOUNT_MISMATCH',
        'PO_OVER_DELIVERED',
        'SALE_AMOUNT_MISMATCH',
        'SALE_PO_MISMATCH'
      ].sort()
    );
    expect(report.issues.find((i) => i.type === 'PO_OVER_DELIVERED')).toMatchObject({
      quantityTons: '10.000',
      soldTons: '15.000'
    });
  });
});
