import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import OfficeQueueManagement from './OfficeQueueManagement.js';
import { createTicketRouter } from './routes/ticketRoutes.js';
import { createCounterRouter } from './routes/counterRoutes.js';

// express initialization
const app = express();
const port = 3001;

app.use(morgan('dev'));
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));

// Centralized office management instance
const officeQueueManagement = new OfficeQueueManagement();

// Routes
app.use('/api/tickets', createTicketRouter(officeQueueManagement));
app.use('/api/counters', createCounterRouter(officeQueueManagement));

// Server activation
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});