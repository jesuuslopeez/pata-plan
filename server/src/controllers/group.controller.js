const groupService = require('../services/group.service');

const getAll = async (req, res, next) => {
  try {
    const groups = await groupService.getAll(req.user.id);
    res.json({ groups });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const group = await groupService.create(req.user.id, req.body);
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const group = await groupService.update(req.user.id, groupId, req.body);
    res.json({ group });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    await groupService.remove(req.user.id, groupId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
