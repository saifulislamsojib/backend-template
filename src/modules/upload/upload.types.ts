export type DetectedUpload = {
  buffer: Buffer;
  byteSize: number;
  contentType: string;
  originalName: string;
};

export type StoredUpload = {
  byteSize: number;
  contentType: string;
  key: string;
};

export type UploadStorage = {
  delete: (key: string) => Promise<void>;
  put: (upload: DetectedUpload) => Promise<StoredUpload>;
};
