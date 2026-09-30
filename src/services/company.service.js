import { AppError } from '../errors/AppError.js';
import { PURCHASE_COMPANY_TYPES, SALE_COMPANY_TYPES } from '../constants/companyTypes.js';
import { normalizeKey, normalizeText, searchRegex } from '../utils/normalize.js';
import { pagination } from '../utils/pagination.js';
import { companyRepository } from '../repositories/company.repository.js';
import { purchaseRepository } from '../repositories/purchase.repository.js';
import { salesPORepository } from '../repositories/salesPO.repository.js';
import { saleRepository } from '../repositories/sale.repository.js';

const notFound = () => new AppError(404, 'COMPANY_NOT_FOUND', 'Company not found');

/** Builds a { $set, $unset } update; an empty GST/contact value clears the stored field. */
function toUpdate(data) {
  const $set = {};
  const $unset = {};
  if (data.name !== undefined)
    Object.assign($set, { name: normalizeText(data.name), normalizedName: normalizeKey(data.name) });
  if (data.type !== undefined) $set.type = data.type;
  if (data.isActive !== undefined) $set.isActive = data.isActive;
  if (data.address !== undefined) $set.address = normalizeText(data.address);
  if (data.gstNumber !== undefined) {
    if (data.gstNumber) $set.gstNumber = data.gstNumber;
    else $unset.gstNumber = 1;
  }
  if (data.contact !== undefined) {
    $set.contact = Object.fromEntries(Object.entries(data.contact).filter(([, v]) => v !== undefined && v !== ''));
  }
  return { $set, ...(Object.keys($unset).length ? { $unset } : {}) };
}

/**
 * A company's type may not drop a role it already plays in recorded history, otherwise existing
 * purchases/sales would reference a company that is no longer valid for them.
 */
async function assertTypeChangeAllowed(company, newType) {
  const losesPurchase = PURCHASE_COMPANY_TYPES.includes(company.type) && !PURCHASE_COMPANY_TYPES.includes(newType);
  const losesSale = SALE_COMPANY_TYPES.includes(company.type) && !SALE_COMPANY_TYPES.includes(newType);

  if (losesPurchase) {
    const [hasPurchases, isStockSource] = await Promise.all([
      purchaseRepository.exists({ companyId: company._id }),
      saleRepository.exists({ sourceCompanyId: company._id })
    ]);
    if (hasPurchases || isStockSource) {
      throw new AppError(
        409,
        'COMPANY_TYPE_IN_USE',
        'Company has purchase history; its type must keep PURCHASE capability (use BOTH)'
      );
    }
  }
  if (losesSale && (await salesPORepository.exists({ companyId: company._id }))) {
    throw new AppError(
      409,
      'COMPANY_TYPE_IN_USE',
      'Company has sales POs; its type must keep SALE capability (use BOTH)'
    );
  }
}

export const companyService = {
  async create(data) {
    const { $set } = toUpdate(data);
    return companyRepository.create($set);
  },

  async update(id, data) {
    const existing = await companyRepository.findById(id, { lean: true });
    if (!existing) throw notFound();
    if (data.type && data.type !== existing.type) await assertTypeChangeAllowed(existing, data.type);

    const updated = await companyRepository.updateById(id, toUpdate(data));
    if (!updated) throw notFound();
    return updated;
  },

  async get(id) {
    const company = await companyRepository.findById(id, { lean: true });
    if (!company) throw notFound();
    return company;
  },

  async list(query) {
    const { page, limit, skip } = pagination(query);
    const filter = {};
    if (query.type) filter.type = query.type;
    if (query.usage === 'purchase') filter.type = { $in: PURCHASE_COMPANY_TYPES };
    if (query.usage === 'sale') filter.type = { $in: SALE_COMPANY_TYPES };
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) filter.$or = [{ name: searchRegex(query.search) }, { gstNumber: searchRegex(query.search) }];

    const { items, total } = await companyRepository.paginate(filter, { sort: { name: 1 }, skip, limit });
    return { items, page, limit, total };
  }
};
