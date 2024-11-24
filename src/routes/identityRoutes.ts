import { Router } from 'express';
import identityController from '../controllers/identityController';

const router = Router();

router.post('/identify', identityController.identify);

export default router;