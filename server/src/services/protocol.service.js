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
    throw new ApiError(404, 'Protocolo no encontrado');
  }
  return protocol;
};

const validateSteps = async (steps) => {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.eventTypeId) {
      throw new ApiError(400, `Paso ${i + 1}: falta el tipo de evento`);
    }
    if (step.dayOffset === undefined || step.dayOffset === null) {
      throw new ApiError(400, `Paso ${i + 1}: falta el día`);
    }
    const dayOffset = parseInt(step.dayOffset, 10);
    if (isNaN(dayOffset) || dayOffset < 0) {
      throw new ApiError(400, `Paso ${i + 1}: el día debe ser un entero mayor o igual a 0`);
    }
    const eventType = await prisma.eventType.findUnique({
      where: { id: parseInt(step.eventTypeId, 10) },
    });
    if (!eventType) {
      throw new ApiError(400, `Paso ${i + 1}: tipo de evento no válido`);
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
    throw new ApiError(404, 'Protocolo no encontrado');
  }

  return protocol;
};

const create = async (userId, data) => {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new ApiError(400, 'Falta el nombre');
  }
  if (data.name.trim().length > 100) {
    throw new ApiError(400, 'El nombre no puede superar los 100 caracteres');
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
      throw new ApiError(400, 'El nombre no puede estar vacío');
    }
    if (data.name.trim().length > 100) {
      throw new ApiError(400, 'El nombre no puede superar los 100 caracteres');
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
      'No se puede eliminar un protocolo con asignaciones activas. Cancélalas o complétalas primero.'
    );
  }

  await prisma.protocol.delete({ where: { id: protocolId } });
};

const addStep = async (userId, protocolId, data) => {
  await verifyOwnership(protocolId, userId);

  if (!data.eventTypeId) {
    throw new ApiError(400, 'Falta el tipo de evento');
  }
  if (data.dayOffset === undefined || data.dayOffset === null) {
    throw new ApiError(400, 'Falta el día');
  }
  const dayOffset = parseInt(data.dayOffset, 10);
  if (isNaN(dayOffset) || dayOffset < 0) {
    throw new ApiError(400, 'El día debe ser un entero mayor o igual a 0');
  }

  const eventTypeId = parseInt(data.eventTypeId, 10);
  const eventType = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
  if (!eventType) {
    throw new ApiError(400, 'Tipo de evento no válido');
  }

  const maxStep = await prisma.protocolStep.findFirst({
    where: { protocolId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  });
  const sortOrder = maxStep ? maxStep.sortOrder + 1 : 0;

  const step = await prisma.protocolStep.create({
    data: {
      protocolId,
      eventTypeId,
      dayOffset,
      product: data.product || null,
      notes: data.notes || null,
      sortOrder,
    },
    include: STEP_INCLUDE,
  });

  return step;
};

const verifyStepOwnership = async (protocolId, stepId, userId) => {
  await verifyOwnership(protocolId, userId);
  const step = await prisma.protocolStep.findFirst({
    where: { id: stepId, protocolId },
  });
  if (!step) {
    throw new ApiError(404, 'Paso no encontrado');
  }
  return step;
};

const updateStep = async (userId, protocolId, stepId, data) => {
  await verifyStepOwnership(protocolId, stepId, userId);

  const updateData = {};

  if (data.eventTypeId !== undefined) {
    const etId = parseInt(data.eventTypeId, 10);
    const eventType = await prisma.eventType.findUnique({ where: { id: etId } });
    if (!eventType) {
      throw new ApiError(400, 'Tipo de evento no válido');
    }
    updateData.eventTypeId = etId;
  }

  if (data.dayOffset !== undefined) {
    const d = parseInt(data.dayOffset, 10);
    if (isNaN(d) || d < 0) {
      throw new ApiError(400, 'El día debe ser un entero mayor o igual a 0');
    }
    updateData.dayOffset = d;
  }

  if (data.product !== undefined) {
    updateData.product = data.product || null;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes || null;
  }
  if (data.sortOrder !== undefined) {
    updateData.sortOrder = parseInt(data.sortOrder, 10);
  }

  const step = await prisma.protocolStep.update({
    where: { id: stepId },
    data: updateData,
    include: STEP_INCLUDE,
  });

  return step;
};

const removeStep = async (userId, protocolId, stepId) => {
  await verifyStepOwnership(protocolId, stepId, userId);

  await prisma.protocolStep.delete({ where: { id: stepId } });

  // Reorder remaining steps to remove gaps
  const remaining = await prisma.protocolStep.findMany({
    where: { protocolId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true },
  });

  for (let i = 0; i < remaining.length; i++) {
    await prisma.protocolStep.update({
      where: { id: remaining[i].id },
      data: { sortOrder: i },
    });
  }
};

const reorderSteps = async (userId, protocolId, stepIds) => {
  await verifyOwnership(protocolId, userId);

  if (!Array.isArray(stepIds) || stepIds.length === 0) {
    throw new ApiError(400, 'La lista de pasos no puede estar vacía');
  }

  const existingSteps = await prisma.protocolStep.findMany({
    where: { protocolId },
    select: { id: true },
  });
  const existingIds = new Set(existingSteps.map((s) => s.id));

  for (const id of stepIds) {
    if (!existingIds.has(id)) {
      throw new ApiError(400, `El paso ${id} no pertenece a este protocolo`);
    }
  }
  if (stepIds.length !== existingIds.size) {
    throw new ApiError(400, 'Debes incluir todos los pasos del protocolo');
  }

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < stepIds.length; i++) {
      await tx.protocolStep.update({
        where: { id: stepIds[i] },
        data: { sortOrder: i },
      });
    }
  });

  const steps = await prisma.protocolStep.findMany({
    where: { protocolId },
    include: STEP_INCLUDE,
    orderBy: { sortOrder: 'asc' },
  });

  return steps;
};

module.exports = { getAll, getById, create, update, remove, addStep, updateStep, removeStep, reorderSteps };
