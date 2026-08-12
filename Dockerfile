FROM node:24-alpine AS builder

RUN apk add --no-cache git
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY docs ./docs
RUN npm run build

FROM nginx:1.29-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/docs/.vitepress/dist/ /usr/share/nginx/html/knowledge/
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/knowledge/ >/dev/null || exit 1
