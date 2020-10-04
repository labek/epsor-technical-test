FROM node:12-stretch AS builder
LABEL Maintainer "David Duong"

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY . .

RUN npm i
RUN npm run build

FROM builder AS cleaner

RUN rm -rf node_modules package-lock.json
RUN npm i --production

FROM node:12-stretch AS app

WORKDIR /app

COPY --from=cleaner /app/node_modules/ node_modules/
COPY --from=cleaner /app/dist/ dist/

ENTRYPOINT ["node", "./dist/index.js"]
