import { AppError } from '../errors/AppError.js';
import { amountFrom, D, d128, Decimal, maxZero, MONEY_SCALE, QTY_SCALE, RATE_SCALE } from '../utils/decimal.js';
import { dateFilter, toDateOnlyString } from '../utils/date.js';
import { normalizeCode, normalizeText, searchRegex } from '../utils/normalize.js';
import { sameId, toObjectId } from '../utils/objectId.js';
import { pagination } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { purchaseRepository } from '../repositories/purchase.repository.js';
import { materialRepository } from '../repositories/material.repository.js';
import { saleRepository } from '../repositories/sale.repository.js';
import { assertActiveMaterial, assertPurchaseCompany } from './references.js';
import { stockService } from './stock.service.js';

const notFound = () => new AppError(404, 'PURCHASE_NOT_FOUND', 'Purchase not found');

const DISPLAY = [
  { path: 'companyId', select: 'name' },
  { path: 'materialId', select: 'name' }
];

/**
 * Converts validated input into a { $set, $unset } update. Amounts are always recalculated from
 * quantity x rate; an empty vehicle/invoice number clears the stored value.
 */
function toUpdate(data) {
  const $set = {
    purchaseDate: data.purchaseDate,
    companyId: data.companyId,
    materialId: data.materialId,
    quantityTons: d128(data.quantityTons, QTY_SCALE),
    ratePerTon: d128(data.ratePerTon, RATE_SCALE),
    totalAmount: d128(amountFrom(data.quantityTons, data.ratePerTon), MONEY_SCALE)
  };
  const $unset = {};

  if (data.vehicleNumber) $set.vehicleNumber = normalizeCode(data.vehicleNumber);
  else if (data.vehicleNumber === '') $unset.vehicleNumber = 1;

  if (data.invoiceNumber) {
    $set.invoiceNumber = normalizeText(data.invoiceNumber);
    $set.normalizedInvoiceNumber = normalizeCode(data.invoiceNumber);
  } else if (data.invoiceNumber === '') {
    Object.assign($unset, { invoiceNumber: 1, normalizedInvoiceNumber: 1 });
  }

  if (data.notes !== undefined) $set.notes = data.notes;
  return { $set, ...(Object.keys($unset).length ? { $unset } : {}) };
}

/**
 * What settling one supplier pool would do. The tons still left in the pool (bought from the
 * supplier minus delivered from it) never really arrived, so they are taken off that supplier's
 * purchases, latest first, until nothing is left. The rate stays; the amount follows the tons.
 *
 * Latest first keeps every day of the pool's history non-negative: after the earliest trimmed
 * purchase only deliveries remain, and they now end exactly at zero.
 */
async function planSettle(companyId, materialId, session) {
  const company = toObjectId(companyId);
  const material = toObjectId(materialId);
  const [purchases, used] = await Promise.all([
    purchaseRepository.model
      .find({ companyId: company, materialId: material })
      .sort({ purchaseDate: -1, _id: -1 })
      .select('purchaseDate invoiceNumber vehicleNumber quantityTons ratePerTon totalAmount bookedTons')
      .session(session ?? null)
      .lean(),
    saleRepository.sumField({ sourceCompanyId: company, materialId: material }, 'quantityTons', { session })
  ]);
  const purchased = purchases.reduce((sum, p) => sum.plus(D(p.quantityTons)), D(0));
  const left = maxZero(purchased.minus(used));

  let toRemove = left;
  const changes = [];
  for (const p of purchases) {
    if (!toRemove.gt(0)) break;
    const before = D(p.quantityTons);
    const cut = Decimal.min(before, toRemove);
    if (cut.isZero()) continue;
    toRemove = toRemove.minus(cut);
    const after = before.minus(cut);
    changes.push({
      purchaseId: String(p._id),
      purchaseDate: toDateOnlyString(p.purchaseDate),
      invoiceNumber: p.invoiceNumber ?? null,
      vehicleNumber: p.vehicleNumber ?? null,
      ratePerTon: D(p.ratePerTon).toFixed(RATE_SCALE),
      // The first settle remembers the original booking; a later one keeps it.
      bookedTons: D(p.bookedTons ?? p.quantityTons).toFixed(QTY_SCALE),
      fromTons: before.toFixed(QTY_SCALE),
      toTons: after.toFixed(QTY_SCALE),
      fromAmount: D(p.totalAmount).toFixed(MONEY_SCALE),
      toAmount: amountFrom(after, p.ratePerTon)
    });
  }

  return {
    companyId: String(companyId),
    materialId: String(materialId),
    purchasedTons: purchased.toFixed(QTY_SCALE),
    usedTons: D(used).toFixed(QTY_SCALE),
    leftTons: left.toFixed(QTY_SCALE),
    changes
  };
}

