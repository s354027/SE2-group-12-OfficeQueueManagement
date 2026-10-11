import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { callNextCustomer, getCounter } from "../api.js";

export default function CounterUI() {
  const { counterId } = useParams();
  const [currentTicket, setCurrentTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(null);
  const [counterError, setCounterError] = useState("");

  useEffect(() => {
    const loadCounter = async () => {
      try {
        const data = await getCounter(counterId);
        
        if (data) {
          setCounter(data);
          setCounterError("");
        } else {
          return;
        }

        const hasWaitingTickets = data.services.some(
          (service) => service.waitingTickets > 0,
        );
        if (hasWaitingTickets) {
          setMessage((currentMessage) =>
            currentMessage === "No customers waiting for this counter"
              ? ""
              : currentMessage,
          );
        }
      } catch (error) {
        setCounterError(error.message);
        setCounter(null);
      }
    };

    loadCounter();
    const refreshInterval = setInterval(loadCounter, 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [counterId]);

  const handleCallNext = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await callNextCustomer(counterId);

      if (data.ticket) {
        setCurrentTicket(data.ticket);
        setCounter(
          (currentCounter) =>
            currentCounter && {
              ...currentCounter,
              services: currentCounter.services.map((service) =>
                service.id === data.ticket.serviceId
                  ? {
                      ...service,
                      waitingTickets: Math.max(
                        0,
                        (service.waitingTickets ?? 0) - 1,
                      ),
                    }
                  : service,
              ),
            },
        );
        setMessage(data.message);
      } else {
        setCurrentTicket(null);
        setMessage(data.message);
      }
    } catch (err) {
      console.error("API error:", err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="screen counter-screen">
      {counterError && (
        <p className="counter-error" role="alert">
          {counterError}
        </p>
      )}

      <h1>Counter Desk #{counter?.number ?? counterId}</h1>

      {counter && (
        <div className="counter-services">
          <p>
            {counter.services
              .map(
                (service) =>
                  `${service.tagName}: ${service.waitingTickets ?? 0}`,
              )
              .join(", ")}
          </p>
        </div>
      )}

      <section className="counter-panel" aria-live="polite">
        <h2>Current Customer:</h2>
        {currentTicket ? (
          <div className="counter-ticket">
            Ticket #{currentTicket.code}
            <div className="counter-service">
              {counter?.services.find(
                (service) => service.id === currentTicket.serviceId,
              )?.tagName ?? currentTicket.serviceId}
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
        {loading ? "Calling next customer..." : "Call Next Customer"}
      </button>

      {message && (
        <p className="counter-message" role="status">
          {message}
        </p>
      )}
    </main>
  );
}
