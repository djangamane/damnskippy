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

// Get research history
router.get('/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const threads = await global.ResearchThread.find({ userId: decoded.userId })
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
    
    if (thread.userId !== decoded.userId) {
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

// Handle research request
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let result;
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI research assistant. Provide detailed, well-structured answers with citations where possible."
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });
      
      result = completion.choices[0].message.content;
    } else {
      // Simulation mode
      result = `Simulated response for query: "${query}"\n\nThis is a placeholder response since the OpenAI API key is not configured.`;
    }
    
    // Save the research thread
    const thread = await global.ResearchThread.create({
      userId: decoded.userId,
      query,
      result
    });
    
    res.json({
      success: true,
      threadId: thread._id,
      result
    });
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process research request'
    });
  }
});

module.exports = {
  researchRouter: router
}; 