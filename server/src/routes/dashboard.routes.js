const { Router } = require('express');
const { getSummary, getAlerts, getUpcoming } = require('../controllers/dashboard.controller');
const { authorize } = require('../middlewares/roles');

const router = Router();

router.get('/', authorize('ADMIN', 'COLLABORATOR'), getSummary);
router.get('/alerts', authorize('ADMIN', 'COLLABORATOR'), getAlerts);
router.get('/upcoming', authorize('ADMIN', 'COLLABORATOR'), getUpcoming);

module.exports = router;
