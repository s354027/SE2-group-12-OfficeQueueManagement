import { describe, it, expect, test } from "vitest";
import Counter from "../../models/Counter.js";

describe("Counter", () => {
  it("stores id, number, officerId, and currentTicketCode", () => {
    const counter = new Counter("C1", 1, "O1");

    expect(counter.id).toBe("C1");
    expect(counter.number).toBe(1);
    expect(counter.serviceIds).toEqual(new Set()); // initially no services are assigned
    expect(counter.officerId).toBe("O1");
    expect(counter.currentTicketCode).toBe(null); // initially no ticket is being served
  });

  it("can add and remove services", () => {
    const counter = new Counter("C1", 1);
    counter.addService("S1");
    counter.addService("S2");

    expect(counter.serviceIds).toEqual(new Set(["S1", "S2"]));

    counter.removeService("S1");
    expect(counter.serviceIds).toEqual(new Set(["S2"]));
  });

  it("can reset services", () => {
    const counter = new Counter("C1", 1);
    counter.addService("S1");
    counter.addService("S2");

    counter.resetServices();
    expect(counter.serviceIds.size).toBe(0);
  });

  it("can assign and remove an officer", () => {
    const counter = new Counter("C1", 1);
    counter.assignOfficer("O1");
    expect(counter.officerId).toBe("O1");

    counter.removeOfficer();
    expect(counter.officerId).toBeNull();
  });

  it("can assign and clear the current ticket", () => {
    const counter = new Counter("C1", 1);
    counter.assignTicket("T1");
    expect(counter.currentTicketCode).toBe("T1");

    counter.clearCurrentTicket();
    expect(counter.currentTicketCode).toBeNull();
  });

  it("can check if it is available (no current ticket)", () => {
    const counter = new Counter("C1", 1);
    expect(counter.isAvailable).toBe(true);
  });

  test("toString returns a string representation of the counter", () => {
    const counter = new Counter("C1", 1);
    counter.addService("S1");
    counter.addService("S2");
    counter.assignOfficer("O1");

    expect(counter.toString()).toBe(
      "Counter 1 | Services: [S1, S2] | Officer: O1",
    );
  });
});
