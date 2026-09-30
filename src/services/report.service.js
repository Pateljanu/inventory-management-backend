import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { PO_LIFECYCLE } from '../constants/poStatus.js';
import { D, Decimal, maxZero, MONEY_SCALE, QTY_SCALE, RATE_SCALE } from '../utils/decimal.js';
import { autoBucket, bucketRanges, businessToday, endOfDayUTC, toDateOnlyString } from '../utils/date.js';
import { toObjectId } from '../utils/objectId.js';
import { purchaseRepository } from '../repositories/purchase.repository.js';
import { saleRepository } from '../repositories/sale.repository.js';
import { salesPORepository } from '../repositories/salesPO.repository.js';
import { materialRepository } from '../repositories/material.repository.js';
import { companyRepository } from '../repositories/company.repository.js';
import { stockService } from './stock.service.js';

/*
 * Reporting semantics (never mix these two):
 *  - ACTIVITY metrics use the period: purchaseDate / saleDate within [from, to].
 *  - POSITION metrics are balances AS OF `to`: stock, PO delivered/remaining, purchase requirement.
 * A report ending Sept 30 therefore ignores October sales even when run in November.
 */

const ZERO = new Decimal(0);
const qtyStr = (d) => D(d).toFixed(QTY_SCALE);
const moneyStr = (d) => D(d).toFixed(MONEY_SCALE);
const avgRate = (value, quantity) => (quantity.gt(0) ? value.div(quantity) : ZERO).toFixed(RATE_SCALE);
const byName = (a, b) => (a.name || '').localeCompare(b.name || '');

function resolvePeriod({ from, to }) {
  const asOf = to ?? businessToday(env.BUSINESS_TIMEZONE);
  return { from: from ?? null, asOf, cutoff: endOfDayUTC(asOf) };
}

function activityRange(from, cutoff) {
  return { ...(from ? { $gte: from } : {}), $lte: cutoff };
}

function sumRows(rows) {
  return rows.reduce((acc, r) => ({ quantity: acc.quantity.plus(r.quantity), value: acc.value.plus(r.value) }), {
    quantity: ZERO,
    value: ZERO
  });
}

/** Remaining quantity per active PO as of the cutoff, using one aggregation for all POs. */
async function poPositionsAsOf(poMatch, cutoff) {
  const pos = await salesPORepository.model.find(poMatch).select('_id materialId quantityTons').lean();
  const deliveredRows = pos.length
    ? await saleRepository.groupTotals({ poId: { $in: pos.map((p) => p._id) }, saleDate: { $lte: cutoff } }, '$poId', {
        quantity: 'quantityTons'
      })
    : [];
  const delivered = new Map(deliveredRows.map((r) => [String(r._id), r.quantity]));
  return pos.map((po) => {
    const deliveredTons = delivered.get(String(po._id)) ?? ZERO;
    return {
      materialId: String(po.materialId),
      quantity: D(po.quantityTons),
      delivered: deliveredTons,
      remaining: maxZero(D(po.quantityTons).minus(deliveredTons))
    };
  });
}

