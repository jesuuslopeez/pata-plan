const documentService = require('../services/document.service');

const getAll = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const documents = await documentService.getAll(req.user.id, animalId, req.query);
    res.json({ documents });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const document = await documentService.create(req.user.id, animalId, req.body, req.file);
    res.status(201).json({ document });
  } catch (err) {
    next(err);
  }
};

const createMany = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const documents = await documentService.createMany(req.user.id, animalId, req.body, req.files);
    res.status(201).json({ documents });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    const document = await documentService.update(req.user.id, documentId, req.body);
    res.json({ document });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    await documentService.remove(req.user.id, documentId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, createMany, update, remove };
