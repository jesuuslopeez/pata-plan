const { Router } = require('express');
const { getAll, getStats, create, update, remove } = require('../controllers/expense.controller');
const { authorize } = require('../middlewares/roles');

const router = Router();

router.get('/', authorize('ADMIN'), getAll);
router.get('/stats', authorize('ADMIN'), getStats);
router.post('/', authorize('ADMIN'), create);
router.put('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
