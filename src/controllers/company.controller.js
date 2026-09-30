import { companyService } from '../services/company.service.js';
import { created, ok } from '../utils/apiResponse.js';
import { pageMeta } from '../utils/pagination.js';

export async function createCompany(req, res) {
  return created(res, await companyService.create(req.validated.body));
}

export async function updateCompany(req, res) {
  return ok(res, await companyService.update(req.validated.params.id, req.validated.body));
}

export async function getCompany(req, res) {
  return ok(res, await companyService.get(req.validated.params.id));
}

export async function listCompanies(req, res) {
  const result = await companyService.list(req.validated.query);
  return ok(res, result.items, pageMeta(result));
}
