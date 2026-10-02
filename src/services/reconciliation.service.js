import { AppError } from '../errors/AppError.js';
import { PURCHASE_COMPANY_TYPES } from '../constants/companyTypes.js';
import { amountFrom, D } from '../utils/decimal.js';
import { maxDeliverableTons } from '../utils/poTolerance.js';
import { Company, Material, Purchase, SalesPO, Sale } from '../models/index.js';
import { stockService } from './stock.service.js';

/**
 * Full-database integrity audit ("run after any data correction"). Re-proves every invariant the
 * write path enforces, so direct database edits, restores or migrations cannot silently leave the
 * books inconsistent. Read-only.
 */

async function collectLedgerIssue(issues, type, check) {
  try {
    await check();
  } catch (err) {
    if (!(err instanceof AppError)) throw err;
    issues.push({ type, ...err.details });
  }
}

async function checkMaterialLedgers(issues) {
  const materials = await Material.find().select('_id name').lean();
  for (const m of materials) {
    await collectLedgerIssue(issues, 'NEGATIVE_MATERIAL_STOCK', () =>
      stockService.assertMaterialLedgerNonNegative(m._id)
    );
  }
  return materials.length;
}

async function checkSourceLedgers(issues) {
  const [fromPurchases, fromSales] = await Promise.all([
    Purchase.aggregate([{ $group: { _id: { companyId: '$companyId', materialId: '$materialId' } } }]),
    Sale.aggregate([{ $group: { _id: { companyId: '$sourceCompanyId', materialId: '$materialId' } } }])
  ]);
  const pools = new Map([...fromPurchases, ...fromSales].map(({ _id }) => [`${_id.companyId}:${_id.materialId}`, _id]));
  for (const { companyId, materialId } of pools.values()) {
    await collectLedgerIssue(issues, 'NEGATIVE_SOURCE_STOCK', () =>
      stockService.assertSourceLedgerNonNegative(companyId, materialId)
    );
  }
  return pools.size;
}

async function checkPOs(issues) {
  const rows = await SalesPO.aggregate([
    { $lookup: { from: 'sales', localField: '_id', foreignField: 'poId', as: 'sales' } },
    {
      $project: {
        poNumber: 1,
        companyId: 1,
        materialId: 1,
        quantityTons: 1,
        tolerancePercent: 1,
        sold: { $sum: '$sales.quantityTons' },
        mismatched: {
          $filter: {
            input: '$sales',
            cond: { $or: [{ $ne: ['$$this.companyId', '$companyId'] }, { $ne: ['$$this.materialId', '$materialId'] }] }
          }
        }
      }
    }
  ]);
  for (const po of rows) {
    if (D(po.sold).gt(maxDeliverableTons(po.quantityTons, po.tolerancePercent))) {
      issues.push({
        type: 'PO_OVER_DELIVERED',
        poId: String(po._id),
        poNumber: po.poNumber,
        quantityTons: D(po.quantityTons).toFixed(3),
        soldTons: D(po.sold).toFixed(3)
      });
    }
    for (const sale of po.mismatched) {
      issues.push({
        type: 'SALE_PO_MISMATCH',
        saleId: String(sale._id),
        poId: String(po._id),
        message: 'Sale customer/material differs from its PO'
      });
    }
  }
  const orphans = await Sale.aggregate([
    { $lookup: { from: 'salespos', localField: 'poId', foreignField: '_id', as: 'po' } },
    { $match: { po: { $size: 0 } } },
    { $project: { _id: 1 } }
  ]);
  for (const s of orphans) issues.push({ type: 'SALE_WITHOUT_PO', saleId: String(s._id) });
  return rows.length;
}

async function checkSourceCompanyTypes(issues) {
  const invalid = await Company.find({ type: { $nin: PURCHASE_COMPANY_TYPES } })
    .select('_id')
    .lean();
  if (!invalid.length) return;
  const sales = await Sale.find({ sourceCompanyId: { $in: invalid.map((c) => c._id) } })
    .select('_id sourceCompanyId')
    .lean();
  for (const s of sales)
    issues.push({
      type: 'INVALID_SOURCE_COMPANY_TYPE',
      saleId: String(s._id),
      sourceCompanyId: String(s.sourceCompanyId)
    });
}

/** Stored totals must equal quantity x rate (half-up to 2 dp) exactly. */
async function checkAmounts(issues) {
  const specs = [
    {
      model: Purchase,
      type: 'PURCHASE_AMOUNT_MISMATCH',
      qty: 'quantityTons',
      rate: 'ratePerTon',
      total: 'totalAmount'
    },
    { model: SalesPO, type: 'PO_AMOUNT_MISMATCH', qty: 'quantityTons', rate: 'ratePerTon', total: 'totalPOAmount' },
    { model: Sale, type: 'SALE_AMOUNT_MISMATCH', qty: 'quantityTons', rate: 'poRateAtSale', total: 'totalAmount' }
  ];
  let checked = 0;
  for (const { model, type, qty, rate, total } of specs) {
    for await (const doc of model.find().select(`${qty} ${rate} ${total}`).lean().cursor()) {
      checked++;
      const expected = amountFrom(doc[qty], doc[rate]);
      if (!D(doc[total]).eq(D(expected))) {
        issues.push({ type, id: String(doc._id), storedAmount: D(doc[total]).toFixed(2), expectedAmount: expected });
      }
    }
  }
  return checked;
}

export const reconciliationService = {
  async run() {
    const issues = [];
    const materials = await checkMaterialLedgers(issues);
    const sourcePools = await checkSourceLedgers(issues);
    const salesPOs = await checkPOs(issues);
    await checkSourceCompanyTypes(issues);
    const amounts = await checkAmounts(issues);
    return {
      checkedAt: new Date(),
      checked: { materials, sourcePools, salesPOs, amounts },
      ok: issues.length === 0,
      issues
    };
  }
};
