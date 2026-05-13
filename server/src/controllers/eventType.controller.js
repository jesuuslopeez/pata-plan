const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const VALID_CATEGORIES = ['VACCINE', 'DEWORMING_INTERNAL', 'DEWORMING_EXTERNAL', 'TREATMENT', 'CHECKUP'];

const getAll = async (req, res, next) => {
  try {
    const includeCustom = req.query.includeCustom === 'true';
    const eventTypes = await prisma.eventType.findMany({
      where: includeCustom ? undefined : { isCustom: false },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ eventTypes });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, category, severityScore, isCustom } = req.body;
    if (!name || !name.trim()) {
      throw new ApiError(400, 'Falta el nombre');
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      throw new ApiError(400, `La categoría debe ser una de: ${VALID_CATEGORIES.join(', ')}`);
    }
    const eventType = await prisma.eventType.create({
      data: {
        name: name.trim(),
        category,
        severityScore: severityScore ? parseInt(severityScore, 10) : 5,
        isCustom: !!isCustom,
      },
    });
    res.status(201).json({ eventType });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create };
