import { purchaseService } from '../services/purchase.service.js';
import { created, ok } from '../utils/apiResponse.js';
import { pageMeta } from '../utils/pagination.js';

export async function createPurchase(req, res) {
  return created(res, await purchaseService.create(req.validated.body, req.user._id));
}

export async function updatePurchase(req, res) {
  return ok(res, await purchaseService.update(req.validated.params.id, req.validated.body, req.user._id));
}

export async function getPurchase(req, res) {
  return ok(res, await purchaseService.get(req.validated.params.id));
}

export async function listPurchases(req, res) {
  const result = await purchaseService.list(req.validated.query);
  return ok(res, result.items, pageMeta(result));
}
