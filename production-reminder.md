# Production Environment Reminder

This project is deployed on Render.com and operates in a production environment with the following considerations:

## Production Guidelines

1. **MongoDB Required**: The application requires a MongoDB connection and will exit if unable to connect in production mode.

2. **No In-Memory Fallbacks**: Unlike development, production mode does not support in-memory storage fallbacks.

3. **OpenAI API Key**: A valid OpenAI API key is required in the environment variables for the research functionality.

4. **Environment Variables**: The following environment variables must be set:
   - `NODE_ENV=production`
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - Secret for JWT token signing
   - `OPENAI_API_KEY` - API key for OpenAI integration

5. **Error Handling**: All production errors should be logged but not exposed to users.

6. **JavaScript vs TypeScript**: The application uses JavaScript for server-side code in production, not TypeScript.

7. **Timeouts**: Longer timeouts are set for operations like research queries (5 minutes).

## Testing in Production-Like Environment

When testing locally, set the environment variables to simulate production:

```powershell
# Windows PowerShell
$env:NODE_ENV="production"
$env:MONGODB_URI="your-mongodb-connection-string"
$env:JWT_SECRET="your-jwt-secret"
$env:OPENAI_API_KEY="your-openai-api-key"
node server.js
```

```bash
# Linux/Mac
NODE_ENV=production MONGODB_URI="your-mongodb-connection-string" JWT_SECRET="your-jwt-secret" OPENAI_API_KEY="your-openai-api-key" node server.js
``` 