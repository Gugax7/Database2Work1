FROM node:24-alpine AS development
ARG APP_UID=1000
ARG APP_GID=1000
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN chown -R ${APP_UID}:${APP_GID} /app
USER ${APP_UID}:${APP_GID}
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine AS production
ENV PORT=8080 BACKEND_HOST=backend:8080
ENV NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_HOST)$"
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
