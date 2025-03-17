import express, { Request, Response, Router, RequestHandler, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both files
dotenv.config({ path: '.env.server' });
dotenv.config({ path: '.env' });

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

console.log('Environment variables loaded:', {
  MONGODB_URI: process.env.MONGODB_URI ? 'Set (hidden)' : 'Not set',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set (hidden)' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set (hidden)' : 'Not set'
});

const app = express();

// MongoDB setup
const mongoClient = new MongoClient(process.env.MONGODB_URI as string);
let db: any;

async function connectToMongo() {
  try {
    await mongoClient.connect();
    db = mongoClient.db('skipthegames4ai');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

connectToMongo();

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://earnest-chimera-9ffaeb.netlify.app', 
        'https://damnskippy.onrender.com', 
        'https://skipthegames4ai.com', 
        'https://www.skipthegames4ai.com', 
        'https://damnskippy.onrender.com', 
        'https://skipthegames4ai.netlify.app',
        'http://localhost:3000',
        'http://localhost:5173'
      ]
    : '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  credentials: true
}));

// Add CORS preflight handler
app.options('*', cors());

// Body parsing middleware with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
const apiRouter: Router = express.Router();

interface SignUpBody {
  email: string;
  password: string;
  displayName?: string;
}

interface SignInBody {
  email: string;
  password: string;
}

// Authentication middleware
interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    displayName?: string;
    isPaidUser?: boolean;
  };
}

const authenticateToken: RequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      _id: string;
      email: string;
      displayName?: string;
      isPaidUser?: boolean;
    };
    
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token.' });
    return;
  }
};

// Authentication Routes
const signUpHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body as SignUpBody;
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ 
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: displayName || null,
      isPaidUser: false,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    const result = await db.collection('users').insertOne(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Generate JWT token
    const token = jwt.sign(
      { ...userWithoutPassword, _id: result.insertedId },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      data: { ...userWithoutPassword, _id: result.insertedId },
      token,
      message: 'Account created successfully'
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'An error occurred during sign up' });
  }
};

const signInHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Sign-in request received:', req.body);
    const { email, password } = req.body as SignInBody;
    
    if (!email || !password) {
      console.log('Missing email or password in request');
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    console.log('Sign-in attempt for email:', email);
    
    // Find user
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    console.log('User found, verifying password');
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    console.log('User authenticated successfully:', email);

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Generate JWT token
    const token = jwt.sign(
      userWithoutPassword,
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    
    console.log('JWT token generated successfully');
    
    // Set token in response header
    res.setHeader('Authorization', `Bearer ${token}`);
    
    console.log('Sending successful response');
    res.json({
      data: userWithoutPassword,
      token
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'An error occurred during sign in' });
  }
};

const signOutHandler: RequestHandler = (req: Request, res: Response) => {
  res.json({ message: 'Signed out successfully' });
};

apiRouter.post('/auth/signup', signUpHandler);
apiRouter.post('/auth/signin', signInHandler);
apiRouter.post('/auth/signout', signOutHandler);

// Protected route example
apiRouter.get('/user/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy' });
});

// Add diagnostic endpoint (only in development)
app.get('/api/diagnostic', (req: Request, res: Response) => {
  // Only provide detailed info in development
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    serverInfo: isDev ? {
      // Safe info to expose in development
      nodeVersion: process.version,
      platform: process.platform,
      mongoConnected: !!db,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      cors: {
        enabled: true,
        allowCredentials: true
      }
    } : {
      // Limited info for production
      serviceAvailable: true
    }
  });
});

// Handle favicon.ico requests
app.get('/favicon.ico', (req: Request, res: Response) => {
  // Return a 204 No Content if favicon doesn't exist
  res.status(204).end();
});

