import AppError from '@/errors/AppError.js';
import status from 'http-status';
import multer from 'multer';

const uploader = multer({
  dest: 'uploads/',
  fileFilter: (_req, file, cb) => {
    // Allow image files
    if (/jpeg|jpg|png/.test(file.mimetype)) {
      return cb(null, true); // Accept the file
    }
    return cb(new AppError(status.BAD_REQUEST, 'Only jpeg, jpg, and png files are allowed')); // Reject the file
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB size limit
});

export default uploader;
