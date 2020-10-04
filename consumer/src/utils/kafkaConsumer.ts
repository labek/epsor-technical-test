import {
    ConsumerGlobalConfig,
    KafkaConsumer,
    LibrdKafkaError,
    Message,
} from 'node-rdkafka';
import MongoDbClient, { UserDocument } from '../database/mongodb';
import { Logger } from './logger';

class KafkaMessageConsumer {
    public isStarted = false;
    public consumer: KafkaConsumer;

    constructor(
        config: ConsumerGlobalConfig,
        private readonly topic: string,
        private readonly logger: Logger,
        public readonly mongoClient: MongoDbClient,
    ) {
        this.consumer = new KafkaConsumer(config, {});

        this.consumer.on('ready', () => {
            this.isStarted = true;
            this.logger.info('✅ Kafka consumer connected');

            this.consumer.subscribe([this.topic]);
            this.logger.info(`✅ Subscription to "${this.topic}" successful`);

            this.consumer.consume();
            this.logger.info('✅ Start consuming...');
        });

        this.consumer.on('data', async (data: Message) => {
            const doc: UserDocument = JSON.parse(data.value.toString());
            await this.mongoClient.insert(doc);
        });

        this.consumer.on('disconnected', () => {
            this.isStarted = false;
            this.logger.info('✅ Kafka consumer disconnected');
        });

        this.consumer.on('event.error', (err: LibrdKafkaError) => {
            this.logger.error(
                `❌ A problem occurred when receiving message : ${err.message}`,
            );
        });

        this.consumer.on('connection.failure', (err: LibrdKafkaError) => {
            this.isStarted = false;
            this.logger.error(
                `❌ Connection to broker failed : ${err.message}`,
            );
        });
    }

    start(): void {
        if (!this.isStarted) {
            this.consumer.connect();
        }
    }

    stop(): void {
        if (this.isStarted) {
            this.consumer.unsubscribe();
            this.consumer.disconnect();
        }
    }
}

export default KafkaMessageConsumer;
