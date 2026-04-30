const { Router } = require('express');
const { getAnimalReport } = require('../controllers/report.controller');
const { authorize } = require('../middlewares/roles');

const router = Router({ mergeParams: true });

router.get('/:id/report', authorize('ADMIN', 'COLLABORATOR'), getAnimalReport);

module.exports = router;
