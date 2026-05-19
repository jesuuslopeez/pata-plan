const { Router } = require('express');
const {
  getAll,
  create,
  createMany,
  update,
  remove,
} = require('../controllers/document.controller');
const { authorize } = require('../middlewares/roles');
const { uploadDocument, uploadDocuments, handleUploadErrors } = require('../middlewares/upload');

const router = Router({ mergeParams: true });

// Nested under /api/animals/:id
router.get('/:id/documents', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.post('/:id/documents', authorize('ADMIN'), handleUploadErrors(uploadDocument), create);
router.post(
  '/:id/documents/bulk',
  authorize('ADMIN'),
  handleUploadErrors(uploadDocuments),
  createMany
);

// Direct by document id under /api/documents/:id
router.patch('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
