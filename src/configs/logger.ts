import fs from 'node:fs';
import path from 'node:path';
import { destination, multistream, pino, type StreamEntry } from 'pino';
import env from './env';

const { NODE_ENV, LOG_LEVEL, IS_LOGS_ON_FILE } = env;

const streams: StreamEntry<string>[] = [];

if (NODE_ENV === 'development' || NODE_ENV === 'test') {
  // eslint-disable-next-line import-x/no-extraneous-dependencies
  const { PinoPretty } = await import('pino-pretty');
  streams.push({ stream: PinoPretty({ colorize: true }) });
} else {
  streams.push({ stream: process.stdout });
}

// If is_logs_on_file is true, add file streams for error and fatal logs
if (IS_LOGS_ON_FILE === 'true') {
  const logDir = path.join(process.cwd(), 'logs');

  // Helper function to generate log filenames with date
  const getLogFilePath = (level: string) => {
    const date = new Date().toISOString().split('T')[0];
    return `${logDir}/${level}-${date}.log`;
  };

  // Ensure the logs directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // add file streams for error and fatal logs
  streams.push(
    { level: 'error', stream: destination(getLogFilePath('error')) },
    { level: 'fatal', stream: destination(getLogFilePath('fatal')) },
  );
}

const logger = pino(
  {
    level: LOG_LEVEL,
    redact: {
      paths: [
        'password',
        'email',
        'userEmail',
        'token',
        'accessToken',
        'refreshToken',
        'currentPassword',
        'newPassword',
        '*.password',
        '*.email',
        '*.userEmail',
        '*.token',
        '*.accessToken',
        '*.refreshToken',
        'req.headers.authorization',
        'req.headers.cookie',
        'headers.authorization',
        'headers.cookie',
      ],
      censor: '[REDACTED]',
    },
    formatters: {
      level(level) {
        return { level };
      },
    },
  },
  multistream(streams),
);

export default logger;
