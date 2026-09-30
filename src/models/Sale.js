import mongoose from 'mongoose';

const { ObjectId, Decimal128 } = mongoose.Schema.Types;

const schema = new mongoose.Schema(
  {
    // Business-effective delivery date (UTC midnight).
    saleDate: { type: Date, required: true },
    poId: { type: ObjectId, ref: 'SalesPO', required: true },
    // Customer company - always copied from the PO by the backend, never accepted from the client.
    companyId: { type: ObjectId, ref: 'Company', required: true },
    // Purchase-side company whose Company + Material stock pool this delivery consumes.
    // Intentionally separate from companyId; the two must never be treated as interchangeable.
    sourceCompanyId: { type: ObjectId, ref: 'Company', required: true },
    // Copied from the PO by the backend.
    materialId: { type: ObjectId, ref: 'Material', required: true },
    quantityTons: { type: Decimal128, required: true },
    // Snapshot of the PO rate when the sale was saved; later PO rate edits do not change it.
    poRateAtSale: { type: Decimal128, required: true },
    totalAmount: { type: Decimal128, required: true },
    vehicleNumber: { type: String, trim: true, uppercase: true },
    challanNumber: { type: String, trim: true },
    normalizedChallanNumber: { type: String },
    notes: { type: String, trim: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedBy: { type: ObjectId, ref: 'User' }
  },
  { timestamps: true, versionKey: false }
);

schema.index({ saleDate: -1 });
schema.index({ poId: 1, saleDate: -1 });
schema.index({ materialId: 1, saleDate: -1 });
schema.index({ companyId: 1, saleDate: -1 });
schema.index({ sourceCompanyId: 1, materialId: 1, saleDate: -1 });
schema.index(
  { companyId: 1, normalizedChallanNumber: 1 },
  { unique: true, partialFilterExpression: { normalizedChallanNumber: { $type: 'string' } } }
);

export const Sale = mongoose.model('Sale', schema);
