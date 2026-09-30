import { LockableRepository } from './base.repository.js';
import { Material } from '../models/Material.js';

class MaterialRepository extends LockableRepository {
  constructor() {
    super(Material);
  }

  findByNormalizedName(normalizedName, { session } = {}) {
    return Material.findOne({ normalizedName }).session(session ?? null);
  }

  namesByIds(ids) {
    return Material.find({ _id: { $in: ids } })
      .select('name')
      .lean();
  }
}

export const materialRepository = new MaterialRepository();
