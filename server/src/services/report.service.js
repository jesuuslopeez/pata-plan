const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');
const { getAccessibleGroupIds } = require('../utils/groupAccess');

const verifyAnimalAccess = async (animalId, userId) => {
  const groupIds = await getAccessibleGroupIds(userId);
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, groupId: { in: groupIds } },
    include: { group: { select: { id: true, name: true } } },
  });
  if (!animal) {
    throw new ApiError(404, 'Animal no encontrado');
  }
  return animal;
};

const gatherReportData = async (userId, animalId) => {
  const animal = await verifyAnimalAccess(animalId, userId);

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
