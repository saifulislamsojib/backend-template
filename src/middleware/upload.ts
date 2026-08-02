import env from '@/configs/env';
import AppError from '@/errors/AppError';
import type { DetectedUpload } from '@/modules/upload/upload.types';
import type { RequestHandler } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import { status } from 'http-status';
import multer from 'multer';

type ImageContentType = 'image/jpeg' | 'image/png';

export type UploadOptions = {
  acceptedContentTypes: readonly ImageContentType[];
  maxFileSizeBytes?: number;
  required?: boolean;
};

const inspectUpload = async (
  file: Express.Multer.File | undefined,
  options: UploadOptions,
): Promise<DetectedUpload | undefined> => {
  if (!file) {
    if (options.required) throw new AppError(status.BAD_REQUEST, 'A file is required');
    return undefined;
  }

  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !options.acceptedContentTypes.includes(detected.mime as ImageContentType)) {
    throw new AppError(status.BAD_REQUEST, 'Uploaded file content is not allowed');
  }
  if (file.mimetype !== detected.mime) {
    throw new AppError(status.BAD_REQUEST, 'Uploaded file type does not match its content');
  }

  return {
    buffer: file.buffer,
    byteSize: file.size,
    contentType: detected.mime,
    originalName: file.originalname,
  };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      upload?: DetectedUpload;
    }
  }
}

export const createSingleUpload = (fieldName: string, options: UploadOptions): RequestHandler => {
  const parser = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: options.maxFileSizeBytes ?? env.UPLOAD_MAX_FILE_SIZE_BYTES, files: 1 },
  }).single(fieldName);

  return (req, res, next) => {
    parser(req, res, (parserError) => {
      if (parserError) return next(parserError);
      void inspectUpload(req.file, options)
        .then((upload) => {
          if (upload) req.upload = upload;
          next();
        })
        .catch(next);
    });
  };
};

export const imageUpload = (fieldName = 'image'): RequestHandler => {
  return createSingleUpload(fieldName, {
    acceptedContentTypes: ['image/jpeg', 'image/png'],
    required: true,
  });
};
