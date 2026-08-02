import env from '@/configs/env';
import type { DetectedUpload, StoredUpload, UploadStorage } from '@/modules/upload/upload.types';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const extensionsByContentType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

const createObjectKey = (contentType: string) => {
  const extension = extensionsByContentType[contentType];
  if (!extension) throw new Error(`Unsupported upload content type: ${contentType}`);
  return `${randomUUID()}${extension}`;
};

export class LocalUploadStorage implements UploadStorage {
  private readonly directory: string;

  constructor(directory: string) {
    this.directory = resolve(directory);
  }

  async put(upload: DetectedUpload): Promise<StoredUpload> {
    const key = createObjectKey(upload.contentType);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await mkdir(this.directory, { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await writeFile(join(this.directory, key), upload.buffer, { flag: 'wx' });
    return { key, contentType: upload.contentType, byteSize: upload.byteSize };
  }

  async delete(key: string): Promise<void> {
    const safeKey = basename(key);
    if (safeKey !== key || extname(safeKey) === '') {
      throw new Error('Invalid upload key');
    }
    await rm(join(this.directory, safeKey), { force: true });
  }
}

class S3UploadStorage implements UploadStorage {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor() {
    if (!env.UPLOAD_S3_BUCKET || !env.UPLOAD_S3_REGION) {
      throw new Error('UPLOAD_S3_BUCKET and UPLOAD_S3_REGION are required for S3 uploads');
    }
    this.bucket = env.UPLOAD_S3_BUCKET;
    const config: S3ClientConfig = {
      region: env.UPLOAD_S3_REGION,
      forcePathStyle: env.UPLOAD_S3_FORCE_PATH_STYLE,
      ...(env.UPLOAD_S3_ENDPOINT ? { endpoint: env.UPLOAD_S3_ENDPOINT } : {}),
      ...(env.UPLOAD_S3_ACCESS_KEY_ID && env.UPLOAD_S3_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: env.UPLOAD_S3_ACCESS_KEY_ID,
              secretAccessKey: env.UPLOAD_S3_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    };
    this.client = new S3Client(config);
  }

  async put(upload: DetectedUpload): Promise<StoredUpload> {
    const key = createObjectKey(upload.contentType);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: upload.buffer,
        ContentLength: upload.byteSize,
        ContentType: upload.contentType,
      }),
    );
    return { key, contentType: upload.contentType, byteSize: upload.byteSize };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

let storage: UploadStorage | undefined;

export const getUploadStorage = (): UploadStorage => {
  storage ??=
    env.UPLOAD_STORAGE_DRIVER === 's3'
      ? new S3UploadStorage()
      : new LocalUploadStorage(env.UPLOAD_LOCAL_DIRECTORY);
  return storage;
};

export const storeUpload = (upload: DetectedUpload, uploadStorage = getUploadStorage()) => {
  return uploadStorage.put(upload);
};
