import AppError from "@/errors/AppError";
import catchAsync from "@/utils/catchAsync";
import { fileTypeFromBuffer } from "file-type";
import { status } from "http-status";
import multer from "multer";

export const TEXT_UPLOAD_MESSAGE = "Only plain text files are allowed";

const storage = multer.memoryStorage();

const memoryUploader = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // Cheap pre-gate only; the real content check happens in validateTextUpload.
    if (file.mimetype === "text/plain") {
      return cb(null, true); // Accept the file
    }
    return cb(new AppError(status.BAD_REQUEST, TEXT_UPLOAD_MESSAGE)); // Reject the file
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB size limit
});

/**
 * Verifies that an uploaded buffer is plain UTF-8 text: it must not carry a known
 * binary signature, must not contain NUL bytes (valid UTF-8, but a strong binary
 * marker), and must decode cleanly as UTF-8.
 */
export const validateTextUpload = catchAsync(async (req, _res, next) => {
  const { file } = req;
  if (!file) {
    throw new AppError(status.BAD_REQUEST, TEXT_UPLOAD_MESSAGE);
  }

  try {
    const { buffer } = file;
    if (buffer.includes(0) || (await fileTypeFromBuffer(buffer)) !== undefined) {
      throw new AppError(status.BAD_REQUEST, TEXT_UPLOAD_MESSAGE);
    }
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    next();
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(status.BAD_REQUEST, TEXT_UPLOAD_MESSAGE);
  }
});

export default memoryUploader;
