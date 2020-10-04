import { main } from '../../src';
import MongoDbClient from '../../src/database/mongodb';
import KafkaMessageConsumer from '../../src/utils/kafkaConsumer';
import { logger } from '../../src/utils/logger';

jest.mock('../../src/utils/logger');

describe('src/index', () => {
    let loggerErrorSpy: jest.SpyInstance;
    let mongoStartSpy: jest.SpyInstance;
    let consumerStartSpy: jest.SpyInstance;

    beforeEach(() => {
        loggerErrorSpy = jest.spyOn(logger, 'error');
        mongoStartSpy = jest
            .spyOn(MongoDbClient.prototype, 'start')
            .mockResolvedValue(undefined);

        consumerStartSpy = jest
            .spyOn(KafkaMessageConsumer.prototype, 'start')
            .mockReturnValue();

        jest.spyOn(process, 'exit').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should throw an error when an async method fails', async () => {
        consumerStartSpy.mockImplementationOnce(() => {
            throw new Error('kafka consumer start error');
        });

        await main();

        expect(loggerErrorSpy).toHaveBeenCalledWith(
            'An error has occurred when running the app: kafka consumer start error',
        );
    });

    it('should start mongoDB client once', async () => {
        await main();

        expect(mongoStartSpy).toHaveBeenCalledTimes(1);
    });

    it('should start kafka consumer client once', async () => {
        await main();

        expect(consumerStartSpy).toHaveBeenCalledTimes(1);
    });
});
