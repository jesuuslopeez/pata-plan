const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');
const {
  getAccessibleGroupIds,
  getEditableGroupIds,
} = require('../utils/groupAccess');

const VISIT_INCLUDE = {
  documents: true,
  expenses: true,
};

const verifyAnimalAccess = async (animalId, userId) => {
  const groupIds = await getAccessibleGroupIds(userId);
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, groupId: { in: groupIds } },
  });
  if (!animal) {
    throw new ApiError(404, 'Animal no encontrado');
  }
  return animal;
};

const verifyAnimalEditAccess = async (animalId, userId) => {
  const groupIds = await getEditableGroupIds(userId);
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, groupId: { in: groupIds } },
  });
  if (!animal) {
    throw new ApiError(403, 'No tienes permiso para modificar este animal');
  }
  return animal;
};

const verifyVisitAccess = async (visitId, userId) => {
  const groupIds = await getAccessibleGroupIds(userId);
  const visit = await prisma.vetVisit.findFirst({
    where: {
      id: visitId,
      animal: { groupId: { in: groupIds } },
    },
    include: VISIT_INCLUDE,
  });
  if (!visit) {
    throw new ApiError(404, 'Visita no encontrada');
  }
  return visit;
};

const verifyVisitEditAccess = async (visitId, userId) => {
  const groupIds = await getEditableGroupIds(userId);
  const visit = await prisma.vetVisit.findFirst({
    where: {
      id: visitId,
      animal: { groupId: { in: groupIds } },
    },
    include: VISIT_INCLUDE,
  });
  if (!visit) {
    throw new ApiError(403, 'No tienes permiso para modificar esta visita');
  }
  return visit;
};

const parseDate = (value, field) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new ApiError(400, `El campo ${field} no es una fecha válida`);
  }
  return d;
};

const validateVisitData = (data, { partial = false } = {}) => {
  const out = {};

  if (data.visitDate !== undefined) {
    const d = parseDate(data.visitDate, 'visitDate');
    if (d.getTime() > Date.now()) {
      throw new ApiError(400, 'La fecha de la visita no puede ser futura');
    }
    out.visitDate = d;
  } else if (!partial) {
    throw new ApiError(400, 'Falta la fecha de la visita');
  }

  if (data.reason !== undefined) {
    if (typeof data.reason !== 'string' || data.reason.trim().length === 0) {
      throw new ApiError(400, 'Falta el motivo');
    }
    const trimmed = data.reason.trim();
    if (trimmed.length > 200) {
      throw new ApiError(400, 'El motivo no puede superar los 200 caracteres');
    }
    out.reason = trimmed;
  } else if (!partial) {
    throw new ApiError(400, 'Falta el motivo');
  }

  if (data.diagnosis !== undefined) {
    out.diagnosis = data.diagnosis ? String(data.diagnosis) : null;
  }

  if (data.treatment !== undefined) {
    out.treatment = data.treatment ? String(data.treatment) : null;
  }

  if (data.vetName !== undefined) {
    if (data.vetName === null || data.vetName === '') {
      out.vetName = null;
    } else if (typeof data.vetName !== 'string') {
      throw new ApiError(400, 'El veterinario debe ser texto');
    } else if (data.vetName.trim().length > 100) {
      throw new ApiError(400, 'El veterinario no puede superar los 100 caracteres');
    } else {
      out.vetName = data.vetName.trim();
    }
  }

  if (data.observations !== undefined) {
    out.observations = data.observations ? String(data.observations) : null;
  }

  if (data.cost !== undefined) {
    if (data.cost === null || data.cost === '') {
      out.cost = null;
    } else {
      const n = Number(data.cost);
      if (isNaN(n) || n <= 0) {
        throw new ApiError(400, 'El coste debe ser un número positivo');
      }
      out.cost = n;
    }
  }

  return out;
};

