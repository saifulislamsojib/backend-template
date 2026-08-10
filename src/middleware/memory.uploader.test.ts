import express from "express";
import { status } from "http-status";
import supertest from "supertest";
import globalErrorHandler from "./globalErrorhandler";
import memoryUploader, { validateTextUpload } from "./memory.uploader";

const { env, logger } = vi.hoisted(() => ({
  env: Object.freeze({ NODE_ENV: "test" }),
  logger: { error: vi.fn(), fatal: vi.fn() },
}));

vi.mock("@/configs/env", () => ({ default: env }));
vi.mock("@/configs/logger", () => ({ default: logger }));

const app = express();

app.post("/upload", memoryUploader.single("file"), validateTextUpload, (req, res) => {
  res.status(status.OK).json({ contents: req.file?.buffer.toString() });
});
app.use(globalErrorHandler);

describe("memoryUploader", () => {
  it("keeps accepted text uploads in memory", async () => {
    const res = await supertest(app).post("/upload").attach("file", Buffer.from("hello"), {
      contentType: "text/plain",
      filename: "note.txt",
    });

    expect(res.status).toBe(status.OK);
    expect(res.body).toStrictEqual({ contents: "hello" });
  });

  it("rejects non-text uploads with the standard error envelope", async () => {
    const res = await supertest(app).post("/upload").attach("file", Buffer.from("image"), {
      contentType: "image/png",
      filename: "image.png",
    });

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: status.BAD_REQUEST,
      type: "appError",
    });
  });

  it("rejects a text/plain upload that carries a known binary signature", async () => {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const res = await supertest(app)
      .post("/upload")
      .attach("file", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), {
        contentType: "text/plain",
        filename: "note.txt",
      });

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Only plain text files are allowed",
      type: "appError",
    });
  });

  it("rejects a text/plain upload containing a NUL byte", async () => {
    const res = await supertest(app)
      .post("/upload")
      .attach("file", Buffer.from([0x68, 0x69, 0x00, 0x21]), {
        contentType: "text/plain",
        filename: "note.txt",
      });

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Only plain text files are allowed",
      type: "appError",
    });
  });

  it("rejects a text/plain upload that is not valid UTF-8", async () => {
    const res = await supertest(app)
      .post("/upload")
      .attach("file", Buffer.from([0x80, 0x80]), {
        contentType: "text/plain",
        filename: "note.txt",
      });

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Only plain text files are allowed",
      type: "appError",
    });
  });

  it("rejects uploads with no file attached", async () => {
    const res = await supertest(app).post("/upload");

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Only plain text files are allowed",
    });
  });
});
