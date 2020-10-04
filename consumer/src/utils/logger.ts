import { createLogger, format, transports, config } from 'winston';
import { appConfig } from '../config';

const logger = createLogger({
    levels: config.syslog.levels,
    defaultMeta: { service: appConfig.name },
    format: format.json(),
    transports: [
        new transports.Console({ level: 'info' }),
        new transports.Console({ level: 'warn' }),
        new transports.Console({ level: 'error' }),
    ],
});

if (process.env.NODE_ENV === 'production') {
    logger.add(
        new transports.Console({
            format: format.simple(),
        }),
    );
}

type Logger = typeof logger;

export { logger, Logger };
