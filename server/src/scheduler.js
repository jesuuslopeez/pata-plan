const cron = require('node-cron');
const { runDailyNotifications } = require('./services/notification.service');

const DEFAULT_CRON = '0 9 * * *'; // 09:00 every day

const startScheduler = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  if (process.env.NOTIFICATIONS_ENABLED === 'false') {
    console.log('[scheduler] notifications disabled (NOTIFICATIONS_ENABLED=false)');
    return;
  }

  const expression = process.env.NOTIFICATIONS_CRON || DEFAULT_CRON;
  if (!cron.validate(expression)) {
    console.error(`[scheduler] invalid cron expression "${expression}", falling back to "${DEFAULT_CRON}"`);
  }
  const tz = process.env.NOTIFICATIONS_TIMEZONE || 'Europe/Madrid';

  cron.schedule(
    cron.validate(expression) ? expression : DEFAULT_CRON,
    async () => {
      try {
        await runDailyNotifications();
      } catch (err) {
        console.error('[scheduler] notifications job failed:', err);
      }
    },
    { timezone: tz }
  );

  console.log(`[scheduler] notifications scheduled "${expression}" (${tz})`);
};

module.exports = { startScheduler };
