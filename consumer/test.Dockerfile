FROM node:12-stretch
LABEL Maintainer "David Duong"

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

COPY . .

RUN npm i

RUN npm run test:coverage