import { Router, Request, Response, RequestHandler } from 'express';
import OpenAI from 'openai';
import { ResearchThreadModel } from './models/ResearchThread';
import { extractUserFromRequest, authenticate } from './auth';

const router = Router();

// Initialize OpenAI client with error handling
let openai: OpenAI | null = null;

try {
  console.log("Initializing OpenAI client...");
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY environment variable is missing or empty. Research functionality will be disabled.');
  } else {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

interface ResearchError extends Error {
  status?: number;
}

interface ResearchResult {
  content: string;
  workflow: any | null;
}

async function performResearch(query: string): Promise<ResearchResult> {
  try {
    if (!openai) {
      throw new Error("OpenAI client is not initialized. Please check your API key configuration.");
    }

    console.log('Performing research with OpenAI for:', query);

    // Set options with longer timeout
    const options = {
      timeout: 120000, // 2 minute timeout
    };

    // Call the OpenAI API with increased max_tokens
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI research assistant specializing in automation solutions. 
          When asked about automation, provide detailed, practical advice in the following sections:

          1. High-Level Solution Overview
             - Step-by-step implementation guide
             - Cost estimates and ROI considerations
             - Integration tips with existing systems

          2. Technical Implementation
             - Recommended tools and services
             - Best practices and potential pitfalls
             - Code snippets or configuration examples where relevant

          3. n8n Workflow Recommendations
             - Specific n8n nodes and workflows that could help
             - Integration points with other services
             - Sample workflow structure

          4. MCP (Model Context Protocol) Server Integration
             - How to leverage MCP servers for enhanced functionality
             - Recommended MCP configurations
             - Integration with n8n workflows

          5. n8n Workflow JSON (if applicable)
             - If the solution can be implemented in n8n, provide a basic workflow JSON
             - Include node configurations and connections
             - Mark this section with [N8N_WORKFLOW_START] and [N8N_WORKFLOW_END] tags

          Format your response in clear sections with markdown headings.
          If a section is not applicable to the query, omit it entirely.`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }, options);

    console.log('OpenAI response received successfully');

    // Extract n8n workflow if present
    let workflowJson = null;
    let content = completion.choices[0].message.content || 'No results found';
    const workflowMatch = content.match(/\[N8N_WORKFLOW_START\]([\s\S]*?)\[N8N_WORKFLOW_END\]/);
    if (workflowMatch) {
      try {
        workflowJson = JSON.parse(workflowMatch[1].trim());
        // Remove the workflow section from the main content
        content = content.replace(/\[N8N_WORKFLOW_START\][\s\S]*?\[N8N_WORKFLOW_END\]/, '');
      } catch (error) {
        console.warn('Failed to parse n8n workflow JSON:', error);
      }
    }

    return {
      content,
      workflow: workflowJson
    };
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    const researchError: ResearchError = new Error(`Failed to process request with OpenAI API: ${error.message}`);
    researchError.status = 500;
    throw researchError;
  }
}

const handleResearch: RequestHandler = async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - POST /api/research`);
    const { query } = req.body;
    const user = await extractUserFromRequest(req);

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing query parameter',
        message: 'Please provide a search query'
      });
    }

    if (!openai) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'The research service is currently unavailable due to configuration issues. Please try again later.'
      });
    }

    console.log('Starting research process for query:', query);
    
    const result = await performResearch(query);
    console.log('Research completed successfully');

    // Save research thread
    try {
      if (!global.researchThreads) {
        global.researchThreads = [];
      }
      
      // Create new thread
      const newThread = {
        id: `thread_${Date.now()}`,
        userId: user?.id || 'anonymous',
        query,
        result: result.content,
        workflow: result.workflow,
        timestamp: new Date().toISOString(),
        tags: []
      };
      
      global.researchThreads.push(newThread);
      console.log(`Saved research thread for user ${user?.id || 'anonymous'}`);
    } catch (saveError) {
      console.error('Failed to save research thread:', saveError);
      // Continue even if saving fails
    }

    return res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Research processing error:', error);
    const status = (error as ResearchError).status || 500;
    return res.status(status).json({
      success: false,
      error: 'Research processing failed',
      message: error.message
    });
  }
};

// Get user's research history (for premium users only)
router.get('/history', async (req, res) => {
  try {
    const user = extractUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!user.isPaidUser) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access research history'
      });
    }
    
    const threads = await ResearchThreadModel.find({ userId: user.id })
      .sort({ timestamp: -1 })
      .limit(50);
      
    res.json({
      success: true,
      data: threads
    });
  } catch (error: any) {
    console.error('Failed to fetch research history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research history'
    });
  }
});

