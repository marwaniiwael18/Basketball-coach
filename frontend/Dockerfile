FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Set the environment to development
ENV NODE_ENV=development

# Expose the port
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]
