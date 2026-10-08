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


    /**
    * Call the next ticket for a specific counter following the office's rules:
    * 1. Selection of the longest queue of those that the counter can serve.
    * 2. Selection of the longest queue of those that the door can serve.
    * 3. if all queues are empty, returns null.
    * 
    * Mark the ticket as SERVED, remove it from the queue, and assign the ticket to the counter.
    * 
    * @param {string} counterId - ID of the counter requesting the next customer.
    * @returns {Ticket|null} the ticket extracted and served, or null if there are no customers waiting.
    */
    callNextCustomer(counterId) {
        const counter = this.counters.get(counterId);
        if (!counter) {
            throw new Error(`Counter with ID ${counterId} not found.`);
        } 

        // 1. Filter queues for services that can be managed from the counter and are NOT empty
        const candidateQueues = [];

        for (const serviceId of counter.serviceIds) {
            const queue = this.queues.get(serviceId);
            const service = this.services.get(serviceId);

            if (queue && service && !queue.isEmpty()) {
                candidateQueues.push({
                    queue,
                    service,
                    length: queue.length,
                    estimatedServiceTimeMinutes: service.estimatedServiceTimeMinutes
                });
            }
        }

        // If all queues that can be managed from the counter are empty
        if (candidateQueues.length === 0) {
            return null;
        }

        // 2. Sort candidate queues:
        // - First for decreasing length (longest queue)
        // - In case of parity, for increasing service time (minor estimatedServiceTimeMinutes)
        candidateQueues.sort((a, b) => {
            if (b.length !== a.length) {
                return b.length - a.length; // Longer queue
            }
            return a.estimatedServiceTimeMinutes - b.estimatedServiceTimeMinutes; // shorter time
        });

        // The first selected queue is the winning one
        const selectedQueue = candidateQueues[0].queue;

        // 3. Extracts the first ticket from the queue (dequeue)
        const ticket = selectedQueue.dequeue();

        if (ticket) {
            // Mark the ticket as served
            ticket.markAsServed();
    
            // Update the counter status by setting the current ticket code
            counter.assignTicket(ticket.code);
        }

        return ticket;
    }
}

export default OfficeQueueManagement;