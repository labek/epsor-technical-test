import { ApolloServer } from 'apollo-server';
import { createConnection } from 'typeorm';
import {
    appConfig,
    mongoConfig,
    producerConfig,
    producerTopicConfig,
} from './config';
import { createSchema } from './utils/helpers';
import KafkaProducer from './utils/kafkaProducer';
import { logger } from './utils/logger';

export const bootstrap = async (): Promise<void> => {
    let producer: KafkaProducer | undefined;

    try {
        await createConnection(mongoConfig);
        logger.info('✅ Connection to database successful');

        producer = new KafkaProducer(
            producerConfig,
            producerTopicConfig,
            logger,
        );

        producer.start();

        const schema = await createSchema(producer);
        const server = new ApolloServer({ schema });
        const { url } = await server.listen({ port: appConfig.port });

        logger.info(`✅ Server ready at ${url}`);
        return;
    } catch (err) {
        producer?.stop();
        logger.error(
            `An error has occurred when running the app: ${err.message}`,
        );
        process.exit(0);
    }
};

bootstrap();
