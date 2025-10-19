#Multi-stage Dockerfile (Node.js app)

ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
RUN mkdir backend
RUN mkdir frontend

# Install deps (uses package-lock.json if present)
COPY backend/package*.json ./backend
COPY frontend/package*.json ./frontend
WORKDIR /app/backend
RUN npm install

WORKDIR /app/frontend
RUN npm install
WORKDIR /app
# Copy source and build (if a "build" script exists)
COPY . .

# Ensure run.sh is copied to the final image
COPY entrypoint.sh ./

# Final image (runtime)
FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy the entire application from builder
COPY --from=builder /app ./

# Copy node_modules from builder stage
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules

# Switch to root user to modify permissions
USER root
RUN chmod +x entrypoint.sh

# Switch back to non-root user
USER node

# Adjust the port if your app uses a different one
EXPOSE 3000
EXPOSE 5173

# Default start command: uses "npm start". Change to your entrypoint if needed:
CMD ["/bin/sh", "./entrypoint.sh"]

# Optional healthcheck (uncomment and adjust path/port if desired)
# HEALTHCHECK --interval=30s --timeout=3s \
#   CMD wget -qO- http://localhost:3000/health || exit 1
