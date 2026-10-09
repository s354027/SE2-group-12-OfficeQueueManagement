# Frontend

Contains: Totem UI (done), Admin UI, Officer UI (to do).

## Run
```bash
# terminal 1
cd backend/src && npm install && npm run dev     # http://localhost:3001
# terminal 2
cd frontend && npm install && npm run dev        # http://localhost:5173
```
`/api` calls are proxied to the backend (see `vite.config.js`).

## Backend
- `POST /api/tickets` is used.
- Services are hardcoded in `src/api.js` (no `GET /api/services` yet).

## Files
- `src/api.js` - backend calls
- `src/components/Totem.jsx` - service selection screen
- `src/components/TicketDisplay.jsx` - ticket shown after selection
