import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true },
    // Physical stock on hand before the first recorded purchase. Material-level only: it has no
    // supplier identity, so it never counts toward any source-company stock pool.
    openingStockTons: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => mongoose.Types.Decimal128.fromString('0.000')
    },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    // No business meaning: incremented inside stock-mutating transactions so concurrent
    // mutations of the same material conflict and are serialized by MongoDB.
    lockVersion: { type: Number, default: 0, select: false }
  },
  { timestamps: true, versionKey: false }
);

schema.index({ normalizedName: 1 }, { unique: true });
schema.index({ isActive: 1 });

export const Material = mongoose.model('Material', schema);
