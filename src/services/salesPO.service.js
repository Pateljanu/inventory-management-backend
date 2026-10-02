import { AppError } from '../errors/AppError.js';
import { amountFrom, D, d128, MONEY_SCALE, QTY_SCALE, RATE_SCALE } from '../utils/decimal.js';
import { maxDeliverableTons } from '../utils/poTolerance.js';
import { PO_LIFECYCLE } from '../constants/poStatus.js';
import { dateFilter } from '../utils/date.js';
import { normalizeCode, normalizeText, searchRegex } from '../utils/normalize.js';
import { sameId, toObjectId } from '../utils/objectId.js';
import { pagination } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { salesPORepository } from '../repositories/salesPO.repository.js';
import { saleRepository } from '../repositories/sale.repository.js';
import { materialRepository } from '../repositories/material.repository.js';
import { assertActiveMaterial, assertSaleCompany } from './references.js';
import { stockService } from './stock.service.js';

const notFound = () => new AppError(404, 'PO_NOT_FOUND', 'Sales PO not found');

function toSet(data) {
  return {
    poNumber: normalizeText(data.poNumber),
    normalizedPoNumber: normalizeCode(data.poNumber),
    poDate: data.poDate,
    companyId: data.companyId,
    materialId: data.materialId,
    quantityTons: d128(data.quantityTons, QTY_SCALE),
    ratePerTon: d128(data.ratePerTon, RATE_SCALE),
    totalPOAmount: d128(amountFrom(data.quantityTons, data.ratePerTon), MONEY_SCALE),
    tolerancePercent: d128(data.tolerancePercent ?? 0, RATE_SCALE),
    ...(data.lifecycleStatus !== undefined ? { lifecycleStatus: data.lifecycleStatus } : {}),
    ...(data.notes !== undefined ? { notes: data.notes } : {})
  };
}

