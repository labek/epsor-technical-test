import { MongoClient, MongoClientOptions } from 'mongodb';
import { MongoConfig } from '../../../src/config';
import MongoDbClient, { UserDocument } from '../../../src/database/mongodb';
import { logger } from '../../../src/utils/logger';

jest.mock('../../../src/utils/logger');

describe('src/database/mongodb', () => {
    let config: MongoConfig;
    let options: MongoClientOptions;
    let userDocument: UserDocument;
    let mongoClient: MongoDbClient;

    let loggerInfoSpy: jest.SpyInstance;
    let loggerErrorSpy: jest.SpyInstance;
    let connectSpy: jest.SpyInstance;
    let closeSpy: jest.SpyInstance;
    let dbSpy: jest.SpyInstance;

    beforeEach(() => {
        config = {
            url: process.env.MONGO_URL,
            collection: 'test',
        };

        options = { useUnifiedTopology: true };

        mongoClient = new MongoDbClient(config, options, logger);

        userDocument = {
            uuid: 'a'.repeat(36),
            firstName: 'foo',
            lastName: 'bar',
            emailAddress: 'foo@bar.com',
            phoneNumber: '0123456789',
            role: 'admin',
        };

        loggerInfoSpy = jest.spyOn(logger, 'info');
        loggerErrorSpy = jest.spyOn(logger, 'error');

        connectSpy = jest.spyOn(mongoClient.client, 'connect');
        closeSpy = jest.spyOn(mongoClient.client, 'close');
        dbSpy = jest.spyOn(mongoClient.client, 'db');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize "client" attribute as instance of MongoClient', () => {
            expect(mongoClient.client).toBeInstanceOf(MongoClient);
        });
    });

    describe('start()', () => {
        it('should throw an error when mongoClient\'s "connect" method fails', async () => {
            connectSpy.mockImplementationOnce(() => {
                throw new Error('connect error');
            });

            try {
                await mongoClient.start();
            } catch (err) {
                expect(err).toEqual(new Error('connect error'));
            }
        });

        it('should log an error message when mongoClient\'s "connect" method fails', async () => {
            connectSpy.mockImplementationOnce(() => {
                throw new Error('connect error');
            });

            try {
                await mongoClient.start();
            } catch (err) {
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    'start error : connect error',
                );
            }
        });

        it('should not call mongoClient\'s "connect" method when "isStarted" attribute equals to true', async () => {
            mongoClient.isStarted = true;
            await mongoClient.start();

            expect(connectSpy).toHaveBeenCalledTimes(0);
        });

        it('should not call mongoClient\'s "connect" method when "client" attribute is not set', async () => {
            mongoClient.client = null;
            await mongoClient.start();

            expect(connectSpy).toHaveBeenCalledTimes(0);
        });

        it('should call mongoClient\'s "connect" method once when "client" attribute is set and "isStarted" attribute equals to false', async () => {
            await mongoClient.start();

            expect(connectSpy).toHaveBeenCalledTimes(1);
        });

        it('should log an info message when client is connected', async () => {
            await mongoClient.start();

            expect(loggerInfoSpy).toHaveBeenCalledWith(
                '✅ MongoDB client connected',
            );
        });

        it('should return true as value of "isStarted" attribute when client is connected', async () => {
            await mongoClient.start();

            expect(mongoClient.isStarted).toBe(true);
        });
    });

    describe('stop()', () => {
        beforeEach(() => {
            mongoClient.isStarted = true;
        });

        it('should throw an error when mongoClient\'s "close" method fails', async () => {
            closeSpy.mockImplementationOnce(() => {
                throw new Error('close error');
            });

            try {
                await mongoClient.stop();
            } catch (err) {
                expect(err).toEqual(new Error('close error'));
            }
        });

        it('should log an error message when mongoClient\'s "close" method fails', async () => {
            closeSpy.mockImplementationOnce(() => {
                throw new Error('close error');
            });

            try {
                await mongoClient.stop();
            } catch (err) {
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    'stop error : close error',
                );
            }
        });

        it('should not call mongoClient\'s "close" method when "isStarted" attribute equals to false', async () => {
            mongoClient.isStarted = false;
            await mongoClient.stop();

            expect(closeSpy).toHaveBeenCalledTimes(0);
        });

        it('should not call mongoClient\'s "close" method when "client" attribute is not set', async () => {
            mongoClient.client = null;
            await mongoClient.stop();

            expect(closeSpy).toHaveBeenCalledTimes(0);
        });

        it('should call mongoClient\'s "close" method once when "client" attribute is set and "isStarted" attribute equals to true', async () => {
            await mongoClient.stop();

            expect(closeSpy).toHaveBeenCalledTimes(1);
        });

        it('should log an info message when client is disconnected', async () => {
            await mongoClient.stop();

            expect(loggerInfoSpy).toHaveBeenCalledWith(
                '✅ MongoDB client disconnected',
            );
        });

        it('should return false as value of "isStarted" attribute when client is disconnected', async () => {
            await mongoClient.stop();

            expect(mongoClient.isStarted).toBe(false);
        });
    });

    describe('insert()', () => {
        beforeEach(async () => {
            await mongoClient.start();
        });

        it("should throw an error when a mongoClient's method fails", async () => {
            dbSpy.mockImplementationOnce(() => {
                throw new Error('db error');
            });

            try {
                await mongoClient.insert(userDocument);
            } catch (err) {
                expect(err).toEqual(new Error('db error'));
            }
        });

        it("should log an error message when a mongoClient's method fails", async () => {
            dbSpy.mockImplementationOnce(() => {
                throw new Error('db error');
            });

            try {
                await mongoClient.insert(userDocument);
            } catch (err) {
                expect(loggerErrorSpy).toHaveBeenCalledWith(
                    'insert error : db error',
                );
            }
        });

        it('should not call mongoClient\'s "db" method when "isStarted" attribute equals to false', async () => {
            mongoClient.isStarted = false;
            await mongoClient.insert(userDocument);

            expect(dbSpy).toHaveBeenCalledTimes(0);
        });

        it('should not call mongoClient\'s "db" method when "client" attribute is not set', async () => {
            mongoClient.client = null;
            await mongoClient.insert(userDocument);

            expect(dbSpy).toHaveBeenCalledTimes(0);
        });

        it('should log an info message when client has inserted a document into the database', async () => {
            await mongoClient.insert(userDocument);

            expect(loggerInfoSpy).toHaveBeenLastCalledWith(
                '✅ Document successfully inserted in test collection',
            );
        });
    });
});
