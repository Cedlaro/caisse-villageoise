import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes          from './routes/auth.routes';
import memberRoutes         from './routes/member.routes';
import savingsRoutes        from './routes/savings.routes';
import loanRoutes           from './routes/loan.routes';
import beneficiaryRoutes    from './routes/beneficiary.routes';

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────

app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/v1/auth',    authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1',         memberRoutes);
app.use('/api/v1',         savingsRoutes);
app.use('/api/v1',         loanRoutes);
app.use('/api/v1',         beneficiaryRoutes);

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
