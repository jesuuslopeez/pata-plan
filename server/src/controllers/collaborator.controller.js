const collaboratorService = require('../services/collaborator.service');
const { ApiError } = require('../utils/ApiError');

const parseId = (raw, label) => {
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    throw new ApiError(400, `${label} no válido`);
  }
  return id;
};

const getInviteCode = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId, 'Grupo');
    const result = await collaboratorService.getInviteCode(req.user.id, groupId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const regenerateInviteCode = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId, 'Grupo');
    const result = await collaboratorService.regenerateInviteCode(req.user.id, groupId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const revokeInviteCode = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId, 'Grupo');
    await collaboratorService.revokeInviteCode(req.user.id, groupId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

const joinByCode = async (req, res, next) => {
  try {
    const result = await collaboratorService.joinByCode(req.user.id, req.body?.code);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listForGroup = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId, 'Grupo');
    const collaborators = await collaboratorService.listForGroup(req.user.id, groupId);
    res.json({ collaborators });
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId, 'Grupo');
    const membershipId = parseId(req.params.id, 'Colaboración');
    const collaborator = await collaboratorService.updateRole(
      req.user.id,
      groupId,
      membershipId,
      req.body?.role
    );
    res.json({ collaborator });
  } catch (err) {
    next(err);
  }
};

const removeFromGroup = async (req, res, next) => {
  try {
    const groupId = parseId(req.params.groupId, 'Grupo');
    const membershipId = parseId(req.params.id, 'Colaboración');
    await collaboratorService.removeFromGroup(req.user.id, groupId, membershipId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const membershipId = parseId(req.params.id, 'Colaboración');
    await collaboratorService.leaveGroup(req.user.id, membershipId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

const getMyMemberships = async (req, res, next) => {
  try {
    const memberships = await collaboratorService.getMyMemberships(req.user.id);
    res.json({ memberships });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInviteCode,
  regenerateInviteCode,
  revokeInviteCode,
  joinByCode,
  listForGroup,
  updateRole,
  removeFromGroup,
  leaveGroup,
  getMyMemberships,
};
