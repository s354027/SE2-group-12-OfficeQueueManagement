import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import Service from './models/Service.js';
import ServiceQueue from './models/ServiceQueue.js';
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
[
  new Service('S1', 'Shipping', 5),
  new Service('S2', 'Accounts', 8),
  new Service('S3', 'Info', 3),
].forEach((service) => {
  officeQueueManagement.services.set(service.id, service);
  officeQueueManagement.queues.set(service.id, new ServiceQueue(service.id));
});
// Routes
app.use('/api/tickets', createTicketRouter(officeQueueManagement));
app.use('/api/counters', createCounterRouter(officeQueueManagement));

// Server activation
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});