// Starter example — expand with the full set of selectService/get-ticket cases.
import { describe, it, expect, beforeEach } from 'vitest';
import OfficeQueueManagement from '../../OfficeQueueManagement.js';
import Service from '../../models/Service.js';
import ServiceQueue from '../../models/ServiceQueue.js';

describe('OfficeQueueManagement.selectService', () => {
  let oqm;

  beforeEach(() => {
    oqm = new OfficeQueueManagement();
  });

  it('throws when the service does not exist', () => {
    expect(() => oqm.selectService('unknown')).toThrow(/does not exist/);
  });

  it('throws when the service has no configured queue', () => {
    oqm.services.set('S1', new Service('S1', 'Shipping', 5));

    expect(() => oqm.selectService('S1')).toThrow(/No queue configured/);
  });

  it('issues a ticket with a unique sequential code and enqueues it', () => {
    oqm.services.set('S1', new Service('S1', 'Shipping', 5));
    oqm.queues.set('S1', new ServiceQueue('S1'));

    const first = oqm.selectService('S1');
    const second = oqm.selectService('S1');

    expect(first.code).toBe(1);
    expect(second.code).toBe(2);
    expect(oqm.queues.get('S1').length).toBe(2);
    expect(oqm.tickets.get(first.code)).toBe(first);
  });
});
