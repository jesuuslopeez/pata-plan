const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');
const {
  getAccessibleGroupIds,
  getEditableGroupIds,
} = require('../utils/groupAccess');

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

const getAll = async (userId, animalId) => {
  await verifyAnimalAccess(animalId, userId);

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
  await verifyAnimalEditAccess(animalId, userId);

  const value = parseFloat(valueKg);
  if (isNaN(value) || value <= 0 || value > 200) {
    throw new ApiError(400, 'El peso debe ser un número positivo de hasta 200 kg');
  }

  const date = new Date(recordedAt);
  if (isNaN(date.getTime())) {
    throw new ApiError(400, 'La fecha del registro no es válida');
  }
  if (date > new Date()) {
    throw new ApiError(400, 'La fecha del registro no puede ser futura');
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

const verifyWeightEditAccess = async (weightId, userId) => {
  const groupIds = await getEditableGroupIds(userId);
  const weight = await prisma.weightRecord.findFirst({
    where: {
      id: weightId,
      animal: { groupId: { in: groupIds } },
    },
  });
  if (!weight) {
    throw new ApiError(403, 'No tienes permiso para modificar este registro');
  }
  return weight;
};

const validateWeightInput = ({ valueKg, recordedAt }, { partial = false } = {}) => {
  const out = {};

  if (valueKg !== undefined) {
    const value = parseFloat(valueKg);
    if (isNaN(value) || value <= 0 || value > 200) {
      throw new ApiError(400, 'El peso debe ser un número positivo de hasta 200 kg');
    }
    out.valueKg = value;
  } else if (!partial) {
    throw new ApiError(400, 'Falta el peso');
  }

  if (recordedAt !== undefined) {
    const date = new Date(recordedAt);
    if (isNaN(date.getTime())) {
      throw new ApiError(400, 'La fecha del registro no es válida');
    }
    if (date > new Date()) {
      throw new ApiError(400, 'La fecha del registro no puede ser futura');
    }
    out.recordedAt = date;
  } else if (!partial) {
    throw new ApiError(400, 'Falta la fecha del registro');
  }

  return out;
};

const update = async (userId, weightId, data) => {
  await verifyWeightEditAccess(weightId, userId);
  const validated = validateWeightInput(data, { partial: true });
  if (Object.keys(validated).length === 0) {
    throw new ApiError(400, 'No hay campos que actualizar');
  }
  return prisma.weightRecord.update({
    where: { id: weightId },
    data: validated,
  });
};

const remove = async (userId, weightId) => {
  await verifyWeightEditAccess(weightId, userId);
  await prisma.weightRecord.delete({ where: { id: weightId } });
};

module.exports = { getAll, create, update, remove };
