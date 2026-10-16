import { describe, it, expect } from 'vitest';
import ServiceQueue from '../../models/ServiceQueue.js';
import Ticket from '../../models/Ticket.js';

describe('ServiceQueue', () => {
  it('starts empty', () => {
    const queue = new ServiceQueue('S1');

    expect(queue.isEmpty()).toBe(true);
    expect(queue.length).toBe(0);
    expect(queue.peek()).toBeNull();
    expect(queue.dequeue()).toBeNull();
  });

  it('refuses to enqueue a ticket for a different service', () => {
    const queue = new ServiceQueue('S1');
    const ticket = new Ticket(1, 'S2');

    expect(() => queue.enqueue(ticket)).toThrow('Ticket service does not match queue service');
    expect(queue.length).toBe(0);
  });

  it('enqueues matching tickets and reports the new length', () => {
    const queue = new ServiceQueue('S1');
    const ticket = new Ticket(1, 'S1');

    queue.enqueue(ticket);

    expect(queue.length).toBe(1);
    expect(queue.isEmpty()).toBe(false);
  });

  it('dequeues tickets in FIFO order', () => {
    const queue = new ServiceQueue('S1');
    const first = new Ticket(1, 'S1');
    const second = new Ticket(2, 'S1');
    queue.enqueue(first);
    queue.enqueue(second);

    expect(queue.dequeue()).toBe(first);
    expect(queue.dequeue()).toBe(second);
    expect(queue.dequeue()).toBeNull();
  });

  it('peek returns the first ticket without removing it', () => {
    const queue = new ServiceQueue('S1');
    const first = new Ticket(1, 'S1');
    queue.enqueue(first);

    expect(queue.peek()).toBe(first);
    expect(queue.length).toBe(1);
  });

  it('getPosition returns the 1-indexed position of a ticket, or null if absent', () => {
    const queue = new ServiceQueue('S1');
    queue.enqueue(new Ticket(1, 'S1'));
    queue.enqueue(new Ticket(2, 'S1'));
    queue.enqueue(new Ticket(3, 'S1'));

    expect(queue.getPosition(1)).toBe(1);
    expect(queue.getPosition(3)).toBe(3);
    expect(queue.getPosition(999)).toBeNull();
  });

  it('reset empties the queue', () => {
    const queue = new ServiceQueue('S1');
    queue.enqueue(new Ticket(1, 'S1'));
    queue.enqueue(new Ticket(2, 'S1'));

    queue.reset();

    expect(queue.length).toBe(0);
    expect(queue.isEmpty()).toBe(true);
  });
});
