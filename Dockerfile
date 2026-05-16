# Etapa de compilación
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Argumentos para la IP de Azure
ARG VITE_API_URL
ARG VITE_WEBSOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL

RUN npm run build

# Etapa de ejecución
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Configuración de Nginx para Single Page Applications
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
