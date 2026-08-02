import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

import authRouter from './routes/auth';
import couplesRouter from './routes/couples';
import visitsRouter from './routes/visits';
import { authMiddleware } from './middleware/auth';
import { requireCouple } from './middleware/requireCouple';
import dateIdeasRouter from './routes/dateIdeas';
import memoriesRouter from './routes/memories';
import rateLimit from './middleware/rateLimit';
import { MEMORY_UPLOAD_DIR } from './lib/memoryUploads';

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

app.use('/api/dateIdeas', authMiddleware, requireCouple, dateIdeasRouter);
app.use('/api/memories', authMiddleware, requireCouple, memoriesRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});