const animalService = require('../services/animal.service');
const { ApiError } = require('../utils/ApiError');

const getAll = async (req, res, next) => {
  try {
    const animals = await animalService.getAll(req.user.id, req.query);
    res.json({ animals });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const animal = await animalService.getById(req.user.id, animalId);
    res.json({ animal });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, species, sex, groupId } = req.body;
    if (!name || !species || !sex || !groupId) {
      throw new ApiError(400, 'name, species, sex, and groupId are required');
    }
    if (!['DOG', 'CAT', 'OTHER'].includes(species)) {
      throw new ApiError(400, 'species must be DOG, CAT, or OTHER');
    }
    if (!['MALE', 'FEMALE', 'UNKNOWN'].includes(sex)) {
      throw new ApiError(400, 'sex must be MALE, FEMALE, or UNKNOWN');
    }
    const animal = await animalService.create(req.user.id, req.body, req.file);
    res.status(201).json({ animal });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    if (req.body.species && !['DOG', 'CAT', 'OTHER'].includes(req.body.species)) {
      throw new ApiError(400, 'species must be DOG, CAT, or OTHER');
    }
    if (req.body.sex && !['MALE', 'FEMALE', 'UNKNOWN'].includes(req.body.sex)) {
      throw new ApiError(400, 'sex must be MALE, FEMALE, or UNKNOWN');
    }
    const animal = await animalService.update(req.user.id, animalId, req.body, req.file);
    res.json({ animal });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    await animalService.remove(req.user.id, animalId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
