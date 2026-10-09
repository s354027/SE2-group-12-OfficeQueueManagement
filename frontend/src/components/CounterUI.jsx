import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { callNextCustomer, getCounter } from '../api.js';

export default function CounterUI() {
  const { counterId } = useParams();
  const [currentTicket, setCurrentTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(null);
  const [counterError, setCounterError] = useState('');

  useEffect(() => {
    getCounter(counterId)
      .then(setCounter)
      .catch((error) => setCounterError(error.message));
  }, [counterId]);

  const handleCallNext = async () => {
    setLoading(true);
    setMessage('');

    try {
      const data = await callNextCustomer(counterId);

      if (data.ticket) {
        setCurrentTicket(data.ticket);
        setMessage(data.message);
      } else {
        setCurrentTicket(null);
        setMessage(data.message); // For example: "No customers waiting for this counter"
      }
    } catch (err) {
      console.error('API error:', err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="screen counter-screen">
      <h1>Counter Desk #{counter?.number ?? counterId}</h1>

      {counter && (
        <p className="counter-services">
          Services: {counter.services.map((service) => service.tagName).join(', ')}
        </p>
      )}
      {counterError && <p className="counter-error" role="alert">{counterError}</p>}

      <section className="counter-panel" aria-live="polite">
        <h2>Current Customer:</h2>
        {currentTicket ? (
          <div className="counter-ticket">
            Ticket #{currentTicket.code}
            <div className="counter-service">
              Service: {counter?.services.find((service) => service.id === currentTicket.serviceId)?.tagName
                ?? currentTicket.serviceId}
            </div>
          </div>
        ) : (
          <p className="counter-empty">No customer currently being served</p>
        )}
      </section>

      <button
        className="counter-button"
        onClick={handleCallNext}
        disabled={loading}
      >
        {loading ? 'Calling next customer...' : 'Call Next Customer'}
      </button>

      {message && <p className="counter-message" role="status">{message}</p>}
    </main>
  );
}