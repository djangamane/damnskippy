import { Router } from 'express';
import { authRouter } from './auth.js';
import { researchRouter } from './research.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/research', researchRouter);

export const apiRouter = router; 