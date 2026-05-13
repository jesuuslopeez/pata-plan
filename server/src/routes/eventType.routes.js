const { Router } = require('express');
const { getAll, create } = require('../controllers/eventType.controller');
const { authorize } = require('../middlewares/roles');

const router = Router();

router.get('/', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.post('/', authorize('ADMIN'), create);

module.exports = router;
