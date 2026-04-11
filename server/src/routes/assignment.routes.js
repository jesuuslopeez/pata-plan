const { Router } = require('express');
const { assignProtocol, getAssignments, cancelAssignment } = require('../controllers/assignment.controller');
const { authorize } = require('../middlewares/roles');

const router = Router({ mergeParams: true });

// Nested under /api/animals/:id
router.post('/:id/assign-protocol', authorize('ADMIN'), assignProtocol);
router.get('/:id/assignments', authorize('ADMIN', 'COLLABORATOR'), getAssignments);

// Direct under /api/assignments/:id
router.patch('/:id/cancel', authorize('ADMIN'), cancelAssignment);

module.exports = router;
