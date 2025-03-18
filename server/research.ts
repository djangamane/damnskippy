import { Request, Response, Router } from 'express';
import axios from 'axios';

// Deepseek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Interface definitions
interface ResearchRequest extends Request {
  user?: {
    _id: string;
    email: string;
    displayName?: string;
    isPaidUser?: boolean;
  };
  body: {
    query: string;
  };
}

interface AutomationWorkflow {
  title: string;
  description: string;
  url: string;
}

interface PremiumService {
  title: string;
  description: string;
  price: string;
  button: string;
}

interface N8nWorkflow {
  json: any;
  explanation: string;
  name: string;
}

interface ResearchResult {
  automation: AutomationWorkflow[];
  research: {
    content: string;
    sources: string[];
  };
  premium_service: PremiumService;
  n8n_workflow: N8nWorkflow;
  youtube_video?: {
    title: string;
    url: string;
    thumbnail: string;
    description: string;
  };
}

// Research functionality
async function performDeepResearch(query: string): Promise<string> {
  try {
    console.log('Performing deep research with Deepseek API for:', query);
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error('Deepseek API key is not configured');
    }
    
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an AI research assistant specializing in automation and workflow optimization."
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Deepseek API response:', response.data);

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    }
    
    throw new Error('Invalid response format from Deepseek API');
  } catch (error: any) {
    console.error('Deepseek API error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed with Deepseek API. Please check your API key.');
    }
    throw error;
  }
}

// Research endpoint
export const researchRouter = Router();

researchRouter.post('/', async (req: ResearchRequest, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    console.log('Starting research process for query:', query);
    
    try {
      // 1. Get research content from Deepseek
      const researchContent = await performDeepResearch(query);
      
      // 2. Prepare response
      const result: ResearchResult = {
        automation: [
          {
            title: "Automation Workflow Example",
            description: "Sample workflow based on your query: " + query,
            url: "https://example.com/workflow"
          }
        ],
        research: {
          content: researchContent,
          sources: ['Deepseek AI'],
        },
        premium_service: {
          title: "Premium Research Service",
          description: "Get detailed research and automation workflows",
          price: "$99",
          button: "Upgrade Now"
        },
        n8n_workflow: {
          json: {
            name: "basic_workflow",
            nodes: [],
            connections: {}
          },
          explanation: "Basic workflow template - Customize based on your needs",
          name: "basic_workflow"
        },
        youtube_video: {
          title: "Getting Started with Automation",
          url: "https://www.youtube.com/watch?v=example",
          thumbnail: "https://img.youtube.com/vi/example/maxresdefault.jpg",
          description: "Learn the basics of automation with this comprehensive tutorial."
        }
      };
      
      res.json(result);
    } catch (error: any) {
      console.error('Research processing error:', error);
      
      if (error.message?.includes('Authentication failed')) {
        res.status(503).json({
          error: 'Research service configuration error',
          message: 'There is an issue with the research service configuration. Please contact support.'
        });
      } else {
        res.status(500).json({
          error: 'Research processing failed',
          message: 'Failed to process research request. Please try again later.',
          details: error.message
        });
      }
    }
  } catch (error) {
    console.error('Research endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
}); 