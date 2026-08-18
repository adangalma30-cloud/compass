# Container image for the Compass API.
#
# Provided so the backend can run on any host that takes a Dockerfile
# (Fly.io, Cloud Run, Railway, a VPS) rather than only on Render.
#
# Build:  docker build -t compass-api .
# Run:    docker run -p 8787:8787 --env-file .env compass-api

FROM node:20-slim

WORKDIR /app

# Install dependencies first so the layer is cached when only source changes.
# The server runs through tsx, which is a runtime dependency, so the full
# dependency set is required.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Only the files the API needs at runtime.
COPY server ./server
COPY src/data ./src/data
COPY src/types ./src/types
COPY tsconfig.json tsconfig.server.json ./

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

# Fails the container health check if the API stops responding.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "server:start"]
