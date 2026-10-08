import express from 'express';
import { callNextCustomer } from '../controllers/counterController.js';

export const createCounterRouter = (officeQueueManagement) => {
  const router = express.Router();

  // POST /api/counters/:counterId/next-customer
  router.post('/:counterId/next-customer', callNextCustomer(officeQueueManagement));

  return router;
};

export default createCounterRouter;