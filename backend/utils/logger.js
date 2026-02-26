import winston from 'winston';

export const logger = winston.createLogger({
	level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
	format: winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.json()
	),
	defaultMeta: { service: 'codesketch-backend' },
	transports: [
		// Write all logs to console
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple()
			),
		}),
		// Write errors to file
		new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
		// Write all logs to combined file
		new winston.transports.File({ filename: 'logs/combined.log' }),
	],
});

import { mkdirSync } from 'fs';
try {
	mkdirSync('logs', { recursive: true });
} catch {
	// ignore
}
