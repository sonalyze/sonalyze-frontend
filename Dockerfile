FROM node:latest AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx expo export --platform web


FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/

COPY --from=builder /app/dist/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]