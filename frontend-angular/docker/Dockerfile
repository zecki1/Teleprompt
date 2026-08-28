FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --fetch-retries=5 --fetch-retry-maxtimeout=120000 --fetch-timeout=600000
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=build /app/dist/teleprompt-frontend/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
