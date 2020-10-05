import { bootstrap } from '../../../src';
import * as helpers from '../../../src/utils/helpers';
import { logger } from '../../../src/utils/logger';

jest.mock('../../../src/utils/logger');
jest.mock('../../../src/config', () => ({
    appConfig: {
        environment: 'test',
        name: 'test',
        port: 4000,
    },
    mongoConfig: {
        type: 'mongodb',
        url: process.env.MONGO_URL,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        entities: [`${__dirname}/../../../../src/entities/*.{js,ts}`],
    },
    producerConfig: {
        'client.id': 'test-kafka',
        'metadata.broker.list': 'localhost:9092',
    },
    producerTopicConfig: { acks: -1 },
}));

describe('src/index', () => {
    let loggerInfoSpy: jest.SpyInstance;
    let loggerErrorSpy: jest.SpyInstance;
    let createSchemaSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;

    beforeEach(() => {
        loggerInfoSpy = jest.spyOn(logger, 'info');
        loggerErrorSpy = jest.spyOn(logger, 'error');
        createSchemaSpy = jest.spyOn(helpers, 'createSchema');
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should log an error message when a function fails', async () => {
        try {
            createSchemaSpy.mockImplementationOnce(() => {
                throw new Error('createSchema error');
            });

            await bootstrap();
        } catch (err) {
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                'An error has occurred when running the app: createSchema error',
            );
        }
    });

    it('should call process.exit with code 1 when a function fails', async () => {
        try {
            createSchemaSpy.mockImplementationOnce(() => {
                throw new Error('createSchema error');
            });

            await bootstrap();
        } catch (err) {
            expect(processExitSpy).toHaveBeenCalledWith(1);
        }
    });

    it('should log an info message when connection to mongoDB is established', async () => {
        await bootstrap();

        expect(loggerInfoSpy).toHaveBeenCalledWith(
            '✅ Connection to database successful',
        );
    });
});
