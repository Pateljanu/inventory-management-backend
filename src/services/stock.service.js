import { AppError } from '../errors/AppError.js';
import { D, Decimal } from '../utils/decimal.js';
import { endOfDayUTC } from '../utils/date.js';
import { toObjectId } from '../utils/objectId.js';
import { materialRepository } from '../repositories/material.repository.js';
import { purchaseRepository } from '../repositories/purchase.repository.js';
import { saleRepository } from '../repositories/sale.repository.js';

/**
 * Replays a ledger day by day. Business dates are calendar days and "stock as of a day" includes
 * everything on that day, so the balance is checked after each day's net movement. Returns the
 * first day on which the balance is negative, or null.
 */
function dailyNet(inflowDays, outflowDays) {
  const days = new Map();
  for (const { date, total } of inflowDays) days.set(date.getTime(), (days.get(date.getTime()) ?? D(0)).plus(total));
  for (const { date, total } of outflowDays) days.set(date.getTime(), (days.get(date.getTime()) ?? D(0)).minus(total));
  return [...days.entries()].sort(([a], [b]) => a - b);
}

function findFirstNegativeDay(openingBalance, inflowDays, outflowDays) {
  let balance = D(openingBalance);
  for (const [time, net] of dailyNet(inflowDays, outflowDays)) {
    balance = balance.plus(net);
    if (balance.isNegative()) return { at: new Date(time), balance };
  }
  return null;
}

/**
 * The most that can leave a ledger on `date` without the balance going negative on that day or
 * any later day: the lowest end-of-day balance from `date` onward. Stock as of the date alone is
 * not enough, because a backdated delivery also reduces every later day's balance.
 */
function headroomFrom(openingBalance, inflowDays, outflowDays, date) {
  const cutoff = date.getTime();
  let balance = D(openingBalance);
  let lowest = null;
  for (const [time, net] of dailyNet(inflowDays, outflowDays)) {
    if (time > cutoff && lowest === null) lowest = balance;
    balance = balance.plus(net);
    if (time > cutoff) lowest = Decimal.min(lowest, balance);
  }
  return lowest ?? balance;
}

function saleExclusion(excludeSaleId) {
  return excludeSaleId ? { _id: { $ne: toObjectId(excludeSaleId) } } : {};
}

async function loadMaterial(materialId, session) {
  const material = await materialRepository.findById(materialId, { session, lean: true });
  if (!material) throw new AppError(404, 'MATERIAL_NOT_FOUND', 'Material not found');
  return material;
}

