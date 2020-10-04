import { mongoConfig, mongoOptions, kafkaConsumerConfig } from './config';
import MongoDbClient from './database/mongodb';
import KafkaConsumer from './utils/kafkaConsumer';
import { logger } from './utils/logger';

export const main = async (): Promise<void> => {
    let mongoClient: MongoDbClient;
    let consumer: KafkaConsumer;

    try {
        mongoClient = new MongoDbClient(mongoConfig, mongoOptions, logger);
        await mongoClient.start();

        consumer = new KafkaConsumer(
            kafkaConsumerConfig,
            'users',
            logger,
            mongoClient,
        );

        consumer.start();
    } catch (err) {
        logger.error(
            `An error has occurred when running the app: ${err.message}`,
        );

        await mongoClient.stop();
        consumer.stop();

        process.exit(0);
    }
};

main();
