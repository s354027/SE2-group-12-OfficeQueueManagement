// Starter example — expand with the full set of Totem/get-ticket UI cases.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Totem from '../../src/components/Totem.jsx';
import * as api from '../../src/api.js';

describe('Totem', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the available services once loaded', async () => {
    vi.spyOn(api, 'getServices').mockResolvedValue([
      { id: 'S1', tagName: 'Shipping', estimatedServiceTimeMinutes: 5 },
    ]);

    render(<Totem />);

    expect(await screen.findByRole('button', { name: 'Shipping' })).toBeInTheDocument();
  });

  it('shows the ticket after selecting a service', async () => {
    vi.spyOn(api, 'getServices').mockResolvedValue([
      { id: 'S1', tagName: 'Shipping', estimatedServiceTimeMinutes: 5 },
    ]);
    vi.spyOn(api, 'createTicket').mockResolvedValue({
      code: 1,
      serviceId: 'S1',
      status: 'WAITING',
      createdAt: new Date().toISOString(),
    });

    const user = userEvent.setup();
    render(<Totem />);

    await user.click(await screen.findByRole('button', { name: 'Shipping' }));

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });
});
