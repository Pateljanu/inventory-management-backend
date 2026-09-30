import { salesPOService } from '../services/salesPO.service.js';
import { created, ok } from '../utils/apiResponse.js';
import { pageMeta } from '../utils/pagination.js';

export async function createSalesPO(req, res) {
  return created(res, await salesPOService.create(req.validated.body, req.user._id));
}

export async function updateSalesPO(req, res) {
  return ok(res, await salesPOService.update(req.validated.params.id, req.validated.body, req.user._id));
}

export async function getSalesPO(req, res) {
  return ok(res, await salesPOService.get(req.validated.params.id));
}

export async function listSalesPOs(req, res) {
  const result = await salesPOService.list(req.validated.query);
  return ok(res, result.items, pageMeta(result));
}
