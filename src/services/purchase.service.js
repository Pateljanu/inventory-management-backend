import { AppError } from '../errors/AppError.js';
import { amountFrom, d128, MONEY_SCALE, QTY_SCALE, RATE_SCALE } from '../utils/decimal.js';
import { dateFilter } from '../utils/date.js';
import { normalizeCode, normalizeText, searchRegex } from '../utils/normalize.js';
import { sameId } from '../utils/objectId.js';
import { pagination } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { purchaseRepository } from '../repositories/purchase.repository.js';
import { materialRepository } from '../repositories/material.repository.js';
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
