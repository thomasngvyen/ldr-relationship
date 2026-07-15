import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

import authRouter from './routes/auth';
import couplesRouter from './routes/couples';
import visitsRouter from './routes/visits';

import {authMiddleware} from './middleware/auth';
import {requireCouple} from './middleware/requireCouple';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/couples', couplesRouter);
app.use('/api/visits', authMiddleware, requireCouple, visitsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
