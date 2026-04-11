const alertService = require('../services/alert.service');
const dashboardService = require('../services/dashboard.service');

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const alerts = await alertService.getAlerts(req.user.id, limit);
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
};

const getUpcoming = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const events = await dashboardService.getUpcoming(req.user.id, days);
    res.json({ events });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getAlerts, getUpcoming };
