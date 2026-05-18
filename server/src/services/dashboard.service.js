const prisma = require('../utils/prisma');
const { getAlerts } = require('./alert.service');
const { getAccessibleGroupIds } = require('../utils/groupAccess');

const getSummary = async (userId) => {
  const groupIds = await getAccessibleGroupIds(userId);

  if (groupIds.length === 0) {
    return {
      summary: {
        totalAnimals: 0,
        animalsWithPendingEvents: 0,
        overdueEventsCount: 0,
        pendingEventsCount: 0,
        monthlySpend: 0,
      },
      topAlerts: [],
      upcomingEvents: [],
    };
  }

  const animalFilter = { groupId: { in: groupIds } };

  const totalAnimals = await prisma.animal.count({ where: animalFilter });

  const overdueEventsCount = await prisma.healthEvent.count({
    where: { animal: animalFilter, status: 'OVERDUE' },
  });

  const pendingEventsCount = await prisma.healthEvent.count({
    where: { animal: animalFilter, status: 'PENDING' },
  });

  const animalsWithPending = await prisma.healthEvent.findMany({
    where: {
      animal: animalFilter,
      status: { in: ['PENDING', 'OVERDUE'] },
    },
    select: { animalId: true },
    distinct: ['animalId'],
  });
  const animalsWithPendingEvents = animalsWithPending.length;

  // Monthly spend
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const spendAgg = await prisma.expense.aggregate({
    where: {
      animal: animalFilter,
      expenseDate: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });
  const monthlySpend = parseFloat(spendAgg._sum.amount || 0);

  // Top 5 alerts
  const topAlerts = await getAlerts(userId, 5);

  // Upcoming events (next 7 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  weekFromNow.setHours(23, 59, 59, 999);

  const upcomingEvents = await prisma.healthEvent.findMany({
    where: {
      animal: animalFilter,
      status: 'PENDING',
      scheduledDate: { gte: today, lte: weekFromNow },
    },
    include: {
      animal: {
        select: {
          id: true,
          name: true,
          species: true,
          group: { select: { name: true } },
        },
      },
      eventType: { select: { name: true, category: true } },
    },
    orderBy: { scheduledDate: 'asc' },
    take: 10,
  });

  const formattedUpcoming = upcomingEvents.map((e) => ({
    id: e.id,
    scheduledDate: e.scheduledDate,
    animal: { id: e.animal.id, name: e.animal.name, species: e.animal.species },
    group: { name: e.animal.group.name },
    eventType: { name: e.eventType.name, category: e.eventType.category },
    product: e.product,
  }));

  return {
    summary: {
      totalAnimals,
      animalsWithPendingEvents,
      overdueEventsCount,
      pendingEventsCount,
      monthlySpend,
    },
    topAlerts,
    upcomingEvents: formattedUpcoming,
  };
};

const getUpcoming = async (userId, days = 7) => {
  const groupIds = await getAccessibleGroupIds(userId);

  if (groupIds.length === 0) {
    return [];
  }

  const limitDays = Math.min(Math.max(days, 1), 30);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + limitDays);
  endDate.setHours(23, 59, 59, 999);

  const events = await prisma.healthEvent.findMany({
    where: {
      animal: { groupId: { in: groupIds } },
      status: 'PENDING',
      scheduledDate: { gte: today, lte: endDate },
    },
    include: {
      animal: {
        select: {
          id: true,
          name: true,
          species: true,
          group: { select: { id: true, name: true } },
        },
      },
      eventType: { select: { id: true, name: true, category: true } },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  return events.map((e) => ({
    id: e.id,
    scheduledDate: e.scheduledDate,
    animal: { id: e.animal.id, name: e.animal.name, species: e.animal.species },
    group: e.animal.group,
    eventType: e.eventType,
    product: e.product,
  }));
};

module.exports = { getSummary, getUpcoming };
