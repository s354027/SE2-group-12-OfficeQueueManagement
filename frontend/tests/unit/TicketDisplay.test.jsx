import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import TicketDisplay from '../../src/components/TicketDisplay.jsx';

const ticket = { code: 42, serviceId: 'S1' };

describe('TicketDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the ticket code and the service name', () => {
    render(<TicketDisplay ticket={ticket} serviceName="Shipping" onDone={() => {}} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
  });

  it('does not show a "people ahead" hint when peopleAhead is not provided', () => {
    render(<TicketDisplay ticket={ticket} serviceName="Shipping" onDone={() => {}} />);

    expect(screen.queryByText(/ahead of you/)).not.toBeInTheDocument();
    expect(screen.queryByText(/next in line/)).not.toBeInTheDocument();
  });

  it('shows "next in line" when peopleAhead is 0', () => {
    render(
      <TicketDisplay
        ticket={{ ...ticket, peopleAhead: 0 }}
        serviceName="Shipping"
        onDone={() => {}}
      />
    );

    expect(screen.getByText('You are next in line')).toBeInTheDocument();
  });

  it('pluralizes "people ahead" correctly', () => {
    const { rerender } = render(
      <TicketDisplay
        ticket={{ ...ticket, peopleAhead: 1 }}
        serviceName="Shipping"
        onDone={() => {}}
      />
    );
    expect(screen.getByText('1 person ahead of you')).toBeInTheDocument();

    rerender(
      <TicketDisplay
        ticket={{ ...ticket, peopleAhead: 3 }}
        serviceName="Shipping"
        onDone={() => {}}
      />
    );
    expect(screen.getByText('3 people ahead of you')).toBeInTheDocument();
  });

  // Each tick only schedules the next setTimeout inside a useEffect, so we
  // advance one 500ms step at a time: act() flushes the resulting effect
  // before the next step is scheduled, matching how the real timer ticks.
  function advanceTicks(count) {
    for (let i = 0; i < count; i += 1) {
      act(() => {
        vi.advanceTimersByTime(500);
      });
    }
  }

  it('calls onDone once the countdown reaches zero', () => {
    const onDone = vi.fn();
    render(<TicketDisplay ticket={ticket} serviceName="Shipping" onDone={onDone} />);

    advanceTicks(10); // AUTO_CLOSE_SECONDS

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does not call onDone before the countdown reaches zero', () => {
    const onDone = vi.fn();
    render(<TicketDisplay ticket={ticket} serviceName="Shipping" onDone={onDone} />);

    advanceTicks(9);

    expect(onDone).not.toHaveBeenCalled();
  });
});
