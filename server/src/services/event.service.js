const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');
const { recalculateCascade } = require('./recalculation.service');

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

const verifyEventOwnership = async (eventId, userId) => {
  const groupIds = await getUserGroupIds(userId);
  const event = await prisma.healthEvent.findFirst({
    where: {
      id: eventId,
      animal: { groupId: { in: groupIds } },
    },
    include: { eventType: true },
  });
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  return event;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const calcStatus = (scheduledDate, completedDate) => {
  if (completedDate) {
    return 'COMPLETED';
  }
  if (new Date(scheduledDate) < new Date()) {
    return 'OVERDUE';
  }
  return 'PENDING';
};

const calcNextDueDate = (scheduledDate, completedDate, frequencyDays) => {
  if (!frequencyDays) {
    return null;
  }
  const baseDate = completedDate || scheduledDate;
  return addDays(baseDate, frequencyDays);
};

const EVENT_INCLUDE = {
  eventType: { select: { id: true, name: true, category: true, severityScore: true } },
};

const getAll = async (userId, animalId, query) => {
  await verifyAnimalOwnership(animalId, userId);

  const where = { animalId };

  if (query.status) {
    where.status = query.status;
  }
  if (query.eventTypeId) {
    where.eventTypeId = parseInt(query.eventTypeId, 10);
  }
  if (query.from || query.to) {
    where.scheduledDate = {};
    if (query.from) {
      where.scheduledDate.gte = new Date(query.from);
    }
    if (query.to) {
      where.scheduledDate.lte = new Date(query.to);
    }
  }

  const events = await prisma.healthEvent.findMany({
    where,
    include: EVENT_INCLUDE,
    orderBy: { scheduledDate: 'desc' },
  });

  return events;
};

const create = async (userId, animalId, data) => {
  await verifyAnimalOwnership(animalId, userId);

  if (!data.eventTypeId) {
    throw new ApiError(400, 'eventTypeId is required');
  }
  if (!data.scheduledDate) {
    throw new ApiError(400, 'scheduledDate is required');
  }

  const eventTypeId = parseInt(data.eventTypeId, 10);
  const eventType = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
  if (!eventType) {
    throw new ApiError(400, 'Invalid eventTypeId');
  }

  const scheduledDate = new Date(data.scheduledDate);
  if (isNaN(scheduledDate.getTime())) {
    throw new ApiError(400, 'scheduledDate must be a valid date');
  }

  const completedDate = data.completedDate ? new Date(data.completedDate) : null;
  if (data.completedDate && isNaN(completedDate.getTime())) {
    throw new ApiError(400, 'completedDate must be a valid date');
  }

  const frequencyDays = data.frequencyDays ? parseInt(data.frequencyDays, 10) : null;
  if (frequencyDays !== null && (isNaN(frequencyDays) || frequencyDays <= 0)) {
    throw new ApiError(400, 'frequencyDays must be a positive integer');
  }

  const status = calcStatus(scheduledDate, completedDate);
  const nextDueDate = calcNextDueDate(scheduledDate, completedDate, frequencyDays);

  const event = await prisma.healthEvent.create({
    data: {
      animalId,
      eventTypeId,
      scheduledDate,
      completedDate,
      product: data.product || null,
      vetName: data.vetName || null,
      notes: data.notes || null,
      frequencyDays,
      nextDueDate,
      status,
    },
    include: EVENT_INCLUDE,
  });

  return event;
};

const update = async (userId, eventId, data) => {
  const existing = await verifyEventOwnership(eventId, userId);

  const updateData = {};

  if (data.eventTypeId !== undefined) {
    const etId = parseInt(data.eventTypeId, 10);
    const eventType = await prisma.eventType.findUnique({ where: { id: etId } });
    if (!eventType) {
      throw new ApiError(400, 'Invalid eventTypeId');
    }
    updateData.eventTypeId = etId;
  }

  if (data.scheduledDate !== undefined) {
    const d = new Date(data.scheduledDate);
    if (isNaN(d.getTime())) {
      throw new ApiError(400, 'scheduledDate must be a valid date');
    }
    updateData.scheduledDate = d;
  }

  if (data.completedDate !== undefined) {
    if (data.completedDate === null || data.completedDate === '') {
      updateData.completedDate = null;
    } else {
      const d = new Date(data.completedDate);
      if (isNaN(d.getTime())) {
        throw new ApiError(400, 'completedDate must be a valid date');
      }
      updateData.completedDate = d;
    }
  }

  if (data.frequencyDays !== undefined) {
    if (data.frequencyDays === null || data.frequencyDays === '') {
      updateData.frequencyDays = null;
    } else {
      const fd = parseInt(data.frequencyDays, 10);
      if (isNaN(fd) || fd <= 0) {
        throw new ApiError(400, 'frequencyDays must be a positive integer');
      }
      updateData.frequencyDays = fd;
    }
  }

  if (data.product !== undefined) {
    updateData.product = data.product || null;
  }
  if (data.vetName !== undefined) {
    updateData.vetName = data.vetName || null;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes || null;
  }

  // Recalculate status and nextDueDate
  const scheduledDate = updateData.scheduledDate || existing.scheduledDate;
  const completedDate =
    updateData.completedDate !== undefined ? updateData.completedDate : existing.completedDate;
  const frequencyDays =
    updateData.frequencyDays !== undefined ? updateData.frequencyDays : existing.frequencyDays;

  updateData.status = calcStatus(scheduledDate, completedDate);
  updateData.nextDueDate = calcNextDueDate(scheduledDate, completedDate, frequencyDays);

  const event = await prisma.healthEvent.update({
    where: { id: eventId },
    data: updateData,
    include: EVENT_INCLUDE,
  });

  return event;
};

const complete = async (userId, eventId, data) => {
  const existing = await verifyEventOwnership(eventId, userId);

  if (existing.status === 'COMPLETED') {
    throw new ApiError(400, 'Event is already completed');
  }

  const completedDate = data.completedDate ? new Date(data.completedDate) : new Date();
  if (isNaN(completedDate.getTime())) {
    throw new ApiError(400, 'completedDate must be a valid date');
  }

  const nextDueDate = calcNextDueDate(
    existing.scheduledDate,
    completedDate,
    existing.frequencyDays
  );

  const event = await prisma.healthEvent.update({
    where: { id: eventId },
    data: {
      status: 'COMPLETED',
      completedDate,
      nextDueDate,
    },
    include: EVENT_INCLUDE,
  });

  let nextEvent = null;
  if (existing.frequencyDays) {
    const nextScheduledDate = addDays(completedDate, existing.frequencyDays);
    nextEvent = await prisma.healthEvent.create({
      data: {
        animalId: existing.animalId,
        eventTypeId: existing.eventTypeId,
        scheduledDate: nextScheduledDate,
        product: existing.product,
        vetName: existing.vetName,
        notes: existing.notes,
        frequencyDays: existing.frequencyDays,
        nextDueDate: addDays(nextScheduledDate, existing.frequencyDays),
        status: 'PENDING',
      },
      include: EVENT_INCLUDE,
    });
  }

  const recalculation = await recalculateCascade(existing, completedDate);

  return { event, nextEvent, recalculation };
};

const remove = async (userId, eventId) => {
  await verifyEventOwnership(eventId, userId);
  await prisma.healthEvent.delete({ where: { id: eventId } });
};

module.exports = { getAll, create, update, complete, remove };
