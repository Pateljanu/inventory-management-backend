import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../constants/roles.js';
import {
  companyCreateSchema,
  companyUpdateSchema,
  companyGetSchema,
  companyListSchema
} from '../validations/company.validation.js';
import { createCompany, updateCompany, getCompany, listCompanies } from '../controllers/company.controller.js';

const router = Router();

router.get('/', validate(companyListSchema), asyncHandler(listCompanies));
router.get('/:id', validate(companyGetSchema), asyncHandler(getCompany));
router.post('/', authorize(ROLES.OWNER), validate(companyCreateSchema), asyncHandler(createCompany));
router.patch('/:id', authorize(ROLES.OWNER), validate(companyUpdateSchema), asyncHandler(updateCompany));

export default router;
