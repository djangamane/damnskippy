# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend and backend
RUN npm run build && npm run build:server

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["npm", "run", "start:prod"] 