const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const getAll = async (userId) => {
  const [owned, memberships] = await Promise.all([
    prisma.group.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { animals: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.groupCollaborator.findMany({
      where: { userId },
      select: {
        role: true,
        group: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
            _count: { select: { animals: true } },
          },
        },
      },
    }),
  ]);

  const ownedDto = owned.map((g) => ({
    id: g.id,
    name: g.name,
    createdAt: g.createdAt,
    _count: g._count,
    role: 'OWNER',
    owner: null,
  }));

  const collabDto = memberships
    .map((m) => ({
      id: m.group.id,
      name: m.group.name,
      createdAt: m.group.createdAt,
      _count: m.group._count,
      role: m.role,
      owner: m.group.user,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...ownedDto, ...collabDto];
};

const create = async (userId, { name }) => {
  const trimmedName = name.trim();

  const existing = await prisma.group.findFirst({
    where: { userId, name: trimmedName },
  });
  if (existing) {
    throw new ApiError(409, 'Ya existe un grupo con ese nombre');
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
    throw new ApiError(404, 'Grupo no encontrado');
  }

  const trimmedName = name.trim();

  const duplicate = await prisma.group.findFirst({
    where: { userId, name: trimmedName, id: { not: groupId } },
  });
  if (duplicate) {
    throw new ApiError(409, 'Ya existe un grupo con ese nombre');
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
    throw new ApiError(404, 'Grupo no encontrado');
  }

  if (group._count.animals > 0) {
    throw new ApiError(400, 'No se puede eliminar un grupo con animales. Mueve o elimina los animales primero.');
  }

  await prisma.group.delete({ where: { id: groupId } });
};

module.exports = { getAll, create, update, remove };
