const { Router } = require('express');
const { getAll, create, update, complete, remove } = require('../controllers/event.controller');
const { authorize } = require('../middlewares/roles');

const router = Router({ mergeParams: true });

// Nested under /api/animals/:id
router.get('/:id/events', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.post('/:id/events', authorize('ADMIN', 'COLLABORATOR'), create);

// Direct by event id under /api/events/:id
router.put('/:id', authorize('ADMIN'), update);
router.patch('/:id/complete', authorize('ADMIN', 'COLLABORATOR'), complete);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
