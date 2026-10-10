import { test, expect } from '@playwright/test';

// These tests drive the real totem UI (http://localhost:5173/) against the real
// backend (http://localhost:3001). The backend state is shared between tests and
// tests run in parallel, so we never assert absolute ticket codes: only that
// they are valid, numeric and unique.

const BACKEND_URL = 'http://localhost:3001';

const SERVICES = [
  { id: 'S1', tagName: 'Shipping' },
  { id: 'S2', tagName: 'Accounts' },
  { id: 'S3', tagName: 'Info' },
];

// Reads the numeric code shown on the ticket screen.
async function readTicketCode(page) {
  const text = await page.locator('.ticket-code').innerText();
  return Number(text.trim());
}

test.describe('Get ticket - totem home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the title, the subtitle and one button per service', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Take a ticket' })).toBeVisible();
    await expect(page.getByText('Choose the service you need')).toBeVisible();

    for (const { tagName } of SERVICES) {
      await expect(page.getByRole('button', { name: tagName, exact: true })).toBeVisible();
    }
    await expect(page.locator('.service-btn')).toHaveCount(SERVICES.length);
  });

  test('service buttons are enabled and no error is shown at start', async ({ page }) => {
    for (const { tagName } of SERVICES) {
      await expect(page.getByRole('button', { name: tagName, exact: true })).toBeEnabled();
    }
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText('No services available.')).toHaveCount(0);
  });
});

test.describe('Get ticket - selecting a service', () => {
  for (const { id, tagName } of SERVICES) {
    test(`customer gets a ticket for the "${tagName}" service`, async ({ page }) => {
      await page.goto('/');

      await page.getByRole('button', { name: tagName, exact: true }).click();

      // Ticket screen
      await expect(page.getByRole('heading', { name: 'Your ticket' })).toBeVisible();
      await expect(page.locator('.ticket')).toBeVisible();
      await expect(page.locator('.ticket-service')).toHaveText(tagName);
      await expect(
        page.getByText('Please wait for your number to be called.')
      ).toBeVisible();

      // The code is a positive integer
      const code = await readTicketCode(page);
      expect(Number.isInteger(code)).toBe(true);
      expect(code).toBeGreaterThan(0);

      // The totem screen is replaced by the ticket screen
      await expect(page.getByRole('heading', { name: 'Take a ticket' })).toHaveCount(0);
      await expect(page.locator('.service-btn')).toHaveCount(0);
    });
  }

  test('the ticket request sent to the backend contains the selected service id', async ({ page }) => {
    await page.goto('/');

    const [request] = await Promise.all([
      page.waitForRequest((req) => req.url().endsWith('/api/tickets') && req.method() === 'POST'),
      page.getByRole('button', { name: 'Accounts', exact: true }).click(),
    ]);

    expect(request.postDataJSON()).toEqual({ serviceId: 'S2' });
    expect(request.headers()['content-type']).toContain('application/json');

    const response = await request.response();
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ serviceId: 'S2', status: 'WAITING', counterId: null });

    // The code in the UI is the one returned by the backend
    await expect(page.locator('.ticket-code')).toHaveText(String(body.code));
  });

  test('the backend does not send "people ahead", so the UI does not show it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Info', exact: true }).click();

    await expect(page.locator('.ticket')).toBeVisible();
    await expect(page.locator('.ticket-ahead')).toHaveCount(0);
  });

  test('buttons are disabled while the ticket is being issued', async ({ page }) => {
    // Slow down the backend answer to observe the "busy" state.
    await page.route('**/api/tickets', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });
    await page.goto('/');

    await page.getByRole('button', { name: 'Shipping', exact: true }).click();

    for (const { tagName } of SERVICES) {
      await expect(page.getByRole('button', { name: tagName, exact: true })).toBeDisabled();
    }
    await expect(page.locator('.ticket')).toBeVisible();
  });

  test('a fast double click issues only one ticket', async ({ page }) => {
    let postCount = 0;
    await page.route('**/api/tickets', async (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      await route.continue();
    });
    await page.goto('/');

    const button = page.getByRole('button', { name: 'Shipping', exact: true });
    await button.click();
    // The button becomes disabled right after the first click: force a second attempt.
    await button.click({ force: true, noWaitAfter: true }).catch(() => {});

    await expect(page.locator('.ticket')).toBeVisible();
    expect(postCount).toBe(1);
  });
});

