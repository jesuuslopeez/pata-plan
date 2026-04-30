const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ApiError } = require('../utils/ApiError');

const ANIMALS_DIR = path.join(__dirname, '../../uploads/animals');
const DOCUMENTS_DIR = path.join(__dirname, '../../uploads/documents');

for (const dir of [ANIMALS_DIR, DOCUMENTS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_BULK_FILES = 5;

const buildStorage = (dir) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, name);
    },
  });

const buildFileFilter = (allowedTypes, rejectMessage) => (_req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, rejectMessage), false);
  }
};

const uploadAnimalPhoto = multer({
  storage: buildStorage(ANIMALS_DIR),
  fileFilter: buildFileFilter(IMAGE_TYPES, 'Only jpeg, jpg, png, and webp images are allowed'),
  limits: { fileSize: MAX_SIZE },
}).single('photo');

const documentUploader = multer({
  storage: buildStorage(DOCUMENTS_DIR),
  fileFilter: buildFileFilter(
    DOCUMENT_TYPES,
    'Only images (JPEG, PNG, WebP) and PDFs are accepted'
  ),
  limits: { fileSize: MAX_SIZE },
});

const uploadDocument = documentUploader.single('file');
const uploadDocuments = documentUploader.array('files', MAX_BULK_FILES);

const handleUploadErrors = (mw) => (req, res, next) => {
  mw(req, res, (err) => {
    if (!err) {
      return next();
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File size exceeds 10MB limit'));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new ApiError(400, 'Unexpected file field'));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new ApiError(400, `A maximum of ${MAX_BULK_FILES} files is allowed`));
      }
      return next(new ApiError(400, err.message));
    }
    if (err instanceof ApiError) {
      return next(err);
    }
    return next(new ApiError(400, err.message || 'Upload failed'));
  });
};

module.exports = {
  uploadAnimalPhoto,
  uploadDocument,
  uploadDocuments,
  handleUploadErrors,
};
