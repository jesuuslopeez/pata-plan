const fs = require('fs');
const path = require('path');
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
  });
  if (!animal) {
    throw new ApiError(404, 'Animal not found');
  }
  return animal;
};

const verifyVisitBelongsToAnimal = async (vetVisitId, animalId) => {
  const visit = await prisma.vetVisit.findFirst({
    where: { id: vetVisitId, animalId },
  });
  if (!visit) {
    throw new ApiError(400, 'vetVisitId does not belong to the given animal');
  }
  return visit;
};

const verifyDocumentOwnership = async (documentId, userId) => {
  const groupIds = await getUserGroupIds(userId);
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      animal: { groupId: { in: groupIds } },
    },
  });
  if (!document) {
    throw new ApiError(404, 'Document not found');
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
    throw new ApiError(400, 'vetVisitId must be an integer');
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
  await verifyAnimalOwnership(animalId, userId);

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
  await verifyAnimalOwnership(animalId, userId);

  if (!file) {
    throw new ApiError(400, 'File is required');
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
  await verifyAnimalOwnership(animalId, userId);

  if (!files || files.length === 0) {
    throw new ApiError(400, 'At least one file is required');
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

const remove = async (userId, documentId) => {
  const existing = await verifyDocumentOwnership(documentId, userId);

  await prisma.document.delete({ where: { id: documentId } });

  removeFileFromDisk(existing.fileUrl);
};

module.exports = { getAll, create, createMany, remove };
