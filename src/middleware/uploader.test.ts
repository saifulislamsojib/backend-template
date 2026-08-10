import express from "express";
import { status } from "http-status";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import supertest from "supertest";
import globalErrorHandler from "./globalErrorhandler";
import uploader, { UPLOADS_DIR, validateImageUpload } from "./uploader";

const { env, logger } = vi.hoisted(() => ({
  env: Object.freeze({ NODE_ENV: "test" }),
  logger: { error: vi.fn(), fatal: vi.fn() },
}));

vi.mock("@/configs/env", () => ({ default: env }));
vi.mock("@/configs/logger", () => ({ default: logger }));

const app = express();

app.post("/upload", uploader.single("file"), validateImageUpload, (req, res) => {
  res.status(status.OK).json({ filename: req.file?.filename, path: req.file?.path });
});
app.use(globalErrorHandler);

/** Reads the uploads directory, returning [] when it has not been created yet. */
const listUploads = async () => {
  // UPLOADS_DIR is a fixed module-level path, never user-controlled.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!existsSync(UPLOADS_DIR)) return [];
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return readdir(UPLOADS_DIR);
};

/** A minimal valid 1x1 PNG (magic bytes: 89 50 4E 47 0D 0A 1A 0A). */
const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe("uploader", () => {
  afterEach(() => {
    vi.clearAllMocks();
    rmSync(UPLOADS_DIR, { recursive: true, force: true });
  });

  it("rejects unsupported file types with the standard validation error envelope", async () => {
    const res = await supertest(app).post("/upload").attach("file", Buffer.from("not an image"), {
      contentType: "text/plain",
      filename: "note.txt",
    });

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toStrictEqual({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Only jpeg, jpg, and png files are allowed",
      type: "appError",
    });
  });

  it("stores a verified PNG with a controlled filename and ignores the client filename", async () => {
    const res = await supertest(app).post("/upload").attach("file", PNG_BUFFER, {
      contentType: "image/png",
      filename: "../../evil.png",
    });

    expect(res.status).toBe(status.OK);
    const { filename, path: storedPath } = res.body as { filename: string; path: string };
    expect(filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(storedPath).toBe(path.join(UPLOADS_DIR, filename));
    // The stored file matches the upload byte-for-byte.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(readFileSync(storedPath).equals(PNG_BUFFER)).toBe(true);
  });

  it("maps an oversize upload to a stable 413 and leaves no file behind", async () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1);

    const res = await supertest(app).post("/upload").attach("file", oversized, {
      contentType: "image/png",
      filename: "big.png",
    });

    expect(res.status).toBe(status.REQUEST_ENTITY_TOO_LARGE);
    expect(res.body).toStrictEqual({
      success: false,
      statusCode: status.REQUEST_ENTITY_TOO_LARGE,
      message: "File too large",
      type: "fileTooLarge",
    });
    expect(logger.fatal).not.toHaveBeenCalled();
    expect(await listUploads()).toStrictEqual([]);
  });

  it("rejects a spoofed image mimetype whose content is not an image", async () => {
    const res = await supertest(app).post("/upload").attach("file", Buffer.from("not really png"), {
      contentType: "image/png",
      filename: "fake.png",
    });

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toStrictEqual({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Only jpeg, jpg, and png files are allowed",
      type: "appError",
    });
    // The rejected file is cleaned up rather than left on disk.
    expect(await listUploads()).toStrictEqual([]);
  });

  it("rejects uploads with no file attached", async () => {
    const res = await supertest(app).post("/upload");

    expect(res.status).toBe(status.BAD_REQUEST);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Only jpeg, jpg, and png files are allowed",
    });
  });
});
