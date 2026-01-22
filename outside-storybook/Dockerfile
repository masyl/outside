# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Copy only Storybook-related directories
COPY outside-storybook/ ./outside-storybook/
COPY outside-client/ ./outside-client/
COPY outside-core/ ./outside-core/
COPY pnpm-workspace.yaml ./

# Install only Storybook dependencies
RUN pnpm install --filter outside-storybook --filter @outside/client --filter @outside/core

# Copy any additional Storybook source files if needed
RUN cd outside-storybook && pnpm build

# Expose port
EXPOSE 6007

# Set environment variables
ENV NODE_ENV=development

# Start Storybook
WORKDIR /app/outside-storybook
CMD ["pnpm", "dev"]