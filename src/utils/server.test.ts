import type { MockInstance } from "vitest";
import server, { closeServer } from "./server";

const { quit, disconnect } = vi.hoisted(() => ({
  quit: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app", () => ({ default: () => undefined }));
vi.mock("@/configs/db", () => ({ dbConnect: vi.fn(), dbDisconnect: disconnect }));
vi.mock("@/configs/redis", () => ({ default: { quit } }));

describe("closeServer", () => {
  let exitSpy: MockInstance<typeof process.exit>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  afterEach(async () => {
    exitSpy.mockRestore();
    vi.clearAllMocks();
    if (server.listening) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it("quits Redis, disconnects the database, and exits when the server is not listening", async () => {
    expect(server.listening).toBe(false);

    closeServer(0);

    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0));
    expect(quit).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("closes an already-listening server before disconnecting", async () => {
    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });
    expect(server.listening).toBe(true);

    closeServer(1);

    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(1));
    expect(quit).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(server.listening).toBe(false);
  });
});
