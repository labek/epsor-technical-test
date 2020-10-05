FROM node:12-stretch
LABEL Maintainer "David Duong"

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

RUN npm cache verify
RUN yarn

COPY . /app/

RUN node -v
RUN ls -al /proc/1/map_files/
RUN yarn run test:coverage