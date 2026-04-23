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

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const assignProtocol = async (userId, animalId, data) => {
  await verifyAnimalOwnership(animalId, userId);

  if (!data.protocolId) {
    throw new ApiError(400, 'protocolId is required');
  }
  if (!data.startDate) {
    throw new ApiError(400, 'startDate is required');
  }

  const protocolId = parseInt(data.protocolId, 10);
  const startDate = new Date(data.startDate);
  if (isNaN(startDate.getTime())) {
    throw new ApiError(400, 'startDate must be a valid date');
  }

  const protocol = await prisma.protocol.findFirst({
    where: { id: protocolId, userId },
    include: {
      steps: {
        orderBy: { sortOrder: 'asc' },
        include: {
          eventType: { select: { id: true, name: true, category: true } },
        },
      },
    },
  });
  if (!protocol) {
    throw new ApiError(404, 'Protocol not found');
  }

  const existingActive = await prisma.protocolAssignment.findFirst({
    where: { animalId, protocolId, status: 'ACTIVE' },
  });
  if (existingActive) {
    throw new ApiError(400, 'This protocol is already active for this animal');
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const assignment = await tx.protocolAssignment.create({
      data: {
        animalId,
        protocolId,
        startDate,
        status: 'ACTIVE',
      },
    });

    const events = [];
    for (const step of protocol.steps) {
      const scheduledDate = addDays(startDate, step.dayOffset);
      const status = scheduledDate < now ? 'OVERDUE' : 'PENDING';

      const event = await tx.healthEvent.create({
        data: {
          animalId,
          eventTypeId: step.eventTypeId,
          scheduledDate,
          product: step.product,
          notes: step.notes,
          status,
          protocolAssignmentId: assignment.id,
          completedDate: null,
          frequencyDays: null,
        },
        include: {
          eventType: { select: { id: true, name: true, category: true, severityScore: true } },
        },
      });
      events.push(event);
    }

    return {
      ...assignment,
      protocol: { name: protocol.name },
      healthEvents: events,
    };
  });

  return result;
};

const getAssignments = async (userId, animalId) => {
  await verifyAnimalOwnership(animalId, userId);

  const assignments = await prisma.protocolAssignment.findMany({
    where: { animalId },
    include: {
      protocol: { select: { id: true, name: true, description: true } },
      healthEvents: { select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return assignments.map((a) => {
    const counts = { pending: 0, completed: 0, overdue: 0, skipped: 0 };
    for (const e of a.healthEvents) {
      const key = e.status.toLowerCase();
      if (counts[key] !== undefined) {
        counts[key]++;
      }
    }
    const { healthEvents, ...rest } = a;
    return { ...rest, eventCounts: counts };
  });
};

const cancelAssignment = async (userId, assignmentId) => {
  const assignment = await prisma.protocolAssignment.findFirst({
    where: { id: assignmentId },
    include: { animal: { select: { groupId: true } } },
  });
  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  const groupIds = await getUserGroupIds(userId);
  if (!groupIds.includes(assignment.animal.groupId)) {
    throw new ApiError(404, 'Assignment not found');
  }

  if (assignment.status !== 'ACTIVE') {
    throw new ApiError(400, 'Assignment is not active');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.protocolAssignment.update({
      where: { id: assignmentId },
      data: { status: 'CANCELLED' },
      include: {
        protocol: { select: { id: true, name: true } },
      },
    });

    await tx.healthEvent.updateMany({
      where: {
        protocolAssignmentId: assignmentId,
        status: 'PENDING',
      },
      data: { status: 'SKIPPED' },
    });

    return updated;
  });

  return result;
};

module.exports = { assignProtocol, getAssignments, cancelAssignment };
