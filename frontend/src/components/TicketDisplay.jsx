import { useEffect, useState } from 'react';

const AUTO_CLOSE_SECONDS = 10;

export default function TicketDisplay({ ticket, serviceName, onDone }) {
  const [seconds, setSeconds] = useState(AUTO_CLOSE_SECONDS);

  // Count down and go back to the start screen automatically.
  useEffect(() => {
    if (seconds <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 500);
    return () => clearTimeout(t);
  }, [seconds, onDone]);

  // peopleAhead is optional: shown only if the backend sends it.
  const ahead = ticket.peopleAhead;

  return (
    <main className="screen">
      <h1>Your ticket</h1>
      <div className="ticket">
        <div className="ticket-code">{ticket.code}</div>
        <div className="ticket-service">{serviceName}</div>
        {typeof ahead === 'number' && (
          <div className="ticket-ahead">
            {ahead === 0
              ? 'You are next in line'
              : `${ahead} ${ahead === 1 ? 'person' : 'people'} ahead of you`}
          </div>
        )}
      </div>
      <p className="subtitle">Please wait for your number to be called.</p>
    
    </main>
  );
}
