import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { createSeededOffice } from '../../seedOffice.js';
import TicketStatus from '../../constants/TicketStatus.js';

// Endpoint under test: POST /api/tickets { serviceId }

describe('Integration - Get ticket (POST /api/tickets)', () => {
  let office;
  let app;

  beforeEach(() => {
    // Fresh, isolated state for every test (services S1, S2, S3; counters C1, C2)
    office = createSeededOffice();
    app = createApp(office);
  });

  describe('successful ticket issuing', () => {
    it('returns 201 with the ticket info for a valid service', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .send({ serviceId: 'S1' });

      expect(res.status).toBe(201);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toMatchObject({
        code: 1,
        serviceId: 'S1',
        status: TicketStatus.WAITING,
        counterId: null,
      });
    });

    it('exposes exactly the fields returned by Ticket.getInfo()', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .send({ serviceId: 'S2' });

      expect(Object.keys(res.body).sort()).toEqual(
        ['code', 'counterId', 'createdAt', 'serviceId', 'status'].sort()
      );
    });

    it('returns a valid ISO creation date close to the current time', async () => {
      const before = Date.now();
      const res = await request(app)
        .post('/api/tickets')
        .send({ serviceId: 'S3' });
      const after = Date.now();

      const createdAt = new Date(res.body.createdAt).getTime();
      expect(Number.isNaN(createdAt)).toBe(false);
      expect(createdAt).toBeGreaterThanOrEqual(before);
      expect(createdAt).toBeLessThanOrEqual(after);
    });

    it('issues a ticket for each configured service', async () => {
      for (const serviceId of ['S1', 'S2', 'S3']) {
        const res = await request(app)
          .post('/api/tickets')
          .send({ serviceId });

        expect(res.status).toBe(201);
        expect(res.body.serviceId).toBe(serviceId);
      }
    });
  });

  describe('ticket codes', () => {
    it('generates incremental codes starting from 1', async () => {
      const first = await request(app).post('/api/tickets').send({ serviceId: 'S1' });
      const second = await request(app).post('/api/tickets').send({ serviceId: 'S1' });
      const third = await request(app).post('/api/tickets').send({ serviceId: 'S1' });

      expect([first.body.code, second.body.code, third.body.code]).toEqual([1, 2, 3]);
    });

    it('keeps codes unique across the whole office, regardless of the service', async () => {
      const r1 = await request(app).post('/api/tickets').send({ serviceId: 'S1' });
      const r2 = await request(app).post('/api/tickets').send({ serviceId: 'S2' });
      const r3 = await request(app).post('/api/tickets').send({ serviceId: 'S3' });
      const r4 = await request(app).post('/api/tickets').send({ serviceId: 'S1' });

      const codes = [r1, r2, r3, r4].map((r) => r.body.code);
      expect(new Set(codes).size).toBe(codes.length);
      expect(codes).toEqual([1, 2, 3, 4]);
    });

    it('assigns unique codes to concurrent requests', async () => {
      const responses = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          request(app)
            .post('/api/tickets')
            .send({ serviceId: ['S1', 'S2', 'S3'][i % 3] })
        )
      );

      responses.forEach((res) => expect(res.status).toBe(201));
      const codes = responses.map((r) => r.body.code);
      expect(new Set(codes).size).toBe(10);
    });

    it('does not consume a code when the request fails', async () => {
      await request(app).post('/api/tickets').send({ serviceId: 'UNKNOWN' });
      await request(app).post('/api/tickets').send({});

      const res = await request(app).post('/api/tickets').send({ serviceId: 'S1' });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(1);
    });
  });

  describe('queue side effects', () => {
    it('enqueues the ticket in the queue of the requested service', async () => {
      const res = await request(app).post('/api/tickets').send({ serviceId: 'S1' });

      const queue = office.queues.get('S1');
      expect(queue.length).toBe(1);
      expect(queue.peek().code).toBe(res.body.code);
      expect(queue.getPosition(res.body.code)).toBe(1);
    });

    it('does not modify the queues of the other services', async () => {
      await request(app).post('/api/tickets').send({ serviceId: 'S1' });

      expect(office.queues.get('S1').length).toBe(1);
      expect(office.queues.get('S2').length).toBe(0);
      expect(office.queues.get('S3').length).toBe(0);
    });

    it('keeps a FIFO order inside the same queue', async () => {
      const a = await request(app).post('/api/tickets').send({ serviceId: 'S2' });
      const b = await request(app).post('/api/tickets').send({ serviceId: 'S2' });
      const c = await request(app).post('/api/tickets').send({ serviceId: 'S2' });

      const queue = office.queues.get('S2');
      expect(queue.length).toBe(3);
      expect(queue.getPosition(a.body.code)).toBe(1);
      expect(queue.getPosition(b.body.code)).toBe(2);
      expect(queue.getPosition(c.body.code)).toBe(3);
    });

    it('keeps independent queue lengths per service type', async () => {
      await request(app).post('/api/tickets').send({ serviceId: 'S1' });
      await request(app).post('/api/tickets').send({ serviceId: 'S1' });
      await request(app).post('/api/tickets').send({ serviceId: 'S3' });

      expect(office.queues.get('S1').length).toBe(2);
      expect(office.queues.get('S2').length).toBe(0);
      expect(office.queues.get('S3').length).toBe(1);
    });

    it('registers the ticket in the office tickets map as WAITING', async () => {
      const res = await request(app).post('/api/tickets').send({ serviceId: 'S3' });

      const stored = office.tickets.get(res.body.code);
      expect(stored).toBeDefined();
      expect(stored.serviceId).toBe('S3');
      expect(stored.status).toBe(TicketStatus.WAITING);
      expect(stored.counterId).toBeNull();
    });
  });

  describe('validation errors', () => {
    it('returns 400 when serviceId is missing from the body', async () => {
      const res = await request(app).post('/api/tickets').send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "The 'serviceId' field is required." });
    });

    it('returns 400 when no body is sent at all', async () => {
      const res = await request(app).post('/api/tickets');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "The 'serviceId' field is required." });
    });

    it('returns 400 when serviceId is an empty string', async () => {
      const res = await request(app).post('/api/tickets').send({ serviceId: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("The 'serviceId' field is required.");
    });

    it('returns 400 when the service does not exist', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .send({ serviceId: 'S999' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Service S999 does not exist' });
    });

    it('returns 400 when serviceId has the wrong type', async () => {
      const res = await request(app).post('/api/tickets').send({ serviceId: 123 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/does not exist/);
    });

    it('returns 400 when a service exists but has no configured queue', async () => {
      // Service registered without a matching queue (misconfiguration)
      office.services.set('S4', { id: 'S4', tagName: 'Orphan', estimatedServiceTimeMinutes: 4 });

      const res = await request(app).post('/api/tickets').send({ serviceId: 'S4' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'No queue configured for service S4' });
    });

    it('does not enqueue anything when the request is invalid', async () => {
      await request(app).post('/api/tickets').send({ serviceId: 'S999' });
      await request(app).post('/api/tickets').send({});

      for (const queue of office.queues.values()) {
        expect(queue.length).toBe(0);
      }
      expect(office.tickets.size).toBe(0);
    });

    it('returns 400 on a malformed JSON body', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Content-Type', 'application/json')
        .send('{"serviceId": "S1"');

      expect(res.status).toBe(400);
    });
  });

  describe('HTTP behaviour', () => {
    it('answers the CORS preflight for the frontend origin', async () => {
      const res = await request(app)
        .options('/api/tickets')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('does not expose a GET handler on /api/tickets', async () => {
      const res = await request(app).get('/api/tickets');

      expect(res.status).toBe(404);
    });
  });
});
