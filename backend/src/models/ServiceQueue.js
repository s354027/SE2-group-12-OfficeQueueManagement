class ServiceQueue{
    serviceId;
    tickets;

    constructor(serviceId){
        this.serviceId = serviceId;
        this.tickets = [];
    }

    enqueue(ticket){
       if (ticket.serviceId !== this.serviceId) {
            throw new Error("Ticket service does not match queue service");
        }

        this.tickets.push(ticket);
    }

    dequeue() {
        return this.tickets.shift() ?? null;
    }

    peek() {
        return this.tickets[0] ?? null;
    }

    getPosition(ticketCode) {
        const index = this.tickets.findIndex(
            ticket => ticket.code === ticketCode
        );

        return index === -1 ? null : index + 1;
    }

    get length() {
        return this.tickets.length;
    }

    isEmpty() {
        return this.tickets.length == 0;
    }

    reset() { // for the dayly reset
        this.tickets = [];
    }
    
    toString() {
        return `ServiceQueue ${this.serviceId} | Waiting: ${this.length} | Tickets: [${this.tickets.map(t => t.code).join(", ")}]`;
    }
}

export default ServiceQueue;