import { Router } from 'express';
import { researchRouter } from './research';
import { authRouter } from './auth';
import { workflowRouter } from './workflows';
import { paymentRouter } from './payment';
import { adminRouter } from './admin';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/research', researchRouter);
apiRouter.use('/workflows', workflowRouter);
apiRouter.use('/payment', paymentRouter);
apiRouter.use('/admin', adminRouter); 