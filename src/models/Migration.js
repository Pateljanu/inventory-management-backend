import mongoose from 'mongoose';

// One document per applied migration; _id is the migration id.
const schema = new mongoose.Schema(
  {
    _id: { type: String },
    appliedAt: { type: Date, default: Date.now },
    durationMs: { type: Number }
  },
  { versionKey: false }
);

export const Migration = mongoose.models.Migration || mongoose.model('Migration', schema, 'migrations');
