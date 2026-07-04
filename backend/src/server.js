import express from 'express';
import cors from 'cors';
import './db/init.js';
import ordersRouter from './routes/orders.js';
import customersRouter from './routes/customers.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import vatRouter from './routes/vat.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/orders', ordersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/vat', vatRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Sand business API listening on http://localhost:${PORT}`);
});
