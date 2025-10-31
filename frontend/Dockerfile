# ----- Stage 1: The 'build' Stage -----
# This stage builds your React app
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy all your frontend source code
COPY . .

# Run the 'build' script from your package.json (Vite/CRA use this)
# This creates the final, optimized 'dist' folder
RUN npm run build

# ----- Stage 2: The 'serve' Stage -----
# This stage serves the built files using Nginx
FROM nginx:stable-alpine

# Copy the build output (the 'dist' folder) from Stage 1
# into Nginx's public HTML directory
COPY --from=build /app/dist /usr/share/nginx/html

# This is the magic for React Router:
# It tells Nginx to always send non-file requests to 'index.html'
# This allows your React app to handle the routing.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Tell Docker the container listens on port 80 (Nginx's default)
EXPOSE 80

# The command to run Nginx
CMD ["nginx", "-g", "daemon off;"]