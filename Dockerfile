FROM node:24-alpine AS builder

RUN apk add --no-cache git
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY docs ./docs
COPY guwen ./guwen
COPY scripts ./scripts
RUN npm run build:all

FROM nginx:1.29-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/docs/.vitepress/dist/ /usr/share/nginx/html/knowledge/
COPY --from=builder /src/guwen/.vitepress/dist/ /usr/share/nginx/html/guwen/
COPY sites/zmq/ /usr/share/nginx/html/zmq/
COPY sites/rby/ /usr/share/nginx/html/rby/
COPY sites/math/ /usr/share/nginx/html/math/
COPY sites/algo/ /usr/share/nginx/html/algo/
COPY sites/english/ /usr/share/nginx/html/english/
COPY sites/biology/ /usr/share/nginx/html/biology/
COPY sites/geography/ /usr/share/nginx/html/geography/
COPY sites/physics/ /usr/share/nginx/html/physics/
COPY sites/chemistry/ /usr/share/nginx/html/chemistry/
COPY sites/history/ /usr/share/nginx/html/history/
COPY sites/shared/base.css /usr/share/nginx/html/zmq/base.css
COPY sites/shared/base.css /usr/share/nginx/html/rby/base.css
COPY sites/shared/base.css /usr/share/nginx/html/math/base.css
COPY sites/shared/base.css /usr/share/nginx/html/algo/base.css
COPY sites/shared/catalog.css /usr/share/nginx/html/math/catalog.css
COPY sites/shared/catalog.css /usr/share/nginx/html/algo/catalog.css
COPY sites/shared/catalog.js /usr/share/nginx/html/math/catalog.js
COPY sites/shared/catalog.js /usr/share/nginx/html/algo/catalog.js
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --header='Host: knowledge.dezhonger.com' -O - http://127.0.0.1/ >/dev/null || exit 1
