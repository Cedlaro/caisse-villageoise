import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes          from './routes/auth.routes';
import memberRoutes         from './routes/member.routes';
import savingsRoutes        from './routes/savings.routes';
import loanRoutes           from './routes/loan.routes';
import beneficiaryRoutes    from './routes/beneficiary.routes';
import staffRoutes           from './routes/staff.routes';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ── Global middleware ─────────────────────────────────────────────────────────

app.use(cors({
  origin:      isProduction ? false : (process.env.CORS_ORIGIN ?? 'http://localhost:4200'),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ────────────────────────────────────────────────────────────────

app.use('/api/v1/auth',    authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1',         memberRoutes);
app.use('/api/v1',         savingsRoutes);
app.use('/api/v1',         loanRoutes);
app.use('/api/v1',         beneficiaryRoutes);
app.use('/api/v1',         staffRoutes);

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve Angular frontend ────────────────────────────────────────────────────

const frontendPath = process.env.FRONTEND_PATH
  ? path.resolve(process.env.FRONTEND_PATH)
  : path.join(__dirname, '../browser');
app.use(express.static(frontendPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
