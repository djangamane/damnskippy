import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('OpenAI client initialized successfully');

async function performResearch(query: string): Promise<string> {
  try {
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
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to process request with OpenAI API: ${error.message}`);
  }
}

router.post('/', async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} - POST /api/research`);
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing query parameter',
        message: 'Please provide a search query'
      });
    }

    console.log('Starting research process for query:', query);
    const result = await performResearch(query);

    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Research processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Research processing failed',
      message: error.message
    });
  }
});

export const researchRouter = router; 