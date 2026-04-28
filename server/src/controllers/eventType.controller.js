const prisma = require('../utils/prisma');

const getAll = async (req, res, next) => {
  try {
    const eventTypes = await prisma.eventType.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ eventTypes });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll };
