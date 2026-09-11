# Build the Vite frontend
FROM oven/bun:1.4.2-slim AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_API_URL is embedded into the frontend at build time.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

RUN bun run build

# Serve the static SPA with nginx
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Support client-side routes and let the PWA fallback to index.html.
RUN printf '%s\n' \
  'server {' \
  '    listen 80;' \
  '    server_name _;' \
  '    root /usr/share/nginx/html;' \
  '    index index.html;' \
  '' \
  '    location / {' \
  '        try_files $uri $uri/ /index.html;' \
  '    }' \
  '' \
  '    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2)$ {' \
  '        try_files $uri =404;' \
  '        add_header Cache-Control "public, max-age=31536000, immutable";' \
  '    }' \
  '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
