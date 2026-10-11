class Counter {
    id;
    number; // similar to the id but it is a number, id may be a string like "C01" 
    serviceIds; // used to index the corresponding queues
    officerId;
    currentTicketCode; // the ticket that is currently being served

    constructor(id, number, officerId=null) {
        this.id = id;
        this.number = number;
        this.serviceIds = new Set();
        this.officerId = officerId;
        this.currentTicketCode = null;
    }

    addService(serviceId) {
        this.serviceIds.add(serviceId);
    }
    removeService(serviceId) {
        this.serviceIds.delete(serviceId);
    }
    resetServices() {
        this.serviceIds.clear();
    }
    canServe(serviceId) {
        return this.serviceIds.has(serviceId);
    }


    assignOfficer(officerId) {
        this.officerId = officerId;
    }
    removeOfficer() {
        this.officerId = null;
    }

    assignTicket(ticketCode) {
        this.currentTicketCode = ticketCode;
    }
    clearCurrentTicket() {
        this.currentTicketCode = null;
    }
    get isAvailable() {
        return this.currentTicketCode === null;
    }
    
    toString() {
        return `Counter ${this.number} | Services: [${[...this.serviceIds].join(", ")}] | Officer: ${this.officerId ?? "Not assigned"}`;
    }
}

export default Counter;