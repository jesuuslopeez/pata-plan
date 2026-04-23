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

module.exports = { getAll, getById, create, update, remove };
