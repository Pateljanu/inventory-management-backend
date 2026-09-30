import { saleService } from '../services/sale.service.js';
import { created, ok } from '../utils/apiResponse.js';
import { pageMeta } from '../utils/pagination.js';

export async function createSale(req, res) {
  return created(res, await saleService.create(req.validated.body, req.user._id));
}

export async function updateSale(req, res) {
  return ok(res, await saleService.update(req.validated.params.id, req.validated.body, req.user._id));
}

export async function getSale(req, res) {
  return ok(res, await saleService.get(req.validated.params.id));
}

export async function listSales(req, res) {
  const result = await saleService.list(req.validated.query);
  return ok(res, result.items, pageMeta(result));
}

export async function getSaleCapacity(req, res) {
  return ok(res, await saleService.capacity(req.validated.query));
}
