import { reportService } from '../services/report.service.js';
import { ok } from '../utils/apiResponse.js';

export async function dashboard(req, res) {
  return ok(res, await reportService.dashboard(req.validated.query));
}

export async function sourceStock(req, res) {
  return ok(res, await reportService.sourceStock(req.validated.query));
}

export async function companySummary(req, res) {
  return ok(res, await reportService.companySummary(req.validated.params.id, req.validated.query));
}

export async function trend(req, res) {
  return ok(res, await reportService.trend(req.validated.query));
}
