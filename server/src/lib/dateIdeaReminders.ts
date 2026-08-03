import prisma from './prisma';
import { sendPushToUser } from './push';
import { formatDateLabel, utcAddDays, utcTodayNoon } from './calendarDates';

/**
 * Send day-before and day-of push reminders for SELECTED date ideas with a plannedDate.
 * Idempotent via dayBeforeNotifiedAt / dayOfNotifiedAt.
 */
export async function processDateIdeaReminders(now = new Date()) {
  const today = utcTodayNoon(now);
  const tomorrow = utcAddDays(today, 1);

  const dayBeforeCandidates = await prisma.dateIdea.findMany({
    where: {
      status: 'SELECTED',
      plannedDate: tomorrow,
      dayBeforeNotifiedAt: null,
    },
    include: {
      couple: { select: { userAId: true, userBId: true } },
    },
  });

  for (const idea of dayBeforeCandidates) {
    const label = formatDateLabel(tomorrow);
    const payload = {
      title: `Date tomorrow: ${idea.title}`,
      body: `${label} — open HeartSync for details.`,
      url: '/date-ideas',
    };
    await notifyCouple(idea.couple.userAId, idea.couple.userBId, payload);
    await prisma.dateIdea.update({
      where: { id: idea.id },
      data: { dayBeforeNotifiedAt: now },
    });
  }

  const dayOfCandidates = await prisma.dateIdea.findMany({
    where: {
      status: 'SELECTED',
      plannedDate: today,
      dayOfNotifiedAt: null,
    },
    include: {
      couple: { select: { userAId: true, userBId: true } },
    },
  });

  for (const idea of dayOfCandidates) {
    const payload = {
      title: `It's date day: ${idea.title}`,
      body: 'Have a wonderful time — open HeartSync if you need the plan.',
      url: '/date-ideas',
    };
    await notifyCouple(idea.couple.userAId, idea.couple.userBId, payload);
    await prisma.dateIdea.update({
      where: { id: idea.id },
      data: { dayOfNotifiedAt: now },
    });
  }

  return {
    dayBefore: dayBeforeCandidates.length,
    dayOf: dayOfCandidates.length,
  };
}

async function notifyCouple(
  userAId: string,
  userBId: string | null,
  payload: { title: string; body: string; url: string },
) {
  const ids = [userAId, userBId].filter((id): id is string => Boolean(id));
  await Promise.all(
    ids.map((userId) =>
      sendPushToUser(userId, payload).catch((err) => {
        console.error(`Date reminder push failed for ${userId}:`, err);
      }),
    ),
  );
}

const HOUR_MS = 60 * 60 * 1000;

/** Run soon after boot, then hourly (while the process is awake). */
export function startDateIdeaReminderScheduler() {
  const run = () => {
    processDateIdeaReminders().catch((err) => {
      console.error('Date idea reminder job failed:', err);
    });
  };

  // Delay first run slightly so the server can finish booting
  setTimeout(run, 15_000);
  setInterval(run, HOUR_MS);
}
