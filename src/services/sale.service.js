import { AppError } from '../errors/AppError.js';
import { PO_LIFECYCLE } from '../constants/poStatus.js';
import { PURCHASE_COMPANY_TYPES } from '../constants/companyTypes.js';
import { amountFrom, D, d128, Decimal, maxZero, MONEY_SCALE, QTY_SCALE, RATE_SCALE } from '../utils/decimal.js';
import { dateFilter, toDateOnlyString } from '../utils/date.js';
import { maxDeliverableTons, tolerancePercentOf } from '../utils/poTolerance.js';
import { normalizeCode, normalizeText, searchRegex } from '../utils/normalize.js';
import { sameId } from '../utils/objectId.js';
import { pagination } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { saleRepository } from '../repositories/sale.repository.js';
import { salesPORepository } from '../repositories/salesPO.repository.js';
import { materialRepository } from '../repositories/material.repository.js';
import { companyRepository } from '../repositories/company.repository.js';
import { purchaseRepository } from '../repositories/purchase.repository.js';
import { assertActiveMaterial, assertSaleCompany, assertSourceCompany } from './references.js';
import { stockService } from './stock.service.js';

const notFound = () => new AppError(404, 'SALE_NOT_FOUND', 'Sale not found');

const DISPLAY = [
  { path: 'companyId', select: 'name' },
  { path: 'sourceCompanyId', select: 'name type' },
  { path: 'materialId', select: 'name' },
  { path: 'poId', select: 'poNumber' }
];

async function lockAndLoadPO(poIds, targetPoId, session) {
  await salesPORepository.lock(poIds, { session });
  const po = await salesPORepository.findById(targetPoId, { session, lean: true });
  if (!po) throw new AppError(404, 'PO_NOT_FOUND', 'Sales PO not found');
  return po;
}

function assertPOOpen(po) {
  if (po.lifecycleStatus !== PO_LIFECYCLE.ACTIVE) {
    throw new AppError(422, 'PO_NOT_AVAILABLE', 'Selected PO is cancelled', { poId: String(po._id) });
  }
}

function assertNotBeforePO(saleDate, po) {
  if (saleDate < po.poDate) {
    throw new AppError(422, 'SALE_BEFORE_PO_DATE', 'Sale date cannot be before the PO date', { poDate: po.poDate });
  }
}

/**
 * The three business limits on a delivery, evaluated inside the locked transaction:
 *   quantity <= PO remaining (ordered tons plus the order's tolerance, minus what is delivered),
 *   <= overall material stock as of saleDate,
 *   and <= the selected source company's material stock as of saleDate.
 * When editing, the sale itself is excluded so it is not counted against its own capacity.
 */
async function assertCapacity({ po, sourceCompanyId, saleDate, quantityTons, excludeSaleId, session }) {
  const requested = D(quantityTons);
  const opts = { session, excludeSaleId };

  const sold = await saleRepository.soldForPO(po._id, opts);
  const poRemaining = D(po.quantityTons).minus(sold);
  const poAllowance = maxDeliverableTons(po.quantityTons, po.tolerancePercent).minus(sold);
  const overallStock = await stockService.getStockAsOf(po.materialId, saleDate, opts);
  const sourceStock = await stockService.getSourceCompanyStockAsOf(sourceCompanyId, po.materialId, saleDate, opts);

  // Every rejection carries all three limits, so a client can show the user exactly how much
  // can be delivered regardless of which limit was hit first.
  const details = {
    poId: String(po._id),
    sourceCompanyId: String(sourceCompanyId),
    materialId: String(po.materialId),
    remainingQuantityTons: maxZero(poRemaining).toFixed(3),
    poAllowanceTons: maxZero(poAllowance).toFixed(3),
    availableStockTons: overallStock.toFixed(3),
    availableSourceStockTons: sourceStock.toFixed(3),
    maxAllowedTons: Decimal.max(Decimal.min(poAllowance, overallStock, sourceStock), 0).toFixed(3)
  };

  if (requested.gt(poAllowance)) {
    throw new AppError(
      409,
      'PO_QUANTITY_EXCEEDED',
      'Sale quantity exceeds remaining PO quantity (including its tolerance)',
      details
    );
  }
  if (requested.gt(overallStock)) {
    throw new AppError(
      409,
      'INSUFFICIENT_STOCK',
      'Sale quantity exceeds overall material stock as of sale date',
      details
    );
  }
  if (requested.gt(sourceStock)) {
    // When the supplier's stock only arrives later (or never), say so: the fix is the date or
    // another supplier, not the quantity.
    const first = await purchaseRepository.model
      .findOne({ companyId: sourceCompanyId, materialId: po.materialId })
      .sort({ purchaseDate: 1 })
      .select('purchaseDate')
      .session(session ?? null)
      .lean();
    throw new AppError(
      409,
      'INSUFFICIENT_SOURCE_STOCK',
      'Sale quantity exceeds stock available from the selected purchase company',
      { ...details, sourceFirstPurchaseDate: first ? toDateOnlyString(first.purchaseDate) : null }
    );
  }
}

