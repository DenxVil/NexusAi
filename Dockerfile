# Use Node.js 18 (as specified in package.json engines)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package.json files for dependency installation
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies
RUN npm run install-all

# Copy source code
COPY . .

# Build the server (TypeScript compilation)
RUN cd server && npm run build

# Build the client (React production build)
RUN cd client && npm run build

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of app files to the nodejs user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]