import express from 'express';
import { issueTicket } from '../controllers/ticketController.js';

export const createTicketRouter = (officeQueueManagement) => {
  const router = express.Router();

  // POST /api/tickets
  router.post('/', issueTicket(officeQueueManagement));

  return router;
};

export default createTicketRouter;