import { D } from '../utils/decimal.js';

/**
 * Reusable persistence access. Every method accepts an optional MongoDB session so the same
 * code works inside and outside transactions; inside a transaction the session is mandatory.
 */
export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  findById(id, { session, lean = false, select } = {}) {
    const query = this.model.findById(id).session(session ?? null);
    if (select) query.select(select);
    return lean ? query.lean() : query;
  }

  exists(filter, { session } = {}) {
    return this.model.exists(filter).session(session ?? null);
  }

  async create(doc, { session } = {}) {
    // Array form is required by Mongoose when passing a session.
    const [created] = await this.model.create([doc], { session });
    return created;
  }

  updateById(id, update, { session } = {}) {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true, session });
  }

  /** Paginated, lean list with total count. */
  async paginate(filter, { sort, skip, limit, populate = [], select } = {}) {
    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit);
    if (select) query = query.select(select);
    for (const p of populate) query = query.populate(p);
    const [items, total] = await Promise.all([query.lean(), this.model.countDocuments(filter)]);
    return { items, total };
  }

  /** Exact Decimal sum of a Decimal128 field. `match` must already contain ObjectIds (no casting). */
  async sumField(match, field, { session } = {}) {
    const [row] = await this.model
      .aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }])
      .session(session ?? null);
    return D(row?.total);
  }

  /**
   * Grouped exact sums. `groupBy` is a $group _id expression (e.g. '$materialId' or
   * { sourceCompanyId: '$companyId', materialId: '$materialId' }); `fields` maps output name -> field.
   */
  async groupTotals(match, groupBy, fields) {
    const group = { _id: groupBy };
    for (const [name, field] of Object.entries(fields)) group[name] = { $sum: `$${field}` };
    const rows = await this.model.aggregate([{ $match: match }, { $group: group }]);
    return rows.map((row) => {
      const out = { _id: row._id };
      for (const name of Object.keys(fields)) out[name] = D(row[name]);
      return out;
    });
  }

  /** Per-day totals of a Decimal128 field, ascending by date. Business dates are UTC midnight. */
  async dailyTotals(match, dateField, field, { session } = {}) {
    const rows = await this.model
      .aggregate([
        { $match: match },
        { $group: { _id: `$${dateField}`, total: { $sum: `$${field}` } } },
        { $sort: { _id: 1 } }
      ])
      .session(session ?? null);
    return rows.map((row) => ({ date: row._id, total: D(row.total) }));
  }

  /** dailyTotals for many ledgers at once: Map<String(key), [{ date, total }]> ascending by date. */
  async dailyTotalsBy(match, keyExpression, dateField, field, { session } = {}) {
    const rows = await this.model
      .aggregate([
        { $match: match },
        { $group: { _id: { key: keyExpression, date: `$${dateField}` }, total: { $sum: `$${field}` } } },
        { $sort: { '_id.date': 1 } }
      ])
      .session(session ?? null);
    const byKey = new Map();
    for (const row of rows) {
      const key = String(row._id.key);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ date: row._id.date, total: D(row.total) });
    }
    return byKey;
  }
}

/**
 * Adds concurrency locking for documents that carry a lockVersion field. Incrementing it inside
 * a transaction makes any concurrent transaction touching the same document hit a write conflict,
 * which MongoDB's transaction retry then serializes. Aggregate-based checks (stock, PO remaining)
 * are therefore never evaluated against a stale snapshot by two writers at once.
 */
export class LockableRepository extends BaseRepository {
  async lock(ids, { session }) {
    // Sorted so every transaction acquires locks in the same order.
    const unique = [...new Set([].concat(ids).map(String))].sort();
    for (const id of unique) {
      await this.model.updateOne({ _id: id }, { $inc: { lockVersion: 1 } }, { session });
    }
  }
}