const getAll = async (userId, animalId, query = {}) => {
  await verifyAnimalAccess(animalId, userId);

  const where = { animalId };

  if (query.from || query.to) {
    where.visitDate = {};
    if (query.from) {
      where.visitDate.gte = parseDate(query.from, 'from');
    }
    if (query.to) {
      where.visitDate.lte = parseDate(query.to, 'to');
    }
  }

  const sort = query.sort === 'asc' ? 'asc' : 'desc';

  const visits = await prisma.vetVisit.findMany({
    where,
    include: VISIT_INCLUDE,
    orderBy: { visitDate: sort },
  });

  return visits;
};

const getById = async (userId, visitId) => {
  return verifyVisitAccess(visitId, userId);
};

const create = async (userId, animalId, data) => {
  await verifyAnimalEditAccess(animalId, userId);

  const validated = validateVisitData(data, { partial: false });

  const visit = await prisma.$transaction(async (tx) => {
    const created = await tx.vetVisit.create({
      data: {
        animalId,
        visitDate: validated.visitDate,
        reason: validated.reason,
        diagnosis: validated.diagnosis ?? null,
        treatment: validated.treatment ?? null,
        vetName: validated.vetName ?? null,
        observations: validated.observations ?? null,
        cost: validated.cost ?? null,
      },
    });

    if (validated.cost) {
      await tx.expense.create({
        data: {
          animalId,
          vetVisitId: created.id,
          amount: validated.cost,
          category: 'OTHER',
          description: validated.reason,
          expenseDate: validated.visitDate,
        },
      });
    }

    return tx.vetVisit.findUnique({
      where: { id: created.id },
      include: VISIT_INCLUDE,
    });
  });

  return visit;
};

const update = async (userId, visitId, data) => {
  const existing = await verifyVisitEditAccess(visitId, userId);

  const validated = validateVisitData(data, { partial: true });

  const visit = await prisma.$transaction(async (tx) => {
    const updateData = {};
    if (validated.visitDate !== undefined) updateData.visitDate = validated.visitDate;
    if (validated.reason !== undefined) updateData.reason = validated.reason;
    if (validated.diagnosis !== undefined) updateData.diagnosis = validated.diagnosis;
    if (validated.treatment !== undefined) updateData.treatment = validated.treatment;
    if (validated.vetName !== undefined) updateData.vetName = validated.vetName;
    if (validated.observations !== undefined) updateData.observations = validated.observations;
    if (validated.cost !== undefined) updateData.cost = validated.cost;

    if (Object.keys(updateData).length > 0) {
      await tx.vetVisit.update({
        where: { id: visitId },
        data: updateData,
      });
    }

    const finalCost = validated.cost !== undefined ? validated.cost : existing.cost;
    const finalDate = validated.visitDate !== undefined ? validated.visitDate : existing.visitDate;
    const finalReason = validated.reason !== undefined ? validated.reason : existing.reason;

    const existingExpense = await tx.expense.findFirst({
      where: { vetVisitId: visitId },
    });

    if (finalCost === null || finalCost === undefined) {
      if (existingExpense) {
        await tx.expense.delete({ where: { id: existingExpense.id } });
      }
    } else if (existingExpense) {
      await tx.expense.update({
        where: { id: existingExpense.id },
        data: {
          amount: finalCost,
          expenseDate: finalDate,
          description: finalReason,
        },
      });
    } else {
      await tx.expense.create({
        data: {
          animalId: existing.animalId,
          vetVisitId: visitId,
          amount: finalCost,
          category: 'OTHER',
          description: finalReason,
          expenseDate: finalDate,
        },
      });
    }

    return tx.vetVisit.findUnique({
      where: { id: visitId },
      include: VISIT_INCLUDE,
    });
  });

  return visit;
};

const remove = async (userId, visitId) => {
  await verifyVisitEditAccess(visitId, userId);
  await prisma.$transaction(async (tx) => {
    await tx.expense.deleteMany({ where: { vetVisitId: visitId } });
    await tx.vetVisit.delete({ where: { id: visitId } });
  });
};

module.exports = { getAll, getById, create, update, remove };
