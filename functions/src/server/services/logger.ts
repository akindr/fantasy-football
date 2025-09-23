import winston from 'winston';
const { align, combine, timestamp, json, errors, colorize, printf } = winston.format;

export const logger = winston.createLogger({
    level: 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        json(),
        align(),
        printf(({ level, message, timestamp, ...rest }) => {
            return `[${timestamp}] ${level}: ${message} ${JSON.stringify(rest)}`;
        }),
        colorize({ all: true })
    ),
    transports: [new winston.transports.Console()],
});
