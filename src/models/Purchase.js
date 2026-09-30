import mongoose from 'mongoose';

const { ObjectId, Decimal128 } = mongoose.Schema.Types;

const schema = new mongoose.Schema(
  {
    // Business-effective inbound date (UTC midnight); distinct from technical createdAt.
    purchaseDate: { type: Date, required: true },
    // Supplier / purchase-side company. Also the stock "source" that Sales allocate from.
    companyId: { type: ObjectId, ref: 'Company', required: true },
    materialId: { type: ObjectId, ref: 'Material', required: true },
    quantityTons: { type: Decimal128, required: true },
    ratePerTon: { type: Decimal128, required: true },
    // Always calculated by the backend: quantityTons x ratePerTon.
    totalAmount: { type: Decimal128, required: true },
    vehicleNumber: { type: String, trim: true, uppercase: true },
    invoiceNumber: { type: String, trim: true },
    normalizedInvoiceNumber: { type: String },
    notes: { type: String, trim: true },
    createdBy: { type: ObjectId, ref: 'User', required: true },
    updatedBy: { type: ObjectId, ref: 'User' }
  },
  { timestamps: true, versionKey: false }
);

schema.index({ purchaseDate: -1 });
schema.index({ companyId: 1, purchaseDate: -1 });
schema.index({ materialId: 1, purchaseDate: -1 });
// Source-company stock pool lookups: purchases for (company, material) up to a cutoff.
schema.index({ companyId: 1, materialId: 1, purchaseDate: -1 });
schema.index(
  { companyId: 1, normalizedInvoiceNumber: 1 },
  { unique: true, partialFilterExpression: { normalizedInvoiceNumber: { $type: 'string' } } }
);

export const Purchase = mongoose.model('Purchase', schema);
