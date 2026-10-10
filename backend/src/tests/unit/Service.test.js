import { describe, it, expect } from 'vitest';
import Service from '../../models/Service.js';

describe('Service', () => {
  it('stores id, tagName and estimated service time', () => {
    const service = new Service('S1', 'Shipping', 5);

    expect(service.id).toBe('S1');
    expect(service.tagName).toBe('Shipping');
    expect(service.estimatedServiceTimeMinutes).toBe(5);
  });

  it.each([0, -1, -5])('rejects a non-positive service time (%d)', (minutes) => {
    expect(() => new Service('S1', 'Shipping', minutes)).toThrow(
      'Service time must be greater than zero'
    );
  });

  it('getInfo returns a plain snapshot of the service', () => {
    const service = new Service('S1', 'Shipping', 5);

    expect(service.getInfo()).toEqual({
      id: 'S1',
      tagName: 'Shipping',
      estimatedServiceTimeMinutes: 5,
    });
  });

  it('toString includes the tag name and the service time', () => {
    const service = new Service('S1', 'Shipping', 5);

    expect(service.toString()).toBe('Service Shipping | Average service time: 5 min');
  });
});
