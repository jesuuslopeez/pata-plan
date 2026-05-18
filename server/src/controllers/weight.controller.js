const weightService = require('../services/weight.service');

const getAll = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const result = await weightService.getAll(req.user.id, animalId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const result = await weightService.create(req.user.id, animalId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const weightId = parseInt(req.params.id, 10);
    const weight = await weightService.update(req.user.id, weightId, req.body);
    res.json({ weight });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const weightId = parseInt(req.params.id, 10);
    await weightService.remove(req.user.id, weightId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
