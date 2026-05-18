const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');
const { assertGroupOwnership } = require('../utils/groupAccess');

const COLLABORATOR_USER_SELECT = {
  id: true,
  name: true,
  email: true,
};

const VALID_ROLES = ['VIEWER', 'EDITOR'];

const generateCode = () => crypto.randomBytes(5).toString('base64url').toUpperCase();

const generateUniqueCode = async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode();
    const collision = await prisma.group.findUnique({
      where: { inviteCode: candidate },
      select: { id: true },
    });
    if (!collision) {
      return candidate;
    }
  }
  throw new ApiError(500, 'No se ha podido generar un código único');
};

const getInviteCode = async (userId, groupId) => {
  await assertGroupOwnership(userId, groupId);
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { inviteCode: true },
  });
  return { inviteCode: group?.inviteCode || null };
};

const regenerateInviteCode = async (userId, groupId) => {
  await assertGroupOwnership(userId, groupId);
  const code = await generateUniqueCode();
  const group = await prisma.group.update({
    where: { id: groupId },
    data: { inviteCode: code },
    select: { inviteCode: true },
  });
  return { inviteCode: group.inviteCode };
};

const revokeInviteCode = async (userId, groupId) => {
  await assertGroupOwnership(userId, groupId);
  await prisma.group.update({
    where: { id: groupId },
    data: { inviteCode: null },
  });
};

const joinByCode = async (userId, code) => {
  if (!code || typeof code !== 'string') {
    throw new ApiError(400, 'Código no válido');
  }
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    throw new ApiError(400, 'Código no válido');
  }
  const group = await prisma.group.findUnique({
    where: { inviteCode: normalized },
    select: { id: true, name: true, userId: true },
  });
  if (!group) {
    throw new ApiError(404, 'Código no válido o caducado');
  }
  if (group.userId === userId) {
    throw new ApiError(400, 'No puedes unirte a un grupo del que ya eres propietario');
  }
  const existing = await prisma.groupCollaborator.findUnique({
    where: { groupId_userId: { groupId: group.id, userId } },
  });
  if (existing) {
    throw new ApiError(409, 'Ya eres colaborador de este grupo');
  }
  await prisma.groupCollaborator.create({
    data: { groupId: group.id, userId, role: 'VIEWER' },
  });
  return {
    group: { id: group.id, name: group.name },
    role: 'VIEWER',
  };
};

const listForGroup = async (userId, groupId) => {
  await assertGroupOwnership(userId, groupId);
  const memberships = await prisma.groupCollaborator.findMany({
    where: { groupId },
    include: { user: { select: COLLABORATOR_USER_SELECT } },
    orderBy: { createdAt: 'asc' },
  });
  return memberships.map((m) => ({
    id: m.id,
    role: m.role,
    createdAt: m.createdAt,
    user: m.user,
  }));
};

const updateRole = async (userId, groupId, membershipId, role) => {
  await assertGroupOwnership(userId, groupId);
  if (!VALID_ROLES.includes(role)) {
    throw new ApiError(400, `El rol debe ser ${VALID_ROLES.join(' o ')}`);
  }
  const membership = await prisma.groupCollaborator.findFirst({
    where: { id: membershipId, groupId },
  });
  if (!membership) {
    throw new ApiError(404, 'Colaboración no encontrada');
  }
  const updated = await prisma.groupCollaborator.update({
    where: { id: membershipId },
    data: { role },
    include: { user: { select: COLLABORATOR_USER_SELECT } },
  });
  return {
    id: updated.id,
    role: updated.role,
    createdAt: updated.createdAt,
    user: updated.user,
  };
};

const removeFromGroup = async (userId, groupId, membershipId) => {
  await assertGroupOwnership(userId, groupId);
  const membership = await prisma.groupCollaborator.findFirst({
    where: { id: membershipId, groupId },
  });
  if (!membership) {
    throw new ApiError(404, 'Colaboración no encontrada');
  }
  await prisma.groupCollaborator.delete({ where: { id: membershipId } });
};

const leaveGroup = async (userId, membershipId) => {
  const membership = await prisma.groupCollaborator.findFirst({
    where: { id: membershipId, userId },
  });
  if (!membership) {
    throw new ApiError(404, 'Colaboración no encontrada');
  }
  await prisma.groupCollaborator.delete({ where: { id: membershipId } });
};

const getMyMemberships = async (userId) => {
  const memberships = await prisma.groupCollaborator.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  return memberships.map((m) => ({
    id: m.id,
    role: m.role,
    group: m.group,
  }));
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
