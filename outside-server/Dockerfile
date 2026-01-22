# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Copy only server-related directories to avoid building unrelated packages
COPY outside-server/ ./outside-server/
COPY outside-core/ ./outside-core/
COPY pnpm-workspace.yaml ./

# Install only server dependencies
RUN pnpm install --filter @outside/server --filter @outside/core

# Build server
RUN cd outside-server && pnpm build

# Expose ports
EXPOSE 3000 3001

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000
ENV WS_PORT=3001

# Start the server
WORKDIR /app/outside-server
CMD ["pnpm", "dev"]