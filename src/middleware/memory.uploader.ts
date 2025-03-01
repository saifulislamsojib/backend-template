import multer from 'multer';

const storage = multer.memoryStorage();

const memoryUploader = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // Allow text files
    if (file.mimetype === 'text/plain') {
      return cb(null, true); // Accept the file
    }
    return cb(new Error('Only plain text files are allowed')); // Reject the file
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB size limit
});

export default memoryUploader;
