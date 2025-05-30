# Stage 1: Build the application with all dependencies (including dev if needed for tests/build steps)
# We use a Node.js image with Alpine Linux for a smaller base size.
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first.
# This step is crucial for Docker's layer caching. If only your code changes,
# but your dependencies (defined in package.json) do not, Docker will reuse
# the cached 'npm install' layer, speeding up subsequent builds.
COPY package*.json ./

# Install all dependencies.
# If you have a separate build step (e.g., for a React frontend), this might include dev dependencies.
RUN npm install

# Copy the rest of your application source code into the container.
# The .dockerignore file (see below) will prevent unnecessary files from being copied.
COPY . .

# If you have a frontend build process (e.g., Webpack for React/Vue), run it here.
# For a simple EJS/Node.js app, this might not be strictly necessary,
# but it's good practice to include if you add one later.
# Example: RUN npm run build


# Stage 2: Create the final, lean production image
# This stage uses a fresh, minimal Node.js image to run the application,
# ensuring that development dependencies and build tools are not included in the final image.
FROM node:20-alpine

# Set the working directory for the final application
WORKDIR /app

# Copy only the necessary files from the 'build' stage:
# 1. node_modules: Contains all the installed production dependencies.
COPY --from=build /app/node_modules ./node_modules
# 2. The rest of your application code: Your server-side JavaScript, HTML templates, static assets.
COPY --from=build /app .

# Expose the port on which your Node.js application listens.
# This informs Docker that the container will listen on this port at runtime.
# It does not actually publish the port; you'll map it when running the container.
EXPOSE 3000

# Define environment variables for the production environment.
# These can also be passed at runtime using the -e flag with 'docker run'.
# ENV NODE_ENV=production
# ENV PORT=3000 # Your app should ideally read this from process.env.PORT

# The command to run your application when the container starts.
# It's good practice to use the "exec" form (JSON array) as it ensures the process
# runs as PID 1, which is important for signal handling (e.g., graceful shutdowns).
# If your package.json has a "start" script (e.g., "start": "node app.js"), you can use:
# CMD ["npm", "start"]
# Otherwise, specify the main application file directly:
CMD ["node", "app.js"]

# For robust production deployments, consider a process manager like PM2 inside the container
# if you're not orchestrating with Kubernetes or similar.
# Example with PM2 (requires installing pm2 in Stage 1 and copying its config):
# CMD ["pm2-runtime", "start", "app.js"]
