import { BaseRepository } from './base.repository.js';
import { Company } from '../models/Company.js';

class CompanyRepository extends BaseRepository {
  constructor() {
    super(Company);
  }

  findByNormalizedName(normalizedName, { session } = {}) {
    return Company.findOne({ normalizedName }).session(session ?? null);
  }

  namesByIds(ids) {
    return Company.find({ _id: { $in: ids } })
      .select('name type')
      .lean();
  }
}

export const companyRepository = new CompanyRepository();
