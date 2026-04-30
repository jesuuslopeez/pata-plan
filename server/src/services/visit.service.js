const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const VISIT_INCLUDE = {
  documents: true,
  expenses: true,
};

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

const verifyVisitOwnership = async (visitId, userId) => {
  const groupIds = await getUserGroupIds(userId);
  const visit = await prisma.vetVisit.findFirst({
    where: {
      id: visitId,
      animal: { groupId: { in: groupIds } },
    },
    include: VISIT_INCLUDE,
  });
  if (!visit) {
    throw new ApiError(404, 'Visit not found');
  }
  return visit;
};

const parseDate = (value, field) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new ApiError(400, `${field} must be a valid date`);
  }
  return d;
};

const validateVisitData = (data, { partial = false } = {}) => {
  const out = {};

  if (data.visitDate !== undefined) {
    const d = parseDate(data.visitDate, 'visitDate');
    if (d.getTime() > Date.now()) {
      throw new ApiError(400, 'visitDate cannot be in the future');
    }
    out.visitDate = d;
  } else if (!partial) {
    throw new ApiError(400, 'visitDate is required');
  }

  if (data.reason !== undefined) {
    if (typeof data.reason !== 'string' || data.reason.trim().length === 0) {
      throw new ApiError(400, 'reason is required');
    }
    const trimmed = data.reason.trim();
    if (trimmed.length > 200) {
      throw new ApiError(400, 'reason must be at most 200 characters');
    }
    out.reason = trimmed;
  } else if (!partial) {
    throw new ApiError(400, 'reason is required');
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
      throw new ApiError(400, 'vetName must be a string');
    } else if (data.vetName.trim().length > 100) {
      throw new ApiError(400, 'vetName must be at most 100 characters');
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
        throw new ApiError(400, 'cost must be a positive number');
      }
      out.cost = n;
    }
  }

  return out;
};

const getAll = async (userId, animalId, query = {}) => {
  await verifyAnimalOwnership(animalId, userId);

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
  return verifyVisitOwnership(visitId, userId);
};

const create = async (userId, animalId, data) => {
  await verifyAnimalOwnership(animalId, userId);

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
  const existing = await verifyVisitOwnership(visitId, userId);

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

    if (validated.cost !== undefined) {
      const existingExpense = await tx.expense.findFirst({
        where: { vetVisitId: visitId },
      });

      if (validated.cost === null) {
        if (existingExpense) {
          await tx.expense.delete({ where: { id: existingExpense.id } });
        }
      } else if (existingExpense) {
        await tx.expense.update({
          where: { id: existingExpense.id },
          data: { amount: validated.cost },
        });
      } else {
        await tx.expense.create({
          data: {
            animalId: existing.animalId,
            vetVisitId: visitId,
            amount: validated.cost,
            category: 'OTHER',
            description: validated.reason ?? existing.reason,
            expenseDate: validated.visitDate ?? existing.visitDate,
          },
        });
      }
    }

    return tx.vetVisit.findUnique({
      where: { id: visitId },
      include: VISIT_INCLUDE,
    });
  });

  return visit;
};

const remove = async (userId, visitId) => {
  await verifyVisitOwnership(visitId, userId);
  await prisma.vetVisit.delete({ where: { id: visitId } });
};

module.exports = { getAll, getById, create, update, remove };
