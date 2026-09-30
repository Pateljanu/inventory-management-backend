import mongoose from 'mongoose';
import { COMPANY_TYPES } from '../constants/companyTypes.js';

const contactSchema = new mongoose.Schema(
  {
    person: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Lowercased, space-collapsed identity key; prevents "Akshat TMT" and "akshat  tmt" twins.
    normalizedName: { type: String, required: true },
    contact: { type: contactSchema, default: () => ({}) },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    type: { type: String, enum: Object.values(COMPANY_TYPES), required: true },
    // Inactive companies stay referenced by history but cannot be used for new transactions.
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

schema.index({ normalizedName: 1 }, { unique: true });
// Partial (not sparse) so only real GST strings participate; a missing GST never collides.
schema.index({ gstNumber: 1 }, { unique: true, partialFilterExpression: { gstNumber: { $type: 'string' } } });
schema.index({ type: 1, isActive: 1 });

export const Company = mongoose.model('Company', schema);