export const stockService = {
  /** Overall material stock at end of `asOf`: opening + purchases - sales. */
  async getStockAsOf(materialId, asOf, { session, excludeSaleId } = {}) {
    const material = await loadMaterial(materialId, session);
    const cutoff = endOfDayUTC(asOf);
    const id = toObjectId(materialId);
    const [purchased, sold] = await Promise.all([
      purchaseRepository.sumField({ materialId: id, purchaseDate: { $lte: cutoff } }, 'quantityTons', { session }),
      saleRepository.sumField(
        { materialId: id, saleDate: { $lte: cutoff }, ...saleExclusion(excludeSaleId) },
        'quantityTons',
        {
          session
        }
      )
    ]);
    return D(material.openingStockTons).plus(purchased).minus(sold);
  },

  /**
   * Company + Material source pool at end of `asOf`: purchases from that company minus sales
   * allocated to it. Opening stock is intentionally excluded because it has no supplier identity;
   * supplier-traceable go-live stock must be entered as Purchase records.
   */
  async getSourceCompanyStockAsOf(sourceCompanyId, materialId, asOf, { session, excludeSaleId } = {}) {
    const cutoff = endOfDayUTC(asOf);
    const companyId = toObjectId(sourceCompanyId);
    const material = toObjectId(materialId);
    const [purchased, allocated] = await Promise.all([
      purchaseRepository.sumField({ companyId, materialId: material, purchaseDate: { $lte: cutoff } }, 'quantityTons', {
        session
      }),
      saleRepository.sumField(
        {
          sourceCompanyId: companyId,
          materialId: material,
          saleDate: { $lte: cutoff },
          ...saleExclusion(excludeSaleId)
        },
        'quantityTons',
        { session }
      )
    ]);
    return purchased.minus(allocated);
  },

  /**
   * Stock of every material (or one) at end of `asOf` in two aggregations, for reports.
   * Returns Map<materialIdString, Decimal>.
   */
  async stockByMaterialAsOf(asOf, { materialId, materials } = {}) {
    const cutoff = endOfDayUTC(asOf);
    const scope = materialId ? { materialId: toObjectId(materialId) } : {};
    const [purchased, sold] = await Promise.all([
      purchaseRepository.groupTotals({ ...scope, purchaseDate: { $lte: cutoff } }, '$materialId', {
        quantity: 'quantityTons'
      }),
      saleRepository.groupTotals({ ...scope, saleDate: { $lte: cutoff } }, '$materialId', { quantity: 'quantityTons' })
    ]);
    const stock = new Map(materials.map((m) => [String(m._id), D(m.openingStockTons)]));
    for (const row of purchased) stock.set(String(row._id), (stock.get(String(row._id)) ?? D(0)).plus(row.quantity));
    for (const row of sold) stock.set(String(row._id), (stock.get(String(row._id)) ?? D(0)).minus(row.quantity));
    return stock;
  },

  /** Overall material headroom for a delivery on `date` (see headroomFrom). */
  async materialHeadroom(materialId, date, { excludeSaleId } = {}) {
    const material = await loadMaterial(materialId);
    const id = toObjectId(materialId);
    const [inflows, outflows] = await Promise.all([
      purchaseRepository.dailyTotals({ materialId: id }, 'purchaseDate', 'quantityTons'),
      saleRepository.dailyTotals({ materialId: id, ...saleExclusion(excludeSaleId) }, 'saleDate', 'quantityTons')
    ]);
    return headroomFrom(material.openingStockTons, inflows, outflows, date);
  },

  /**
   * Every supplier pool of one material, seen from a delivery on `date`: Map<companyId, pool>.
   * `available` is headroom (see headroomFrom); `purchased` / `used` are totals up to the end of
   * `date`; `firstPurchaseDate` is the earliest purchase ever and `lastPurchaseDate` the latest on
   * or before `date` (null when none).
   */
  async sourcePoolsByCompany(materialId, date, { excludeSaleId } = {}) {
    const id = toObjectId(materialId);
    const [inflows, outflows] = await Promise.all([
      purchaseRepository.dailyTotalsBy({ materialId: id }, '$companyId', 'purchaseDate', 'quantityTons'),
      saleRepository.dailyTotalsBy(
        { materialId: id, ...saleExclusion(excludeSaleId) },
        '$sourceCompanyId',
        'saleDate',
        'quantityTons'
      )
    ]);
    const cutoff = date.getTime();
    const upToDate = (days) => days.filter((d) => d.date.getTime() <= cutoff);
    const total = (days) => days.reduce((sum, d) => sum.plus(d.total), D(0));
    const companies = new Set([...inflows.keys(), ...outflows.keys()]);
    return new Map(
      [...companies].map((c) => {
        const bought = inflows.get(c) ?? [];
        const sold = outflows.get(c) ?? [];
        const boughtSoFar = upToDate(bought);
        return [
          c,
          {
            available: headroomFrom(0, bought, sold, date),
            purchased: total(boughtSoFar),
            used: total(upToDate(sold)),
            // Daily totals are sorted by date, ascending.
            firstPurchaseDate: bought[0]?.date ?? null,
            lastPurchaseDate: boughtSoFar.at(-1)?.date ?? null
          }
        ];
      })
    );
  },

  /** Rejects the current transaction if the material's stock is negative at any point in history. */
  async assertMaterialLedgerNonNegative(materialId, { session } = {}) {
    const material = await loadMaterial(materialId, session);
    const id = toObjectId(materialId);
    const [inflows, outflows] = await Promise.all([
      purchaseRepository.dailyTotals({ materialId: id }, 'purchaseDate', 'quantityTons', { session }),
      saleRepository.dailyTotals({ materialId: id }, 'saleDate', 'quantityTons', { session })
    ]);
    const negative = findFirstNegativeDay(material.openingStockTons, inflows, outflows);
    if (negative) {
      throw new AppError(409, 'NEGATIVE_STOCK_HISTORY', 'This change would make historical material stock negative', {
        materialId: String(materialId),
        at: negative.at,
        balanceTons: negative.balance.toFixed(3)
      });
    }
  },

  /** Same guarantee for one purchase-company + material source pool. */
  async assertSourceLedgerNonNegative(sourceCompanyId, materialId, { session } = {}) {
    const companyId = toObjectId(sourceCompanyId);
    const material = toObjectId(materialId);
    const [inflows, outflows] = await Promise.all([
      purchaseRepository.dailyTotals({ companyId, materialId: material }, 'purchaseDate', 'quantityTons', { session }),
      saleRepository.dailyTotals({ sourceCompanyId: companyId, materialId: material }, 'saleDate', 'quantityTons', {
        session
      })
    ]);
    const negative = findFirstNegativeDay(0, inflows, outflows);
    if (negative) {
      throw new AppError(
        409,
        'NEGATIVE_SOURCE_STOCK_HISTORY',
        'This change would make the purchase-company material stock negative',
        {
          sourceCompanyId: String(sourceCompanyId),
          materialId: String(materialId),
          at: negative.at,
          balanceTons: negative.balance.toFixed(3)
        }
      );
    }
  }
};

export { findFirstNegativeDay, headroomFrom };
