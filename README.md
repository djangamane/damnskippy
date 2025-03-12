# Planetary Chess

A modern web application built with React, TypeScript, and MongoDB.

## Setup

1. Clone the repository
```bash
git clone <your-repo-url>
cd planetarychess
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file in the root directory with the following variables:
```
VITE_MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/planetarychess
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_FIRECRAWL_KEY=your_firecrawl_key
```

4. Start the development server
```bash
npm start
```

## Environment Setup

1. MongoDB Atlas
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string from the cluster
- Replace `<username>`, `<password>`, and `<cluster>` in the MongoDB URI with your credentials

## Available Scripts

- `npm start` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run dev` - Runs the app in development mode

## Features

- User authentication
- MongoDB integration
- Real-time updates
- TypeScript support 