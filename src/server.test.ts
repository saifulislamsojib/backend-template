const mocks = vi.hoisted(() => ({
  dbConnect: vi.fn(),
  listen: vi.fn((_port: number, onListening: () => void) => onListening()),
  closeServer: vi.fn(),
  logger: { info: vi.fn(), fatal: vi.fn() },
}));

vi.mock("@/configs/db", () => ({
  dbConnect: mocks.dbConnect,
  dbDisconnect: vi.fn(),
}));
vi.mock("@/configs/logger", () => ({ default: mocks.logger }));
vi.mock("@/utils/server", () => ({
  default: { listen: mocks.listen },
  closeServer: mocks.closeServer,
}));

describe("server bootstrap", () => {
  beforeAll(async () => {
    mocks.dbConnect.mockResolvedValue(false);
    await import("./server");
  });

  beforeEach(() => {
    mocks.closeServer.mockClear();
    mocks.listen.mockClear();
    mocks.logger.info.mockClear();
    mocks.logger.fatal.mockClear();
  });

  it("attempts a database connection on startup", () => {
    expect(mocks.dbConnect).toHaveBeenCalled();
  });

  it("does not start listening when the database connection fails", () => {
    expect(mocks.listen).not.toHaveBeenCalled();
  });

  it("shuts down with exit code 1 on unhandledRejection", () => {
    process.emit("unhandledRejection", new Error("boom"), Promise.resolve());

    expect(mocks.logger.fatal).toHaveBeenCalled();
    expect(mocks.closeServer).toHaveBeenCalledWith(1);
  });

  it("shuts down with exit code 1 on uncaughtException", () => {
    process.emit("uncaughtException", new Error("boom"));

    expect(mocks.closeServer).toHaveBeenCalledWith(1);
  });

  it("shuts down gracefully on SIGINT", () => {
    process.emit("SIGINT");

    expect(mocks.closeServer).toHaveBeenCalledWith(0);
  });

  it("shuts down gracefully on SIGTERM", () => {
    process.emit("SIGTERM");

    expect(mocks.closeServer).toHaveBeenCalledWith(0);
  });

  it("starts listening when the database connects", async () => {
    mocks.dbConnect.mockResolvedValue(true);
    vi.resetModules();
    await import("./server");

    await vi.waitFor(() => expect(mocks.listen).toHaveBeenCalled());
    expect(mocks.listen).toHaveBeenCalledWith(expect.any(Number), expect.any(Function));
    expect(mocks.logger.info).toHaveBeenCalled();
  });

  it("exits when the database connection rejects", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    mocks.dbConnect.mockRejectedValue(new Error("connection failed"));
    vi.resetModules();
    await import("./server");

    await vi.waitFor(() => expect(mocks.logger.fatal).toHaveBeenCalled());
    expect(mocks.logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({ errorMsg: "connection failed" }),
      "Server connection error",
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});

export {};
