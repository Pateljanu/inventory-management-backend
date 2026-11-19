import mongoose from 'mongoose';

const { ObjectId, Decimal128 } = mongoose.Schema.Types;

/**
 * A delivery that was voided (entered by mistake, e.g. the same truck saved twice). Voiding moves
 * the delivery out of the `sales` collection into this one, keeping the same _id, so every stock,
 * PO and report calculation (all computed from `sales`) drops it automatically while the record
 * and the reason stay on file.
 */
const schema = new mongoose.Schema(
  {
    saleDate: { type: Date, required: true },
    poId: { type: ObjectId, ref: 'SalesPO', required: true },
    companyId: { type: ObjectId, ref: 'Company', required: true },
    sourceCompanyId: { type: ObjectId, ref: 'Company', required: true },
    materialId: { type: ObjectId, ref: 'Material', required: true },
    quantityTons: { type: Decimal128, required: true },
    poRateAtSale: { type: Decimal128, required: true },
    totalAmount: { type: Decimal128, required: true },
    vehicleNumber: { type: String },
    challanNumber: { type: String },
    normalizedChallanNumber: { type: String },
    notes: { type: String },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedBy: { type: ObjectId, ref: 'User' },
    // When the delivery itself was first saved / last edited.
    createdAt: { type: Date },
    updatedAt: { type: Date },
    voidedAt: { type: Date, required: true },
    voidedBy: { type: ObjectId, ref: 'User', required: true },
    voidReason: { type: String, required: true, trim: true }
  },
  { versionKey: false, collection: 'voidedsales' }
);

schema.index({ voidedAt: -1 });
schema.index({ saleDate: -1 });
schema.index({ poId: 1 });

export const VoidedSale = mongoose.model('VoidedSale', schema);
