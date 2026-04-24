import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';
import { fileURLToPath } from 'node:url';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

export const logDirectory = path.join(projectRoot, '.logs');

fs.mkdirSync(logDirectory, { recursive: true });

const colorizer = winston.format.colorize();

function serializeConsoleMeta(metadata: Record<string, unknown>): string {
  if (Object.keys(metadata).length === 0) {
    return '';
  }

  return `\n${util.inspect(metadata, {
    colors: true,
    depth: 6,
    compact: false,
    breakLength: 120,
  })}`;
}

const consoleFormat = winston.format.printf((info) => {
  const { timestamp, level, message, stack, ...metadata } = info;
  const renderedLevel = colorizer.colorize(level, level.toUpperCase().padEnd(5));
  const renderedMessage = stack ?? message;

  return `${timestamp} ${renderedLevel} ${renderedMessage}${serializeConsoleMeta(metadata)}`;
});

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export function toLogError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  defaultMeta: {
    service: 'bhaga-banti',
    environment: process.env.NODE_ENV ?? 'development',
  },
  format: fileFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'application.log'),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        consoleFormat,
      ),
    }),
  ],
  exitOnError: false,
});
