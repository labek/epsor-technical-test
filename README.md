# EPSOR TECHNICAL TEST

## Description

This technical test has two exercises.

Here are the instructions:

```
1. Exercice 1

Réaliser une API GraphQL en Node.js avec :
- typegraphql https://typegraphql.com/
- apollo server https://www.apollographql.com/docs/apollo-server/
- mongodb https://docs.mongodb.com/manual/ et https://mongodb.github.io/node-mongodb-native/
- node-rdkafka https://github.com/Blizzard/node-rdkafka

Cette API aura une mutation et une query :
 - La mutation permettra de créer des produits (ou autre, à toi de choisir). Cette mutation produira un message Kafka contenant la donnée de la mutation. La mutation devra retourner l’uuid de l’objet créé uniquement quand Kafka aura acknowledge le message.
 - Une query pour récupérer les produits (ou ce que tu auras décidé) stockés dans une base de donnée Mongo.
 - Ce n’est pas à l’api de générer l’uuid.

2. Exercice 2

Réaliser un consumer en Node.js qui aura pour rôle de lire les message Kafka et de les insérer dans la Mongo.
- node-rdkafka https://github.com/Blizzard/node-rdkafka

3. Bonus
- Permettre la mutation que si un token valide est présent dans les headers.
```

## Getting started

To ease the review, I've created a `docker-compose.yml` file which allows to run all of following apps:

1. Kafka + Zookeeper
2. MongoDB
3. Consumer
4. API

All you need to do is to run this following command:

```
docker-compose up -d --build
```

## Improvements

Here is a list of a few things I would like to improve if I had more time:

- Finish to write tests to achieve 100% code coverage on both services
- Fix some warnings when running consumer's tests
- Fix issue related to producer's tests (doesn't work in docker container)
- Modify architecture of consumer service to have a layer architecture

## Bonus question

About the bonus question, here's my approach if I would have time to implement it:

1. I would add a `@Authorized` on the users mutation
2. I would add an `authChecker` into schema and create a custom auth checker which validates if there's a token present within headers and if it's a valid one.
3. For this use-case, the valid token would be just a plain text value loaded by a environment variable
4. Write some integration tests checking this use-case
