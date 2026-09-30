import { AppError } from '../errors/AppError.js';
import { PURCHASE_COMPANY_TYPES, SALE_COMPANY_TYPES } from '../constants/companyTypes.js';
import { companyRepository } from '../repositories/company.repository.js';
import { materialRepository } from '../repositories/material.repository.js';

/**
 * Master-data checks shared by transaction services. "Active" is required only when a transaction
 * newly references a master: inactive masters stay valid on existing history, so correcting e.g.
 * the notes of an old purchase from a since-deactivated supplier is still possible.
 */

async function loadCompany(companyId, session) {
  return companyRepository.findById(companyId, { session, lean: true });
}

export async function assertPurchaseCompany(companyId, session) {
  const company = await loadCompany(companyId, session);
  if (!company?.isActive || !PURCHASE_COMPANY_TYPES.includes(company.type)) {
    throw new AppError(422, 'INVALID_PURCHASE_COMPANY', 'Purchase company must be an active PURCHASE or BOTH company', {
      companyId: String(companyId)
    });
  }
  return company;
}

export async function assertSaleCompany(companyId, session) {
  const company = await loadCompany(companyId, session);
  if (!company?.isActive || !SALE_COMPANY_TYPES.includes(company.type)) {
    throw new AppError(422, 'INVALID_SALE_COMPANY', 'Customer company must be an active SALE or BOTH company', {
      companyId: String(companyId)
    });
  }
  return company;
}

/** The purchase-side company whose Company + Material pool a sale consumes. */
export async function assertSourceCompany(sourceCompanyId, session) {
  const company = await loadCompany(sourceCompanyId, session);
  if (!company?.isActive || !PURCHASE_COMPANY_TYPES.includes(company.type)) {
    throw new AppError(
      422,
      'INVALID_SOURCE_COMPANY',
      'Stock source company must be an active PURCHASE or BOTH company',
      {
        sourceCompanyId: String(sourceCompanyId)
      }
    );
  }
  return company;
}

export async function assertActiveMaterial(materialId, session) {
  const material = await materialRepository.findById(materialId, { session, lean: true });
  if (!material?.isActive) {
    throw new AppError(422, 'INVALID_MATERIAL', 'Material is missing or inactive', { materialId: String(materialId) });
  }
  return material;
}