export const reportService = {
  /**
   * Overall / material / company dashboard.
   * companyId narrows purchases to that supplier, sales and POs to that customer; stock stays
   * material-wide because physical stock is not owned by a customer.
   */
  async dashboard({ from, to, materialId, companyId }) {
    const period = resolvePeriod({ from, to });
    const materialScope = materialId ? { materialId: toObjectId(materialId) } : {};
    const companyScope = companyId ? { companyId: toObjectId(companyId) } : {};

    const purchaseMatch = {
      purchaseDate: activityRange(period.from, period.cutoff),
      ...materialScope,
      ...companyScope
    };
    const saleMatch = { saleDate: activityRange(period.from, period.cutoff), ...materialScope, ...companyScope };
    // Lifecycle has no history, so "active" is the current lifecycle of POs dated on/before the cutoff.
    const poMatch = {
      poDate: { $lte: period.cutoff },
      lifecycleStatus: PO_LIFECYCLE.ACTIVE,
      ...materialScope,
      ...companyScope
    };

    const materials = await materialRepository.model
      .find(materialId ? { _id: materialId } : {})
      .select('name openingStockTons isActive')
      .lean();
    if (materialId && !materials.length) throw new AppError(404, 'MATERIAL_NOT_FOUND', 'Material not found');

    const totals = { quantity: 'quantityTons', value: 'totalAmount' };
    const [purchaseRows, saleRows, poPositions, stock, supplierRows, buyerRows] = await Promise.all([
      purchaseRepository.groupTotals(purchaseMatch, '$materialId', totals),
      saleRepository.groupTotals(saleMatch, '$materialId', totals),
      poPositionsAsOf(poMatch, period.cutoff),
      stockService.stockByMaterialAsOf(period.asOf, { materialId, materials }),
      purchaseRepository.groupTotals(purchaseMatch, '$companyId', totals),
      // A sale's companyId is the buyer (taken from its PO).
      saleRepository.groupTotals(saleMatch, '$companyId', totals)
    ]);
    const companyNames = new Map(
      (await companyRepository.namesByIds([...new Set([...supplierRows, ...buyerRows].map((r) => String(r._id)))])).map(
        (c) => [String(c._id), c.name]
      )
    );
    const byCompany = (rows) =>
      rows
        .map((r) => ({
          companyId: String(r._id),
          companyName: companyNames.get(String(r._id)) ?? null,
          quantityTons: qtyStr(r.quantity),
          value: moneyStr(r.value),
          averageRate: avgRate(r.value, r.quantity)
        }))
        .sort((a, b) => D(b.value).cmp(D(a.value)) || byName({ name: a.companyName }, { name: b.companyName }));

    const purchasesByMaterial = new Map(purchaseRows.map((r) => [String(r._id), r]));
    const salesByMaterial = new Map(saleRows.map((r) => [String(r._id), r]));
    const remainingByMaterial = new Map();
    for (const po of poPositions) {
      remainingByMaterial.set(po.materialId, (remainingByMaterial.get(po.materialId) ?? ZERO).plus(po.remaining));
    }

    const materialRows = materials
      .map((m) => {
        const id = String(m._id);
        const bought = purchasesByMaterial.get(id) ?? { quantity: ZERO, value: ZERO };
        const sold = salesByMaterial.get(id) ?? { quantity: ZERO, value: ZERO };
        const stockTons = stock.get(id) ?? ZERO;
        const remainingPO = remainingByMaterial.get(id) ?? ZERO;
        const balance = stockTons.minus(remainingPO);
        return {
          isActive: m.isActive,
          row: {
            materialId: id,
            materialName: m.name,
            currentStockTons: qtyStr(stockTons),
            remainingPOQuantityTons: qtyStr(remainingPO),
            purchaseRequiredTons: qtyStr(balance.isNegative() ? balance.abs() : ZERO),
            extraStockTons: qtyStr(balance.isPositive() ? balance : ZERO),
            purchasedTons: qtyStr(bought.quantity),
            purchaseValue: moneyStr(bought.value),
            averageBuyingRate: avgRate(bought.value, bought.quantity),
            soldTons: qtyStr(sold.quantity),
            salesValue: moneyStr(sold.value),
            averageSellingRate: avgRate(sold.value, sold.quantity)
          },
          relevant: !stockTons.isZero() || remainingPO.gt(0) || bought.quantity.gt(0) || sold.quantity.gt(0)
        };
      })
      // Inactive materials appear only while they still hold stock, demand or period activity.
      .filter((x) => materialId || x.isActive || x.relevant)
      .map((x) => x.row)
      .sort((a, b) => a.materialName.localeCompare(b.materialName));

    const purchases = sumRows(purchaseRows);
    const sales = sumRows(saleRows);
    const po = poPositions.reduce(
      (acc, p) => ({
        quantity: acc.quantity.plus(p.quantity),
        delivered: acc.delivered.plus(p.delivered),
        remaining: acc.remaining.plus(p.remaining),
        open: acc.open + (p.remaining.gt(0) ? 1 : 0)
      }),
      { quantity: ZERO, delivered: ZERO, remaining: ZERO, open: 0 }
    );

    return {
      period: { from: toDateOnlyString(period.from), to: toDateOnlyString(period.asOf) },
      purchases: {
        quantityTons: qtyStr(purchases.quantity),
        value: moneyStr(purchases.value),
        averageBuyingRate: avgRate(purchases.value, purchases.quantity)
      },
      sales: {
        quantityTons: qtyStr(sales.quantity),
        value: moneyStr(sales.value),
        averageSellingRate: avgRate(sales.value, sales.quantity)
      },
      po: {
        poQuantityTons: qtyStr(po.quantity),
        deliveredQuantityTons: qtyStr(po.delivered),
        remainingQuantityTons: qtyStr(po.remaining),
        activePOCount: poPositions.length,
        openPOCount: po.open
      },
      materials: materialRows,
      // Period activity per company: bought from each supplier, delivered to each buyer.
      companies: { suppliers: byCompany(supplierRows), buyers: byCompany(buyerRows) }
    };
  },

  /**
   * Purchase-company material pools as of a date: purchased from the company, allocated to sales
   * via sourceCompanyId, and available. Pool accounting, not per-invoice/FIFO allocation.
   */
  async sourceStock({ asOf, sourceCompanyId, materialId }) {
    const date = asOf ?? businessToday(env.BUSINESS_TIMEZONE);
    const cutoff = endOfDayUTC(date);
    const purchaseMatch = { purchaseDate: { $lte: cutoff } };
    const saleMatch = { saleDate: { $lte: cutoff } };
    if (sourceCompanyId) {
      purchaseMatch.companyId = toObjectId(sourceCompanyId);
      saleMatch.sourceCompanyId = toObjectId(sourceCompanyId);
    }
    if (materialId) {
      purchaseMatch.materialId = toObjectId(materialId);
      saleMatch.materialId = toObjectId(materialId);
    }

    const [purchased, used] = await Promise.all([
      purchaseRepository.groupTotals(
        purchaseMatch,
        { sourceCompanyId: '$companyId', materialId: '$materialId' },
        { quantity: 'quantityTons' }
      ),
      saleRepository.groupTotals(
        saleMatch,
        { sourceCompanyId: '$sourceCompanyId', materialId: '$materialId' },
        { quantity: 'quantityTons' }
      )
    ]);

    const pools = new Map();
    const pool = (key) => {
      const id = `${key.sourceCompanyId}:${key.materialId}`;
      if (!pools.has(id)) pools.set(id, { ...key, purchased: ZERO, used: ZERO });
      return pools.get(id);
    };
    for (const row of purchased) pool(row._id).purchased = row.quantity;
    for (const row of used) pool(row._id).used = row.quantity;

    const values = [...pools.values()];
    const [companies, materials] = await Promise.all([
      companyRepository.namesByIds([...new Set(values.map((p) => String(p.sourceCompanyId)))]),
      materialRepository.namesByIds([...new Set(values.map((p) => String(p.materialId)))])
    ]);
    const companyNames = new Map(companies.map((c) => [String(c._id), c.name]));
    const materialNames = new Map(materials.map((m) => [String(m._id), m.name]));

    return values
      .map((p) => ({
        sourceCompanyId: String(p.sourceCompanyId),
        sourceCompanyName: companyNames.get(String(p.sourceCompanyId)) ?? null,
        materialId: String(p.materialId),
        materialName: materialNames.get(String(p.materialId)) ?? null,
        purchasedTons: qtyStr(p.purchased),
        usedForSalesTons: qtyStr(p.used),
        availableTons: qtyStr(p.purchased.minus(p.used))
      }))
      .sort(
        (a, b) =>
          byName({ name: a.sourceCompanyName }, { name: b.sourceCompanyName }) ||
          byName({ name: a.materialName }, { name: b.materialName })
      );
  },

  /**
   * Tons and value bought vs delivered per day / week / month across [from, to], for trend charts.
   * Every bucket in the range is returned, including empty ones, so a chart has no gaps.
   * Same scoping as the dashboard: companyId narrows purchases to that supplier and sales to that
   * customer.
   */
  async trend({ from, to, materialId, companyId, bucket }) {
    const size = bucket ?? autoBucket(from, to);
    const scope = {
      ...(materialId ? { materialId: toObjectId(materialId) } : {}),
      ...(companyId ? { companyId: toObjectId(companyId) } : {})
    };
    const range = { $gte: from, $lte: endOfDayUTC(to) };
    const totals = { quantity: 'quantityTons', value: 'totalAmount' };
    const [purchaseDays, saleDays] = await Promise.all([
      purchaseRepository.groupTotals({ ...scope, purchaseDate: range }, '$purchaseDate', totals),
      saleRepository.groupTotals({ ...scope, saleDate: range }, '$saleDate', totals)
    ]);

    const buckets = bucketRanges(from, to, size).map((b) => ({
      ...b,
      purchased: { quantity: ZERO, value: ZERO },
      sold: { quantity: ZERO, value: ZERO }
    }));
    const add = (rows, key) => {
      for (const row of rows) {
        const day = new Date(row._id);
        const target = buckets.find((b) => day >= b.start && day <= b.end);
        if (!target) continue;
        target[key].quantity = target[key].quantity.plus(row.quantity);
        target[key].value = target[key].value.plus(row.value);
      }
    };
    add(purchaseDays, 'purchased');
    add(saleDays, 'sold');

    return {
      from: toDateOnlyString(from),
      to: toDateOnlyString(to),
      bucket: size,
      points: buckets.map((b) => ({
        start: toDateOnlyString(b.start),
        end: toDateOnlyString(b.end),
        purchasedTons: qtyStr(b.purchased.quantity),
        purchaseValue: moneyStr(b.purchased.value),
        deliveredTons: qtyStr(b.sold.quantity),
        salesValue: moneyStr(b.sold.value)
      }))
    };
  },

  /** Company-focused report: the dashboard scoped to the company plus its supplier pools. */
  async companySummary(companyId, { from, to, materialId }) {
    const company = await companyRepository.findById(companyId, { lean: true });
    if (!company) throw new AppError(404, 'COMPANY_NOT_FOUND', 'Company not found');
    const [dashboard, sourceStock] = await Promise.all([
      this.dashboard({ from, to, materialId, companyId }),
      this.sourceStock({ asOf: to, sourceCompanyId: companyId, materialId })
    ]);
    return {
      company: { _id: company._id, name: company.name, type: company.type, isActive: company.isActive },
      ...dashboard,
      sourceStock
    };
  }
};
