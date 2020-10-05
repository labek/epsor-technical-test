import {
    Producer,
    ProducerGlobalConfig,
    ProducerTopicConfig,
} from 'node-rdkafka';
import { CreateUserInput } from '../types/userTypes';
import { Logger } from './logger';

class KafkaProducer {
    public isStarted = false;
    public producer: Producer;

    constructor(
        public readonly config: ProducerGlobalConfig,
        topicConfig: ProducerTopicConfig,
        public readonly logger: Logger,
    ) {
        this.producer = new Producer(this.config, topicConfig);

        this.producer
            .on('ready', () => {
                this.isStarted = true;
                this.logger.info('✅ Kafka producer connected');
            })
            .on('disconnected', () => {
                this.isStarted = false;
                this.logger.info('✅ Kafka producer disconnected');
            })
            .on('connection.failure', (err) => {
                this.isStarted = false;
                this.logger.error(
                    `❌ Connection to broker failed : ${err.message}`,
                );
            })
            .on('event.error', (err) => {
                this.logger.error(
                    `❌ A problem occurred when sending our message : ${err.message}`,
                );
            });
    }

    start(): void {
        if (!this.isStarted) {
            this.producer.connect();
        }
    }

    stop(): void {
        if (this.isStarted) {
            this.producer.disconnect();
        }
    }

    sendMessage(data: CreateUserInput): void {
        if (!this.isStarted) {
            this.logger.info('The producer is not ready yet');
            return;
        }

        try {
            const stringifiedMessage = JSON.stringify(data);
            const message = Buffer.from(stringifiedMessage);
            const timestamp = Date.now();
            const headers = [];

            this.producer.produce(
                'users',
                null,
                message,
                null,
                timestamp,
                null,
                headers,
            );

            // As seen on the documentation, we need to set the poll interval
            // to get delivery events and know when the queue is eventually filled up
            // (https://github.com/Blizzard/node-rdkafka#standard-api)
            this.producer.setPollInterval(100);

            this.logger.info('✉️  A new message has been sent');
        } catch (err) {
            this.logger.error(
                `kafkaProducer > sendMessage err: ${err.message}`,
            );
        }
    }
}

export default KafkaProducer;
