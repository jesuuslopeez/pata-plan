const collaboratorService = require('../services/collaborator.service');

const getAll = async (req, res, next) => {
  try {
    const collaborators = await collaboratorService.getAll();
    res.json({ collaborators });
  } catch (err) {
    next(err);
  }
};

const invite = async (req, res, next) => {
  try {
    const result = await collaboratorService.invite(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    await collaboratorService.remove(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, invite, remove };
