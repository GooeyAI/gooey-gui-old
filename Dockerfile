# base node image
FROM node:18-bullseye-slim

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production

ENTRYPOINT ./scripts/run-prod.sh
