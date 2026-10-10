import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createTicketRouter } from './routes/ticketRoutes.js';
import { createCounterRouter } from './routes/counterRoutes.js';

// Builds the Express app around a given OfficeQueueManagement instance,
// without binding to a port. Used both by index.js (real server) and by
// integration tests (supertest can hit it in-memory with its own instance).
export function createApp(officeQueueManagement) {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.json());

  const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true
  };
  app.use(cors(corsOptions));

  app.use('/api/tickets', createTicketRouter(officeQueueManagement));
  app.use('/api/counters', createCounterRouter(officeQueueManagement));

  return app;
}

export default createApp;
