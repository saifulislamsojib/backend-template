import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { vi } from "vitest";

vi.mock("./env", () => ({
  default: { NODE_ENV: "production", LOG_LEVEL: "warn" },
}));

describe("logger output", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(["development", "test"])("starts the pretty transport worker in %s", async (nodeEnv) => {
    const { stdout, stderr } = await promisify(execFile)(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "--eval",
        'import logger from "./src/configs/logger.ts"; logger.info({ password: "worker-secret" }, "pretty worker ready");',
      ],
      { env: { ...process.env, NODE_ENV: nodeEnv, LOG_LEVEL: "info" }, timeout: 10000 },
    );

    expect(stderr).toBe("");
    expect(stdout).toContain("pretty worker ready");
    expect(stdout).toContain("[REDACTED]");
    expect(stdout).not.toContain("worker-secret");
    expect(stdout).toContain("\u001b[");
  });

  it("writes JSON to stdout and respects the configured level", async () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const { default: logger } = await import("./logger");

    logger.info("filtered message");
    logger.warn({ requestId: "request-123" }, "visible message");

    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(write.mock.calls[0]?.[0]))).toMatchObject({
      level: "warn",
      requestId: "request-123",
      msg: "visible message",
    });
  });

  it("redacts credentials while preserving useful log fields", async () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const { default: logger } = await import("./logger");
    const credentials = {
      password: "secret-password",
      email: "secret@example.com",
      userEmail: "secret-user@example.com",
      token: "secret-token",
      accessToken: "secret-access-token",
      refreshToken: "secret-refresh-token",
    };
    const redactedCredentials = Object.fromEntries(
      Object.keys(credentials).map((key) => [key, "[REDACTED]"]),
    );

    logger.error(
      {
        ...credentials,
        currentPassword: "secret-current-password",
        newPassword: "secret-new-password",
        user: credentials,
        req: { headers: { authorization: "Bearer secret", cookie: "session=secret" } },
        headers: { authorization: "Bearer secret", cookie: "session=secret" },
        requestId: "request-123",
      },
      "Request failed",
    );

    expect(write).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(write.mock.calls[0]?.[0]))).toMatchObject({
      ...redactedCredentials,
      currentPassword: "[REDACTED]",
      newPassword: "[REDACTED]",
      user: redactedCredentials,
      req: { headers: { authorization: "[REDACTED]", cookie: "[REDACTED]" } },
      headers: { authorization: "[REDACTED]", cookie: "[REDACTED]" },
      requestId: "request-123",
      level: "error",
      msg: "Request failed",
    });
  });
});
