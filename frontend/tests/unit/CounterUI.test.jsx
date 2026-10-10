import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CounterUI from "../../src/components/CounterUI.jsx";
import * as api from "../../src/api.js";

describe("CounterUI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the counter number and services when loaded", async () => {
    const counterData = {
      number: 1,
      services: [
        { id: "S1", tagName: "Shipping", waitingTickets: 3 },
        { id: "S2", tagName: "Accounts", waitingTickets: 1 },
      ],
    };
    vi.spyOn(api, "getCounter").mockResolvedValue(counterData);

    render(<CounterUI />);

    expect(await screen.findByText("Counter Desk #1")).toBeInTheDocument();
    expect(screen.getByText("Shipping: 3, Accounts: 1")).toBeInTheDocument();
  });

  it('shows "No customers currently being served" when loaded', async () => {
    render(<CounterUI />);

    expect(
      await screen.findByText("No customer currently being served"),
    ).toBeInTheDocument();
  });

  it('shows "Call Next Customer" button and calls the API when clicked', async () => {
    const ticketData = {
      ticket: { code: 42, serviceId: "S1" },
      message: "Next customer called successfully",
    };
    vi.spyOn(api, "callNextCustomer").mockResolvedValue(ticketData);

    render(<CounterUI />);

    const button = await screen.findByRole("button", {
      text: "Call Next Customer",
    });
    await userEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("Next customer called successfully"),
      ).toBeInTheDocument();
      expect(screen.getByText("Ticket #42")).toBeInTheDocument();
    });
  });

  it("shows an error message when the API call fails", async () => {
    vi.spyOn(api, "callNextCustomer").mockRejectedValue(new Error("API error"));

    render(<CounterUI />);

    const button = await screen.findByRole("button", {
      text: "Call Next Customer",
    });
    await userEvent.click(button);
  });

  it("disables the button while loading", async () => {
    const ticketData = {
      ticket: { code: 42, serviceId: "S1" },
      message: "Next customer called successfully",
    };
    vi.spyOn(api, "callNextCustomer").mockImplementation(() => {
      return new Promise((resolve) =>
        setTimeout(() => resolve(ticketData), 100),
      );
    });

    render(<CounterUI />);

    const button = await screen.findByRole("button", {
      text: "Call Next Customer",
    });
    await userEvent.click(button);

    expect(button).toBeDisabled();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("shows the service name for the current ticket", async () => {
    const counterData = {
      number: 1,
      services: [
        { id: "S1", tagName: "Shipping", waitingTickets: 1 },
        { id: "S2", tagName: "Accounts", waitingTickets: 2 },
      ],
    };
    const ticketData = {
      ticket: { code: 42, serviceId: "S1" },
      message: "Next customer called successfully",
    };
    vi.spyOn(api, "getCounter").mockResolvedValue(counterData);
    vi.spyOn(api, "callNextCustomer").mockResolvedValue(ticketData);

    render(<CounterUI />);

    const button = await screen.findByRole("button", {
      text: "Call Next Customer",
    });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Shipping: 0, Accounts: 2")).toBeInTheDocument();
    });
  });

  it('shows "No customers waiting for this counter" when no ticket is returned', async () => {
    const ticketData = {
      ticket: null,
      message: "No customers waiting for this counter",
    };
    vi.spyOn(api, "callNextCustomer").mockResolvedValue(ticketData);

    render(<CounterUI />);

    const button = await screen.findByRole("button", {
      text: "Call Next Customer",
    });
    await userEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText("No customers waiting for this counter"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("No customer currently being served"),
      ).toBeInTheDocument();
    });
  });
});
