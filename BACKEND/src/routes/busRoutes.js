import { Router } from 'express';
import {
  searchBuses,
  getBusById,
  getAllBuses,
  getBusSeatLayout,
} from '../controllers/busController.js';

const router = Router();

// Bus search endpoint (supports ?from=&to=&date=)
router.get('/search', searchBuses);

// Bus seat layout & real-time inventory evaluation endpoint
router.get('/:busId/seat-layout', getBusSeatLayout);
router.get('/:id/seat-layout', getBusSeatLayout);

// Bus details endpoint by ID or registration number
router.get('/:id', getBusById);

// All active buses listing endpoint
router.get('/', getAllBuses);

export default router;
