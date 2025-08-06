import fs from 'node:fs';
import path from 'node:path';
import { pino, type StreamEntry } from 'pino';
import configs from './index.js';

const { node_env, log_level, is_logs_on_file } = configs;

const streams: StreamEntry<string>[] = [];

if (node_env === 'development' || node_env === 'test') {
  const { PinoPretty } = await import('pino-pretty');
  streams.push({ stream: PinoPretty({ colorize: true }) });
} else {
  streams.push({ stream: process.stdout });
}

// If is_logs_on_file is true, add file streams for error and fatal logs
if (is_logs_on_file) {
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
    { level: 'error', stream: pino.destination(getLogFilePath('error')) },
    { level: 'fatal', stream: pino.destination(getLogFilePath('fatal')) },
  );
}

const logger = pino(
  {
    level: log_level || 'info',
    formatters: {
      level(level) {
        return { level };
      },
    },
  },
  pino.multistream(streams),
);

export default logger;
