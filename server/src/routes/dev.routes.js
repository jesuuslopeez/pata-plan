const { Router } = require('express');
const { runDailyNotifications } = require('../services/notification.service');

const router = Router();

const requireTriggerToken = (req, res, next) => {
  const expected = process.env.NOTIFICATIONS_TRIGGER_TOKEN;
  if (!expected) {
    return res.status(404).json({ error: 'Not found' });
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  next();
};

router.post('/run-notifications', requireTriggerToken, async (req, res, next) => {
  try {
    const stats = await runDailyNotifications();
    res.json({ ok: true, stats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
