import express from 'express';
import { callNextCustomer, getCounter } from '../controllers/counterController.js';

export const createCounterRouter = (officeQueueManagement) => {
  const router = express.Router();

  // GET /api/counters/:counterId
  router.get('/:counterId', getCounter(officeQueueManagement));

  // POST /api/counters/:counterId/next-customer
  router.post('/:counterId/next-customer', callNextCustomer(officeQueueManagement));

  return router;
};

export default createCounterRouter;