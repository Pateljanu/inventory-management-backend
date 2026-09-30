import mongoose from 'mongoose';
import { PO_LIFECYCLE } from '../constants/poStatus.js';

const { ObjectId, Decimal128 } = mongoose.Schema.Types;

const schema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, trim: true },
    normalizedPoNumber: { type: String, required: true },
    poDate: { type: Date, required: true },
    // Customer company.
    companyId: { type: ObjectId, ref: 'Company', required: true },
    materialId: { type: ObjectId, ref: 'Material', required: true },
    quantityTons: { type: Decimal128, required: true },
    // Live PO rate used for future sales; existing sales keep their poRateAtSale snapshot.
    ratePerTon: { type: Decimal128, required: true },
    totalPOAmount: { type: Decimal128, required: true },
    // Only the persistent lifecycle is stored; PENDING/PARTIALLY_SUPPLIED/COMPLETED are derived
    // from Sale records so there is no second delivered counter to drift out of sync.
    lifecycleStatus: { type: String, enum: Object.values(PO_LIFECYCLE), default: PO_LIFECYCLE.ACTIVE },
    notes: { type: String, trim: true },
    lockVersion: { type: Number, default: 0, select: false },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedBy: { type: ObjectId, ref: 'User' }
  },
  { timestamps: true, versionKey: false }
);

// PO-001 may exist at two different customers, but only once per customer.
schema.index({ companyId: 1, normalizedPoNumber: 1 }, { unique: true });
schema.index({ poDate: -1 });
schema.index({ companyId: 1, poDate: -1 });
schema.index({ materialId: 1, poDate: -1 });
schema.index({ lifecycleStatus: 1, materialId: 1 });

export const SalesPO = mongoose.model('SalesPO', schema);
