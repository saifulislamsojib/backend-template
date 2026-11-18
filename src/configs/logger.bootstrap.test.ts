import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  env: { NODE_ENV: "test", LOG_LEVEL: "info" },
  pino: vi.fn(),
}));

vi.mock("./env", () => ({ default: mocks.env }));
vi.mock("pino", () => ({ pino: mocks.pino }));

describe("logger bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it.each(["development", "test"])("uses pretty output in %s", async (nodeEnv) => {
    mocks.env.NODE_ENV = nodeEnv;

    await import("./logger");

    expect(mocks.pino).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        level: "info",
        transport: { target: "pino-pretty", options: { colorize: true } },
      }),
    );
  });

  it.each(["production", "staging"])("writes directly to stdout in %s", async (nodeEnv) => {
    mocks.env.NODE_ENV = nodeEnv;

    await import("./logger");

    expect(mocks.pino).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ level: "info" }));
    expect(mocks.pino.mock.calls[0]?.[0]).not.toHaveProperty("transport");
  });
});
