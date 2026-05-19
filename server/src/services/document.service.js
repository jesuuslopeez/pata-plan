const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');
const { getAccessibleGroupIds, getEditableGroupIds } = require('../utils/groupAccess');

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

const verifyVisitBelongsToAnimal = async (vetVisitId, animalId) => {
  const visit = await prisma.vetVisit.findFirst({
    where: { id: vetVisitId, animalId },
  });
  if (!visit) {
    throw new ApiError(400, 'La visita indicada no pertenece a este animal');
  }
  return visit;
};

const verifyDocumentEditAccess = async (documentId, userId) => {
  const groupIds = await getEditableGroupIds(userId);
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      animal: { groupId: { in: groupIds } },
    },
  });
  if (!document) {
    throw new ApiError(403, 'No tienes permiso para modificar este documento');
  }
  return document;
};

const removeFileFromDisk = (fileUrl) => {
  if (!fileUrl) {
    return;
  }
  const filePath = path.join(__dirname, '../..', fileUrl);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.warn(`Failed to delete file ${filePath}:`, err.message);
    } else if (err && err.code === 'ENOENT') {
      console.warn(`File not found on disk, skipping unlink: ${filePath}`);
    }
  });
};

const parseVetVisitId = (raw) => {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    throw new ApiError(400, 'El identificador de visita no es válido');
  }
  return id;
};

const sanitizeDescription = (raw) => {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  return String(raw).trim() || null;
};

const buildDocumentRecord = (animalId, vetVisitId, description, file) => ({
  animalId,
  vetVisitId: vetVisitId ?? null,
  filename: file.originalname,
  fileUrl: `/uploads/documents/${file.filename}`,
  fileType: file.mimetype,
  description: description ?? null,
});

const getAll = async (userId, animalId, query = {}) => {
  await verifyAnimalAccess(animalId, userId);

  const where = { animalId };

  if (query.vetVisitId !== undefined) {
    const vetVisitId = parseVetVisitId(query.vetVisitId);
    if (vetVisitId !== null) {
      where.vetVisitId = vetVisitId;
    }
  }

  const documents = await prisma.document.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
  });

  return documents;
};

const create = async (userId, animalId, data, file) => {
  await verifyAnimalEditAccess(animalId, userId);

  if (!file) {
    throw new ApiError(400, 'Falta el archivo');
  }

  const vetVisitId = parseVetVisitId(data.vetVisitId);
  if (vetVisitId !== null) {
    await verifyVisitBelongsToAnimal(vetVisitId, animalId);
  }

  const description = sanitizeDescription(data.description);

  const document = await prisma.document.create({
    data: buildDocumentRecord(animalId, vetVisitId, description, file),
  });

  return document;
};

const createMany = async (userId, animalId, data, files) => {
  await verifyAnimalEditAccess(animalId, userId);

  if (!files || files.length === 0) {
    throw new ApiError(400, 'Se requiere al menos un archivo');
  }

  const vetVisitId = parseVetVisitId(data.vetVisitId);
  if (vetVisitId !== null) {
    await verifyVisitBelongsToAnimal(vetVisitId, animalId);
  }

  const description = sanitizeDescription(data.description);

  const documents = await prisma.$transaction(
    files.map((file) =>
      prisma.document.create({
        data: buildDocumentRecord(animalId, vetVisitId, description, file),
      })
    )
  );

  return documents;
};

const update = async (userId, documentId, data) => {
  await verifyDocumentEditAccess(documentId, userId);

  const updateData = {};

  if (data.filename !== undefined) {
    if (typeof data.filename !== 'string' || !data.filename.trim()) {
      throw new ApiError(400, 'El nombre del archivo no puede estar vacío');
    }
    const trimmed = data.filename.trim();
    if (trimmed.length > 255) {
      throw new ApiError(400, 'El nombre del archivo no puede superar los 255 caracteres');
    }
    updateData.filename = trimmed;
  }

  if (data.description !== undefined) {
    updateData.description = sanitizeDescription(data.description);
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'No hay campos que actualizar');
  }

  return prisma.document.update({
    where: { id: documentId },
    data: updateData,
  });
};

const remove = async (userId, documentId) => {
  const existing = await verifyDocumentEditAccess(documentId, userId);

  await prisma.document.delete({ where: { id: documentId } });

  removeFileFromDisk(existing.fileUrl);
};

module.exports = { getAll, create, createMany, update, remove };