test.describe('Get ticket - ticket codes', () => {
  test('two different customers receive different codes', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');

    await pageA.getByRole('button', { name: 'Shipping', exact: true }).click();
    await pageB.getByRole('button', { name: 'Accounts', exact: true }).click();

    await expect(pageA.locator('.ticket-code')).toBeVisible();
    await expect(pageB.locator('.ticket-code')).toBeVisible();

    const codeA = await readTicketCode(pageA);
    const codeB = await readTicketCode(pageB);
    expect(codeA).not.toBe(codeB);

    await contextA.close();
    await contextB.close();
  });

  test('codes are unique even for the same service', async ({ browser }) => {
    const codes = [];

    for (let i = 0; i < 3; i += 1) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: 'Info', exact: true }).click();
      await expect(page.locator('.ticket-code')).toBeVisible();
      codes.push(await readTicketCode(page));
      await context.close();
    }

    expect(new Set(codes).size).toBe(codes.length);
  });

  test('codes grow monotonically for consecutive requests', async ({ browser }) => {
    const codes = [];

    for (const { tagName } of SERVICES) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: tagName, exact: true }).click();
      await expect(page.locator('.ticket-code')).toBeVisible();
      codes.push(await readTicketCode(page));
      await context.close();
    }

    // Tests run in parallel, so other codes may be interleaved: only order is checked.
    expect(codes[1]).toBeGreaterThan(codes[0]);
    expect(codes[2]).toBeGreaterThan(codes[1]);
  });
});

test.describe('Get ticket - return to the start screen', () => {
  test('the totem goes back to the service list automatically after the countdown', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Shipping', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your ticket' })).toBeVisible();

    // TicketDisplay counts down 10 steps of 500 ms (about 5 seconds).
    await expect(page.getByRole('heading', { name: 'Take a ticket' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('.ticket')).toHaveCount(0);
    await expect(page.locator('.service-btn')).toHaveCount(SERVICES.length);
  });

  test('after the reset a new customer can get another ticket', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Info', exact: true }).click();
    await expect(page.locator('.ticket-code')).toBeVisible();
    const firstCode = await readTicketCode(page);

    await expect(page.getByRole('heading', { name: 'Take a ticket' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'Accounts', exact: true }).click();
    await expect(page.locator('.ticket-service')).toHaveText('Accounts');
    const secondCode = await readTicketCode(page);

    expect(secondCode).toBeGreaterThan(firstCode);
  });
});

test.describe('Get ticket - error handling', () => {
  test('shows the backend error message when the ticket cannot be issued', async ({ page }) => {
    await page.route('**/api/tickets', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service S1 does not exist' }),
      })
    );
    await page.goto('/');

    await page.getByRole('button', { name: 'Shipping', exact: true }).click();

    await expect(page.getByRole('alert')).toHaveText('Service S1 does not exist');
    // Still on the totem: the customer can try again
    await expect(page.getByRole('heading', { name: 'Take a ticket' })).toBeVisible();
    await expect(page.locator('.ticket')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Shipping', exact: true })).toBeEnabled();
  });

  test('shows an error when the backend is unreachable', async ({ page }) => {
    await page.route('**/api/tickets', (route) => route.abort('failed'));
    await page.goto('/');

    await page.getByRole('button', { name: 'Info', exact: true }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('.ticket')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Info', exact: true })).toBeEnabled();
  });

  test('shows a generic message when the error response has no body', async ({ page }) => {
    await page.route('**/api/tickets', (route) =>
      route.fulfill({ status: 500, contentType: 'text/plain', body: '' })
    );
    await page.goto('/');

    await page.getByRole('button', { name: 'Accounts', exact: true }).click();

    await expect(page.getByRole('alert')).toHaveText('Request failed (500)');
  });

  test('the customer can retry successfully after an error', async ({ page }) => {
    let attempt = 0;
    await page.route('**/api/tickets', (route) => {
      attempt += 1;
      if (attempt === 1) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary problem' }),
        });
      }
      return route.continue();
    });
    await page.goto('/');

    await page.getByRole('button', { name: 'Shipping', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Temporary problem');

    await page.getByRole('button', { name: 'Shipping', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your ticket' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('Get ticket - backend API from the end-to-end environment', () => {
  test('POST /api/tickets answers 201 with a WAITING ticket', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/tickets`, {
      data: { serviceId: 'S3' },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ serviceId: 'S3', status: 'WAITING', counterId: null });
    expect(typeof body.code).toBe('number');
    expect(new Date(body.createdAt).toString()).not.toBe('Invalid Date');
  });

  test('POST /api/tickets answers 400 for an unknown service', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/tickets`, {
      data: { serviceId: 'NOPE' },
    });

    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: 'Service NOPE does not exist' });
  });

  test('POST /api/tickets answers 400 when serviceId is missing', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/tickets`, { data: {} });

    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: "The 'serviceId' field is required." });
  });
});
