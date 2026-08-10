import AppError from "@/errors/AppError";
import catchAsync from "@/utils/catchAsync";
import { fileTypeFromFile } from "file-type";
import { status } from "http-status";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { rename, unlink } from "node:fs/promises";
import path from "node:path";
import multer from "multer";

/** Absolute directory where accepted image uploads are stored. */
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export const IMAGE_UPLOAD_MESSAGE = "Only jpeg, jpg, and png files are allowed";

const uploader = multer({
  storage: multer.diskStorage({
    // A per-request callback keeps the directory self-healing; a plain string
    // `destination` only creates the directory once at import time.
    destination: (_req, _file, cb) => {
      // Multer calls this synchronously, so the directory must be ensured
      // synchronously too; recursive mkdir is a no-op once it exists.
      mkdirSync(UPLOADS_DIR, { recursive: true });
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, _file, cb) => cb(null, randomUUID()),
  }),
  fileFilter: (_req, file, cb) => {
    // Cheap pre-gate only; the real content check happens in validateImageUpload.
    if (/jpeg|jpg|png/.test(file.mimetype)) {
      return cb(null, true); // Accept the file
    }
    return cb(new AppError(status.BAD_REQUEST, IMAGE_UPLOAD_MESSAGE)); // Reject the file
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB size limit
});

const removeUploadedFile = (filePath: string) =>
  // `file.path` is a fixed multer-controlled absolute path, never user input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  unlink(filePath).catch(() => undefined);

/**
 * Verifies that an uploaded file is a real JPEG/PNG via magic bytes (the client
 * mimetype is spoofable) and renames it to `<uuid>.<ext>` before it is consumed.
 * Rejected files are removed so no orphaned bytes stay on disk.
 */
export const validateImageUpload = catchAsync(async (req, _res, next) => {
  const { file } = req;
  if (!file) {
    throw new AppError(status.BAD_REQUEST, IMAGE_UPLOAD_MESSAGE);
  }

  try {
    const detected = await fileTypeFromFile(file.path);
    if (
      detected === undefined ||
      (detected.mime !== "image/jpeg" && detected.mime !== "image/png")
    ) {
      throw new AppError(status.BAD_REQUEST, IMAGE_UPLOAD_MESSAGE);
    }

    const finalPath = `${file.path}.${detected.ext}`;
    // `file.path` is a fixed multer-controlled absolute path, never user input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await rename(file.path, finalPath);
    file.path = finalPath;
    file.filename = `${file.filename}.${detected.ext}`;
    next();
  } catch (err) {
    // Multer self-cleans files when its own middleware fails (e.g. LIMIT_FILE_SIZE),
    // so only validator-stage failures need manual cleanup here.
    await removeUploadedFile(file.path);
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(status.BAD_REQUEST, IMAGE_UPLOAD_MESSAGE);
  }
});

export default uploader;
