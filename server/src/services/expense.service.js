const { Prisma } = require('.prisma/client');
const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const VALID_CATEGORIES = ['VACCINE', 'DEWORMING', 'SURGERY', 'MEDICATION', 'FOOD', 'OTHER'];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const ANIMAL_INCLUDE = {
  animal: { select: { id: true, name: true, species: true } },
  vetVisit: { select: { id: true, reason: true } },
};

const { getAccessibleGroupIds, getEditableGroupIds } = require('../utils/groupAccess');

const getUserAnimalIds = async (userId) => {
  const groupIds = await getAccessibleGroupIds(userId);
  if (groupIds.length === 0) {
    return [];
  }
  const animals = await prisma.animal.findMany({
    where: { groupId: { in: groupIds } },
    select: { id: true, name: true },
  });
  return animals;
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

const verifyExpenseEditAccess = async (expenseId, userId) => {
  const groupIds = await getEditableGroupIds(userId);
  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      animal: { groupId: { in: groupIds } },
    },
  });
  if (!expense) {
    throw new ApiError(403, 'No tienes permiso para modificar este gasto');
  }
  return expense;
};

const verifyVisitBelongsToAnimal = async (vetVisitId, animalId) => {
  const visit = await prisma.vetVisit.findFirst({
    where: { id: vetVisitId, animalId },
  });
  if (!visit) {
    throw new ApiError(400, 'La visita indicada no pertenece a este animal');
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

const validateExpenseData = (data, { partial = false } = {}) => {
  const out = {};

  if (data.amount !== undefined) {
    const n = Number(data.amount);
    if (isNaN(n) || n <= 0) {
      throw new ApiError(400, 'El importe debe ser un número positivo');
    }
    out.amount = n;
  } else if (!partial) {
    throw new ApiError(400, 'Falta el importe');
  }

  if (data.category !== undefined) {
    if (!VALID_CATEGORIES.includes(data.category)) {
      throw new ApiError(400, `La categoría debe ser una de: ${VALID_CATEGORIES.join(', ')}`);
    }
    out.category = data.category;
  } else if (!partial) {
    throw new ApiError(400, 'Falta la categoría');
  }

  if (data.expenseDate !== undefined) {
    out.expenseDate = parseDate(data.expenseDate, 'expenseDate');
  } else if (!partial) {
    throw new ApiError(400, 'Falta la fecha del gasto');
  }

  if (data.description !== undefined) {
    if (data.description === null || data.description === '') {
      out.description = null;
    } else if (typeof data.description !== 'string') {
      throw new ApiError(400, 'La descripción debe ser texto');
    } else {
      const trimmed = data.description.trim();
      if (trimmed.length > 300) {
        throw new ApiError(400, 'La descripción no puede superar los 300 caracteres');
      }
      out.description = trimmed || null;
    }
  }

  if (data.vetVisitId !== undefined) {
    if (data.vetVisitId === null || data.vetVisitId === '') {
      out.vetVisitId = null;
    } else {
      const id = parseInt(data.vetVisitId, 10);
      if (isNaN(id)) {
        throw new ApiError(400, 'El identificador de visita no es válido');
      }
      out.vetVisitId = id;
    }
  }

  return out;
};

const buildListWhere = async (userId, query) => {
  const groupIds = await getAccessibleGroupIds(userId);
  if (groupIds.length === 0) {
    return null;
  }

  const where = { animal: { groupId: { in: groupIds } } };

  if (query.animalId !== undefined) {
    const id = parseInt(query.animalId, 10);
    if (isNaN(id)) {
      throw new ApiError(400, 'El identificador de animal no es válido');
    }
    where.animalId = id;
  }

  if (query.category !== undefined) {
    if (!VALID_CATEGORIES.includes(query.category)) {
      throw new ApiError(400, `La categoría debe ser una de: ${VALID_CATEGORIES.join(', ')}`);
    }
    where.category = query.category;
  }

  if (query.dateFrom || query.dateTo) {
    where.expenseDate = {};
    if (query.dateFrom) {
      where.expenseDate.gte = parseDate(query.dateFrom, 'dateFrom');
    }
    if (query.dateTo) {
      where.expenseDate.lte = parseDate(query.dateTo, 'dateTo');
    }
  }

  return where;
};

const getAll = async (userId, query = {}) => {
  const where = await buildListWhere(userId, query);
  if (where === null) {
    return { expenses: [], total: 0 };
  }

  const sort = query.sort === 'asc' ? 'asc' : 'desc';

  const limit = (() => {
    if (query.limit === undefined) {
      return DEFAULT_LIMIT;
    }
    const n = parseInt(query.limit, 10);
    if (isNaN(n) || n <= 0) {
      throw new ApiError(400, 'El límite debe ser un número entero positivo');
    }
    return Math.min(n, MAX_LIMIT);
  })();

  const offset = (() => {
    if (query.offset === undefined) {
      return 0;
    }
    const n = parseInt(query.offset, 10);
    if (isNaN(n) || n < 0) {
      throw new ApiError(400, 'El offset debe ser un número entero no negativo');
    }
    return n;
  })();

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: ANIMAL_INCLUDE,
      orderBy: { expenseDate: sort },
      take: limit,
      skip: offset,
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total };
};

const create = async (userId, data) => {
  if (!data.animalId) {
    throw new ApiError(400, 'Falta el animal');
  }
  const animalId = parseInt(data.animalId, 10);
  if (isNaN(animalId)) {
    throw new ApiError(400, 'animalId must be an integer');
  }

  await verifyAnimalEditAccess(animalId, userId);

  const validated = validateExpenseData(data, { partial: false });

  if (validated.vetVisitId) {
    await verifyVisitBelongsToAnimal(validated.vetVisitId, animalId);
  }

  const expense = await prisma.expense.create({
    data: {
      animalId,
      amount: validated.amount,
      category: validated.category,
      description: validated.description ?? null,
      expenseDate: validated.expenseDate,
      vetVisitId: validated.vetVisitId ?? null,
    },
    include: ANIMAL_INCLUDE,
  });

  return expense;
};

const update = async (userId, expenseId, data) => {
  const existing = await verifyExpenseEditAccess(expenseId, userId);

  const validated = validateExpenseData(data, { partial: true });

  let targetAnimalId = existing.animalId;

  if (data.animalId !== undefined) {
    const newAnimalId = parseInt(data.animalId, 10);
    if (isNaN(newAnimalId)) {
      throw new ApiError(400, 'El identificador de animal no es válido');
    }
    await verifyAnimalEditAccess(newAnimalId, userId);
    targetAnimalId = newAnimalId;
  }

  if (validated.vetVisitId) {
    await verifyVisitBelongsToAnimal(validated.vetVisitId, targetAnimalId);
  }

  const updateData = {};
  if (data.animalId !== undefined) {
    updateData.animalId = targetAnimalId;
  }
  if (validated.amount !== undefined) {
    updateData.amount = validated.amount;
  }
  if (validated.category !== undefined) {
    updateData.category = validated.category;
  }
  if (validated.description !== undefined) {
    updateData.description = validated.description;
  }
  if (validated.expenseDate !== undefined) {
    updateData.expenseDate = validated.expenseDate;
  }
  if (validated.vetVisitId !== undefined) {
    updateData.vetVisitId = validated.vetVisitId;
  }

  const expense = await prisma.expense.update({
    where: { id: expenseId },
    data: updateData,
    include: ANIMAL_INCLUDE,
  });

  return expense;
};

const remove = async (userId, expenseId) => {
  await verifyExpenseEditAccess(expenseId, userId);
  await prisma.expense.delete({ where: { id: expenseId } });
};

const toNumber = (decimal) => (decimal === null || decimal === undefined ? 0 : Number(decimal));

const getStats = async (userId, query = {}) => {
  const groupIds = await getAccessibleGroupIds(userId);
  if (groupIds.length === 0) {
    return emptyStats(query.year);
  }

  const animals = await getUserAnimalIds(userId);
  const animalMap = Object.fromEntries(animals.map((a) => [a.id, a.name]));
  const animalIds = animals.map((a) => a.id);
  if (animalIds.length === 0) {
    return emptyStats(query.year);
  }

  const now = new Date();
  const year = (() => {
    if (query.year === undefined) {
      return now.getFullYear();
    }
    const n = parseInt(query.year, 10);
    if (isNaN(n)) {
      throw new ApiError(400, 'El año no es válido');
    }
    return n;
  })();

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevMonthEnd = monthStart;

  const baseWhere = { animalId: { in: animalIds } };

  const [
    totalAllTimeAgg,
    totalThisYearAgg,
    totalThisMonthAgg,
    previousMonthAgg,
    byCategoryRaw,
    byAnimalRaw,
    byMonthRaw,
  ] = await Promise.all([
    prisma.expense.aggregate({
      where: baseWhere,
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { ...baseWhere, expenseDate: { gte: yearStart, lt: yearEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { ...baseWhere, expenseDate: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { ...baseWhere, expenseDate: { gte: prevMonthStart, lt: prevMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: baseWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.expense.groupBy({
      by: ['animalId'],
      where: baseWhere,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.$queryRaw`
      SELECT to_char(date_trunc('month', "expenseDate"), 'YYYY-MM') AS month,
             SUM("amount")::float AS total
      FROM "Expense"
      WHERE "animalId" IN (${Prisma.join(animalIds)})
        AND "expenseDate" >= ${yearStart}
        AND "expenseDate" <  ${yearEnd}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  const totalAllTime = round2(toNumber(totalAllTimeAgg._sum.amount));
  const totalThisYear = round2(toNumber(totalThisYearAgg._sum.amount));
  const totalThisMonth = round2(toNumber(totalThisMonthAgg._sum.amount));
  const previousMonthTotal = round2(toNumber(previousMonthAgg._sum.amount));

  const averagePerAnimal = animalIds.length > 0 ? round2(totalAllTime / animalIds.length) : 0;

  const byCategory = VALID_CATEGORIES.map((cat) => {
    const row = byCategoryRaw.find((r) => r.category === cat);
    return {
      category: cat,
      total: round2(toNumber(row?._sum.amount)),
      count: row ? row._count._all : 0,
    };
  });

  const byAnimal = byAnimalRaw.map((r) => ({
    animalId: r.animalId,
    animalName: animalMap[r.animalId] ?? 'Unknown',
    total: round2(toNumber(r._sum.amount)),
  }));

  const byMonth = buildMonthSeries(year, byMonthRaw);

  const monthlyChangePercent = (() => {
    if (previousMonthTotal === 0) {
      return totalThisMonth === 0 ? 0 : null;
    }
    return round2(((totalThisMonth - previousMonthTotal) / previousMonthTotal) * 100);
  })();

  return {
    totalAllTime,
    totalThisYear,
    totalThisMonth,
    averagePerAnimal,
    byCategory,
    byAnimal,
    byMonth,
    previousMonthTotal,
    monthlyChangePercent,
  };
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const buildMonthSeries = (year, rows) => {
  const map = Object.fromEntries(rows.map((r) => [r.month, Number(r.total)]));
  const series = [];
  for (let m = 1; m <= 12; m += 1) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    series.push({ month: key, total: round2(map[key] ?? 0) });
  }
  return series;
};

const emptyStats = (rawYear) => {
  const year = rawYear ? parseInt(rawYear, 10) : new Date().getFullYear();
  const safeYear = isNaN(year) ? new Date().getFullYear() : year;
  return {
    totalAllTime: 0,
    totalThisYear: 0,
    totalThisMonth: 0,
    averagePerAnimal: 0,
    byCategory: VALID_CATEGORIES.map((c) => ({ category: c, total: 0, count: 0 })),
    byAnimal: [],
    byMonth: buildMonthSeries(safeYear, []),
    previousMonthTotal: 0,
    monthlyChangePercent: 0,
  };
};

module.exports = { getAll, create, update, remove, getStats };
