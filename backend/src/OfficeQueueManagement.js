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
}

export default OfficeQueueManagement;