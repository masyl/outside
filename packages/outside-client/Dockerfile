# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Copy only client-related directories
COPY packages/outside-client/ ./packages/outside-client/
COPY packages/outside-core/ ./packages/outside-core/
COPY pnpm-workspace.yaml ./

# Install only client dependencies
RUN pnpm install --filter @outside/client --filter @outside/core

# Build client
RUN cd packages/outside-client && pnpm build

# Expose port
EXPOSE 5174

# Set environment variables
ENV NODE_ENV=development
ENV VITE_API_URL=https://api.outside.local
ENV VITE_WS_URL=wss://api.outside.local

# Start development server
WORKDIR /app/packages/outside-client
CMD ["pnpm", "dev"]
