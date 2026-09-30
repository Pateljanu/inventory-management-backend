import { materialService } from '../services/material.service.js';
import { created, ok } from '../utils/apiResponse.js';
import { pageMeta } from '../utils/pagination.js';

export async function createMaterial(req, res) {
  return created(res, await materialService.create(req.validated.body));
}

export async function updateMaterial(req, res) {
  return ok(res, await materialService.update(req.validated.params.id, req.validated.body));
}

export async function getMaterial(req, res) {
  return ok(res, await materialService.get(req.validated.params.id));
}

export async function listMaterials(req, res) {
  const result = await materialService.list(req.validated.query);
  return ok(res, result.items, pageMeta(result));
}
