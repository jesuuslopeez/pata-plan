const protocolService = require('../services/protocol.service');

const getAll = async (req, res, next) => {
  try {
    const protocols = await protocolService.getAll(req.user.id);
    res.json({ protocols });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const protocolId = parseInt(req.params.id, 10);
    const protocol = await protocolService.getById(req.user.id, protocolId);
    res.json({ protocol });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const protocol = await protocolService.create(req.user.id, req.body);
    res.status(201).json({ protocol });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const protocolId = parseInt(req.params.id, 10);
    const protocol = await protocolService.update(req.user.id, protocolId, req.body);
    res.json({ protocol });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const protocolId = parseInt(req.params.id, 10);
    await protocolService.remove(req.user.id, protocolId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

const addStep = async (req, res, next) => {
  try {
    const protocolId = parseInt(req.params.id, 10);
    const step = await protocolService.addStep(req.user.id, protocolId, req.body);
    res.status(201).json({ step });
  } catch (err) {
    next(err);
  }
};

const updateStep = async (req, res, next) => {
  try {
    const protocolId = parseInt(req.params.protocolId, 10);
    const stepId = parseInt(req.params.stepId, 10);
    const step = await protocolService.updateStep(req.user.id, protocolId, stepId, req.body);
    res.json({ step });
  } catch (err) {
    next(err);
  }
};

const removeStep = async (req, res, next) => {
  try {
    const protocolId = parseInt(req.params.protocolId, 10);
    const stepId = parseInt(req.params.stepId, 10);
    await protocolService.removeStep(req.user.id, protocolId, stepId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

const reorderSteps = async (req, res, next) => {
  try {
    const protocolId = parseInt(req.params.id, 10);
    const steps = await protocolService.reorderSteps(req.user.id, protocolId, req.body.stepIds);
    res.json({ steps });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  addStep,
  updateStep,
  removeStep,
  reorderSteps,
};