export const salesPOService = {
  async create(data, userId) {
    await assertSaleCompany(data.companyId);
    await assertActiveMaterial(data.materialId);
    return salesPORepository.create({ ...toSet(data), createdBy: userId });
  },

  /**
   * Invariants on edit:
   *  - quantity may not drop below what is already delivered;
   *  - poDate may not move after an existing delivery;
   *  - existing sales keep their poRateAtSale (a rate change only affects future sales);
   *  - customer/material edits cascade to linked sales, and a material change re-validates the
   *    new material's overall and per-supplier ledgers because those sales now consume it.
   */
  async update(id, data, userId) {
    return withTransaction(async (session) => {
      await salesPORepository.lock(id, { session });
      const existing = await salesPORepository.findById(id, { session, lean: true });
      if (!existing) throw notFound();

      const merged = {
        poNumber: data.poNumber ?? existing.poNumber,
        poDate: data.poDate ?? existing.poDate,
        companyId: data.companyId ?? existing.companyId,
        materialId: data.materialId ?? existing.materialId,
        quantityTons: data.quantityTons ?? existing.quantityTons,
        ratePerTon: data.ratePerTon ?? existing.ratePerTon,
        tolerancePercent: data.tolerancePercent ?? existing.tolerancePercent,
        lifecycleStatus: data.lifecycleStatus,
        notes: data.notes
      };
      const companyChanged = !sameId(merged.companyId, existing.companyId);
      const materialChanged = !sameId(merged.materialId, existing.materialId);
      if (companyChanged) await assertSaleCompany(merged.companyId, session);
      if (materialChanged) await assertActiveMaterial(merged.materialId, session);

      // Deliveries may already use part of the tolerance, so the limit is ordered + tolerance.
      const sold = await saleRepository.soldForPO(id, { session });
      const maxTons = maxDeliverableTons(merged.quantityTons, merged.tolerancePercent);
      if (maxTons.lt(sold)) {
        throw new AppError(409, 'PO_QTY_BELOW_SOLD', 'PO quantity cannot be lower than quantity already delivered', {
          soldQuantityTons: sold.toFixed(3),
          maxDeliverableTons: maxTons.toFixed(3)
        });
      }

      const firstSaleDate = await saleRepository.earliestSaleDateForPO(existing._id, { session });
      if (firstSaleDate && merged.poDate > firstSaleDate) {
        throw new AppError(422, 'PO_DATE_AFTER_SALES', 'PO date cannot be later than its first delivery', {
          firstSaleDate
        });
      }

      const hasSales = sold.gt(0);
      if (materialChanged && hasSales)
        await materialRepository.lock([existing.materialId, merged.materialId], { session });

      const updated = await salesPORepository.updateById(
        id,
        { $set: { ...toSet(merged), updatedBy: userId } },
        { session }
      );

      if ((companyChanged || materialChanged) && hasSales) {
        await saleRepository.reassignPO(
          existing._id,
          { companyId: toObjectId(merged.companyId), materialId: toObjectId(merged.materialId) },
          { session }
        );
      }
      // Moving deliveries off the old material can only raise its stock, so only the new
      // material's ledgers need to be proven non-negative.
      if (materialChanged && hasSales) {
        await stockService.assertMaterialLedgerNonNegative(merged.materialId, { session });
        const sources = await saleRepository.distinctSourceCompaniesForPO(existing._id, { session });
        for (const sourceCompanyId of sources) {
          await stockService.assertSourceLedgerNonNegative(sourceCompanyId, merged.materialId, { session });
        }
      }
      return updated;
    });
  },

  /**
   * Closes a short-delivered order: the ordered tons become what was delivered, so nothing is
   * left, the order shows as completed and stops counting as open demand. The rate stays and the
   * order value follows the tons; the first ordered quantity is kept in originalQuantityTons. To
   * deliver more later, edit the quantity back up.
   */
  async settle(id, userId) {
    await withTransaction(async (session) => {
      // Same lock as deliveries, so a delivery saved at the same moment is counted or waits.
      await salesPORepository.lock(id, { session });
      const po = await salesPORepository.findById(id, { session, lean: true });
      if (!po) throw notFound();
      if (po.lifecycleStatus !== PO_LIFECYCLE.ACTIVE) {
        throw new AppError(422, 'PO_NOT_AVAILABLE', 'A cancelled order cannot be settled', { poId: String(id) });
      }
      const sold = await saleRepository.soldForPO(id, { session });
      if (!sold.gt(0)) {
        throw new AppError(409, 'NOTHING_TO_SETTLE', 'Nothing has been delivered yet; cancel the order instead', {
          poId: String(id)
        });
      }
      if (!D(po.quantityTons).gt(sold)) {
        throw new AppError(409, 'NOTHING_TO_SETTLE', 'The order is already fully delivered', { poId: String(id) });
      }
      await salesPORepository.updateById(
        id,
        {
          $set: {
            quantityTons: d128(sold, QTY_SCALE),
            totalPOAmount: d128(amountFrom(sold, po.ratePerTon), MONEY_SCALE),
            originalQuantityTons: d128(po.originalQuantityTons ?? po.quantityTons, QTY_SCALE),
            updatedBy: userId
          }
        },
        { session }
      );
    });
    return salesPORepository.findWithPosition(id);
  },

  async get(id) {
    const po = await salesPORepository.findWithPosition(id);
    if (!po) throw notFound();
    return po;
  },

  async list(query) {
    const { page, limit, skip } = pagination(query);
    // Aggregation: ids must be ObjectIds, Mongoose does not cast here.
    const match = { ...dateFilter(query.from, query.to, 'poDate') };
    if (query.companyId) match.companyId = toObjectId(query.companyId);
    if (query.materialId) match.materialId = toObjectId(query.materialId);
    if (query.lifecycleStatus) match.lifecycleStatus = query.lifecycleStatus;
    if (query.search) match.poNumber = searchRegex(query.search);

    const { items, total } = await salesPORepository.listWithPosition(match, {
      skip,
      limit,
      displayStatus: query.status
    });
    return { items, page, limit, total };
  }
};
