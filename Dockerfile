# base node image
FROM node:18-bullseye-slim

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production

CMD echo $GOOGLE_APPLICATION_CREDENTIALS_JSON > serviceAccountKey.json \
    && GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json npm run start
