import { Router } from 'express';
import { autocompletePlaces, getPlaceDetails } from '../controllers/placeController.js';

const router = Router();

router.get('/autocomplete', autocompletePlaces);
router.get('/details', getPlaceDetails);

export default router;
