# SkipTheGames4AI

A powerful AI-driven research and automation platform.

## Prerequisites

- Node.js v18 or higher
- MongoDB account and database
- OpenAI API key

## Environment Variables

### Required Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `VITE_MONGODB_URI`: MongoDB connection URI
- `VITE_OPENAI_API_KEY`: OpenAI API key for client-side use

## Features

- Advanced AI-powered research
- MongoDB for data persistence
- Real-time updates
- Custom workflow creation
- Premium service offerings

## Local Development Setup

1. Clone the repository
```bash
git clone <your-repo-url>
cd skipthegames4ai
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
- Copy `.env.example` to `.env`
```bash
cp .env.example .env
```
- Fill in your environment variables in `.env`

4. Start the development server
```bash
npm start
```

## Production Deployment

### Prerequisites
- Node.js 18+ installed
- MongoDB database (e.g., MongoDB Atlas)
- OpenAI API key

### Deployment Steps

1. Set up environment variables
- Ensure all required environment variables are set in your deployment environment
- See `.env.example` for required variables

2. Build the application
```bash
# Install dependencies
npm install

# Build will happen automatically due to postinstall script
# Or manually run:
npm run build && npm run build:server
```

3. Start the production server
```bash
# Set NODE_ENV to production
NODE_ENV=production npm run start:prod
```

### Deployment Platforms

#### Heroku
1. Create a new Heroku app
2. Add environment variables in Heroku dashboard
3. Deploy using Heroku Git:
```bash
heroku login
heroku git:remote -a your-app-name
git push heroku main
```

#### Railway/Render
1. Connect your GitHub repository
2. Add environment variables in the dashboard
3. Set the build command: `npm install`
4. Set the start command: `npm run start:prod`

## Scripts
- `npm start` - Start development server
- `npm run build` - Build frontend for production
- `npm run build:server` - Build backend for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally 