const { Router } = require('express');
const { getAll, create, update, remove } = require('../controllers/weight.controller');
const { authorize } = require('../middlewares/roles');

const router = Router({ mergeParams: true });

// Nested under /api/animals/:id
router.get('/:id/weights', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.post('/:id/weights', authorize('ADMIN'), create);

// Direct by weight id under /api/weights/:id
router.put('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
