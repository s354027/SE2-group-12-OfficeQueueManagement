// All backend calls for the Totem live here.

// Services are hardcoded for now (there is no GET /api/services in the backend).
// The ids MUST match the service ids the backend knows about.
// When the backend has the endpoint, replace the body with:
//   const res = await fetch('/api/services'); return res.json();
const SERVICES = [
  { id: 'S1', tagName: 'Shipping', estimatedServiceTimeMinutes: 5 },
  { id: 'S2', tagName: 'Accounts', estimatedServiceTimeMinutes: 8 },
  { id: 'S3', tagName: 'Info', estimatedServiceTimeMinutes: 3 },
];

export async function getServices() {
  return SERVICES;
}

// POST /api/tickets  { serviceId }  ->  201 { code, serviceId, status, createdAt, counterId }
// Errors come back as 400 { error }.
export async function createTicket(serviceId) {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

// GET /api/counters/:counterId -> { id, number, services }
export async function getCounter(counterId) {
  const backendCounterId = /^\d+$/.test(counterId) ? `C${counterId}` : counterId;
  const res = await fetch(`/api/counters/${backendCounterId}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

// POST /api/counters/:counterId/next-customer  { counterId }  ->  200 { ticket, service }
// Errors come back as 400 { error }.
export async function callNextCustomer(counterId) {
  const backendCounterId = /^\d+$/.test(counterId) ? `C${counterId}` : counterId;
  const res = await fetch(`/api/counters/${backendCounterId}/next-customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}