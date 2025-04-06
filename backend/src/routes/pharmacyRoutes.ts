// backend/src/routes/pharmacyRoutes.ts
import { Router } from 'express';
import { getPharmacyData } from '../controllers/pharmacyController';

const router = Router();

// Define a GET route for retrieving pharmacy data
router.get('/pharmacies', getPharmacyData);

// Export router as default
export default router;
