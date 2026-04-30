const { Router } = require('express');
const { getAll, getById, create, update, remove } = require('../controllers/visit.controller');
const { authorize } = require('../middlewares/roles');

const router = Router({ mergeParams: true });

// Nested under /api/animals/:id
router.get('/:id/visits', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.post('/:id/visits', authorize('ADMIN'), create);

// Direct by visit id under /api/visits/:id
router.get('/:id', authorize('ADMIN', 'COLLABORATOR'), getById);
router.put('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
