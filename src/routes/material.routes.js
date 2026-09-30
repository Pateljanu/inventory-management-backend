import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../constants/roles.js';
import {
  materialCreateSchema,
  materialUpdateSchema,
  materialGetSchema,
  materialListSchema
} from '../validations/material.validation.js';
import { createMaterial, updateMaterial, getMaterial, listMaterials } from '../controllers/material.controller.js';

const router = Router();

router.get('/', validate(materialListSchema), asyncHandler(listMaterials));
router.get('/:id', validate(materialGetSchema), asyncHandler(getMaterial));
router.post('/', authorize(ROLES.OWNER), validate(materialCreateSchema), asyncHandler(createMaterial));
router.patch('/:id', authorize(ROLES.OWNER), validate(materialUpdateSchema), asyncHandler(updateMaterial));

export default router;
