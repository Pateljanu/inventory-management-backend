import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // SHA-256 of the opaque refresh token; the raw token is returned to the client exactly once.
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String },
    ip: { type: String }
  },
  { timestamps: true, versionKey: false }
);

schema.index({ tokenHash: 1 }, { unique: true });
schema.index({ userId: 1 });
// TTL: MongoDB removes each session automatically once expiresAt has passed.
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSession = mongoose.model('RefreshSession', schema);
