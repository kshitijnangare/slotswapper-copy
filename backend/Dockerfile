# ----- Base Stage: Install Dependencies -----
# Use an official Node.js image. 'node:18-alpine' is a good, lightweight, and secure choice.
FROM node:18-alpine

# Set the working directory *inside* the container
WORKDIR /usr/src/app

# Copy 'package.json' and 'package-lock.json' FIRST
# This is a key Docker optimization. It caches your 'npm install' layer.
COPY package*.json ./

# Install all production dependencies
RUN npm install

# ----- Production Stage -----
# Copy the rest of your application code (routes, models, controllers, etc.)
COPY . .

# Tell Docker your app listens on port 8080 (Change this if your server.js uses a different port!)
EXPOSE 8080

# The command to run your application when the container starts
CMD ["npm", "start"]