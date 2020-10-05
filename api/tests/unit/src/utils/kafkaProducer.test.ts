import { ProducerGlobalConfig, ProducerTopicConfig } from 'node-rdkafka';
import KafkaProducer from '../../../../src/utils/kafkaProducer';
import { logger } from '../../../../src/utils/logger';
import { CreateUserInput } from '../../../../src/types/userTypes';

jest.mock('../../../../src/utils/logger');

enum ClientEvents {
    CONNECTION_FAILURE = 'connection.failure',
    DATA = 'data',
    DISCONNECTED = 'disconnected',
    EVENT_ERROR = 'event.error',
    READY = 'ready',
}

describe('src/utils/kafkaProducer', () => {
    const topic = 'test-topic';
    const brokerName = 'localhost:9092/1';
    const metadata = {
        orig_broker_id: 1,
        orig_broker_name: brokerName,
        topics: [
            {
                name: topic,
                partitions: [{ id: 0, leader: 1, replicas: [1], isrs: [1] }],
            },
            {
                name: '__consumer_offsets',
                partitions: [{ id: 0, leader: 1, replicas: [1], isrs: [1] }],
            },
        ],
        brokers: [{ id: 1, host: 'localhost', port: 9092 }],
    };

    let config: ProducerGlobalConfig;
    let topicConfig: ProducerTopicConfig;
    let testProducer: KafkaProducer;

    let loggerInfoSpy: jest.SpyInstance;
    let loggerErrorSpy: jest.SpyInstance;
    let connectSpy: jest.SpyInstance;
    let disconnectSpy: jest.SpyInstance;
    let produceSpy: jest.SpyInstance;

    beforeEach(() => {
        config = {
            'client.id': 'test-kafka',
            'metadata.broker.list': 'localhost:9092',
        };
        topicConfig = { acks: -1 };

        testProducer = new KafkaProducer(config, topicConfig, logger);

        loggerInfoSpy = jest.spyOn(logger, 'info');
        loggerErrorSpy = jest.spyOn(logger, 'error');
        connectSpy = jest
            .spyOn(testProducer.producer, 'connect')
            .mockReturnThis();

        disconnectSpy = jest
            .spyOn(testProducer.producer, 'disconnect')
            .mockReturnThis();

        produceSpy = jest
            .spyOn(testProducer.producer, 'produce')
            .mockReturnThis();
    });

    afterEach(() => {
        testProducer.stop();
        testProducer.producer.emit(ClientEvents.DISCONNECTED, {});
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize "isStarted" attribute to false', () => {
            expect(testProducer.isStarted).toBe(false);
        });

        it('should initialize value of "logger" attribute with value of "logger" argument', () => {
            expect(testProducer.logger).toEqual(logger);
        });

        it('should initialize value of "config" attribute with value of "config" argument', () => {
            expect(testProducer.config).toEqual(config);
        });
    });

    describe('Events', () => {
        describe('ready', () => {
            beforeEach(() => {
                testProducer.start();
                testProducer.producer.emit(
                    ClientEvents.READY,
                    brokerName,
                    metadata,
                );
            });

            afterEach(() => {
                testProducer.stop();
                testProducer.producer.emit(ClientEvents.DISCONNECTED, {});
            });

            it(`should log an info message when "${ClientEvents.READY}" event is emitted`, () => {
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '✅ Kafka producer connected',
                );
            });

            it(`should set "true" as value of "isStarted" attribute when "${ClientEvents.READY}" event is emitted`, () => {
                expect(testProducer.isStarted).toBe(true);
            });
        });

        describe('disconnected', () => {
            beforeEach(() => {
                testProducer.start();
                testProducer.producer.emit(
                    ClientEvents.READY,
                    brokerName,
                    metadata,
                );

                testProducer.stop();
                testProducer.producer.emit(ClientEvents.DISCONNECTED, {});
            });

            it(`should set value of "isStarted" attribute to false when "${ClientEvents.DISCONNECTED}" event is emitted`, () => {
                expect(testProducer.isStarted).toBe(false);
            });

            it(`should log an info message when "${ClientEvents.DISCONNECTED}" event is emitted`, () => {
                expect(loggerInfoSpy).toHaveBeenCalledWith(
                    '✅ Kafka producer disconnected',
                );
            });
        });

        describe('event.error', () => {
            beforeEach(() => {
                testProducer.producer.emit(
                    ClientEvents.EVENT_ERROR,
                    new Error('test error!'),
                );
            });

            it(`should log an error message when "${ClientEvents.EVENT_ERROR}" event is emitted`, () => {
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    '❌ A problem occurred when sending our message : test error!',
                );
            });
        });

        describe('connection.failure', () => {
            beforeEach(() => {
                testProducer.producer.emit(
                    ClientEvents.CONNECTION_FAILURE,
                    new Error('test error!'),
                    {},
                );
            });

            it(`should set value of "isStarted" attribute to false when "${ClientEvents.CONNECTION_FAILURE}" event is emitted`, () => {
                expect(testProducer.isStarted).toBe(false);
            });

            it(`should log an error message when "${ClientEvents.CONNECTION_FAILURE}" event is emitted`, () => {
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    '❌ Connection to broker failed : test error!',
                );
            });
        });
    });

    describe('start()', () => {
        it('should return value of "isStarted" attribute', () => {
            expect(testProducer.isStarted).toBe(false);
        });

        it('should not call producer\'s "connect" method when "isStarted" attribute equals to true', () => {
            testProducer.isStarted = true;

            expect(connectSpy).toBeCalledTimes(0);
        });

        it('should call producer\'s "connect" method once when "isStarted" attribute equals to false', () => {
            testProducer.start();

            expect(connectSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('stop()', () => {
        it('should not call producer\'s "disconnect" method when "isStarted" attribute equals to false', () => {
            testProducer.isStarted = false;

            expect(disconnectSpy).toBeCalledTimes(0);
        });

        it('should call producer\'s "disconnect" method once when "isStarted" attribute equals to true', () => {
            testProducer.isStarted = true;
            testProducer.stop();

            expect(disconnectSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('sendMessage()', () => {
        let data: CreateUserInput;

        beforeEach(() => {
            data = {
                uuid: '24',
                firstName: 'Kobe',
                lastName: 'Bryant',
                emailAddress: 'black@mamba.com',
                phoneNumber: '824',
                role: 'admin',
            };

            testProducer.start();
            testProducer.producer.emit(
                ClientEvents.READY,
                brokerName,
                metadata,
            );
        });

        afterEach(() => {
            testProducer.stop();
            testProducer.producer.emit(ClientEvents.DISCONNECTED, {});
        });

        it('should display an info message informing that producer is not ready when "sendMessage" method is called and "isStarted" attribute equals false', () => {
            testProducer.isStarted = false;
            testProducer.sendMessage(data);

            expect(loggerInfoSpy).toHaveBeenCalledWith(
                'The producer is not ready yet',
            );
        });

        it('should log an error message when producer\'s "producer" method fails', () => {
            testProducer.producer.produce = jest.fn(() => {
                throw new Error('produce error');
            });

            testProducer.sendMessage(data);
            const expected = `kafkaProducer > sendMessage err: produce error`;

            expect(loggerErrorSpy).toHaveBeenCalledWith(expected);
        });

        it('should call producer\'s "producer" method once when "sendMessage" method is called', () => {
            testProducer.sendMessage(data);

            expect(produceSpy).toHaveBeenCalledTimes(1);
        });

        it('should log an info message when a message has been successfully sent to broker', () => {
            // testProducer.isStarted = true;
            testProducer.sendMessage(data);

            expect(loggerInfoSpy).toHaveBeenLastCalledWith(
                '✉️  A new message has been sent',
            );
        });
    });
});
