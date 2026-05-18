const eventService = require('../services/event.service');

const getAll = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const events = await eventService.getAll(req.user.id, animalId, req.query);
    res.json({ events });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const event = await eventService.create(req.user.id, animalId, req.body);
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const event = await eventService.update(req.user.id, eventId, req.body);
    res.json({ event });
  } catch (err) {
    next(err);
  }
};

const complete = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const result = await eventService.complete(req.user.id, eventId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    await eventService.remove(req.user.id, eventId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, complete, remove };
