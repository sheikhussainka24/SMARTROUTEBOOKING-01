import { Router } from 'express';
import { getRouteCatalogue } from '../controllers/tripController.js';

const router = Router();

// Public route catalogue endpoints
router.get('/catalogue', getRouteCatalogue);
router.get('/', getRouteCatalogue);

export default router;
