const { Router } = require('express');
const { getAll, create, update, remove } = require('../controllers/group.controller');
const { authorize } = require('../middlewares/roles');
const { validate } = require('../middlewares/validate');

const router = Router();

const nameSchema = {
  name: { required: true, type: 'string', min: 1, max: 100 },
};

router.get('/', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.post('/', authorize('ADMIN'), validate(nameSchema), create);
router.put('/:id', authorize('ADMIN'), validate(nameSchema), update);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
