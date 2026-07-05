import express from 'express';
import cors from 'cors';
import { init } from './db/init.js';
import ordersRouter from './routes/orders.js';
import customersRouter from './routes/customers.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import vatRouter from './routes/vat.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await init();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/vat', vatRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.message?.includes('SQLITE_CONSTRAINT')) {
    return res.status(400).json({ error: 'Invalid or inconsistent data' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
