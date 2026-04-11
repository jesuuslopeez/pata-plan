const { Router } = require('express');
const { getAlerts } = require('../controllers/dashboard.controller');
const { authorize } = require('../middlewares/roles');

const router = Router();

router.get('/alerts', authorize('ADMIN', 'COLLABORATOR'), getAlerts);

module.exports = router;
