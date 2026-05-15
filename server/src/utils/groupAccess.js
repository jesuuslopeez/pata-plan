const prisma = require('./prisma');
const { ApiError } = require('./ApiError');

const getOwnedGroupIds = async (userId) => {
  const groups = await prisma.group.findMany({
    where: { userId },
    select: { id: true },
  });
  return groups.map((g) => g.id);
};

const getCollaboratingGroupIds = async (userId) => {
  const memberships = await prisma.groupCollaborator.findMany({
    where: { userId },
    select: { groupId: true },
  });
  return memberships.map((m) => m.groupId);
};

const getEditorGroupIds = async (userId) => {
  const memberships = await prisma.groupCollaborator.findMany({
    where: { userId, role: 'EDITOR' },
    select: { groupId: true },
  });
  return memberships.map((m) => m.groupId);
};

const getAccessibleGroupIds = async (userId) => {
  const [owned, collaborating] = await Promise.all([
    getOwnedGroupIds(userId),
    getCollaboratingGroupIds(userId),
  ]);
  return [...new Set([...owned, ...collaborating])];
};

const getEditableGroupIds = async (userId) => {
  const [owned, editor] = await Promise.all([
    getOwnedGroupIds(userId),
    getEditorGroupIds(userId),
  ]);
  return [...new Set([...owned, ...editor])];
};

const assertGroupAccess = async (userId, groupId) => {
  const ids = await getAccessibleGroupIds(userId);
  if (!ids.includes(groupId)) {
    throw new ApiError(404, 'Grupo no encontrado');
  }
};

const assertGroupOwnership = async (userId, groupId) => {
  const group = await prisma.group.findFirst({
    where: { id: groupId, userId },
    select: { id: true },
  });
  if (!group) {
    throw new ApiError(404, 'Grupo no encontrado');
  }
};

const assertCanEditGroup = async (userId, groupId) => {
  const ids = await getEditableGroupIds(userId);
  if (!ids.includes(groupId)) {
    throw new ApiError(403, 'No tienes permiso de edición sobre este grupo');
  }
};

module.exports = {
  getOwnedGroupIds,
  getCollaboratingGroupIds,
  getEditorGroupIds,
  getAccessibleGroupIds,
  getEditableGroupIds,
  assertGroupAccess,
  assertGroupOwnership,
  assertCanEditGroup,
};
