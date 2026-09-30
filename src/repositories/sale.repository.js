import { BaseRepository } from './base.repository.js';
import { Sale } from '../models/Sale.js';
import { toObjectId } from '../utils/objectId.js';

class SaleRepository extends BaseRepository {
  constructor() {
    super(Sale);
  }

  /** Total delivered against a PO, optionally excluding one sale (edits) and/or up to a cutoff. */
  soldForPO(poId, { session, excludeSaleId, asOf } = {}) {
    const match = { poId: toObjectId(poId) };
    if (excludeSaleId) match._id = { $ne: toObjectId(excludeSaleId) };
    if (asOf) match.saleDate = { $lte: asOf };
    return this.sumField(match, 'quantityTons', { session });
  }

  async earliestSaleDateForPO(poId, { session } = {}) {
    const first = await Sale.findOne({ poId })
      .sort({ saleDate: 1 })
      .select('saleDate')
      .session(session ?? null)
      .lean();
    return first?.saleDate ?? null;
  }

  distinctSourceCompaniesForPO(poId, { session } = {}) {
    return Sale.distinct('sourceCompanyId', { poId }).session(session ?? null);
  }

  reassignPO(poId, { companyId, materialId }, { session }) {
    return Sale.updateMany({ poId }, { $set: { companyId, materialId } }, { session });
  }
}

export const saleRepository = new SaleRepository();
