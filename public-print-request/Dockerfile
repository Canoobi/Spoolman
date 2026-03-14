FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html/request
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY config /etc/nginx/ssl

EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
