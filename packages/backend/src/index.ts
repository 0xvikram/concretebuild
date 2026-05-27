import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { propertiesRouter } from './routes/properties';
import { investmentsRouter } from './routes/investments';
import { distributionsRouter } from './routes/distributions';
import { rewardsRouter } from './routes/rewards';
import { authRouter } from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/distributions', distributionsRouter);
app.use('/api/rewards', rewardsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
});
