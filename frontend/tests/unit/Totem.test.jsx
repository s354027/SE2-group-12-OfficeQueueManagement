import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Totem from '../../src/components/Totem.jsx';
import * as api from '../../src/api.js';

const SERVICES = [
  { id: 'S1', tagName: 'Shipping', estimatedServiceTimeMinutes: 5 },
  { id: 'S2', tagName: 'Accounts', estimatedServiceTimeMinutes: 8 },
];

describe('Totem', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('lists every available service once loaded', async () => {
    vi.spyOn(api, 'getServices').mockResolvedValue(SERVICES);

    render(<Totem />);

    expect(await screen.findByRole('button', { name: 'Shipping' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accounts' })).toBeInTheDocument();
  });

  it('shows an error and a retry button when the services fail to load', async () => {
    vi.spyOn(api, 'getServices').mockRejectedValueOnce(new Error('network down'));

    render(<Totem />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot load the services. Please ask the staff.'
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('reloads the services when Retry is clicked', async () => {
    const getServices = vi
      .spyOn(api, 'getServices')
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(SERVICES);

    const user = userEvent.setup();
    render(<Totem />);

    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: 'Shipping' })).toBeInTheDocument();
    expect(getServices).toHaveBeenCalledTimes(2);
  });

  it('issues a ticket for the selected service and displays it', async () => {
    vi.spyOn(api, 'getServices').mockResolvedValue(SERVICES);
    vi.spyOn(api, 'createTicket').mockResolvedValue({
      code: 1,
      serviceId: 'S1',
      status: 'WAITING',
      createdAt: new Date().toISOString(),
    });

    const user = userEvent.setup();
    render(<Totem />);

    await user.click(await screen.findByRole('button', { name: 'Shipping' }));

    expect(await screen.findByText('1')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(api.createTicket).toHaveBeenCalledWith('S1');
  });

  it('shows an error without leaving the selection screen if ticket creation fails', async () => {
    vi.spyOn(api, 'getServices').mockResolvedValue(SERVICES);
    vi.spyOn(api, 'createTicket').mockRejectedValue(new Error('Service S1 does not exist'));

    const user = userEvent.setup();
    render(<Totem />);

    await user.click(await screen.findByRole('button', { name: 'Shipping' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Service S1 does not exist')
    );
    // still on the selection screen, not the ticket screen
    expect(screen.getByRole('button', { name: 'Shipping' })).toBeInTheDocument();
  });
});
