const { Router } = require('express');
const { getAll, invite, remove } = require('../controllers/collaborator.controller');
const { authorize } = require('../middlewares/roles');
const { validate } = require('../middlewares/validate');

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inviteSchema = {
  email: { required: true, type: 'string', max: 255, pattern: EMAIL_REGEX },
};

router.get('/', authorize('ADMIN'), getAll);
router.post('/', authorize('ADMIN'), validate(inviteSchema), invite);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
