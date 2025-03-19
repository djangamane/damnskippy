import { Router, Request, Response } from 'express';
import { authenticate, extractUserFromRequest } from './auth';

const router = Router();

// Get all workflows for the authenticated user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Get workflows from database or in-memory storage
    let userWorkflows = [];
    
    if (global.workflows && Array.isArray(global.workflows)) {
      // Use in-memory storage
      userWorkflows = global.workflows.filter(workflow => workflow.userId === user.id);
    } else {
      // If no storage available, return empty array
      userWorkflows = [];
    }
    
    return res.json({
      success: true,
      data: userWorkflows
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows'
    });
  }
});

// Get a specific workflow
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const workflowId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find workflow by ID
    let workflow;
    
    if (global.workflows && Array.isArray(global.workflows)) {
      workflow = global.workflows.find(w => w.id === workflowId && w.userId === user.id);
    }
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    return res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow'
    });
  }
});

// Create a new workflow
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { name, description, steps, status } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name is required'
      });
    }
    
    // Create new workflow
    const newWorkflow = {
      id: `workflow_${Date.now()}`,
      userId: user.id,
      name,
      description: description || '',
      steps: steps || [],
      status: status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save workflow to database or in-memory storage
    if (!global.workflows) {
      global.workflows = [];
    }
    
    global.workflows.push(newWorkflow);
    
    return res.status(201).json({
      success: true,
      data: newWorkflow
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create workflow'
    });
  }
});

// Update a workflow
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const workflowId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { name, description, steps, status } = req.body;
    
    // Find workflow index
    let workflowIndex = -1;
    
    if (global.workflows && Array.isArray(global.workflows)) {
      workflowIndex = global.workflows.findIndex(w => w.id === workflowId && w.userId === user.id);
    }
    
    if (workflowIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    // Update workflow
    const updatedWorkflow = {
      ...global.workflows[workflowIndex],
      name: name || global.workflows[workflowIndex].name,
      description: description !== undefined ? description : global.workflows[workflowIndex].description,
      steps: steps || global.workflows[workflowIndex].steps,
      status: status || global.workflows[workflowIndex].status,
      updatedAt: new Date().toISOString()
    };
    
    global.workflows[workflowIndex] = updatedWorkflow;
    
    return res.json({
      success: true,
      data: updatedWorkflow
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update workflow'
    });
  }
});

// Delete a workflow
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const workflowId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find workflow index
    let workflowIndex = -1;
    
    if (global.workflows && Array.isArray(global.workflows)) {
      workflowIndex = global.workflows.findIndex(w => w.id === workflowId && w.userId === user.id);
    }
    
    if (workflowIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }
    
    // Remove workflow
    global.workflows.splice(workflowIndex, 1);
    
    return res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete workflow'
    });
  }
});

export const workflowsRouter = router; 