import mongoose from 'mongoose';
import { LockableRepository } from './base.repository.js';
import { SalesPO } from '../models/SalesPO.js';
import { PO_DISPLAY_STATUS, PO_LIFECYCLE } from '../constants/poStatus.js';

const ZERO = mongoose.Types.Decimal128.fromString('0');
// Clamped positions keep the quantity scale ("0.000"), like the values they replace.
const ZERO_TONS = mongoose.Types.Decimal128.fromString('0.000');

/** Resolves a reference to { _id, name } like populate(), inside an aggregation. */
const lookupName = (from, field) => [
  { $lookup: { from, localField: field, foreignField: '_id', pipeline: [{ $project: { name: 1 } }], as: field } },
  { $set: { [field]: { $first: `$${field}` } } }
];

/**
 * Adds soldQuantityTons, remainingQuantityTons, extraQuantityTons and the derived displayStatus from the Sale
 * collection. Status is computed, never stored, so it can never drift from the actual deliveries.
 */
const positionStages = [
  {
    $lookup: {
      from: 'sales',
      localField: '_id',
      foreignField: 'poId',
      pipeline: [{ $group: { _id: null, sold: { $sum: '$quantityTons' } } }],
      as: 'delivered'
    }
  },
  { $set: { soldQuantityTons: { $ifNull: [{ $first: '$delivered.sold' }, ZERO] } } },
  {
    $set: {
      remainingQuantityTons: { $max: [{ $subtract: ['$quantityTons', '$soldQuantityTons'] }, ZERO_TONS] },
      // Delivered beyond the ordered tons, within the order's tolerance.
      extraQuantityTons: { $max: [{ $subtract: ['$soldQuantityTons', '$quantityTons'] }, ZERO_TONS] }
    }
  },
  {
    $set: {
      displayStatus: {
        $switch: {
          branches: [
            { case: { $eq: ['$lifecycleStatus', PO_LIFECYCLE.CANCELLED] }, then: PO_DISPLAY_STATUS.CANCELLED },
            { case: { $lte: ['$soldQuantityTons', 0] }, then: PO_DISPLAY_STATUS.PENDING },
            { case: { $lte: ['$remainingQuantityTons', 0] }, then: PO_DISPLAY_STATUS.COMPLETED }
          ],
          default: PO_DISPLAY_STATUS.PARTIALLY_SUPPLIED
        }
      }
    }
  },
  { $unset: ['delivered', 'lockVersion'] }
];

const displayStages = [...lookupName('companies', 'companyId'), ...lookupName('materials', 'materialId')];

class SalesPORepository extends LockableRepository {
  constructor() {
    super(SalesPO);
  }

  /**
   * Paginated PO list with delivery position. Without a status filter the page is cut before the
   * Sale lookup, so only the returned POs are aggregated.
   */
  async listWithPosition(match, { skip, limit, displayStatus }) {
    // displayStatus: optional array of derived statuses.
    const sort = { $sort: { poDate: -1, _id: -1 } };
    const pipeline = displayStatus?.length
      ? [
          { $match: match },
          sort,
          ...positionStages,
          { $match: { displayStatus: { $in: displayStatus } } },
          { $facet: { items: [{ $skip: skip }, { $limit: limit }, ...displayStages], total: [{ $count: 'n' }] } }
        ]
      : [
          { $match: match },
          {
            $facet: {
              items: [sort, { $skip: skip }, { $limit: limit }, ...positionStages, ...displayStages],
              total: [{ $count: 'n' }]
            }
          }
        ];
    const [result] = await SalesPO.aggregate(pipeline);
    return { items: result.items, total: result.total[0]?.n ?? 0 };
  }

  async findWithPosition(id) {
    const [po] = await SalesPO.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(String(id)) } },
      ...positionStages,
      ...displayStages
    ]);
    return po ?? null;
  }
}

export const salesPORepository = new SalesPORepository();
