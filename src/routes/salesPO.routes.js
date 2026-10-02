import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../constants/roles.js';
import {
  salesPOCreateSchema,
  salesPOUpdateSchema,
  salesPOGetSchema,
  salesPOListSchema,
  salesPOSettleSchema
} from '../validations/salesPO.validation.js';
import {
  createSalesPO,
  updateSalesPO,
  getSalesPO,
  listSalesPOs,
  settleSalesPO
} from '../controllers/salesPO.controller.js';

const router = Router();

router.get('/', validate(salesPOListSchema), asyncHandler(listSalesPOs));
router.get('/:id', validate(salesPOGetSchema), asyncHandler(getSalesPO));
router.post('/', authorize(ROLES.OWNER), validate(salesPOCreateSchema), asyncHandler(createSalesPO));
router.post('/:id/settle', authorize(ROLES.OWNER), validate(salesPOSettleSchema), asyncHandler(settleSalesPO));
router.patch('/:id', authorize(ROLES.OWNER), validate(salesPOUpdateSchema), asyncHandler(updateSalesPO));

export default router;
