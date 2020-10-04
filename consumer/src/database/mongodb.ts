import { MongoClient, MongoClientOptions } from 'mongodb';
import { MongoConfig } from '../config';
import { Logger } from '../utils/logger';

export interface UserDocument {
    uuid: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber: string;
    role: string;
}

class MongoDbClient {
    public isStarted = false;
    public client: MongoClient;

    constructor(
        private readonly config: MongoConfig,
        private readonly options: MongoClientOptions,
        private readonly logger: Logger,
    ) {
        this.client = new MongoClient(config.url, this.options);
    }

    async start(): Promise<boolean> {
        try {
            if (!this.isStarted && this.client) {
                await this.client.connect();
                
                this.logger.info('✅ MongoDB client connected');

                this.isStarted = true;
            }

            return this.isStarted;
        } catch (err) {
            this.logger.error(`start error : ${err.message}`);
            throw err;
        }
    }

    async stop(): Promise<boolean> {
        try {
            if (this.isStarted && this.client) {
                await this.client.close();
                this.logger.info('✅ MongoDB client disconnected');
                this.isStarted = false;
            }

            return this.isStarted;
        } catch (err) {
            this.logger.error(`stop error : ${err.message}`);
            throw err;
        }
    }

    async insert(document: UserDocument): Promise<void> {
        const { collection } = this.config;

        try {
            if (this.isStarted && this.client) {
                await this.client
                    .db()
                    .collection(collection)
                    .insertOne(document);

                this.logger.info(
                    `✅ Document successfully inserted in ${collection} collection`,
                );
            }
        } catch (err) {
            this.logger.error(`insert error : ${err.message}`);
            throw err;
        }
    }
}

export default MongoDbClient;
