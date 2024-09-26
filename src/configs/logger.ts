import pino from 'pino';
import configs from '.';

const { node_env, log_level } = configs;

// TODO: logs save in file for error and fatal separately, file name by dates
const logger = pino({
  level: node_env === 'test' ? 'silent' : log_level || 'info',
  transport:
    node_env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

export default logger;