export const purchaseService = {
  async create(data, userId) {
    return withTransaction(async (session) => {
      await assertPurchaseCompany(data.companyId, session);
      await assertActiveMaterial(data.materialId, session);
      // Serializes with sales of this material so stock checks never see a half-applied state.
      await materialRepository.lock(data.materialId, { session });
      const { $set } = toUpdate(data);
      return purchaseRepository.create({ ...$set, createdBy: userId }, { session });
    });
  },

  /**
   * Any edit (quantity, date, company or material) can retroactively starve sales that already
   * consumed this stock, so both the overall material ledger and the Company + Material source
   * ledger are replayed for every affected material/pool before commit.
   */
  async update(id, data, userId) {
    return withTransaction(async (session) => {
      const existing = await purchaseRepository.findById(id, { session, lean: true });
      if (!existing) throw notFound();

      const merged = {
        purchaseDate: data.purchaseDate ?? existing.purchaseDate,
        companyId: data.companyId ?? existing.companyId,
        materialId: data.materialId ?? existing.materialId,
        quantityTons: data.quantityTons ?? existing.quantityTons,
        ratePerTon: data.ratePerTon ?? existing.ratePerTon,
        vehicleNumber: data.vehicleNumber,
        invoiceNumber: data.invoiceNumber,
        notes: data.notes
      };
      if (!sameId(merged.companyId, existing.companyId)) await assertPurchaseCompany(merged.companyId, session);
      if (!sameId(merged.materialId, existing.materialId)) await assertActiveMaterial(merged.materialId, session);

      const materials = [existing.materialId, merged.materialId];
      await materialRepository.lock(materials, { session });

      const update = toUpdate(merged);
      update.$set.updatedBy = userId;
      const updated = await purchaseRepository.updateById(id, update, { session });

      for (const materialId of new Set(materials.map(String))) {
        await stockService.assertMaterialLedgerNonNegative(materialId, { session });
      }
      // A supplier pool can go negative even while total material stock stays positive
      // (e.g. re-assigning the purchase to another supplier), so each pool is checked separately.
      const pools = new Map([
        [`${existing.companyId}:${existing.materialId}`, [existing.companyId, existing.materialId]],
        [`${merged.companyId}:${merged.materialId}`, [merged.companyId, merged.materialId]]
      ]);
      for (const [companyId, materialId] of pools.values()) {
        await stockService.assertSourceLedgerNonNegative(companyId, materialId, { session });
      }
      return updated;
    });
  },

  /** Read-only: the purchases a settle would change right now. */
  async settlePreview({ companyId, materialId }) {
    return planSettle(companyId, materialId);
  },

  /**
   * Sets one supplier pool to zero by trimming its purchases to what deliveries actually used
   * (see planSettle). Runs under the material lock, so a delivery saved at the same moment is
   * either fully counted or waits; both ledgers are replayed before commit as with any edit.
   */
  async settle({ companyId, materialId }, userId) {
    return withTransaction(async (session) => {
      await materialRepository.lock(materialId, { session });
      const plan = await planSettle(companyId, materialId, session);
      if (!plan.changes.length) {
        throw new AppError(409, 'NOTHING_TO_SETTLE', 'No stock is left from this supplier for this material', {
          companyId: plan.companyId,
          materialId: plan.materialId
        });
      }
      for (const change of plan.changes) {
        await purchaseRepository.updateById(
          change.purchaseId,
          {
            $set: {
              quantityTons: d128(change.toTons, QTY_SCALE),
              totalAmount: d128(change.toAmount, MONEY_SCALE),
              bookedTons: d128(change.bookedTons, QTY_SCALE),
              updatedBy: userId
            }
          },
          { session }
        );
      }
      await stockService.assertMaterialLedgerNonNegative(materialId, { session });
      await stockService.assertSourceLedgerNonNegative(companyId, materialId, { session });
      return plan;
    });
  },

  async get(id) {
    const purchase = await purchaseRepository.model.findById(id).populate(DISPLAY).lean();
    if (!purchase) throw notFound();
    return purchase;
  },

  async list(query) {
    const { page, limit, skip } = pagination(query);
    const filter = { ...dateFilter(query.from, query.to, 'purchaseDate') };
    if (query.companyId) filter.companyId = query.companyId;
    if (query.materialId) filter.materialId = query.materialId;
    if (query.search)
      filter.$or = [{ invoiceNumber: searchRegex(query.search) }, { vehicleNumber: searchRegex(query.search) }];

    const { items, total } = await purchaseRepository.paginate(filter, {
      sort: { purchaseDate: -1, _id: -1 },
      skip,
      limit,
      populate: DISPLAY
    });
    return { items, page, limit, total };
  }
};
