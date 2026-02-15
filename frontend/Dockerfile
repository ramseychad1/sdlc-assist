# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Frontend calls /api (same-origin), nginx proxies to backend
RUN find dist -name '*.js' -exec sed -i "s|__API_URL__|/api|g" {} +

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
