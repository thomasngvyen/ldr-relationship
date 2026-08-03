import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

import authRouter from './routes/auth';
import couplesRouter from './routes/couples';
import visitsRouter from './routes/visits';
import moodMessagesRouter from './routes/moodMessages';
import moodsRouter from './routes/moods';
import { authMiddleware } from './middleware/auth';
import { requireCouple } from './middleware/requireCouple';
import dateIdeasRouter from './routes/dateIdeas';
import memoriesRouter from './routes/memories';
import feelingsRouter from './routes/feelings';
import pushRouter from './routes/push';
import rateLimit from './middleware/rateLimit';
import { MEMORY_UPLOAD_DIR } from './lib/memoryUploads';
import {
  processDateIdeaReminders,
  startDateIdeaReminderScheduler,
} from './lib/dateIdeaReminders';

const app = express();
const PORT = process.env.PORT || 3001;

// Behind a reverse proxy (Railway, Nginx, etc.), trust X-Forwarded-For for req.ip
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use('/uploads/memories', express.static(MEMORY_UPLOAD_DIR));

app.use('/api', rateLimit(120, 60_000));

app.use('/api/auth', rateLimit(20, 15 * 60_000));

app.use('/api/auth', authRouter);
app.use('/api/couples', couplesRouter);
app.use('/api/visits', authMiddleware, requireCouple, visitsRouter);
app.use('/api/moods', authMiddleware, requireCouple, moodsRouter);
app.use('/api/moodMessages', authMiddleware, requireCouple, moodMessagesRouter);
app.use('/api/dateIdeas', authMiddleware, requireCouple, dateIdeasRouter);
app.use('/api/memories', authMiddleware, requireCouple, memoriesRouter);
app.use('/api/feelings', authMiddleware, requireCouple, feelingsRouter);
app.use('/api/push', pushRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

/** For Render Cron Jobs / external ping when the free dyno sleeps */
app.post('/api/cron/date-reminders', async (req, res) => {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers['x-cron-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await processDateIdeaReminders();
    return res.status(200).json({ ok: true, ...result });
  } catch {
    return res.status(500).json({ error: 'Reminder job failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startDateIdeaReminderScheduler();
});
