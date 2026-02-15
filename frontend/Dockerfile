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
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["/bin/sh", "-c", "RESOLVER=$(grep nameserver /etc/resolv.conf | head -1 | awk '{print $2}') && sed \"s|__PORT__|${PORT}|g;s|__API_URL__|${API_URL}|g;s|__RESOLVER__|${RESOLVER}|g\" /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
