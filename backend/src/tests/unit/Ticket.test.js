import { describe, it, expect } from 'vitest';
import Ticket from '../../models/Ticket.js';
import TicketStatus from '../../constants/TicketStatus.js';

describe('Ticket', () => {
  it('starts out WAITING, unassigned to any counter', () => {
    const ticket = new Ticket(1, 'S1');

    expect(ticket.code).toBe(1);
    expect(ticket.serviceId).toBe('S1');
    expect(ticket.status).toBe(TicketStatus.WAITING);
    expect(ticket.counterId).toBeNull();
    expect(ticket.createdAt).toBeInstanceOf(Date);
  });

  it('markAsCalled moves it to CALLED and assigns the counter', () => {
    const ticket = new Ticket(1, 'S1');

    ticket.markAsCalled('C1');

    expect(ticket.status).toBe(TicketStatus.CALLED);
    expect(ticket.counterId).toBe('C1');
    expect(ticket.calledAt).toBeInstanceOf(Date);
  });

  it('markAsServed moves it to SERVED', () => {
    const ticket = new Ticket(1, 'S1');
    ticket.markAsCalled('C1');

    ticket.markAsServed();

    expect(ticket.status).toBe(TicketStatus.SERVED);
    expect(ticket.servedAt).toBeInstanceOf(Date);
    // the counter assignment from markAsCalled is preserved
    expect(ticket.counterId).toBe('C1');
  });

  it('getInfo returns a plain snapshot of the ticket', () => {
    const ticket = new Ticket(7, 'S2');

    expect(ticket.getInfo()).toEqual({
      code: 7,
      serviceId: 'S2',
      status: TicketStatus.WAITING,
      createdAt: ticket.createdAt,
      counterId: null,
    });
  });

  it('toString reports "Not assigned" before being called to a counter', () => {
    const ticket = new Ticket(1, 'S1');

    expect(ticket.toString()).toBe('Ticket 1 | Service: S1 | Status: WAITING | Counter: Not assigned');
  });

  it('toString reports the counter once called', () => {
    const ticket = new Ticket(1, 'S1');
    ticket.markAsCalled('C2');

    expect(ticket.toString()).toBe('Ticket 1 | Service: S1 | Status: CALLED | Counter: C2');
  });
});
