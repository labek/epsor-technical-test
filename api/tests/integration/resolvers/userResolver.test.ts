import { ApolloServer, gql } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import { ProducerGlobalConfig, ProducerTopicConfig } from 'node-rdkafka';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import Container from 'typedi';
import {
    Connection,
    ConnectionOptions,
    createConnection,
    getMongoRepository,
    MongoRepository,
} from 'typeorm';
import User from '../../../src/entities/user';
import UserResolver from '../../../src/resolvers/userResolver';
import { CreateUserInput } from '../../../src/types/userTypes';
import KafkaProducer from '../../../src/utils/kafkaProducer';
import { logger } from '../../../src/utils/logger';

jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/kafkaProducer');

// Queries & Mutations
const GET_USERS = gql`
    query getUsers($skip: Int, $take: Int) {
        users(skip: $skip, take: $take) {
            uuid
            firstName
            lastName
            emailAddress
            phoneNumber
            role
        }
    }
`;

const CREATE_USER = gql`
    mutation createUser($newUserData: CreateUserInput!) {
        createUser(newUserData: $newUserData) {
            code
            success
            message
            uuid
        }
    }
`;

describe('src/resolvers/userResolver', () => {
    const producerConfig: ProducerGlobalConfig = {
        'client.id': 'kafka',
        'metadata.broker.list': 'localhost:9092',
        dr_cb: true,
    };

    const topicConfig: ProducerTopicConfig = { acks: -1 };
    const mongoConfig: ConnectionOptions = {
        type: 'mongodb',
        url: process.env.MONGO_URL,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        entities: [`${__dirname}/../../../../**/entities/*.{js,ts}`],
    };

    let testProducer: KafkaProducer;
    let userRepository: MongoRepository<User>;
    let userResolver: UserResolver;
    let server: ApolloServer;
    let connection: Connection;
    let userInput: CreateUserInput;

    beforeAll(async () => {
        connection = await createConnection(mongoConfig);
        userRepository = getMongoRepository(User);

        testProducer = new KafkaProducer(producerConfig, topicConfig, logger);
        testProducer.start();

        userResolver = new UserResolver(userRepository, testProducer);

        userInput = {
            uuid: 'a'.repeat(36),
            firstName: 'Kobe',
            lastName: 'Bryant',
            emailAddress: 'kobe.bryant@lakers.com',
            phoneNumber: '2424242424',
            role: 'admin',
        };
    });

    beforeEach(async () => {
        Container.set(UserResolver, userResolver);

        const schema = await buildSchema({
            resolvers: [UserResolver],
            container: Container,
        });

        server = new ApolloServer({ schema });
    });

    afterEach(async () => {
        await userRepository.deleteMany({});
    });

    afterAll(async () => {
        testProducer.stop();
        await connection.dropDatabase();
    });

    describe('Queries', () => {
        it("should return an empty array of users when there's no user in the database", async () => {
            const { query } = createTestClient(server);
            const { data } = await query({ query: GET_USERS, variables: {} });

            expect(data.users).toEqual([]);
        });

        it('should return an array of users', async () => {
            const newUser = userRepository.create();
            newUser.uuid = userInput.uuid;
            newUser.firstName = userInput.firstName;
            newUser.lastName = userInput.lastName;
            newUser.emailAddress = userInput.emailAddress;
            newUser.phoneNumber = userInput.phoneNumber;
            newUser.role = userInput.role;

            await userRepository.save(newUser);

            const { query } = createTestClient(server);
            const { data } = await query({ query: GET_USERS, variables: {} });

            const expected = [
                {
                    uuid: newUser.uuid,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    emailAddress: newUser.emailAddress,
                    phoneNumber: newUser.phoneNumber,
                    role: newUser.role,
                },
            ];

            expect(data.users).toEqual(expected);
        });
    });

    describe('Mutations', () => {
        it('should create a new user', async () => {
            const { mutate } = createTestClient(server);

            const { data } = await mutate({
                mutation: CREATE_USER,
                variables: { newUserData: userInput },
            });

            const expected = {
                code: '201',
                success: true,
                message: 'Created',
                uuid: userInput.uuid,
            };

            expect(data.createUser).toEqual(expected);
        });
    });
});
