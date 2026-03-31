const { Router } = require('express');
const { getAll, create } = require('../controllers/weight.controller');
const { authorize } = require('../middlewares/roles');

const router = Router({ mergeParams: true });

router.get('/:id/weights', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.post('/:id/weights', authorize('ADMIN'), create);

module.exports = router;
