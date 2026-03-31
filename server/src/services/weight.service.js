const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const verifyAnimalOwnership = async (animalId, userId) => {
  const groups = await prisma.group.findMany({
    where: { userId },
    select: { id: true },
  });
  const groupIds = groups.map((g) => g.id);

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, groupId: { in: groupIds } },
  });
  if (!animal) {
    throw new ApiError(404, 'Animal not found');
  }
  return animal;
};

const getAll = async (userId, animalId) => {
  await verifyAnimalOwnership(animalId, userId);

  const weights = await prisma.weightRecord.findMany({
    where: { animalId },
    orderBy: { recordedAt: 'asc' },
  });

  let trend = null;
  if (weights.length > 0) {
    const values = weights.map((w) => parseFloat(w.valueKg));
    const current = values[values.length - 1];
    const previous = values.length > 1 ? values[values.length - 2] : null;
    const sum = values.reduce((a, b) => a + b, 0);

    trend = {
      currentWeight: current,
      previousWeight: previous,
      changeKg: previous !== null ? parseFloat((current - previous).toFixed(2)) : null,
      changePercent:
        previous !== null ? parseFloat((((current - previous) / previous) * 100).toFixed(2)) : null,
      averageWeight: parseFloat((sum / values.length).toFixed(2)),
      minWeight: Math.min(...values),
      maxWeight: Math.max(...values),
      totalRecords: weights.length,
    };
  }

  return { weights, trend };
};

const detectAnomaly = (newValue, recentValues) => {
  if (recentValues.length < 3) {
    return false;
  }

  const sum = recentValues.reduce((a, b) => a + b, 0);
  const mean = sum / recentValues.length;
  const deviation = Math.abs(newValue - mean);
  const threshold = mean * 0.1;

  return deviation > threshold;
};

const create = async (userId, animalId, { valueKg, recordedAt }) => {
  await verifyAnimalOwnership(animalId, userId);

  const value = parseFloat(valueKg);
  if (isNaN(value) || value <= 0 || value > 200) {
    throw new ApiError(400, 'valueKg must be a positive number up to 200');
  }

  const date = new Date(recordedAt);
  if (isNaN(date.getTime())) {
    throw new ApiError(400, 'recordedAt must be a valid date');
  }
  if (date > new Date()) {
    throw new ApiError(400, 'recordedAt cannot be a future date');
  }

  const recentRecords = await prisma.weightRecord.findMany({
    where: { animalId },
    orderBy: { recordedAt: 'desc' },
    take: 5,
    select: { valueKg: true },
  });
  const recentValues = recentRecords.map((r) => parseFloat(r.valueKg));

  const isAnomaly = detectAnomaly(value, recentValues);

  const weight = await prisma.weightRecord.create({
    data: {
      animalId,
      valueKg: value,
      recordedAt: date,
      isAnomaly,
    },
  });

  const result = { weight, anomalyDetected: isAnomaly };
  if (isAnomaly) {
    result.anomalyMessage =
      'Peso registrado con una desviación significativa respecto al historial del animal';
  }

  return result;
};

module.exports = { getAll, create };
