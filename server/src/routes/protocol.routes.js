const { Router } = require('express');
const { getAll, getById, create, update, remove } = require('../controllers/protocol.controller');
const { authorize } = require('../middlewares/roles');

const router = Router();

router.get('/', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.get('/:id', authorize('ADMIN', 'COLLABORATOR'), getById);
router.post('/', authorize('ADMIN'), create);
router.put('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
