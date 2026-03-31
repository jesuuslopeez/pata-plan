const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const getUserGroupIds = async (userId) => {
  const groups = await prisma.group.findMany({
    where: { userId },
    select: { id: true },
  });
  return groups.map((g) => g.id);
};

const verifyAnimalOwnership = async (animalId, userId) => {
  const groupIds = await getUserGroupIds(userId);
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, groupId: { in: groupIds } },
  });
  if (!animal) {
    throw new ApiError(404, 'Animal not found');
  }
  return animal;
};

const getAll = async (userId, query) => {
  const groupIds = await getUserGroupIds(userId);
  if (groupIds.length === 0) {
    return [];
  }

  const where = { groupId: { in: groupIds } };

  if (query.groupId) {
    const gid = parseInt(query.groupId, 10);
    if (!groupIds.includes(gid)) {
      return [];
    }
    where.groupId = gid;
  }

  if (query.species) {
    where.species = query.species;
  }

  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }

  const animals = await prisma.animal.findMany({
    where,
    include: {
      group: { select: { id: true, name: true } },
      _count: {
        select: {
          healthEvents: { where: { status: 'PENDING' } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Add overdue count separately since Prisma _count doesn't support multiple filters on same relation
  const animalIds = animals.map((a) => a.id);
  const overdueCounts = await prisma.healthEvent.groupBy({
    by: ['animalId'],
    where: { animalId: { in: animalIds }, status: 'OVERDUE' },
    _count: true,
  });
  const overdueMap = Object.fromEntries(overdueCounts.map((o) => [o.animalId, o._count]));

  return animals.map((a) => ({
    ...a,
    _count: {
      pendingEvents: a._count.healthEvents,
      overdueEvents: overdueMap[a.id] || 0,
    },
  }));
};

const getById = async (userId, animalId) => {
  const groupIds = await getUserGroupIds(userId);

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, groupId: { in: groupIds } },
    include: {
      group: { select: { id: true, name: true } },
      weightRecords: {
        orderBy: { recordedAt: 'desc' },
        take: 1,
        select: { id: true, valueKg: true, recordedAt: true, isAnomaly: true },
      },
    },
  });

  if (!animal) {
    throw new ApiError(404, 'Animal not found');
  }

  const eventCounts = await prisma.healthEvent.groupBy({
    by: ['status'],
    where: { animalId },
    _count: true,
  });
  const counts = Object.fromEntries(eventCounts.map((e) => [e.status, e._count]));

  return {
    ...animal,
    latestWeight: animal.weightRecords[0] || null,
    weightRecords: undefined,
    eventCounts: {
      pending: counts.PENDING || 0,
      completed: counts.COMPLETED || 0,
      overdue: counts.OVERDUE || 0,
      skipped: counts.SKIPPED || 0,
    },
  };
};

const create = async (userId, data, file) => {
  const groupIds = await getUserGroupIds(userId);
  const groupId = parseInt(data.groupId, 10);

  if (!groupIds.includes(groupId)) {
    throw new ApiError(400, 'Invalid group');
  }

  const animalData = {
    name: data.name.trim(),
    species: data.species,
    sex: data.sex,
    groupId,
  };

  if (data.breed) {
    animalData.breed = data.breed.trim();
  }
  if (data.dateOfBirth) {
    animalData.dateOfBirth = new Date(data.dateOfBirth);
  }
  if (data.microchip) {
    animalData.microchip = data.microchip.trim();
  }
  if (data.notes) {
    animalData.notes = data.notes.trim();
  }
  if (file) {
    animalData.photoUrl = `/uploads/animals/${file.filename}`;
  }

  const animal = await prisma.animal.create({
    data: animalData,
    include: { group: { select: { id: true, name: true } } },
  });

  return animal;
};

const deletePhotoFile = (photoUrl) => {
  if (!photoUrl) {
    return;
  }
  const filePath = path.join(__dirname, '../..', photoUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const update = async (userId, animalId, data, file) => {
  const existing = await verifyAnimalOwnership(animalId, userId);

  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }
  if (data.species !== undefined) {
    updateData.species = data.species;
  }
  if (data.sex !== undefined) {
    updateData.sex = data.sex;
  }
  if (data.breed !== undefined) {
    updateData.breed = data.breed.trim() || null;
  }
  if (data.dateOfBirth !== undefined) {
    updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }
  if (data.microchip !== undefined) {
    updateData.microchip = data.microchip.trim() || null;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes.trim() || null;
  }

  if (data.groupId !== undefined) {
    const groupIds = await getUserGroupIds(userId);
    const newGroupId = parseInt(data.groupId, 10);
    if (!groupIds.includes(newGroupId)) {
      throw new ApiError(400, 'Invalid group');
    }
    updateData.groupId = newGroupId;
  }

  if (file) {
    deletePhotoFile(existing.photoUrl);
    updateData.photoUrl = `/uploads/animals/${file.filename}`;
  }

  const animal = await prisma.animal.update({
    where: { id: animalId },
    data: updateData,
    include: { group: { select: { id: true, name: true } } },
  });

  return animal;
};

const remove = async (userId, animalId) => {
  const existing = await verifyAnimalOwnership(animalId, userId);
  deletePhotoFile(existing.photoUrl);
  await prisma.animal.delete({ where: { id: animalId } });
};

module.exports = { getAll, getById, create, update, remove };
