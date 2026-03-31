const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const getAll = async (userId) => {
  const groups = await prisma.group.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { animals: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return groups;
};

const create = async (userId, { name }) => {
  const trimmedName = name.trim();

  const existing = await prisma.group.findFirst({
    where: { userId, name: trimmedName },
  });
  if (existing) {
    throw new ApiError(409, 'Group name already exists');
  }

  const group = await prisma.group.create({
    data: { name: trimmedName, userId },
    select: { id: true, name: true, createdAt: true },
  });

  return group;
};

const update = async (userId, groupId, { name }) => {
  const group = await prisma.group.findFirst({
    where: { id: groupId, userId },
  });
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const trimmedName = name.trim();

  const duplicate = await prisma.group.findFirst({
    where: { userId, name: trimmedName, id: { not: groupId } },
  });
  if (duplicate) {
    throw new ApiError(409, 'Group name already exists');
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { name: trimmedName },
    select: { id: true, name: true, createdAt: true },
  });

  return updated;
};

const remove = async (userId, groupId) => {
  const group = await prisma.group.findFirst({
    where: { id: groupId, userId },
    include: { _count: { select: { animals: true } } },
  });
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  if (group._count.animals > 0) {
    throw new ApiError(400, 'Cannot delete group with animals. Move or delete animals first');
  }

  await prisma.group.delete({ where: { id: groupId } });
};

module.exports = { getAll, create, update, remove };
