const prisma = require('../utils/prisma');
const {
  sendUpcomingEventEmail,
  sendDueTodayEmail,
  sendOverdueEventEmail,
} = require('../utils/mailer');

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const EVENT_INCLUDE = {
  animal: {
    include: {
      group: {
        select: {
          id: true,
          name: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              emailNotificationsEnabled: true,
            },
          },
        },
      },
    },
  },
  eventType: { select: { id: true, name: true, category: true } },
};

const groupByOwner = (events) => {
  const byOwner = new Map();
  for (const e of events) {
    const owner = e.animal?.group?.user;
    if (!owner) continue;
    if (!owner.emailVerified) continue;
    if (!owner.emailNotificationsEnabled) continue;
    const bucket = byOwner.get(owner.id) || { owner, events: [] };
    bucket.events.push(e);
    byOwner.set(owner.id, bucket);
  }
  return byOwner;
};

const runDailyNotifications = async ({ logger = console } = {}) => {
  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const in3Days = addDays(today, 3);
  const in4Days = addDays(today, 4);

  // 1) Events exactly 3 days from now, not yet notified
  const upcoming = await prisma.healthEvent.findMany({
    where: {
      scheduledDate: { gte: in3Days, lt: in4Days },
      status: { not: 'COMPLETED' },
      notified3DaysAt: null,
    },
    include: EVENT_INCLUDE,
  });

  // 2) Events due today, not yet notified
  const dueToday = await prisma.healthEvent.findMany({
    where: {
      scheduledDate: { gte: today, lt: tomorrow },
      status: { not: 'COMPLETED' },
      notifiedDueDayAt: null,
    },
    include: EVENT_INCLUDE,
  });

  // 3) Overdue events not notified today
  const overdue = await prisma.healthEvent.findMany({
    where: {
      scheduledDate: { lt: today },
      status: { not: 'COMPLETED' },
      OR: [{ notifiedOverdueAt: null }, { notifiedOverdueAt: { lt: today } }],
    },
    include: EVENT_INCLUDE,
  });

  const stats = {
    upcoming: { totalEvents: upcoming.length, emailsSent: 0 },
    dueToday: { totalEvents: dueToday.length, emailsSent: 0 },
    overdue: { totalEvents: overdue.length, emailsSent: 0 },
  };

  // Process upcoming (3 days)
  const upcomingByOwner = groupByOwner(upcoming);
  for (const { owner, events } of upcomingByOwner.values()) {
    try {
      await sendUpcomingEventEmail({ to: owner.email, name: owner.name, events });
      await prisma.healthEvent.updateMany({
        where: { id: { in: events.map((e) => e.id) } },
        data: { notified3DaysAt: new Date() },
      });
      stats.upcoming.emailsSent += 1;
    } catch (err) {
      logger.error(`[notifications] upcoming -> ${owner.email}: ${err.message}`);
    }
  }

  // Process due today
  const dueTodayByOwner = groupByOwner(dueToday);
  for (const { owner, events } of dueTodayByOwner.values()) {
    try {
      await sendDueTodayEmail({ to: owner.email, name: owner.name, events });
      await prisma.healthEvent.updateMany({
        where: { id: { in: events.map((e) => e.id) } },
        data: { notifiedDueDayAt: new Date() },
      });
      stats.dueToday.emailsSent += 1;
    } catch (err) {
      logger.error(`[notifications] dueToday -> ${owner.email}: ${err.message}`);
    }
  }

  // Process overdue
  const overdueByOwner = groupByOwner(overdue);
  for (const { owner, events } of overdueByOwner.values()) {
    try {
      await sendOverdueEventEmail({ to: owner.email, name: owner.name, events });
      await prisma.healthEvent.updateMany({
        where: { id: { in: events.map((e) => e.id) } },
        data: { notifiedOverdueAt: new Date() },
      });
      stats.overdue.emailsSent += 1;
    } catch (err) {
      logger.error(`[notifications] overdue -> ${owner.email}: ${err.message}`);
    }
  }

  logger.log(
    `[notifications] done — upcoming: ${stats.upcoming.emailsSent} mails / ${stats.upcoming.totalEvents} events · ` +
      `today: ${stats.dueToday.emailsSent} / ${stats.dueToday.totalEvents} · ` +
      `overdue: ${stats.overdue.emailsSent} / ${stats.overdue.totalEvents}`
  );

  return stats;
};

module.exports = { runDailyNotifications };
