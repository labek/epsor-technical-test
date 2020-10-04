import { KafkaConsumer, Message, Metadata } from 'node-rdkafka';
import { MongoConfig } from '../../../src/config';
import MongoDbClient from '../../../src/database/mongodb';
import KafkaMessageConsumer from '../../../src/utils/kafkaConsumer';
import { logger } from '../../../src/utils/logger';

jest.mock('../../../src/utils/logger');

enum ConsumerEvents {
    CONNECTION_FAILURE = 'connection.failure',
    DATA = 'data',
    DISCONNECTED = 'disconnected',
    EVENT_ERROR = 'event.error',
    READY = 'ready',
}

describe('src/utils/kafkaConsumer', () => {
    const topic = 'test-topic';
    const brokerName = 'localhost:9092/1';

    let consumerConfig;
    let mongoConfig: MongoConfig;
    let metadata: Metadata;

    let testConsumer: KafkaMessageConsumer;
    let mongoClient: MongoDbClient;

    let loggerInfoSpy: jest.SpyInstance;
    let loggerErrorSpy: jest.SpyInstance;
    let connectSpy: jest.SpyInstance;
    let consumeSpy: jest.SpyInstance;
    let disconnectSpy: jest.SpyInstance;
    let subscribeSpy: jest.SpyInstance;
    let unsubscribeSpy: jest.SpyInstance;

    beforeEach(() => {
        mongoConfig = {
            url: process.env.MONGO_URL,
            collection: 'collection',
        };

        consumerConfig = {
            'group.id': 'test-kafka',
            'metadata.broker.list': 'localhost:9092',
        };

        metadata = {
            orig_broker_id: 1,
            orig_broker_name: brokerName,
            topics: [
                {
                    name: topic,
                    partitions: [
                        { id: 0, leader: 1, replicas: [1], isrs: [1] },
                    ],
                },
                {
                    name: '__consumer_offsets',
                    partitions: [
                        { id: 0, leader: 1, replicas: [1], isrs: [1] },
                    ],
                },
            ],
            brokers: [{ id: 1, host: 'localhost', port: 9092 }],
        };

        mongoClient = new MongoDbClient(mongoConfig, {}, logger);
        testConsumer = new KafkaMessageConsumer(
            consumerConfig,
            topic,
            logger,
            mongoClient,
        );

        loggerInfoSpy = jest.spyOn(logger, 'info');
        loggerErrorSpy = jest.spyOn(logger, 'error');

        connectSpy = jest.spyOn(testConsumer.consumer, 'connect');
        consumeSpy = jest.spyOn(testConsumer.consumer, 'consume');
        disconnectSpy = jest.spyOn(testConsumer.consumer, 'disconnect');
        subscribeSpy = jest
            .spyOn(testConsumer.consumer, 'subscribe')
            .mockReturnThis();

        unsubscribeSpy = jest.spyOn(testConsumer.consumer, 'unsubscribe');
    });

    afterEach(async () => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should instantiate "consumer" attribute as KafkaConsumer', () => {
            expect(testConsumer.consumer).toBeInstanceOf(KafkaConsumer);
        });
    });

    describe('Events', () => {
        describe('ready', () => {
            it(`should log 3 info messages when "${ConsumerEvents.READY}" event is emitted`, async () => {
                testConsumer.start();
                testConsumer.consumer.emit(
                    ConsumerEvents.READY,
                    brokerName,
                    metadata,
                );

                expect(loggerInfoSpy).toHaveBeenNthCalledWith(
                    1,
                    '✅ Kafka consumer connected',
                );

                expect(loggerInfoSpy).toHaveBeenNthCalledWith(
                    2,
                    `✅ Subscription to "${topic}" successful`,
                );

                expect(loggerInfoSpy).toHaveBeenNthCalledWith(
                    3,
                    '✅ Start consuming...',
                );
            });

            it(`should call consumer's "subscribe" method once when ${ConsumerEvents.READY} event is emitted`, async () => {
                testConsumer.start();
                testConsumer.consumer.emit(
                    ConsumerEvents.READY,
                    brokerName,
                    metadata,
                );

                expect(subscribeSpy).toHaveBeenCalledTimes(1);
            });

            it(`should call consumer's "consume" method once when "${ConsumerEvents.READY}" event is emitted`, async () => {
                testConsumer.start();
                testConsumer.consumer.emit(
                    ConsumerEvents.READY,
                    brokerName,
                    metadata,
                );

                expect(consumeSpy).toHaveBeenCalledTimes(1);
            });

            it(`should set "true" as value of "isStarted" attribute when "${ConsumerEvents.READY}" event is emitted`, async () => {
                testConsumer.start();
                testConsumer.consumer.emit(
                    ConsumerEvents.READY,
                    brokerName,
                    metadata,
                );

                expect(testConsumer.isStarted).toBe(true);
            });
        });

        describe('data', () => {
            let data: Message;

            beforeEach(() => {
                testConsumer.start();
                testConsumer.consumer.emit(
                    ConsumerEvents.READY,
                    brokerName,
                    metadata,
                );

                const value = Buffer.from(
                    JSON.stringify({
                        uuid: 'a'.repeat(36),
                        firstName: 'foo',
                        lastName: 'bar',
                        emailAddress: 'foo@bar.com',
                        phoneNumber: '0123456789',
                        role: 'admin',
                    }),
                );

                data = {
                    size: 1,
                    topic,
                    offset: 1,
                    partition: 1,
                    value,
                };

                testConsumer.consumer.emit(ConsumerEvents.DATA, data);
            });

            it(`should call mongoDb client's "insert" method once when "${ConsumerEvents.DATA}" event is emitted`, async () => {
                testConsumer.consumer.emit(ConsumerEvents.DATA, data);
            });
        });

        describe('disconnected', () => {
            beforeEach(() => {
                testConsumer.start();
                testConsumer.consumer.emit(
                    ConsumerEvents.READY,
                    brokerName,
                    metadata,
                );
            });

            it(`should set value of "isStarted" attribute to false when "${ConsumerEvents.DISCONNECTED}" event is emitted`, async () => {
                testConsumer.stop();
                testConsumer.consumer.emit(ConsumerEvents.DISCONNECTED, {});

                expect(testConsumer.isStarted).toBe(false);
            });

            it(`should log an info message when "${ConsumerEvents.DISCONNECTED}" event is emitted`, async () => {
                testConsumer.stop();
                testConsumer.consumer.emit(ConsumerEvents.DISCONNECTED, {});

                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '✅ Kafka consumer disconnected',
                );
            });
        });

        describe('event.error', () => {
            it(`should log an error message when "${ConsumerEvents.EVENT_ERROR}" event is emitted`, async () => {
                testConsumer.start();
                testConsumer.consumer.emit(
                    ConsumerEvents.EVENT_ERROR,
                    new Error('test error!'),
                );

                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    '❌ A problem occurred when receiving message : test error!',
                );
            });
        });

        describe('connection.failure', () => {
            beforeEach(() => {
                testConsumer.start();
                testConsumer.consumer.emit(
                    ConsumerEvents.READY,
                    brokerName,
                    metadata,
                );
            });

            it(`should set value of "isStarted" attribute to false when "${ConsumerEvents.CONNECTION_FAILURE}" event is emitted`, async () => {
                testConsumer.consumer.emit(
                    ConsumerEvents.CONNECTION_FAILURE,
                    new Error('test error!'),
                    {},
                );

                expect(testConsumer.isStarted).toBe(false);
            });

            it(`should log an error message when "${ConsumerEvents.CONNECTION_FAILURE}" event is emitted`, async () => {
                testConsumer.consumer.emit(
                    ConsumerEvents.CONNECTION_FAILURE,
                    new Error('test error!'),
                    {},
                );

                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    '❌ Connection to broker failed : test error!',
                );
            });
        });
    });

    describe('start', () => {
        it('should not call consumer\'s "connect" method when "isStarted" attribute equals to true', async () => {
            testConsumer.isStarted = true;
            testConsumer.start();

            expect(connectSpy).toHaveBeenCalledTimes(0);
        });

        it('should call consumer\'s "connect" method once when "isStarted" attribute equals to false', async () => {
            testConsumer.start();

            expect(connectSpy).toHaveBeenCalledTimes(1);
        });

        it('should return "false" as value of "isStarted" attribute when the client isn\'t connected yet', async () => {
            testConsumer.start();

            expect(testConsumer.isStarted).toBe(false);
        });
    });

    describe('stop', () => {
        it('should not call consumer\'s "unsubscribe" method when "isStarted" attribute equals to false', async () => {
            testConsumer.isStarted = false;
            testConsumer.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(0);
        });

        it('should not call consumer\'s "disconnect" method when "isStarted" attribute equals to false', async () => {
            testConsumer.isStarted = false;
            testConsumer.stop();

            expect(disconnectSpy).toHaveBeenCalledTimes(0);
        });

        it('should call consumer\'s "unsubscribe" method once when "isStarted" attribute equals to true', async () => {
            testConsumer.isStarted = true;
            testConsumer.stop();

            expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        });

        it('should call consumer\'s "disconnect" method once when "isStarted" attribute equals to true', async () => {
            testConsumer.isStarted = true;
            testConsumer.stop();

            expect(disconnectSpy).toHaveBeenCalledTimes(1);
        });

        it('should return true as value of "isStarted" attribute when client isn\'t disconnected yet', async () => {
            testConsumer.start();
            testConsumer.consumer.emit('ready', brokerName, metadata);

            testConsumer.stop();

            expect(testConsumer.isStarted).toBe(true);
        });

        it('should return false as value of "isStarted" attribute when client is disconnected', async () => {
            testConsumer.start();
            testConsumer.consumer.emit('ready', brokerName, metadata);

            testConsumer.stop();
            testConsumer.consumer.emit('disconnected', {});

            expect(testConsumer.isStarted).toBe(false);
        });
    });
});
