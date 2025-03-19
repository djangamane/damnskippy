import { Router, Request, Response, RequestHandler } from 'express';
import OpenAI from 'openai';

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

async function performResearch(query: string): Promise<string> {
  try {
    if (!openai) {
      throw new Error("OpenAI client is not initialized. Please check your API key configuration.");
    }

    console.log('Performing research with OpenAI for:', query);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI research assistant specializing in automation solutions. 
          When asked about automation, provide detailed, practical advice including:
          1. Step-by-step implementation guide
          2. Recommended tools and services
          3. Best practices and potential pitfalls
          4. Cost estimates and ROI considerations
          5. Integration tips with existing systems
          Format your response in clear sections with markdown headings.`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log('OpenAI response received successfully');
    return completion.choices[0].message.content || 'No results found';
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    const researchError: ResearchError = new Error(`Failed to process request with OpenAI API: ${error.message}`);
    researchError.status = 500;
    throw researchError;
  }
}

const handleResearch: RequestHandler = async (req, res, next) => {
  try {
    console.log(`${new Date().toISOString()} - POST /api/research`);
    const { query } = req.body;

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Missing query parameter',
        message: 'Please provide a search query'
      });
      return;
    }

    if (!openai) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'The research service is currently unavailable due to configuration issues. Please try again later.'
      });
      return;
    }

    console.log('Starting research process for query:', query);
    const result = await performResearch(query);

    res.json({
      success: true,
      result: result
    });
  } catch (error: any) {
    console.error('Research processing error:', error);
    const status = (error as ResearchError).status || 500;
    res.status(status).json({
      success: false,
      error: 'Research processing failed',
      message: error.message
    });
  }
};

router.post('/', handleResearch);

export const researchRouter = router; 