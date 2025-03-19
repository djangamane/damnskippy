import { Router, Request, Response } from 'express';
import { authenticate, extractUserFromRequest } from './auth';
import { CustomWorkflowModel } from './models/CustomWorkflow';

const router = Router();

// Get workflows for authenticated user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    
    if (!user || !user.isPaidUser) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access workflows'
      });
    }
    
    const workflows = await CustomWorkflowModel.find({ userId: user.id })
      .sort({ updatedAt: -1 });
      
    res.json({
      success: true,
      data: workflows
    });
  } catch (error: any) {
    console.error('Failed to fetch workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows'
    });
  }
});

// Get workflow by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const workflow = await CustomWorkflowModel.findById(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    // Ensure user owns this workflow
    if (workflow.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error: any) {
    console.error('Failed to fetch workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow'
    });
  }
});

// Create workflow
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!user.isPaidUser) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to create workflows'
      });
    }
    
    const { name, description, steps, status } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }
    
    const workflow = await CustomWorkflowModel.create({
      userId: user.id,
      name,
      description,
      steps: steps || [],
      status: status || 'draft'
    });
    
    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error: any) {
    console.error('Failed to create workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workflow'
    });
  }
});

// Update workflow
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const workflow = await CustomWorkflowModel.findById(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    // Ensure user owns this workflow
    if (workflow.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const { name, description, steps, status } = req.body;
    
    // Update fields
    if (name) workflow.name = name;
    if (description) workflow.description = description;
    if (steps) workflow.steps = steps;
    if (status) workflow.status = status;
    
    const updatedWorkflow = await workflow.save();
    
    res.json({
      success: true,
      data: updatedWorkflow
    });
  } catch (error: any) {
    console.error('Failed to update workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow'
    });
  }
});

// Delete workflow
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const { id } = req.params;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const workflow = await CustomWorkflowModel.findById(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    // Ensure user owns this workflow
    if (workflow.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await CustomWorkflowModel.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error: any) {
    console.error('Failed to delete workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workflow'
    });
  }
});

export const workflowRouter = router; 