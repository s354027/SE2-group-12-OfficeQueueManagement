# Frontend

React and Vite frontend for the Office Queue Management system.

The frontend currently contains:

- the customer totem for requesting tickets;
- the officer counter UI for calling the next customer;
- no admin UI yet.

## Requirements

- Node.js and npm;
- the backend running on `http://localhost:3001` for ticket and counter operations.

## Run Locally

Install dependencies and start the backend:

```bash
cd backend/src
npm install
npm run dev
```

In a second terminal, install dependencies and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:5173`.
Vite proxies every request beginning with `/api` to `http://localhost:3001` (see `vite.config.js`).

## Frontend URLs

With the frontend running on `http://localhost:5173`:

| Page | URL | Description |
| --- | --- | --- |
| Totem | `http://localhost:5173/` | Select a service and get a ticket. |
| Counter 1 | `http://localhost:5173/counter-ui/1` | Officer UI for counter `C1`. |
| Counter 2 | `http://localhost:5173/counter-ui/2` | Officer UI for counter `C2`. |

## Application Flow

### Customer totem

1. The totem loads the available services.
2. The customer selects a service.
3. The frontend creates a ticket through the backend.
4. The ticket code and service are displayed for ten seconds.
5. The screen returns to the service selection page.

### Officer counter

1. The officer opens a counter URL.
2. The frontend loads the counter number and supported services.
3. The officer calls the next customer.
4. The backend selects a compatible queue and returns the ticket.
5. The ticket code and service name are displayed in the counter UI.

## Backend API Used

- `POST /api/tickets` creates a ticket for a service.
- `GET /api/counters/:counterId` loads counter details and supported services.
- `POST /api/counters/:counterId/next-customer` calls the next compatible customer.