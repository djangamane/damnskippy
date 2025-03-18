import { Router } from 'express';
import { researchRouter } from './research.js';
import { authRouter } from './auth.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/research', researchRouter); 