const { Router } = require('express');
const {
  getAll, getById, create, update, remove,
  addStep, updateStep, removeStep, reorderSteps,
} = require('../controllers/protocol.controller');
const { authorize } = require('../middlewares/roles');

const router = Router();

router.get('/', authorize('ADMIN', 'COLLABORATOR'), getAll);
router.get('/:id', authorize('ADMIN', 'COLLABORATOR'), getById);
router.post('/', authorize('ADMIN'), create);
router.put('/:id', authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);

// Steps
router.post('/:id/steps', authorize('ADMIN'), addStep);
router.put('/:id/steps/reorder', authorize('ADMIN'), reorderSteps);
router.put('/:protocolId/steps/:stepId', authorize('ADMIN'), updateStep);
router.delete('/:protocolId/steps/:stepId', authorize('ADMIN'), removeStep);

module.exports = router;
