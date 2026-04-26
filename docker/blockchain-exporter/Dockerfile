FROM node:18-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

COPY package*.json ./
RUN npm install --omit=dev

COPY index.js .

EXPOSE 8080

CMD ["node", "index.js"]
