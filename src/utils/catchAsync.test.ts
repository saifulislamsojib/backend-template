import PersistenceError from "@/errors/PersistenceError";
import type { Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import catchAsync from "./catchAsync";

describe("catchAsync", () => {
  const req = {} as Request;
  const res = {} as Response;

  it("passes the request context to a successful handler without forwarding an error", async () => {
    const next = vi.fn();
    const handler = vi.fn().mockResolvedValue(undefined);
    await catchAsync(handler)(req as never, res, next);
    expect(handler).toHaveBeenCalledExactlyOnceWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("translates rejected database errors before forwarding them", async () => {
    const next = vi.fn();
    const handler = catchAsync(() =>
      Promise.reject(new MongooseError.CastError("ObjectId", "invalid", "_id")),
    );

    await handler(req as never, res, next);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(PersistenceError));
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      kind: "castError",
      message: '"invalid" is not a valid ID!',
    });
  });

  it.each(["throw", "reject"])("preserves unknown errors by identity (%s)", async (mode) => {
    const error = new Error("database unavailable");
    const next = vi.fn();
    const handler = catchAsync(() => {
      if (mode === "throw") throw error;
      return Promise.reject(error);
    });

    await handler(req as never, res, next);

    expect(next).toHaveBeenCalledExactlyOnceWith(error);
    expect(next.mock.calls[0]?.[0]).toBe(error);
  });
});
