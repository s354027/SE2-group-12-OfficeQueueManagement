import { describe, it, expect, beforeEach } from 'vitest';
import OfficeQueueManagement from '../../OfficeQueueManagement.js';
import Counter from '../../models/Counter.js';
import Service from '../../models/Service.js';
import ServiceQueue from '../../models/ServiceQueue.js';
import Ticket from '../../models/Ticket.js';
import TicketStatus from '../../constants/TicketStatus.js';

describe('OfficeQueueManagement', () => {
  let oqm;

  beforeEach(() => {
    oqm = new OfficeQueueManagement();
  });

  describe('generateNextTicketCode', () => {
    it('starts from 1', () => {
      expect(oqm.generateNextTicketCode()).toBe(1);
    });

    it('increments by 1 on every call', () => {
      expect(oqm.generateNextTicketCode()).toBe(1);
      expect(oqm.generateNextTicketCode()).toBe(2);
      expect(oqm.generateNextTicketCode()).toBe(3);
    });

    it('never repeats a code, even across different services', () => {
      oqm.services.set('S1', new Service('S1', 'Shipping', 5));
      oqm.queues.set('S1', new ServiceQueue('S1'));
      oqm.services.set('S2', new Service('S2', 'Accounts', 8));
      oqm.queues.set('S2', new ServiceQueue('S2'));

      const codes = [
        oqm.selectService('S1').code,
        oqm.selectService('S2').code,
        oqm.selectService('S1').code,
      ];

      expect(codes).toEqual([1, 2, 3]);
      expect(new Set(codes).size).toBe(3);
    });
  });

  describe('selectService', () => {
    it('throws when the service does not exist', () => {
      expect(() => oqm.selectService('unknown')).toThrow(/does not exist/);
    });

    it('throws when the service has no configured queue', () => {
      oqm.services.set('S1', new Service('S1', 'Shipping', 5));

      expect(() => oqm.selectService('S1')).toThrow(/No queue configured/);
    });

    it('does not mutate any state when it throws', () => {
      expect(() => oqm.selectService('unknown')).toThrow();

      expect(oqm.lastTicketCode).toBe(0);
      expect(oqm.tickets.size).toBe(0);
    });

    it('returns a WAITING ticket for the requested service', () => {
      oqm.services.set('S1', new Service('S1', 'Shipping', 5));
      oqm.queues.set('S1', new ServiceQueue('S1'));

      const ticket = oqm.selectService('S1');

      expect(ticket).toBeInstanceOf(Ticket);
      expect(ticket.serviceId).toBe('S1');
      expect(ticket.status).toBe(TicketStatus.WAITING);
      expect(ticket.counterId).toBeNull();
    });

    it('issues tickets with unique sequential codes', () => {
      oqm.services.set('S1', new Service('S1', 'Shipping', 5));
      oqm.queues.set('S1', new ServiceQueue('S1'));

      const first = oqm.selectService('S1');
      const second = oqm.selectService('S1');

      expect(first.code).toBe(1);
      expect(second.code).toBe(2);
    });

    it('enqueues the ticket in the matching service queue', () => {
      oqm.services.set('S1', new Service('S1', 'Shipping', 5));
      const queue = new ServiceQueue('S1');
      oqm.queues.set('S1', queue);

      const ticket = oqm.selectService('S1');

      expect(queue.length).toBe(1);
      expect(queue.peek()).toBe(ticket);
    });

    it('does not enqueue the ticket in an unrelated queue', () => {
      oqm.services.set('S1', new Service('S1', 'Shipping', 5));
      oqm.queues.set('S1', new ServiceQueue('S1'));
      oqm.services.set('S2', new Service('S2', 'Accounts', 8));
      const otherQueue = new ServiceQueue('S2');
      oqm.queues.set('S2', otherQueue);

      oqm.selectService('S1');

      expect(otherQueue.length).toBe(0);
    });

    it('registers the ticket in the tickets map, keyed by its code', () => {
      oqm.services.set('S1', new Service('S1', 'Shipping', 5));
      oqm.queues.set('S1', new ServiceQueue('S1'));

      const ticket = oqm.selectService('S1');

      expect(oqm.tickets.get(ticket.code)).toBe(ticket);
      expect(oqm.tickets.size).toBe(1);
    });
  });

  describe('callNextCustomer', () => {
    beforeEach(() => {
      oqm.services.set('S1', new Service('S1', 'Shipping', 5));
      oqm.services.set('S2', new Service('S2', 'Accounts', 8));

      oqm.queues.set('S1', new ServiceQueue('S1'));
      oqm.queues.set('S2', new ServiceQueue('S2'));

      oqm.counters.set('C1', new Counter('C1', 1));
      oqm.counters.set('C2', new Counter('C2', 2));

      oqm.counters.get('C1').addService('S1');
      oqm.counters.get('C1').addService('S2');
      oqm.counters.get('C2').addService('S1');
    });

    it('throws when the counter does not exist', () => {
      expect(() => oqm.callNextCustomer('unknown')).toThrow(/not found/);
    });

    it('returns null when all queues are empty', () => {
      const result = oqm.callNextCustomer('C1');
      expect(result).toBeNull();
    });

    it('marks the ticket as CALLED and assigns it to the counter', () => {
      const ticket = oqm.selectService('S1');

      const result = oqm.callNextCustomer('C1');

      expect(result).toBe(ticket);
      expect(ticket.status).toBe(TicketStatus.CALLED);
      expect(ticket.counterId).toBe('C1');
    });

    it('removes the ticket from the queue after serving', () => {
      const ticket = oqm.selectService('S1');

      const result = oqm.callNextCustomer('C1');

      expect(result).toBe(ticket);
      const queue = oqm.queues.get('S1');
      expect(queue.length).toBe(0);
    });

    it('returns the next ticket from the longest queue that the counter can serve', () => {
      const ticket1 = oqm.selectService('S1');
      
      oqm.selectService('S1');
      oqm.selectService('S2');

      const result = oqm.callNextCustomer('C1');

      expect(result).toBe(ticket1);
    });

    it('returns the next ticket with the shortest estimated service time when multiple queues have the same length', () => {
      oqm.selectService('S1');
      oqm.selectService('S2');

      const result = oqm.callNextCustomer('C1');

      expect(result.serviceId).toBe('S1');
    });
  });
});
