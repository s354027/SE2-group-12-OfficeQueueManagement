import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import OfficeQueueManagement from '../../OfficeQueueManagement.js';
import Service from '../../models/Service.js';
import ServiceQueue from '../../models/ServiceQueue.js';
import Counter from '../../models/Counter.js';
import TicketStatus from '../../constants/TicketStatus.js';

// Builds a fresh app + office for each test, so no test can leak queue/ticket
// state into another one. Mirrors backend/README.md's documented scenario
// (S1 Shipping / S2 Accounts / S3 Info, counters C1 / C2) unless a test
// needs a more specific layout.
function buildOffice() {
  const oqm = new OfficeQueueManagement();

  [
    new Service('S1', 'Shipping', 5),
    new Service('S2', 'Accounts', 8),
    new Service('S3', 'Info', 3),
  ].forEach((service) => {
    oqm.services.set(service.id, service);
    oqm.queues.set(service.id, new ServiceQueue(service.id));
  });

  const counter1 = new Counter('C1', 1);
  counter1.addService('S1');
  counter1.addService('S3');

  const counter2 = new Counter('C2', 2);
  counter2.addService('S1');
  counter2.addService('S2');
  counter2.addService('S3');

  oqm.counters.set(counter1.id, counter1);
  oqm.counters.set(counter2.id, counter2);

  return oqm;
}

describe('GET /api/counters/:counterId', () => {
  it('returns the counter id, number and the services it supports', async () => {
    const app = createApp(buildOffice());

    const res = await request(app).get('/api/counters/C1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('C1');
    expect(res.body.number).toBe(1);
    expect(res.body.services).toEqual(
      expect.arrayContaining([
        { id: 'S1', tagName: 'Shipping', estimatedServiceTimeMinutes: 5 },
        { id: 'S3', tagName: 'Info', estimatedServiceTimeMinutes: 3 },
      ])
    );
    expect(res.body.services).toHaveLength(2);
  });

  it('returns 404 for a counter that does not exist', async () => {
    const app = createApp(buildOffice());

    const res = await request(app).get('/api/counters/UNKNOWN');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/UNKNOWN/);
  });
});

describe('POST /api/counters/:counterId/next-customer', () => {
  it('returns a null ticket when every queue the counter serves is empty', async () => {
    const app = createApp(buildOffice());

    const res = await request(app).post('/api/counters/C1/next-customer');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'No customers waiting for this counter',
      ticket: null,
    });
  });

  it('calls and returns the only waiting customer', async () => {
    const oqm = buildOffice();
    const app = createApp(oqm);
    await request(app).post('/api/tickets').send({ serviceId: 'S1' });

    const res = await request(app).post('/api/counters/C1/next-customer');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Next customer called successfully');
    expect(res.body.ticket).toMatchObject({
      code: 1,
      serviceId: 'S1',
      status: TicketStatus.CALLED,
      counterId: 'C1',
    });
  });

  it('picks the longest queue among the ones the counter can serve', async () => {
    const oqm = buildOffice();
    const app = createApp(oqm);
    // S3 (Info) gets 2 waiting customers, S1 (Shipping) only 1; C1 serves both.
    await request(app).post('/api/tickets').send({ serviceId: 'S1' });
    await request(app).post('/api/tickets').send({ serviceId: 'S3' });
    await request(app).post('/api/tickets').send({ serviceId: 'S3' });

    const res = await request(app).post('/api/counters/C1/next-customer');

    expect(res.body.ticket.serviceId).toBe('S3');
    expect(oqm.queues.get('S3').length).toBe(1);
    expect(oqm.queues.get('S1').length).toBe(1);
  });

  it('breaks a tie in queue length by picking the shorter service time', async () => {
    const oqm = buildOffice();
    const app = createApp(oqm);
    // Both queues have exactly 1 person; S3 (3 min) must win over S1 (5 min).
    await request(app).post('/api/tickets').send({ serviceId: 'S1' });
    await request(app).post('/api/tickets').send({ serviceId: 'S3' });

    const res = await request(app).post('/api/counters/C1/next-customer');

    expect(res.body.ticket.serviceId).toBe('S3');
  });

  it('only serves queues the counter is actually configured for', async () => {
    const oqm = buildOffice();
    const app = createApp(oqm);
    // S2 (Accounts) has a waiting customer, but C1 cannot serve S2.
    await request(app).post('/api/tickets').send({ serviceId: 'S2' });

    const res = await request(app).post('/api/counters/C1/next-customer');

    expect(res.body).toEqual({
      message: 'No customers waiting for this counter',
      ticket: null,
    });
    expect(oqm.queues.get('S2').length).toBe(1); // left untouched
  });

  it('dequeues customers in FIFO order on repeated calls', async () => {
    const app = createApp(buildOffice());
    await request(app).post('/api/tickets').send({ serviceId: 'S1' });
    await request(app).post('/api/tickets').send({ serviceId: 'S1' });

    const first = await request(app).post('/api/counters/C1/next-customer');
    const second = await request(app).post('/api/counters/C1/next-customer');

    expect(first.body.ticket.code).toBe(1);
    expect(second.body.ticket.code).toBe(2);
  });

  it('assigns the served ticket to the counter', async () => {
    const oqm = buildOffice();
    const app = createApp(oqm);
    await request(app).post('/api/tickets').send({ serviceId: 'S1' });

    await request(app).post('/api/counters/C1/next-customer');

    expect(oqm.counters.get('C1').currentTicketCode).toBe(1);
  });

  it('returns 400 for a counter that does not exist', async () => {
    const app = createApp(buildOffice());

    const res = await request(app).post('/api/counters/UNKNOWN/next-customer');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/UNKNOWN/);
  });
});
