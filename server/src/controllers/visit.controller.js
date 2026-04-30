const visitService = require('../services/visit.service');

const getAll = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const visits = await visitService.getAll(req.user.id, animalId, req.query);
    res.json({ visits });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const visitId = parseInt(req.params.id, 10);
    const visit = await visitService.getById(req.user.id, visitId);
    res.json({ visit });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const visit = await visitService.create(req.user.id, animalId, req.body);
    res.status(201).json({ visit });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const visitId = parseInt(req.params.id, 10);
    const visit = await visitService.update(req.user.id, visitId, req.body);
    res.json({ visit });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const visitId = parseInt(req.params.id, 10);
    await visitService.remove(req.user.id, visitId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
