import { MongoClientOptions } from 'mongodb';
import { ConsumerGlobalConfig } from 'node-rdkafka';

interface AppConfig {
    environment: string;
    name: string;
}

interface MongoConfig {
    url: string;
    collection: string;
}

const mongoConfig: MongoConfig = {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/epsor',
    collection: process.env.MONGODB_COLLECTION || 'users',
};

const auth =
    process.env.MONGDOB_USERNAME && process.env.MONGODB_PASSWORD
        ? {
              user: process.env.MONGODB_USERNAME,
              password: process.env.MONGODB_PASSWORD,
          }
        : {};

const mongoOptions: MongoClientOptions = {
    ...auth,
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

const kafkaConsumerConfig: ConsumerGlobalConfig = {
    'group.id': 'kafka',
    'metadata.broker.list': process.env.KAFKA_BROKER_LIST,
};

const appConfig: AppConfig = {
    environment: process.env.NODE_ENV as string,
    name: process.env.SERVICE_NAME as string,
};

export {
    MongoConfig,
    mongoConfig,
    mongoOptions,
    kafkaConsumerConfig,
    appConfig,
};
