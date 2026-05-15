const { Router } = require('express');
const {
  getInviteCode,
  regenerateInviteCode,
  revokeInviteCode,
  joinByCode,
  listForGroup,
  updateRole,
  removeFromGroup,
  leaveGroup,
  getMyMemberships,
} = require('../controllers/collaborator.controller');

const router = Router();

router.get('/me/memberships', getMyMemberships);
router.delete('/me/memberships/:id', leaveGroup);
router.post('/join', joinByCode);

router.get('/groups/:groupId/invite-code', getInviteCode);
router.post('/groups/:groupId/invite-code', regenerateInviteCode);
router.delete('/groups/:groupId/invite-code', revokeInviteCode);

router.get('/groups/:groupId/collaborators', listForGroup);
router.patch('/groups/:groupId/collaborators/:id', updateRole);
router.delete('/groups/:groupId/collaborators/:id', removeFromGroup);

module.exports = router;
