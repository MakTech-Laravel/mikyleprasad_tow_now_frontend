# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Declare build-time env vars (Coolify passes these from Environment Variables)
ARG VITE_SITE_NAME
ARG VITE_API_BASE_URL
ARG VITE_AUTH_STRATEGY
ARG VITE_BEARER_TOKEN_STORAGE
ARG VITE_AUTH_ME_PATH
ARG VITE_ENVIRONMENT_MODE

# Make them available to Vite at build time
ENV VITE_SITE_NAME=$VITE_SITE_NAME
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AUTH_STRATEGY=$VITE_AUTH_STRATEGY
ENV VITE_BEARER_TOKEN_STORAGE=$VITE_BEARER_TOKEN_STORAGE
ENV VITE_AUTH_ME_PATH=$VITE_AUTH_ME_PATH
ENV VITE_ENVIRONMENT_MODE=$VITE_ENVIRONMENT_MODE

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npm install && npm run build

# ─── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf

COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]