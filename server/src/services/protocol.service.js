const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const STEP_INCLUDE = {
  eventType: { select: { id: true, name: true, category: true, severityScore: true } },
};

const PROTOCOL_INCLUDE = {
  steps: {
    include: STEP_INCLUDE,
    orderBy: { sortOrder: 'asc' },
  },
};

const verifyOwnership = async (protocolId, userId) => {
  const protocol = await prisma.protocol.findFirst({
    where: { id: protocolId, userId },
  });
  if (!protocol) {
    throw new ApiError(404, 'Protocol not found');
  }
  return protocol;
};

const validateSteps = async (steps) => {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.eventTypeId) {
      throw new ApiError(400, `Step ${i}: eventTypeId is required`);
    }
    if (step.dayOffset === undefined || step.dayOffset === null) {
      throw new ApiError(400, `Step ${i}: dayOffset is required`);
    }
    const dayOffset = parseInt(step.dayOffset, 10);
    if (isNaN(dayOffset) || dayOffset < 0) {
      throw new ApiError(400, `Step ${i}: dayOffset must be an integer >= 0`);
    }
    const eventType = await prisma.eventType.findUnique({
      where: { id: parseInt(step.eventTypeId, 10) },
    });
    if (!eventType) {
      throw new ApiError(400, `Step ${i}: invalid eventTypeId`);
    }
  }
};

const getAll = async (userId) => {
  const protocols = await prisma.protocol.findMany({
    where: { userId },
    include: {
      ...PROTOCOL_INCLUDE,
      _count: {
        select: {
          assignments: { where: { status: 'ACTIVE' } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return protocols;
};

const getById = async (userId, protocolId) => {
  const protocol = await prisma.protocol.findFirst({
    where: { id: protocolId, userId },
    include: {
      ...PROTOCOL_INCLUDE,
      assignments: {
        include: {
          animal: {
            select: {
              id: true,
              name: true,
              group: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!protocol) {
    throw new ApiError(404, 'Protocol not found');
  }

  return protocol;
};

const create = async (userId, data) => {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new ApiError(400, 'name is required');
  }
  if (data.name.trim().length > 100) {
    throw new ApiError(400, 'name must be at most 100 characters');
  }

  const stepsData = [];
  if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
    await validateSteps(data.steps);
    for (let i = 0; i < data.steps.length; i++) {
      const s = data.steps[i];
      stepsData.push({
        eventTypeId: parseInt(s.eventTypeId, 10),
        dayOffset: parseInt(s.dayOffset, 10),
        product: s.product || null,
        notes: s.notes || null,
        sortOrder: i,
      });
    }
  }

  const protocol = await prisma.$transaction(async (tx) => {
    const created = await tx.protocol.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        userId,
        steps: { create: stepsData },
      },
      include: PROTOCOL_INCLUDE,
    });
    return created;
  });

  return protocol;
};

const update = async (userId, protocolId, data) => {
  await verifyOwnership(protocolId, userId);

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new ApiError(400, 'name cannot be empty');
    }
    if (data.name.trim().length > 100) {
      throw new ApiError(400, 'name must be at most 100 characters');
    }
  }

  const hasSteps = data.steps && Array.isArray(data.steps);
  if (hasSteps) {
    await validateSteps(data.steps);
  }

  const protocol = await prisma.$transaction(async (tx) => {
    const updateData = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }

    await tx.protocol.update({
      where: { id: protocolId },
      data: updateData,
    });

    if (hasSteps) {
      await tx.protocolStep.deleteMany({ where: { protocolId } });
      for (let i = 0; i < data.steps.length; i++) {
        const s = data.steps[i];
        await tx.protocolStep.create({
          data: {
            protocolId,
            eventTypeId: parseInt(s.eventTypeId, 10),
            dayOffset: parseInt(s.dayOffset, 10),
            product: s.product || null,
            notes: s.notes || null,
            sortOrder: i,
          },
        });
      }
    }

    return tx.protocol.findUnique({
      where: { id: protocolId },
      include: PROTOCOL_INCLUDE,
    });
  });

  return protocol;
};

const remove = async (userId, protocolId) => {
  await verifyOwnership(protocolId, userId);

  const activeCount = await prisma.protocolAssignment.count({
    where: { protocolId, status: 'ACTIVE' },
  });
  if (activeCount > 0) {
    throw new ApiError(
      400,
      'Cannot delete protocol with active assignments. Cancel or complete them first'
    );
  }

  await prisma.protocol.delete({ where: { id: protocolId } });
};

module.exports = { getAll, getById, create, update, remove };
