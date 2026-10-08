import Ticket from "./models/Ticket.js";

// this is the central unit that manages the office
class OfficeQueueManagement {
    services;
    queues;
    counters;
    tickets;
    users;
    lastTicketCode;  // Track the last unique code generated

    constructor() {
        this.services = new Map();
        this.queues = new Map();
        this.counters = new Map();
        this.tickets = new Map();
        this.users = new Map();
        this.lastTicketCode = 0;
    } 
    
    /**
    * Generate the next unique code for a ticket. 
    * Increments the last released code by 1.
    * @returns {number} The new unique ticket code.
    */
    generateNextTicketCode() {
        this.lastTicketCode += 1;
        return this.lastTicketCode;
    }

    /**
    * Select a service type and issue a new ticket for it.
    * The ticket is appended to the queue associated with the service.
    * @param {string} serviceId - The id of the requested service.
    * @returns {Ticket} The newly created ticket, holding the wait list code.
    */
    selectService(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error(`Service ${serviceId} does not exist`);
        }

        const queue = this.queues.get(serviceId);
        if (!queue) {
            throw new Error(`No queue configured for service ${serviceId}`);
        }

        const code = this.generateNextTicketCode();
        const ticket = new Ticket(code, serviceId);

        queue.enqueue(ticket);
        this.tickets.set(code, ticket);

        return ticket;
    }
}

export default OfficeQueueManagement;