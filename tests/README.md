# Testing

Stack: [Vitest](https://vitest.dev) for unit and integration tests, [Playwright](https://playwright.dev) for end-to-end tests.

Unit and integration tests live **inside each package** (`backend/src/tests/`,
`frontend/tests/`) so they resolve that package's own `node_modules` (e.g.
`supertest`, `@testing-library/react`) without extra configuration. Only
end-to-end tests, which don't need either package's dependencies, live here
at the repo root.

```
backend/src/tests/
  unit/           Unit tests for OfficeQueueManagement and the models
  integration/    supertest tests against the Express app (backend/src/app.js)
frontend/tests/
  unit/           Component tests (React Testing Library)
tests/
  e2e/            Playwright tests driving the real totem/counter UI
```

## Running tests

```bash
# backend unit + integration
cd backend/src && npm test

# frontend unit
cd frontend && npm test

# end-to-end (boots backend + frontend automatically)
npm run test:e2e
```

Before running e2e tests for the first time, install the Playwright browsers:

```bash
npx playwright install
```

## Integration tests

`backend/src/app.js` exports `createApp(officeQueueManagement)`, which builds
the Express app without binding to a port. Integration tests build their own
`OfficeQueueManagement` (see `backend/src/seedOffice.js` for the same demo
data `index.js` uses) and drive it with `supertest(app)`, so each test starts
from a known, isolated state.
