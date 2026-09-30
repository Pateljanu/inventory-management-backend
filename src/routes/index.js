import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import authRoutes from './auth.routes.js';
import companyRoutes from './company.routes.js';
import materialRoutes from './material.routes.js';
import purchaseRoutes from './purchase.routes.js';
import salesPORoutes from './salesPO.routes.js';
import saleRoutes from './sale.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/auth', authRoutes);

// Everything below requires a valid access token. Reads are open to OWNER and VIEWER;
// each resource router restricts writes to OWNER.
router.use(authenticate);
router.use('/companies', companyRoutes);
router.use('/materials', materialRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/sales-pos', salesPORoutes);
router.use('/sales', saleRoutes);
router.use('/reports', reportRoutes);

export default router;
