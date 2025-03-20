const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');

// Initialize OpenAI client
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
  } else {
    console.log('No OpenAI API key found, using simulation mode');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

// Handle research request
router.post('/', async (req, res) => {
  try {
    console.log('Research request received:', req.body.query);
    const { query } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let result;
    
    if (openai) {
      console.log('Calling OpenAI with query:', query);
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert AI research and automation specialist with extensive knowledge in workflow automation, system integration, and business process optimization.

              When presented with a query about automation or business processes, provide comprehensive, actionable insights in the following structured format:
              
              ## Solution Overview
              - Provide a clear, executive-level summary of the solution
              - Include strategic benefits and potential business impact
              - Outline how this solution addresses the core problem
              
              ## Implementation Strategy
              - Present a detailed step-by-step implementation plan
              - Estimate costs, timeline, and resource requirements
              - List necessary tools, platforms, and third-party services
              - Identify potential challenges and mitigation strategies
              
              ## Technical Architecture
              - Design a robust technical architecture for the solution
              - Discuss API integrations and data flows
              - Include security considerations and best practices
              - Provide example configuration settings or parameters
              
              ## Code & Configuration Examples
              - Include relevant code snippets in appropriate languages
              - Show configuration examples for key components
              - Provide API endpoint structures and sample requests/responses
              
              ## Integration & Customization Options
              - Suggest alternate approaches or variations to consider
              - Discuss integration with other business systems
              - Outline scaling strategies as needs grow
              - Provide maintenance and monitoring guidance
              
              Format your response using clear markdown formatting with appropriate headings, bullet points, and code blocks.
              If any section is not applicable to the specific query, omit it entirely.
              Be comprehensive, precise, and actionable - your response should serve as a complete implementation guide.`
            },
            {
              role: "user",
              content: query
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          timeout: 300000 // 5 minute timeout for comprehensive responses
        });
        
        result = completion.choices[0].message.content;
        console.log('OpenAI response received successfully');
      } catch (apiError) {
        console.error('OpenAI API error:', apiError);
        
        // Check for specific OpenAI errors and provide better error messages
        if (apiError.status === 429) {
          result = "The OpenAI API rate limit has been reached. Please try again in a few minutes.";
        } else if (apiError.status === 401 || apiError.status === 403) {
          result = "There was an authentication error with the OpenAI API. Please contact support.";
        } else {
          result = `There was an error processing your research query: ${apiError.message}`;
        }
      }
    } else {
      // Simulation mode - should not happen in production
      console.error('CRITICAL: OpenAI API key is not configured in production environment');
      result = "Our research engine is currently unavailable. Please try again later or contact support.";
    }
    
    // Save research thread
    try {
      if (global.ResearchThread) {
        // Create new thread in MongoDB
        const thread = await global.ResearchThread.create({
          userId: decoded.id || decoded.userId,
          query,
          result
        });
        console.log(`Saved research thread for user ${decoded.id || decoded.userId}`);
      }
    } catch (saveError) {
      console.error('Failed to save research thread:', saveError);
      // Continue even if saving fails
    }

    // Return the result in the format expected by the frontend
    return res.json({
      success: true,
      result: {
        content: result,
        workflow: null
      }
    });
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process research request',
      message: error.message
    });
  }
});

// Get research history
router.get('/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const threads = await global.ResearchThread.find({ userId: decoded.id || decoded.userId })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json(threads.map(thread => ({
      id: thread._id,
      query: thread.query,
      result: thread.result,
      timestamp: thread.timestamp
    })));
  } catch (error) {
    console.error('Error fetching research history:', error);
    res.status(500).json({ error: 'Failed to fetch research history' });
  }
});

// Get individual research thread
router.get('/thread/:id', async (req, res) => {
  try {
    const thread = await global.ResearchThread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the user has access to this thread
    if (thread.userId !== (decoded.id || decoded.userId)) {
      return res.status(403).json({ error: 'Unauthorized access to thread' });
    }
    
    res.json({
      id: thread._id,
      query: thread.query,
      result: thread.result,
      timestamp: thread.timestamp
    });
  } catch (error) {
    console.error('Error fetching research thread:', error);
    res.status(500).json({ error: 'Failed to fetch research thread' });
  }
});

module.exports = {
  researchRouter: router
}; 