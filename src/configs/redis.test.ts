const mocks = vi.hoisted(() => ({
  env: { NODE_ENV: "test", REDIS_HOST: "localhost", REDIS_PORT: 6379 },
  on: vi.fn(),
  connect: vi.fn(),
  logger: { warn: vi.fn(), info: vi.fn() },
  createClient: vi.fn(),
}));

vi.mock("redis", () => ({ createClient: mocks.createClient }));
vi.mock("@/configs/logger", () => ({ default: mocks.logger }));
vi.mock("@/configs/env", () => ({ default: mocks.env }));

const mockClient = () => ({ on: mocks.on, connect: mocks.connect });

describe("Redis client bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mocks.createClient.mockImplementation(() => mockClient());
  });

  const getHandler = (event: string) => {
    const call = mocks.on.mock.calls.find(([name]) => name === event);
    return call?.[1] as ((...args: unknown[]) => void) | undefined;
  };

  it("registers error and connect handlers and skips connecting in the test environment", async () => {
    mocks.env.NODE_ENV = "test";

    await import("./redis");

    expect(mocks.createClient).toHaveBeenCalledWith({
      socket: { host: "localhost", port: 6379 },
    });
    expect(mocks.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mocks.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("warns when the client emits an error event", async () => {
    mocks.env.NODE_ENV = "test";

    await import("./redis");

    const errorHandler = getHandler("error");
    expect(errorHandler).toBeDefined();
    errorHandler?.({ message: "connect ECONNREFUSED" });

    expect(mocks.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ message: "connect ECONNREFUSED" }),
      "Redis client connection error",
    );
  });

  it("logs when the client connects", async () => {
    mocks.env.NODE_ENV = "test";

    await import("./redis");

    const connectHandler = getHandler("connect");
    expect(connectHandler).toBeDefined();
    connectHandler?.();

    expect(mocks.logger.info).toHaveBeenCalledWith("Redis Client successfully connected!");
  });

  it("connects eagerly outside the test environment", async () => {
    mocks.env.NODE_ENV = "production";

    await import("./redis");

    expect(mocks.connect).toHaveBeenCalled();
  });
});

export {};
