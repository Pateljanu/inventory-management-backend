import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  reportQuerySchema,
  companyReportSchema,
  sourceStockQuerySchema,
  trendQuerySchema
} from '../validations/report.validation.js';
import { dashboard, companySummary, sourceStock, trend } from '../controllers/report.controller.js';

const router = Router();

router.get('/dashboard', validate(reportQuerySchema), asyncHandler(dashboard));
router.get('/source-stock', validate(sourceStockQuerySchema), asyncHandler(sourceStock));
router.get('/trend', validate(trendQuerySchema), asyncHandler(trend));
router.get('/companies/:id', validate(companyReportSchema), asyncHandler(companySummary));

export default router;
