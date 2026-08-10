import fs from "node:fs";
import type { MockInstance } from "vitest";

const mocks = vi.hoisted(() => ({
  logger: { info: vi.fn() },
  destination: vi.fn(() => ({ write: vi.fn() })),
  multistream: vi.fn((streams: unknown[]) => streams),
  PinoPretty: vi.fn(() => ({ write: vi.fn() })),
}));

vi.mock("pino", () => ({
  destination: mocks.destination,
  multistream: mocks.multistream,
  pino: vi.fn(() => mocks.logger),
}));
vi.mock("pino-pretty", () => ({ PinoPretty: mocks.PinoPretty }));

const stubLoggerEnv = (overrides: { NODE_ENV: string; IS_LOGS_ON_FILE?: string }) => {
  vi.stubEnv("NODE_ENV", overrides.NODE_ENV);
  vi.stubEnv("IS_LOGS_ON_FILE", overrides.IS_LOGS_ON_FILE ?? "false");
  vi.stubEnv("LOG_LEVEL", "info");
  vi.stubEnv("DB_URI", "mongodb://127.0.0.1:27017/backend-template-test");
  vi.stubEnv("APP_KEY", "test-app-key");
  vi.stubEnv("JWT_ACCESS_SECRET", "test-jwt-access-secret");
  vi.stubEnv("CLIENT_ORIGIN", "http://localhost:3000");
  vi.stubEnv("BCRYPT_SALT_ROUNDS", "10");
};

describe("logger bootstrap", () => {
  let existsSyncSpy: MockInstance<typeof fs.existsSync> | undefined;
  let mkdirSyncSpy: MockInstance<typeof fs.mkdirSync> | undefined;

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
    existsSyncSpy = vi.spyOn(fs, "existsSync");
    mkdirSyncSpy = vi.spyOn(fs, "mkdirSync");
  });

  afterEach(() => {
    existsSyncSpy?.mockRestore();
    mkdirSyncSpy?.mockRestore();
    vi.unstubAllEnvs();
  });

  it("uses a pretty stream in development", async () => {
    stubLoggerEnv({ NODE_ENV: "development" });

    await import("./logger");

    expect(mocks.PinoPretty).toHaveBeenCalledWith({ colorize: true });

    const streams = mocks.multistream.mock.calls[0]?.[0];
    expect(streams).toHaveLength(1);
  });

  it("writes JSON to stdout in production when file logs are disabled", async () => {
    stubLoggerEnv({ NODE_ENV: "production" });

    await import("./logger");

    expect(mocks.PinoPretty).not.toHaveBeenCalled();
    expect(mocks.multistream).toHaveBeenCalledWith([
      expect.objectContaining({ stream: process.stdout }),
    ]);
  });

  it("adds error and fatal file streams when file logs are enabled", async () => {
    existsSyncSpy!.mockReturnValue(true);
    stubLoggerEnv({ NODE_ENV: "production", IS_LOGS_ON_FILE: "true" });

    await import("./logger");

    expect(existsSyncSpy).toHaveBeenCalled();
    expect(mkdirSyncSpy).not.toHaveBeenCalled();
    expect(mocks.destination).toHaveBeenCalledWith(expect.stringContaining("error-"));
    expect(mocks.destination).toHaveBeenCalledWith(expect.stringContaining("fatal-"));
    expect(mocks.multistream).toHaveBeenCalledWith([
      expect.objectContaining({ stream: process.stdout }),
      expect.objectContaining({ level: "error" }),
      expect.objectContaining({ level: "fatal" }),
    ]);
  });

  it("creates the logs directory when it does not exist", async () => {
    existsSyncSpy!.mockReturnValue(false);
    mkdirSyncSpy!.mockImplementation(() => undefined);
    stubLoggerEnv({ NODE_ENV: "production", IS_LOGS_ON_FILE: "true" });

    await import("./logger");

    expect(mkdirSyncSpy).toHaveBeenCalledWith(expect.stringContaining("logs"));
    expect(mocks.destination).toHaveBeenCalledTimes(2);
  });
});
