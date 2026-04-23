const prisma = require('../utils/prisma');

const DEFAULT_SEVERITY = {
  TREATMENT: 10,
  VACCINE: 7,
  DEWORMING_INTERNAL: 5,
  DEWORMING_EXTERNAL: 5,
  CHECKUP: 3,
};

const diffDays = (dateA, dateB) => {
  const msPerDay = 86400000;
  return Math.round((dateA.getTime() - dateB.getTime()) / msPerDay);
};

const calcDaysOverdueFactor = (scheduledDate, now) => {
  const daysUntil = diffDays(new Date(scheduledDate), now);

  if (daysUntil < 0) {
    // Overdue
    return Math.abs(daysUntil) * 3;
  }
  if (daysUntil === 0) {
    return 3;
  }
  if (daysUntil <= 3) {
    return 2;
  }
  if (daysUntil <= 7) {
    return 1;
  }
  return 0;
};

const calcSeverityFactor = (eventType) => {
  if (eventType.severityScore) {
    return eventType.severityScore;
  }
  return DEFAULT_SEVERITY[eventType.category] || 5;
};

const calcAnimalMultiplier = (animal, now) => {
  let multiplier = 1.0;

  if (animal.dateOfBirth) {
    const ageMs = now.getTime() - new Date(animal.dateOfBirth).getTime();
    const ageMonths = ageMs / (30.44 * 86400000);
    if (ageMonths < 6) {
      multiplier = Math.max(multiplier, 1.5);
    }
  }

  const createdMs = now.getTime() - new Date(animal.createdAt).getTime();
  const createdDays = createdMs / 86400000;
  if (createdDays < 30) {
    multiplier = Math.max(multiplier, 1.3);
  }

  return multiplier;
};

const getUrgencyLabel = (score) => {
  if (score >= 30) {
    return 'critical';
  }
  if (score >= 15) {
    return 'high';
  }
  if (score >= 5) {
    return 'medium';
  }
  return 'low';
};

const getAlerts = async (userId, limit = 20) => {
  const groups = await prisma.group.findMany({
    where: { userId },
    select: { id: true },
  });
  const groupIds = groups.map((g) => g.id);

  if (groupIds.length === 0) {
    return [];
  }

  const events = await prisma.healthEvent.findMany({
    where: {
      status: { in: ['PENDING', 'OVERDUE'] },
      animal: { groupId: { in: groupIds } },
    },
    include: {
      eventType: {
        select: { id: true, name: true, category: true, severityScore: true },
      },
      animal: {
        select: {
          id: true,
          name: true,
          species: true,
          photoUrl: true,
          dateOfBirth: true,
          createdAt: true,
          group: { select: { id: true, name: true } },
        },
      },
    },
  });

  const now = new Date();

  const alerts = events.map((event) => {
    const daysOverdueFactor = calcDaysOverdueFactor(event.scheduledDate, now);
    const severityFactor = calcSeverityFactor(event.eventType);
    const animalMultiplier = calcAnimalMultiplier(event.animal, now);

    const score = parseFloat(
      ((daysOverdueFactor + severityFactor) * animalMultiplier).toFixed(1)
    );

    const daysOverdue = diffDays(now, new Date(event.scheduledDate));

    return {
      id: event.id,
      score,
      urgency: getUrgencyLabel(score),
      animal: {
        id: event.animal.id,
        name: event.animal.name,
        species: event.animal.species,
        photoUrl: event.animal.photoUrl,
      },
      group: event.animal.group,
      eventType: {
        name: event.eventType.name,
        category: event.eventType.category,
      },
      scheduledDate: event.scheduledDate,
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
      product: event.product,
      status: event.status,
    };
  });

  alerts.sort((a, b) => b.score - a.score);

  return alerts.slice(0, limit);
};

module.exports = { getAlerts };