// Define the Research Thread interface
interface ResearchThread {
  id: string;
  userId: string;
  query: string;
  result: string;
  timestamp: string;
  tags?: string[];
}

// In-memory storage for research threads (for development/testing)
let researchThreads: ResearchThread[] = [];

// Get all research threads for authenticated user
router.get('/threads', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Always allow access to threads regardless of premium status
    
    // Get threads from database or in-memory storage
    let userThreads = [];
    
    if (global.researchThreads && Array.isArray(global.researchThreads)) {
      // Use in-memory storage
      userThreads = global.researchThreads.filter(thread => thread.userId === user.id);
    } else {
      // If no storage available, return empty array
      userThreads = [];
    }
    
    return res.json({
      success: true,
      data: userThreads
    });
  } catch (error) {
    console.error('Error fetching research threads:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch research threads'
    });
  }
});

// Get a specific research thread
router.get('/threads/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const threadId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log(`Fetching research thread ${threadId} for user ${user.id}`);
    
    // Find thread by ID
    let thread: ResearchThread | undefined;
    
    if (global.researchThreads && Array.isArray(global.researchThreads)) {
      thread = global.researchThreads.find(t => t.id === threadId && t.userId === user.id);
      console.log(`Thread found in memory: ${!!thread}`);
    }
    
    if (!thread) {
      console.log(`Thread not found in memory, trying database...`);
      // Try to get from database if we have the ResearchThread model available
      if (global.ResearchThread) {
        try {
          const dbThread = await global.ResearchThread.findOne({ 
            _id: threadId.replace('thread_', ''), 
            userId: user.id 
          });
          
          if (dbThread) {
            thread = {
              id: dbThread._id.toString(),
              userId: dbThread.userId,
              query: dbThread.query,
              result: dbThread.result,
              timestamp: dbThread.timestamp.toISOString(),
              tags: dbThread.tags || []
            };
            console.log(`Thread found in database`);
          }
        } catch (dbError) {
          console.error('Error fetching thread from database:', dbError);
        }
      }
    }
    
    if (!thread) {
      console.log(`Thread not found, returning 404`);
      return res.status(404).json({
        success: false,
        message: 'Research thread not found'
      });
    }
    
    console.log(`Successfully returning thread`);
    return res.json({
      success: true,
      data: thread
    });
  } catch (error) {
    console.error('Error fetching research thread:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch research thread',
      error: error.message
    });
  }
});

// Save a new research thread
router.post('/threads', async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    const { query, result, tags } = req.body;
    
    if (!query || !result) {
      res.status(400).json({
        success: false,
        message: 'Query and result are required'
      });
      return;
    }
    
    // Create new thread
    const newThread: ResearchThread = {
      id: `thread_${Date.now()}`,
      userId: user.id,
      query,
      result,
      timestamp: new Date().toISOString(),
      tags: tags || []
    };
    
    // Save thread to database or in-memory storage
    if (!global.researchThreads) {
      global.researchThreads = [];
    }
    
    global.researchThreads.push(newThread);
    
    res.status(201).json({
      success: true,
      data: newThread
    });
  } catch (error) {
    console.error('Error saving research thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save research thread'
    });
  }
});

// Update a research thread
router.put('/threads/:id', async (req: Request, res: Response) => {
  try {
    const user = await extractUserFromRequest(req);
    const threadId = req.params.id;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    
    const { query, result, tags } = req.body;
    
    // Find thread index
    let threadIndex = -1;
    
    if (global.researchThreads && Array.isArray(global.researchThreads)) {
      threadIndex = global.researchThreads.findIndex(t => t.id === threadId && t.userId === user.id);
    }
    
    if (threadIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Research thread not found'
      });
      return;
    }
    
    // Update thread
    const updatedThread = {
      ...global.researchThreads[threadIndex],
      query: query || global.researchThreads[threadIndex].query,
      result: result || global.researchThreads[threadIndex].result,
      tags: tags || global.researchThreads[threadIndex].tags
    };
    
    global.researchThreads[threadIndex] = updatedThread;
    
    res.json({
      success: true,
      data: updatedThread
    });
  } catch (error) {
    console.error('Error updating research thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update research thread'
    });
  }
});

router.post('/', handleResearch);

export const researchRouter = router; 