import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../constants/roles.js';
import {
  saleCapacitySchema,
  saleCreateSchema,
  saleUpdateSchema,
  saleGetSchema,
  saleListSchema
} from '../validations/sale.validation.js';
import { createSale, updateSale, getSale, getSaleCapacity, listSales } from '../controllers/sale.controller.js';

const router = Router();

router.get('/', validate(saleListSchema), asyncHandler(listSales));
// Before '/:id' so "capacity" is not read as an id.
router.get('/capacity', validate(saleCapacitySchema), asyncHandler(getSaleCapacity));
router.get('/:id', validate(saleGetSchema), asyncHandler(getSale));
router.post('/', authorize(ROLES.OWNER), validate(saleCreateSchema), asyncHandler(createSale));
router.patch('/:id', authorize(ROLES.OWNER), validate(saleUpdateSchema), asyncHandler(updateSale));

export default router;
