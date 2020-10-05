# API

## Description

This Node.js application developped with Apollo server and TypeGraphQL is an API with the following features:
1. A query that allows to fetch all users from a MongoDB database;
2. A mutation that allows to create a new user by sending a new message to Kafka.

The actual user creation is handled by a consumer which reads messages from message broker and inserts them into a datatase.

## Getting started

Here are the steps to follow to run the project on your machine:

1. Make a copy of `.example.env` file as `.env`
2. Change default values within `.env` file
3. Make changes on environment variables' values of `.env` file
4. Run this following command to set Node.js version via `nvm`:

```sh
nvm i
```

4. Install dependencies with this following command:

```sh
npm i
```

All you need to do now is running the application

## Useful commands

| Commands      | Description                                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| build         | Build the application by compiling TS files into JS files                     |
| start         | Start the production-ready application                                        |
| start:dev     | Start the application in development mode using hot-reloading via `tsc-watch` |
| lint          | Lint code with ESLint                                                         |
| format        | Format code with Prettier                                                     |
| test          | Run tests with Jest                                                           |
| test:coverage | Run tests + coverage with Jest                                                |
