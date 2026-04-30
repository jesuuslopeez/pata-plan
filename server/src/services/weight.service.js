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

const ANOMALY_THRESHOLD = 0.1;
const ANOMALY_EVENT_TYPE_NAME = 'Anomalía de peso';

const computeAnomaly = (newValue, recentValues) => {
  if (recentValues.length < 3) {
    return { isAnomaly: false, mean: null, deviationPercent: null };
  }
  const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  const deviationPercent = ((newValue - mean) / mean) * 100;
  const isAnomaly = Math.abs(deviationPercent) > ANOMALY_THRESHOLD * 100;
  return { isAnomaly, mean, deviationPercent };
};

const buildAnomalyMessage = (value, mean, deviationPercent) => {
  const sign = deviationPercent >= 0 ? '+' : '';
  return (
    `Peso registrado: ${value.toFixed(2)} kg. ` +
    `Media histórica: ${mean.toFixed(2)} kg. ` +
    `Desviación: ${sign}${deviationPercent.toFixed(1)}%`
  );
};

const findOrCreateAnomalyEventType = async (tx) => {
  const existing = await tx.eventType.findFirst({
    where: { name: ANOMALY_EVENT_TYPE_NAME, category: 'CHECKUP' },
  });
  if (existing) {
    return existing;
  }
  return tx.eventType.create({
    data: {
      name: ANOMALY_EVENT_TYPE_NAME,
      category: 'CHECKUP',
      severityScore: 8,
    },
  });
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

  const { isAnomaly, mean, deviationPercent } = computeAnomaly(value, recentValues);
  const anomalyMessage = isAnomaly
    ? buildAnomalyMessage(value, mean, deviationPercent)
    : null;

  const weight = await prisma.$transaction(async (tx) => {
    const created = await tx.weightRecord.create({
      data: {
        animalId,
        valueKg: value,
        recordedAt: date,
        isAnomaly,
      },
    });

    if (isAnomaly) {
      const eventType = await findOrCreateAnomalyEventType(tx);
      await tx.healthEvent.create({
        data: {
          animalId,
          eventTypeId: eventType.id,
          scheduledDate: new Date(),
          status: 'PENDING',
          notes: anomalyMessage,
        },
      });
    }

    return created;
  });

  const result = { weight, anomalyDetected: isAnomaly };
  if (isAnomaly) {
    result.anomalyMessage = anomalyMessage;
  }

  return result;
};

module.exports = { getAll, create };
