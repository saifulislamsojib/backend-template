import { pino } from "pino";
import env from "./env";

const { NODE_ENV, LOG_LEVEL } = env;
const prettyOutput = NODE_ENV === "development" || NODE_ENV === "test";

const logger = pino({
  level: LOG_LEVEL,
  ...(prettyOutput && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
  redact: {
    paths: [
      "password",
      "email",
      "userEmail",
      "token",
      "accessToken",
      "refreshToken",
      "currentPassword",
      "newPassword",
      "*.password",
      "*.email",
      "*.userEmail",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "req.headers.authorization",
      "req.headers.cookie",
      "headers.authorization",
      "headers.cookie",
    ],
    censor: "[REDACTED]",
  },
  formatters: {
    level(level) {
      return { level };
    },
  },
});

export default logger;
