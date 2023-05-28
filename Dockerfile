# base node image
FROM node:18-bullseye-slim

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production=false
COPY . .
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
