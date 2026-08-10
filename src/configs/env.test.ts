import { readFileSync } from "node:fs";
import path from "node:path";
import { envValidationSchema } from "./env";

const parseEnvFile = (contents: string): Record<string, string> => {
  const env: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) env[key] = value;
  }

  return env;
};

const validEnvironment = {
  APP_KEY: "test-app-key",
  BCRYPT_SALT_ROUNDS: "10",
  CLIENT_ORIGIN: "http://localhost:3000",
  DB_URI: "mongodb://127.0.0.1:27017/backend-template-test",
  JWT_ACCESS_SECRET: "test-jwt-access-secret",
};

describe("environment validation", () => {
  it("parses required values and applies typed defaults", () => {
    expect(envValidationSchema.parse(validEnvironment)).toMatchObject({
      ...validEnvironment,
      BCRYPT_SALT_ROUNDS: 10,
      JWT_ACCESS_EXPIRES_IN_MINUTES: 10080,
      NODE_ENV: "development",
      PORT: 8080,
      REDIS_CACHE_REVALIDATE_TIME_IN_SECONDS: 86400,
      REDIS_PORT: 6379,
    });
  });

  it("rejects incomplete or invalid environment values", () => {
    expect(
      envValidationSchema.safeParse({ ...validEnvironment, CLIENT_ORIGIN: "not-a-url" }).success,
    ).toBe(false);
    expect(envValidationSchema.safeParse({ ...validEnvironment, APP_KEY: "short" }).success).toBe(
      false,
    );
  });
});

describe("startup validation with the documented example", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("loads without exiting when process.env matches .env.example", async () => {
    const documentedExampleEnvironment = parseEnvFile(
      readFileSync(path.join(process.cwd(), ".env.example"), "utf8"),
    );
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    vi.resetModules();
    for (const [key, value] of Object.entries(documentedExampleEnvironment)) {
      vi.stubEnv(key, value);
    }

    const { default: env } = await import("./env");

    expect(exitSpy).not.toHaveBeenCalled();
    expect(env.DB_URI).toBe("mongodb://127.0.0.1:27017/backend-template");
    expect(env.JWT_ACCESS_EXPIRES_IN_MINUTES).toBe(10080);
  });
});
