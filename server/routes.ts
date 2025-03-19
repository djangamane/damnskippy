import { Router } from 'express';
import { researchRouter } from './research';
import { authRouter } from './auth';
import { workflowRouter } from './workflows';
import { paymentRouter } from './payment';
import { adminRouter } from './admin';
import { testEmailEndpoint } from './test-email-prod';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/research', researchRouter);
apiRouter.use('/workflows', workflowRouter);
apiRouter.use('/payment', paymentRouter);
apiRouter.use('/admin', adminRouter);

// Add test endpoint for email diagnostics
apiRouter.get('/test-email', testEmailEndpoint); 