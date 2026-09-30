import mongoose from 'mongoose';

/**
 * Aggregation pipelines are NOT cast by Mongoose: a string id in $match silently matches nothing.
 * Every id used in an aggregate $match must go through this helper.
 */
export function toObjectId(id) {
  return id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id));
}

export const sameId = (a, b) => a != null && b != null && String(a) === String(b);
