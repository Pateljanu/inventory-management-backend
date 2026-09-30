import { AppError } from '../errors/AppError.js';
import { d128, qty } from '../utils/decimal.js';
import { env } from '../config/env.js';
import { businessToday } from '../utils/date.js';
import { normalizeKey, normalizeText, searchRegex } from '../utils/normalize.js';
import { pagination } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { materialRepository } from '../repositories/material.repository.js';
import { stockService } from './stock.service.js';

const notFound = () => new AppError(404, 'MATERIAL_NOT_FOUND', 'Material not found');

function toSet(data) {
  const $set = {};
  if (data.name !== undefined)
    Object.assign($set, { name: normalizeText(data.name), normalizedName: normalizeKey(data.name) });
  if (data.openingStockTons !== undefined) $set.openingStockTons = d128(data.openingStockTons);
  if (data.notes !== undefined) $set.notes = data.notes;
  if (data.isActive !== undefined) $set.isActive = data.isActive;
  return $set;
}

export const materialService = {
  async create(data) {
    return materialRepository.create({ openingStockTons: d128(0), ...toSet(data) });
  },

  async update(id, data) {
    if (data.openingStockTons === undefined) {
      const updated = await materialRepository.updateById(id, { $set: toSet(data) });
      if (!updated) throw notFound();
      return updated;
    }

    // Lowering opening stock can retroactively make a past sale impossible, so the change is
    // applied under the material lock and the whole ledger is replayed before commit.
    return withTransaction(async (session) => {
      await materialRepository.lock(id, { session });
      const updated = await materialRepository.updateById(id, { $set: toSet(data) }, { session });
      if (!updated) throw notFound();
      await stockService.assertMaterialLedgerNonNegative(id, { session });
      return updated;
    });
  },

  async get(id) {
    const material = await materialRepository.findById(id, { lean: true });
    if (!material) throw notFound();
    const currentStock = await stockService.getStockAsOf(id, businessToday(env.BUSINESS_TIMEZONE));
    return { ...material, currentStockTons: qty(currentStock) };
  },

  async list(query) {
    const { page, limit, skip } = pagination(query);
    const filter = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) filter.name = searchRegex(query.search);
    const { items, total } = await materialRepository.paginate(filter, { sort: { name: 1 }, skip, limit });
    return { items, page, limit, total };
  }
};
