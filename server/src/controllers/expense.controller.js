const expenseService = require('../services/expense.service');

const getAll = async (req, res, next) => {
  try {
    const result = await expenseService.getAll(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await expenseService.getStats(req.user.id, req.query);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const expense = await expenseService.create(req.user.id, req.body);
    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const expenseId = parseInt(req.params.id, 10);
    const expense = await expenseService.update(req.user.id, expenseId, req.body);
    res.json({ expense });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const expenseId = parseInt(req.params.id, 10);
    await expenseService.remove(req.user.id, expenseId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getStats, create, update, remove };
