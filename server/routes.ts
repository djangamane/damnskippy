import { Router, Request, Response } from 'express';
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

// Simple debug endpoint to check environment variables
apiRouter.get('/debug-env', (req: Request, res: Response) => {
  try {
    // Return basic info without sensitive data
    return res.json({
      status: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      emailConfigured: !!process.env.EMAIL_USER || false,
      sendgridConfigured: process.env.USE_SENDGRID === 'true' && !!process.env.SENDGRID_API_KEY,
      adminEmailConfigured: !!process.env.ADMIN_EMAIL || false
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({
      error: error.toString()
    });
  }
}); 