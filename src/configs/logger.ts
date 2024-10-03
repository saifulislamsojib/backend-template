import fs from 'fs';
import path from 'path';
import pino, { type StreamEntry } from 'pino';
import pretty from 'pino-pretty';
import configs from '.';

const { node_env, log_level, is_logs_on_file } = configs;

const streams: StreamEntry<string>[] = [
  { stream: pretty({ colorize: node_env === 'development' }) },
];

// If is_logs_on_file is true, add file streams for error and fatal logs
if (is_logs_on_file) {
  const logDir = path.join(__dirname, '../../logs');

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
    level: node_env === 'test' ? 'silent' : log_level || 'info',
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  pino.multistream(streams),
);

export default logger;
