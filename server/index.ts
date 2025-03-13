import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both files
dotenv.config({ path: '.env.server' });
dotenv.config({ path: '.env' });

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

console.log('Environment variables loaded:', {
  MONGODB_URI: process.env.VITE_MONGODB_URI || 'Not set',
  OPENAI_API_KEY: 'Set (hidden)'
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
  
  // Serve index.html for any unknown routes (SPA fallback)
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

interface ResearchRequest {
  query: string;
}

async function fetchN8nWorkflows(query: string): Promise<AutomationWorkflow[]> {
  try {
    // This is a mock implementation since we don't have actual API access
    // In a real implementation, you would call the n8n API
    console.log('Fetching n8n workflows for:', query);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, return mock data based on query
    if (query.toLowerCase().includes('sales') || query.toLowerCase().includes('automate')) {
      return [
        {
          title: "n8n Sales Automation Workflow",
          description: `Pre-built automation for ${query} with lead scoring and follow-ups`,
          url: "https://n8n.io/workflows/sales-automation"
        }
      ];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching n8n workflows:', error);
    return [];
  }
}

async function fetchMakeWorkflows(query: string): Promise<AutomationWorkflow[]> {
  try {
    // This is a mock implementation since we don't have actual API access
    // In a real implementation, you would call the Make.com API
    console.log('Fetching Make.com workflows for:', query);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, return mock data based on query
    if (query.toLowerCase().includes('email') || query.toLowerCase().includes('marketing')) {
      return [
        {
          title: "Make.com Email Marketing Automation",
          description: `Ready-to-use scenario for ${query} with email sequences and analytics`,
          url: "https://make.com/scenarios/email-marketing"
        }
      ];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Make workflows:', error);
    return [];
  }
}

async function performDeepResearch(query: string): Promise<string> {
  try {
    console.log('Starting research for query:', query);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a research assistant that performs deep analysis and research on automation topics. 
          When given a query about automation or building something, you should:
          1. Break down the topic into key aspects to research
          2. Provide comprehensive, well-structured information
          3. Include specific examples and use cases where relevant
          4. Suggest tools and approaches for automation
          5. Organize the information in a clear, readable format with sections
          
          Format your response in markdown with clear headings and bullet points where appropriate.`
        },
        {
          role: "user",
          content: `Perform detailed research on how to automate or build: ${query}`
        }
      ],
      temperature: 0.7,
    });

    console.log('OpenAI API response received');
    return completion.choices[0].message.content || "";
  } catch (error: any) {
    console.error('Detailed research error:', error);
    throw error;
  }
}

async function generateN8nWorkflow(query: string, researchContent: string): Promise<N8nWorkflow> {
  try {
    console.log('Generating n8n workflow for:', query);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert in n8n automation workflows. Based on research findings, you'll create a practical n8n workflow JSON that users can import directly into n8n.
          
          Follow these guidelines:
          1. Analyze the research to identify key automation opportunities
          2. Create a workflow with 3-6 nodes that addresses the main automation need
          3. Use common n8n nodes like HTTP Request, Gmail, Slack, Discord, Google Sheets, etc.
          4. Ensure the workflow is practical and can be implemented with minimal customization
          5. Include proper connections between nodes
          6. Provide a clear explanation of what the workflow does and how to use it
          
          Return your response as a valid JSON object with these properties:
          - json: The complete n8n workflow JSON that can be imported
          - explanation: A clear explanation of what the workflow does and how to use it
          - name: A descriptive name for the workflow`
        },
        {
          role: "user",
          content: `Generate an n8n workflow for: ${query}\n\nResearch findings:\n${researchContent}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    console.log('n8n workflow generation completed');
    const workflowData = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      json: workflowData.json || {},
      explanation: workflowData.explanation || "No explanation provided",
      name: workflowData.name || `${query} Automation`
    };
  } catch (error: any) {
    console.error('n8n workflow generation error:', error);
    throw error;
  }
}

function generatePremiumService(query: string): PremiumService {
  return {
    title: "Custom Automation Solution",
    description: `Need a more sophisticated solution for ${query}? Our team can build a custom automation tailored to your specific business requirements with expert implementation and ongoing support.`,
    price: "",
    button: "Schedule Discovery Call"
  };
}

async function findRelevantYoutubeVideo(query: string): Promise<ResearchResult['youtube_video']> {
  try {
    console.log('Finding relevant YouTube video for:', query);
    
    // Mock database of real videos from the specified channels
    const videoDatabase = [
      {
        title: "Build Anything with n8n - Complete Tutorial",
        url: "https://www.youtube.com/embed/B_1nBG0ofhc",
        thumbnail: "https://img.youtube.com/vi/B_1nBG0ofhc/hqdefault.jpg",
        description: "Comprehensive tutorial on building automations with n8n - perfect for beginners and advanced users alike.",
        keywords: ["n8n", "automation", "tutorial", "workflow", "build", "complete"]
      },
      {
        title: "n8n Beginner Tutorial - Getting Started With n8n",
        url: "https://www.youtube.com/embed/RpvNEGcLKyY",
        thumbnail: "https://img.youtube.com/vi/RpvNEGcLKyY/hqdefault.jpg",
        description: "Learn the basics of n8n automation with this comprehensive beginner tutorial by David Ondrej.",
        keywords: ["beginner", "tutorial", "automation", "n8n", "workflow"]
      },
      {
        title: "Social Media Automation with n8n",
        url: "https://www.youtube.com/watch?v=0or7E3fTjkY",
        thumbnail: "https://img.youtube.com/vi/0or7E3fTjkY/maxresdefault.jpg",
        description: "Automate your social media posting across multiple platforms using n8n workflows.",
        keywords: ["social", "media", "posting", "automation"]
      },
      {
        title: "Build an AI Automation System with n8n",
        url: "https://www.youtube.com/watch?v=3ml9cXNF6vw",
        thumbnail: "https://img.youtube.com/vi/3ml9cXNF6vw/maxresdefault.jpg",
        description: "Create powerful AI automations using n8n and various AI tools.",
        keywords: ["ai", "automation", "integration", "workflow"]
      },
      {
        title: "Email Marketing Automation with n8n",
        url: "https://www.youtube.com/watch?v=rp1QR3eGI_k",
        thumbnail: "https://img.youtube.com/vi/rp1QR3eGI_k/maxresdefault.jpg",
        description: "Set up automated email marketing campaigns using n8n and email service providers.",
        keywords: ["email", "marketing", "automation", "campaign"]
      },
      {
        title: "n8n Automation Ideas for Business",
        url: "https://www.youtube.com/watch?v=ixKzq1H4Xms",
        thumbnail: "https://img.youtube.com/vi/ixKzq1H4Xms/maxresdefault.jpg",
        description: "Discover practical n8n automation ideas to streamline your business processes.",
        keywords: ["business", "automation", "workflow", "productivity"]
      },
      {
        title: "Create Custom API with n8n",
        url: "https://www.youtube.com/watch?v=JT-0jXF8Qk0",
        thumbnail: "https://img.youtube.com/vi/JT-0jXF8Qk0/maxresdefault.jpg",
        description: "Learn how to create and use custom APIs with n8n for advanced automation.",
        keywords: ["api", "integration", "custom", "webhook"]
      }
    ];

    // Find the most relevant video based on query keywords
    const queryWords = query.toLowerCase().split(' ');
    let bestMatch = videoDatabase[0];
    let highestScore = 0;

    videoDatabase.forEach(video => {
      let score = 0;
      queryWords.forEach(word => {
        if (video.title.toLowerCase().includes(word)) score += 2;
        if (video.description.toLowerCase().includes(word)) score += 1;
        video.keywords.forEach(keyword => {
          if (keyword.includes(word)) score += 3;
        });
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = video;
      }
    });

    return {
      title: bestMatch.title,
      url: bestMatch.url,
      thumbnail: bestMatch.thumbnail,
      description: bestMatch.description
    };
  } catch (error) {
    console.error('Error finding YouTube video:', error);
    
    // Return a fallback video if there's an error
    return {
      title: "n8n Beginner Tutorial - Getting Started With n8n",
      url: "https://www.youtube.com/watch?v=RpvNEGcLKyY",
      thumbnail: "https://img.youtube.com/vi/RpvNEGcLKyY/maxresdefault.jpg",
      description: "Learn the basics of n8n automation with this comprehensive beginner tutorial by David Ondrej."
    };
  }
}

async function processResearchRequest(query: string): Promise<ResearchResult> {
  try {
    console.log('Processing research request for:', query);
    
    // 1. Fetch automation workflows
    const n8nWorkflows = await fetchN8nWorkflows(query);
    
    // 2. If no n8n workflows, try Make.com
    let automationWorkflows = n8nWorkflows;
    if (automationWorkflows.length === 0) {
      const makeWorkflows = await fetchMakeWorkflows(query);
      automationWorkflows = makeWorkflows;
    }
    
    // 3. If still no workflows, add a placeholder
    if (automationWorkflows.length === 0) {
      automationWorkflows = [{
        title: "No Automation Available",
        description: "We couldn't find pre-built automation for your specific query. Consider our premium service for a custom solution.",
        url: "#"
      }];
    }
    
    // 4. Perform deep research
    const researchContent = await performDeepResearch(query);
    
    // 5. Generate n8n workflow based on research
    const n8nWorkflow = await generateN8nWorkflow(query, researchContent);
    
    // 6. Generate premium service recommendation
    const premiumService = generatePremiumService(query);
    
    // 7. Find a relevant YouTube video
    const youtubeVideo = await findRelevantYoutubeVideo(query);
    
    // 8. Return the complete result
    return {
      automation: automationWorkflows,
      research: {
        content: researchContent,
        sources: [
          "Research-based content generated by OpenAI",
          "Industry Reports",
          "Expert Analysis"
        ]
      },
      premium_service: premiumService,
      n8n_workflow: n8nWorkflow,
      youtube_video: youtubeVideo
    };
  } catch (error) {
    console.error('Process research request error:', error);
    
    // Return a fallback result
    return {
      automation: [{
        title: "Basic Automation",
        description: `A simple automation solution for ${query}`,
        url: "#"
      }],
      research: {
        content: `# Research on ${query}\n\nWe apologize, but we encountered an issue while researching this topic. Here's some general information:\n\n- ${query} can be automated using various tools like n8n, Make.com, or Zapier\n- Consider breaking down your workflow into smaller steps for easier automation\n- Look for pre-built templates that match your needs\n- For complex workflows, custom solutions might be necessary\n\n## MCP Servers and AI Integration\n\nMCP (Multi-Cloud Platform) servers are connecting AI tools like never before, enabling seamless integration between different services.`,
        sources: ["General Automation Knowledge"]
      },
      premium_service: generatePremiumService(query),
      n8n_workflow: {
        json: {
          nodes: [
            {
              parameters: {
                triggerTimes: {
                  item: [
                    {
                      mode: "everyX",
                      value: 1,
                      unit: "hours"
                    }
                  ]
                }
              },
              name: "Schedule Trigger",
              type: "n8n-nodes-base.scheduleTrigger",
              typeVersion: 1,
              position: [250, 300]
            }
          ],
          connections: {}
        },
        explanation: "No workflow could be generated due to an error.",
        name: "Error"
      },
      youtube_video: {
        title: "Automation Fundamentals",
        url: "https://www.youtube.com/watch?v=fallback",
        thumbnail: "https://i.ytimg.com/vi/fallback/hqdefault.jpg",
        description: "Learn the basics of workflow automation with this introductory video."
      }
    };
  }
}

app.post('/api/research', async (req: Request<{}, {}, ResearchRequest>, res: Response) => {
  try {
    const { query } = req.body;
    console.log('Received research request:', { query });
    
    console.log('Starting research process for query:', query);
    const result = await processResearchRequest(query);
    
    console.log('Research completed successfully');
    res.json(result);
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({ error: 'Failed to generate research' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
}); 