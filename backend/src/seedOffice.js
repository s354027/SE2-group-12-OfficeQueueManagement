import Counter from './models/Counter.js';
import Service from './models/Service.js';
import ServiceQueue from './models/ServiceQueue.js';
import OfficeQueueManagement from './OfficeQueueManagement.js';

// Builds a fresh OfficeQueueManagement pre-configured with the office's
// default demo services and counters (see backend/README.md). Shared by
// index.js (real server) and by integration/e2e tests that need the same
// known starting state without duplicating the configuration.
export function createSeededOffice() {
  const officeQueueManagement = new OfficeQueueManagement();

  [
    new Service('S1', 'Shipping', 5),
    new Service('S2', 'Accounts', 8),
    new Service('S3', 'Info', 3),
  ].forEach((service) => {
    officeQueueManagement.services.set(service.id, service);
    officeQueueManagement.queues.set(service.id, new ServiceQueue(service.id));
  });

  const counter1 = new Counter('C1', 1);
  counter1.addService('S1');
  counter1.addService('S3');

  const counter2 = new Counter('C2', 2);
  counter2.addService('S1');
  counter2.addService('S2');
  counter2.addService('S3');

  officeQueueManagement.counters.set(counter1.id, counter1);
  officeQueueManagement.counters.set(counter2.id, counter2);

  return officeQueueManagement;
}

export default createSeededOffice;
