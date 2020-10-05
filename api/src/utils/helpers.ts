import { GraphQLSchema } from 'graphql';

import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { getMongoRepository, MongoRepository } from 'typeorm';

import User from '../entities/user';
import UserResolver from '../resolvers/userResolver';
import KafkaProducer from './kafkaProducer';

const createSchema = async (
    producer: KafkaProducer,
): Promise<GraphQLSchema> => {
    const userRepository: MongoRepository<User> = getMongoRepository(User);
    const userResolver = new UserResolver(userRepository, producer);

    Container.set(UserResolver, userResolver);

    const schema = await buildSchema({
        resolvers: [UserResolver],
        container: Container,
    });

    return schema;
};

export { createSchema };
