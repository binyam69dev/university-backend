# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads logs

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]