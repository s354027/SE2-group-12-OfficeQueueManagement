import { useEffect, useState } from 'react';
import { getServices, createTicket } from '../api.js';
import TicketDisplay from './TicketDisplay.jsx';

export default function Totem() {
  const [services, setServices] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function loadServices() {
    setLoading(true);
    setError('');
    getServices()
      .then(setServices)
      .catch(() => setError('Cannot load the services. Please ask the staff.'))
      .finally(() => setLoading(false));
  }

  useEffect(loadServices, []);

  async function handleSelect(serviceId) {
    setBusy(true);
    setError('');
    try {
      setTicket(await createTicket(serviceId));
    } catch (e) {
      setError(e.message || 'Could not issue the ticket. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (ticket) {
    const service = services.find((s) => s.id === ticket.serviceId);
    return (
      <TicketDisplay
        ticket={ticket}
        serviceName={service ? service.tagName : ticket.serviceId}
        onDone={() => setTicket(null)}
      />
    );
  }

  return (
    <main className="screen">
      <h1>Take a ticket</h1>
      <p className="subtitle">Choose the service you need</p>

      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p>Loading services...</p>}

      <div className="services">
        {services.map((s) => (
          <button
            key={s.id}
            className="service-btn"
            disabled={busy}
            onClick={() => handleSelect(s.id)}
          >
            {s.tagName}
          </button>
        ))}
      </div>

      {!loading && services.length === 0 && !error && <p>No services available.</p>}
      {error && services.length === 0 && (
        <button className="secondary-btn" onClick={loadServices}>Retry</button>
      )}
    </main>
  );
}
