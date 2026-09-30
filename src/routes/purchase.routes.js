import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../constants/roles.js';
import {
  purchaseCreateSchema,
  purchaseUpdateSchema,
  purchaseGetSchema,
  purchaseListSchema
} from '../validations/purchase.validation.js';
import { createPurchase, updatePurchase, getPurchase, listPurchases } from '../controllers/purchase.controller.js';

const router = Router();

router.get('/', validate(purchaseListSchema), asyncHandler(listPurchases));
router.get('/:id', validate(purchaseGetSchema), asyncHandler(getPurchase));
router.post('/', authorize(ROLES.OWNER), validate(purchaseCreateSchema), asyncHandler(createPurchase));
router.patch('/:id', authorize(ROLES.OWNER), validate(purchaseUpdateSchema), asyncHandler(updatePurchase));

export default router;
