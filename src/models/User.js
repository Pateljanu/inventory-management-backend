import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';

const schema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    // Argon2id hash; the plaintext password is never stored or logged.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.OWNER },
    // Deactivation revokes access without deleting the user referenced by createdBy fields.
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

schema.index({ email: 1 }, { unique: true });

export const User = mongoose.model('User', schema);
