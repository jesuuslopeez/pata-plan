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
    include: { group: { select: { id: true, name: true } } },
  });
  if (!animal) {
    throw new ApiError(404, 'Animal not found');
  }
  return animal;
};

const gatherReportData = async (userId, animalId) => {
  const animal = await verifyAnimalOwnership(animalId, userId);

  const [healthEvents, vetVisits, weightRecords, expenses] = await Promise.all([
    prisma.healthEvent.findMany({
      where: { animalId },
      include: {
        eventType: { select: { id: true, name: true, category: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    }),
    prisma.vetVisit.findMany({
      where: { animalId },
      orderBy: { visitDate: 'desc' },
    }),
    prisma.weightRecord.findMany({
      where: { animalId },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.expense.findMany({
      where: { animalId },
      orderBy: { expenseDate: 'desc' },
    }),
  ]);

  return { animal, healthEvents, vetVisits, weightRecords, expenses };
};

module.exports = { gatherReportData };
