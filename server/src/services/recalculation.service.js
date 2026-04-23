const prisma = require('../utils/prisma');

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const diffDays = (dateA, dateB) => {
  const msPerDay = 86400000;
  return Math.round((dateA.getTime() - dateB.getTime()) / msPerDay);
};

const recalculateCascade = async (completedEvent, completedDate) => {
  if (!completedEvent.protocolAssignmentId) {
    return null;
  }

  const delayDays = diffDays(completedDate, new Date(completedEvent.scheduledDate));
  if (delayDays <= 0) {
    return null;
  }

  const assignment = await prisma.protocolAssignment.findUnique({
    where: { id: completedEvent.protocolAssignmentId },
    select: { status: true },
  });
  if (!assignment || assignment.status === 'CANCELLED') {
    return null;
  }

  const pendingEvents = await prisma.healthEvent.findMany({
    where: {
      protocolAssignmentId: completedEvent.protocolAssignmentId,
      status: 'PENDING',
      scheduledDate: { gt: completedEvent.scheduledDate },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  if (pendingEvents.length === 0) {
    return null;
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const event of pendingEvents) {
      const newDate = addDays(event.scheduledDate, delayDays);
      const newStatus = newDate < now ? 'OVERDUE' : 'PENDING';

      await tx.healthEvent.update({
        where: { id: event.id },
        data: {
          scheduledDate: newDate,
          status: newStatus,
        },
      });
    }
  });

  return { delayDays, eventsUpdated: pendingEvents.length };
};

module.exports = { recalculateCascade };