/** Optional delivery fields; an empty string clears the stored value. */
function optionalFields(data) {
  const $set = {};
  const $unset = {};
  if (data.vehicleNumber) $set.vehicleNumber = normalizeCode(data.vehicleNumber);
  else if (data.vehicleNumber === '') $unset.vehicleNumber = 1;
  if (data.challanNumber) {
    $set.challanNumber = normalizeText(data.challanNumber);
    $set.normalizedChallanNumber = normalizeCode(data.challanNumber);
  } else if (data.challanNumber === '') {
    Object.assign($unset, { challanNumber: 1, normalizedChallanNumber: 1 });
  }
  if (data.notes !== undefined) $set.notes = data.notes;
  return { $set, $unset };
}

/** Re-proves both ledgers for every material/pool the change touched. */
async function assertLedgers(materialIds, pools, session) {
  for (const materialId of new Set(materialIds.map(String))) {
    await stockService.assertMaterialLedgerNonNegative(materialId, { session });
  }
  const unique = new Map(
    pools.map(([companyId, materialId]) => [`${companyId}:${materialId}`, [companyId, materialId]])
  );
  for (const [companyId, materialId] of unique.values()) {
    await stockService.assertSourceLedgerNonNegative(companyId, materialId, { session });
  }
}

export const saleService = {
  /**
   * Customer, material and selling rate always come from the PO; the client only chooses the PO,
   * the source company, quantity and delivery details.
   */
  async create(data, userId) {
    return withTransaction(async (session) => {
      const po = await lockAndLoadPO(data.poId, data.poId, session);
      await materialRepository.lock(po.materialId, { session });

      assertPOOpen(po);
      assertNotBeforePO(data.saleDate, po);
      await assertSaleCompany(po.companyId, session);
      await assertActiveMaterial(po.materialId, session);
      await assertSourceCompany(data.sourceCompanyId, session);
      await assertCapacity({
        po,
        sourceCompanyId: data.sourceCompanyId,
        saleDate: data.saleDate,
        quantityTons: data.quantityTons,
        session
      });

      const { $set } = optionalFields(data);
      const sale = await saleRepository.create(
        {
          saleDate: data.saleDate,
          poId: po._id,
          companyId: po.companyId,
          sourceCompanyId: data.sourceCompanyId,
          materialId: po.materialId,
          quantityTons: d128(data.quantityTons, QTY_SCALE),
          poRateAtSale: d128(po.ratePerTon, RATE_SCALE),
          totalAmount: d128(amountFrom(data.quantityTons, po.ratePerTon), MONEY_SCALE),
          ...$set,
          createdBy: userId
        },
        { session }
      );

      // A backdated delivery can fit on its own date yet starve a later one; replay both ledgers.
      await assertLedgers([po.materialId], [[data.sourceCompanyId, po.materialId]], session);
      return sale;
    });
  },

  async update(id, data, userId) {
    return withTransaction(async (session) => {
      const existing = await saleRepository.findById(id, { session, lean: true });
      if (!existing) throw notFound();

      const targetPoId = data.poId ?? existing.poId;
      const poChanged = !sameId(targetPoId, existing.poId);
      const po = await lockAndLoadPO([existing.poId, targetPoId], targetPoId, session);
      await materialRepository.lock([existing.materialId, po.materialId], { session });

      const merged = {
        saleDate: data.saleDate ?? existing.saleDate,
        sourceCompanyId: data.sourceCompanyId ?? existing.sourceCompanyId,
        quantityTons: data.quantityTons ?? existing.quantityTons
      };
      const sourceChanged = !sameId(merged.sourceCompanyId, existing.sourceCompanyId);

      // New references must be usable; unchanged ones stay valid even if since deactivated or
      // cancelled, so correcting e.g. a vehicle number on an old delivery is always possible.
      if (poChanged || D(merged.quantityTons).gt(D(existing.quantityTons))) assertPOOpen(po);
      if (poChanged) {
        await assertSaleCompany(po.companyId, session);
        await assertActiveMaterial(po.materialId, session);
      }
      if (sourceChanged) await assertSourceCompany(merged.sourceCompanyId, session);
      assertNotBeforePO(merged.saleDate, po);
      await assertCapacity({ po, ...merged, excludeSaleId: id, session });

      // The rate snapshot is kept unless the sale moves to a different PO: a later PO rate edit
      // must never silently reprice an existing delivery.
      const rate = poChanged ? po.ratePerTon : existing.poRateAtSale;
      const { $set, $unset } = optionalFields(data);
      const update = {
        $set: {
          saleDate: merged.saleDate,
          poId: po._id,
          companyId: po.companyId,
          materialId: po.materialId,
          sourceCompanyId: merged.sourceCompanyId,
          quantityTons: d128(merged.quantityTons, QTY_SCALE),
          poRateAtSale: d128(rate, RATE_SCALE),
          totalAmount: d128(amountFrom(merged.quantityTons, rate), MONEY_SCALE),
          ...$set,
          updatedBy: userId
        },
        ...(Object.keys($unset).length ? { $unset } : {})
      };
      const updated = await saleRepository.updateById(id, update, { session });

      await assertLedgers(
        [existing.materialId, po.materialId],
        [
          [existing.sourceCompanyId, existing.materialId],
          [merged.sourceCompanyId, po.materialId]
        ],
        session
      );
      return updated;
    });
  },

  /**
   * Live limits for the delivery form, before anything is saved. Same three limits as
   * assertCapacity, but the stock figures are headroom from the sale date onward, so a quantity
   * within maxAllowedTons also passes the ledger replay for a backdated delivery. `sources` lists
   * every supplier pool of the PO's material with stock left (plus the selected one).
   */
  async capacity({ poId, saleDate, sourceCompanyId, excludeSaleId }) {
    const po = await salesPORepository.findById(poId, { lean: true });
    if (!po) throw new AppError(404, 'PO_NOT_FOUND', 'Sales PO not found');

    const opts = { excludeSaleId };
    const [sold, stock, pools] = await Promise.all([
      saleRepository.soldForPO(po._id, opts),
      stockService.materialHeadroom(po.materialId, saleDate, opts),
      stockService.sourcePoolsByCompany(po.materialId, saleDate, opts)
    ]);
    const remaining = D(po.quantityTons).minus(sold);
    const allowance = maxDeliverableTons(po.quantityTons, po.tolerancePercent).minus(sold);
    const selected = sourceCompanyId ? String(sourceCompanyId) : null;
    const sourceStock = selected ? (pools.get(selected)?.available ?? D(0)) : null;

    const limits = [['PO', allowance], ['STOCK', stock], ...(sourceStock ? [['SOURCE_STOCK', sourceStock]] : [])];
    const [limitedBy, lowest] = limits.reduce((a, b) => (b[1].lt(a[1]) ? b : a));

    const candidates = [...pools.keys()].filter((id) => pools.get(id).available.gt(0) || id === selected);
    if (selected && !pools.has(selected)) candidates.push(selected);
    const companies = await companyRepository.model
      .find({ _id: { $in: candidates }, type: { $in: PURCHASE_COMPANY_TYPES } })
      .select('name isActive')
      .lean();
    const sources = companies
      .map((c) => {
        const pool = pools.get(String(c._id));
        return {
          sourceCompanyId: String(c._id),
          name: c.name,
          isActive: c.isActive,
          availableTons: maxZero(pool?.available ?? D(0)).toFixed(QTY_SCALE),
          purchasedTons: (pool?.purchased ?? D(0)).toFixed(QTY_SCALE),
          usedTons: (pool?.used ?? D(0)).toFixed(QTY_SCALE),
          firstPurchaseDate: pool?.firstPurchaseDate ? toDateOnlyString(pool.firstPurchaseDate) : null,
          lastPurchaseDate: pool?.lastPurchaseDate ? toDateOnlyString(pool.lastPurchaseDate) : null
        };
      })
      .sort((a, b) => D(b.availableTons).cmp(D(a.availableTons)) || a.name.localeCompare(b.name));

    return {
      poId: String(po._id),
      poNumber: po.poNumber,
      poDate: toDateOnlyString(po.poDate),
      poOpen: po.lifecycleStatus === PO_LIFECYCLE.ACTIVE,
      materialId: String(po.materialId),
      saleDate: toDateOnlyString(saleDate),
      // Ordered tons not delivered yet; poAllowanceTons adds the order's tolerance and is the limit.
      remainingQuantityTons: maxZero(remaining).toFixed(QTY_SCALE),
      tolerancePercent: tolerancePercentOf(po.tolerancePercent).toFixed(RATE_SCALE),
      poAllowanceTons: maxZero(allowance).toFixed(QTY_SCALE),
      availableStockTons: stock.toFixed(QTY_SCALE),
      availableSourceStockTons: sourceStock ? sourceStock.toFixed(QTY_SCALE) : null,
      maxAllowedTons: maxZero(lowest).toFixed(QTY_SCALE),
      limitedBy,
      sources
    };
  },

  async get(id) {
    const sale = await saleRepository.model.findById(id).populate(DISPLAY).lean();
    if (!sale) throw notFound();
    return sale;
  },

  async list(query) {
    const { page, limit, skip } = pagination(query);
    const filter = { ...dateFilter(query.from, query.to, 'saleDate') };
    for (const key of ['companyId', 'sourceCompanyId', 'materialId', 'poId']) {
      if (query[key]) filter[key] = query[key];
    }
    if (query.search)
      filter.$or = [{ challanNumber: searchRegex(query.search) }, { vehicleNumber: searchRegex(query.search) }];

    const { items, total } = await saleRepository.paginate(filter, {
      sort: { saleDate: -1, _id: -1 },
      skip,
      limit,
      populate: DISPLAY
    });
    return { items, page, limit, total };
  }
};
