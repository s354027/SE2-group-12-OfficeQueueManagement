// This test suite is for the Next Customer feature in the application.

import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const COUNTER_ID = "1"; // Replace with the actual counter ID you want to test

const SERVICES = [{ id: "S1", tagName: "Shipping" }];

test.describe("Next Customer Feature", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    // Navigate to the counter page before each test
    await page.goto(`/counter-ui/${COUNTER_ID}`);
  });

  test('should display the "Next Customer" button', async ({ page }) => {
    const nextCustomerButton = page.locator("button", {
      hasText: "Next Customer",
    });
    await expect(nextCustomerButton).toBeVisible();
  });

  test("should fetch counter data from the API and display it on the page", async ({
    page,
  }) => {
    // Fetch counter data from the backend API
    const backendCounterId = `C${COUNTER_ID}`;
    const res = await page.request.get(
      `${BASE_URL}/api/counters/${backendCounterId}`,
    );
    await expect(res).toBeOK();

    // Verify that the counter number is displayed correctly
    const counterData = await res.json();
    await expect(page.locator("h1")).toHaveText(
      `Counter Desk #${counterData.number}`,
    );

    // Verify that the services and their waiting tickets are displayed correctly
    const servicesText = counterData.services
      .map((service) => `${service.tagName}: ${service.waitingTickets}`)
      .join(", ");
    await expect(page.locator(".counter-services p")).toHaveText(servicesText);
  });

  test("no current customer should be displayed initially", async ({
    page,
  }) => {
    const currentTicketText = page.locator(".counter-empty");
    await expect(currentTicketText).toHaveText(
      "No customer currently being served",
    );
  });

  test('should display the next customer when the "Next Customer" button is clicked', async ({
    page,
  }) => {
    // Simulate a customer taking a ticket for service S1
    const ticketResponse = await page.request.post(`${BASE_URL}/api/tickets`, {
      data: { serviceId: `${SERVICES[0].id}` },
    });
    await expect(ticketResponse).toBeOK();

    // Click the "Next Customer" button and wait for the response
    const nextCustomerButton = page.locator("button", {
      hasText: "Next Customer",
    });
    const nextCustomerResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/counters/C${COUNTER_ID}/next-customer`) &&
        response.status() === 200,
      (response) =>
        response.json().then((data) => {
          // Verify that the response contains the expected ticket information
          expect(data).toHaveProperty(
            "message",
            "Next customer called successfully",
          );
          expect(data).toHaveProperty(
            "ticket",
            expect.objectContaining({
              serviceId: `${SERVICES[0].id}`,
              code: expect.any(Number),
              status: "CALLED",
              counterId: `C${COUNTER_ID}`,
            }),
          );
        }),
    );
    await nextCustomerButton.click();
    await nextCustomerResponse;

    // Check that the current ticket information is updated
    await expect(page.locator(".counter-ticket")).toBeVisible();
  });

  test("should display a message when there are no waiting customers", async ({
    page,
  }) => {
    // Click the "Next Customer" button when there are no waiting customers
    const nextCustomerButton = page.locator("button", {
      hasText: "Next Customer",
    });
    const nextCustomerResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/counters/C${COUNTER_ID}/next-customer`) &&
        response.status() === 200,
      (response) =>
        response.json().then((data) => {
          // Verify that the response contains the expected ticket information
          expect(data).toHaveProperty(
            "message",
            "No customers waiting for this counter",
          );
          expect(data).toHaveProperty("ticket", null);
        }),
    );
    await nextCustomerButton.click();
    await nextCustomerResponse;

    // Check that the current ticket information is updated to show no customer
    await expect(page.locator(".counter-empty")).toHaveText(
      "No customer currently being served",
    );
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Simulate an API error by using an invalid counter ID
    const invalidCounterId = "invalid-counter-id";
    await page.goto(`/counter-ui/${invalidCounterId}`);

    const nextCustomerButton = page.locator("button", {
      hasText: "Next Customer",
    });
    const nextCustomerResponse = page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(`/api/counters/${invalidCounterId}/next-customer`) &&
        response.status() === 400,
      (response) =>
        response.json().then((data) => {
          // Verify that the response contains the expected error message
          expect(data).toHaveProperty(
            "error",
            `Counter with ID ${invalidCounterId} not found.`,
          );
        }),
    );
    await nextCustomerButton.click();
    await nextCustomerResponse;

    // Check that the current ticket information is still showing no customer
    await expect(page.locator(".counter-empty")).toHaveText(
      "No customer currently being served",
    );

    // Check that the error message is displayed on the page
    await expect(page.locator(".counter-error")).toHaveText(
      `Counter with ID ${invalidCounterId} not found.`,
    );
  });

  test("should increment the waiting tickets count for a service when a customer takes a ticket", async ({
    page,
  }) => {
    // Fetch counter data from the backend API
    const backendCounterId = `C${COUNTER_ID}`;
    const res = await page.request.get(
      `${BASE_URL}/api/counters/${backendCounterId}`,
    );
    await expect(res).toBeOK();

    // Store the initial waiting tickets count for service S1
    const data = await res.json();
    const waitingTicketsBefore =
      data.services.find((service) => service.id === `${SERVICES[0].id}`)
        ?.waitingTickets ?? 0;

    // Simulate a customer taking a ticket for service S1
    const ticketResponse = await page.request.post(`${BASE_URL}/api/tickets`, {
      data: { serviceId: `${SERVICES[0].id}` },
    });
    await expect(ticketResponse).toBeOK();

    // Checks that the waiting tickets count for service S1 has incremented by 1
    const expectedWaitingTicketsAfter = waitingTicketsBefore + 1;
    await expect
      .poll(() => page.locator(".counter-services p").textContent())
      .toContain(`${SERVICES[0].tagName}: ${expectedWaitingTicketsAfter}`);
  });

  test("should decrement the waiting tickets count for a service when a customer is called", async ({
    page,
  }) => {
    const backendCounterId = `C${COUNTER_ID}`;
    const res = await page.request.get(
      `${BASE_URL}/api/counters/${backendCounterId}`,
    );
    await expect(res).toBeOK();

    const data = await res.json();
    const waitingTicketsBefore =
      data.services.find((service) => service.id === `${SERVICES[0].id}`)
        ?.waitingTickets ?? 0;

    // Simulate a customer taking a ticket for service S1
    const ticketResponse = await page.request.post(`${BASE_URL}/api/tickets`, {
      data: { serviceId: `${SERVICES[0].id}` },
    });
    await expect(ticketResponse).toBeOK();

    // Checks that the waiting tickets count for service S1 is as expected before calling the next customer
    const expectedWaitingTicketsBefore = waitingTicketsBefore + 1;
    await expect
      .poll(() => page.locator(".counter-services p").textContent())
      .toContain(`${SERVICES[0].tagName}: ${expectedWaitingTicketsBefore}`);

    // Click the "Next Customer" button and wait for the response
    const nextCustomerButton = page.locator("button", {
      hasText: "Next Customer",
    });
    const nextCustomerResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/counters/C${COUNTER_ID}/next-customer`) &&
        response.status() === 200,
      (response) =>
        response.json().then((data) => {
          // Verify that the response contains the expected ticket information
          expect(data).toHaveProperty(
            "message",
            "Next customer called successfully",
          );
          expect(data).toHaveProperty(
            "ticket",
            expect.objectContaining({
              serviceId: `${SERVICES[0].id}`,
              code: expect.any(Number),
              status: "CALLED",
              counterId: `C${COUNTER_ID}`,
            }),
          );
        }),
    );
    await nextCustomerButton.click();
    await nextCustomerResponse;

    // Checks that the waiting tickets count for service S1 has decremented by 1
    await expect
      .poll(() => page.locator(".counter-services p").textContent())
      .toContain(`${SERVICES[0].tagName}: ${waitingTicketsBefore}`);
  });
});