// Initialize OpenAI client
let openai: OpenAI | null = null;
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: Missing OPENAI_API_KEY environment variable. Research features will be disabled.');
} else {
  openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
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
  if (!openai) {
    return `# Research Temporarily Unavailable\n\nWe apologize, but our research feature is currently unavailable. Please try again later.\n\nIn the meantime, you can:\n- Break down your workflow into smaller steps\n- Look for pre-built templates\n- Consider using tools like n8n, Make.com, or Zapier`;
  }
  
  try {
    console.log('Starting research for query:', query);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a research assistant that performs deep analysis and research on automation topics.`
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
  if (!openai) {
    return {
      json: {},
      explanation: "Workflow generation is temporarily unavailable.",
      name: "Service Unavailable"
    };
  }
  
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

// Serve static files from the dist directory with proper MIME types
const distPath = path.resolve(__dirname, '../../dist');
console.log('Found dist directory at:', distPath);

// Set proper MIME types for all files
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    // Log the file path being processed
    console.log(`Setting headers for file: ${filePath}`);
    
    // Set proper MIME types based on file extension
    if (filePath.endsWith('.js')) {
      console.log(`Setting Content-Type: application/javascript for ${filePath}`);
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.mjs')) {
      console.log(`Setting Content-Type: application/javascript for ${filePath}`);
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      console.log(`Setting Content-Type: text/css for ${filePath}`);
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      console.log(`Setting Content-Type: text/html for ${filePath}`);
      res.setHeader('Content-Type', 'text/html');
    } else if (filePath.endsWith('.svg')) {
      console.log(`Setting Content-Type: image/svg+xml for ${filePath}`);
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.json')) {
      console.log(`Setting Content-Type: application/json for ${filePath}`);
      res.setHeader('Content-Type', 'application/json');
    } else if (filePath.endsWith('.png')) {
      console.log(`Setting Content-Type: image/png for ${filePath}`);
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      console.log(`Setting Content-Type: image/jpeg for ${filePath}`);
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.gif')) {
      console.log(`Setting Content-Type: image/gif for ${filePath}`);
      res.setHeader('Content-Type', 'image/gif');
    } else {
      console.log(`No specific Content-Type set for ${filePath}`);
    }
  }
}));

// Catch-all route to serve index.html for client-side routing (SPA fallback)
app.get('*', function(req: Request, res: Response, next: NextFunction) {
  // Skip API routes
  if (req.url.startsWith('/api/')) {
    return next();
  }
  
  const indexPath = path.join(distPath, 'index.html');
  console.log(`Serving index.html from ${indexPath} for path: ${req.url}`);
  
  // Check if index.html exists before sending
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`Error: index.html not found at ${indexPath}`);
    res.status(404).send('index.html not found');
  }
});

// Define the assets list handler as a separate function
const assetsListHandler = (req: Request, res: Response) => {
  console.log('Received request for assets list');
  console.log('Current working directory:', process.cwd());
  console.log('__dirname:', __dirname);
  console.log('distPath:', distPath);
  
  // Try to find the assets directory in various locations
  const possibleAssetsDirs = [
    path.join(distPath, 'assets'),
    path.join(distPath, 'dist', 'assets'),
    path.join(__dirname, '..', 'assets'),
    path.join(__dirname, '..', '..', 'assets'),
    path.join(process.cwd(), 'assets'),
    path.join(process.cwd(), 'dist', 'assets')
  ];
  
  console.log('Checking these possible asset directories:');
  possibleAssetsDirs.forEach(dir => {
    console.log(`- ${dir} (exists: ${fs.existsSync(dir)})`);
  });
  
  let filesFound = false;
  
  for (const dir of possibleAssetsDirs) {
    console.log(`Checking for assets directory at ${dir}`);
    if (fs.existsSync(dir)) {
      console.log(`Found assets directory at ${dir}`);
      try {
        const files = fs.readdirSync(dir);
        console.log(`Files in assets directory: ${files.join(', ')}`);
        filesFound = true;
        res.json(files);
        return;
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
    }
  }
  
  // If no assets directory found, return an empty array
  if (!filesFound) {
    console.log('No assets directory found, checking public/assets as fallback');
    const publicAssetsDir = path.join(distPath, 'public', 'assets');
    
    console.log(`Checking public assets directory at ${publicAssetsDir} (exists: ${fs.existsSync(publicAssetsDir)})`);
    
    if (fs.existsSync(publicAssetsDir)) {
      try {
        const files = fs.readdirSync(publicAssetsDir);
        console.log(`Files in public/assets directory: ${files.join(', ')}`);
        // Return these files with a special prefix to indicate they're from public/assets
        res.json(files);
        return;
      } catch (error) {
        console.error(`Error reading public/assets directory:`, error);
      }
    }
  }
  
  console.log('No assets found in any location');
  res.json([]);
};

// Add an API endpoint to list files in the assets directory
app.get('/api/assets-list', assetsListHandler);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
}); 

// Export the app for testing
export default app; 