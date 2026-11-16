import express, { type Request, type Response } from "express";
import request from "supertest";
import { z } from "zod";
import validateRequest from "./validateRequest";

describe("validateRequest middleware", () => {
  const res = {} as Response;
  const schema = z.object({ name: z.string(), age: z.number() });

  it("parses the request body and calls next when valid", async () => {
    const req = { body: { name: "John", age: 30 } } as Request;
    const next = vi.fn();

    await validateRequest(schema)(req as never, res as never, next);

    expect(req.body).toStrictEqual({ name: "John", age: 30 });
    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it("forwards validation errors to next", async () => {
    const req = { body: { name: "John" } } as Request;
    const next = vi.fn();

    await validateRequest(schema)(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(z.ZodError);
  });

  it("parses request params when target is 'params'", async () => {
    const req = { params: { id: "42" } } as unknown as Request;
    const next = vi.fn();

    await validateRequest(z.object({ id: z.string() }), "params")(req as never, res as never, next);

    expect(req.params).toStrictEqual({ id: "42" });
    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  const buildQueryApp = () => {
    const app = express();
    app.get(
      "/items",
      validateRequest(z.object({ page: z.coerce.number() }), "query"),
      (handlerReq, handlerRes) => {
        handlerRes.json({ query: handlerReq.query });
      },
    );
    return app;
  };

  it("exposes the validated query to later handlers when target is 'query'", async () => {
    const response = await request(buildQueryApp()).get("/items?page=2");

    // Express 5 re-parses `req.query` on each access, so the validated value
    // must survive a fresh read in the downstream handler.
    expect(response.body).toStrictEqual({ query: { page: 2 } });
  });

  it("strips unknown query keys the schema does not define", async () => {
    const response = await request(buildQueryApp()).get("/items?page=2&role=admin");

    expect(response.body).toStrictEqual({ query: { page: 2 } });
  });
});
