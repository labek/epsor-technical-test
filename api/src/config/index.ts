import { ProducerGlobalConfig, ProducerTopicConfig } from 'node-rdkafka';
import { ConnectionOptions } from 'typeorm';

interface AppConfig {
    environment: string;
    name: string;
    port: number;
}

const appConfig: AppConfig = {
    environment: process.env.NODE_ENV as string,
    name: process.env.SERVICE_NAME as string,
    port: parseInt(process.env.SERVICE_PORT, 10) || 4000,
};

const mongoConfig: ConnectionOptions = {
    type: 'mongodb',
    url:
        (process.env.MONGODB_URL as string) ||
        'mongodb://localhost:27017/epsor',
    username: process.env.MONGODB_USERNAME as string,
    password: process.env.MONGODB_PASSWORD as string,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    synchronize: true,
    entities: [`${__dirname}/../**/entities/*.{ts,js}`],
};

const producerConfig: ProducerGlobalConfig = {
    'client.id': 'kafka',
    'metadata.broker.list':
        (process.env.KAFKA_BROKER_LIST as string) || 'localhost:9092',
    'compression.codec': 'gzip',
    'socket.keepalive.enable': true,
    dr_cb: true,
};

const producerTopicConfig: ProducerTopicConfig = {
    acks: -1,
};

export {
    AppConfig,
    appConfig,
    mongoConfig,
    producerConfig,
    producerTopicConfig,
};
