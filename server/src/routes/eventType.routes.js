const { Router } = require('express');
const { getAll } = require('../controllers/eventType.controller');
const { authorize } = require('../middlewares/roles');

const router = Router();

router.get('/', authorize('ADMIN', 'COLLABORATOR'), getAll);

module.exports = router;
