# relay-demo-front — two-stage build for the Vite React SPA.
#
#   docker compose up -d --build      # from /opt/relay/relay-demo-front
#
# Stage 1 builds the static bundle (Vite inlines VITE_* from .env at BUILD time,
# so .env must be present in the context — it is, and these vars are public).
# Stage 2 serves the bundle with nginx + SPA fallback (react-router needs every
# unknown path to return index.html).

# ---- Stage 1: build ----
FROM node:25-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: serve ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
