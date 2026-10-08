// ============================================================
//  THE ONLY FILE TO EDIT WHEN THE BACKEND IS READY
//  Replace the body of the two functions below with real calls.
// ============================================================

// TODO: call the backend:  GET /api/services
// Must return: [ { id, tagName, estimatedServiceTimeMinutes } ]
export async function getServices() {
  // placeholder so the screen is not empty - DELETE when the API exists
  return [
    { id: 'S1', tagName: 'Shipping', estimatedServiceTimeMinutes: 5 },
    { id: 'S2', tagName: 'Accounts', estimatedServiceTimeMinutes: 8 },
    { id: 'S3', tagName: 'Info', estimatedServiceTimeMinutes: 3 },
  ];
}

// TODO: call the backend:  POST /api/tickets  with body { serviceId }
// Must return: { code, serviceId, status, createdAt, counterId }
// (optional extra: peopleAhead)
let placeholderCode = 0;
export async function createTicket(serviceId) {
  // placeholder - DELETE when the API exists
  placeholderCode += 1;
  return { code: placeholderCode, serviceId, status: 'WAITING', createdAt: new Date().toISOString(), counterId: null };
}
