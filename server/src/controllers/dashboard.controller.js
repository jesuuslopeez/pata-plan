const alertService = require('../services/alert.service');

const getAlerts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const alerts = await alertService.getAlerts(req.user.id, limit);
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAlerts };
