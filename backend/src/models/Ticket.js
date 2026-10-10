import TicketStatus from "../constants/TicketStatus.js";

class Ticket {
    code;
    serviceId;
    status;
    createdAt;
    counterId;

    constructor(code, serviceId, status, createdAt, counterId) {
        this.code = code;
        this.serviceId = serviceId;
        this.status = TicketStatus.WAITING;
        this.createdAt = new Date(); // used for ordering, stats and debugging
        this.counterId = null; // you don't know a priori 
    }

    markAsCalled(counterId) {
    this.status = TicketStatus.CALLED;
    this.counterId = counterId;
    this.calledAt = new Date();
    }

    markAsServed() {
        this.status = TicketStatus.SERVED;
        this.servedAt = new Date();
    }

    toString() {
        return `Ticket ${this.code} | Service: ${this.serviceId} | Status: ${this.status} | Counter: ${this.counterId ?? "Not assigned"}`;
    }

    getInfo() {
        return {
            code: this.code,
            serviceId: this.serviceId,
            status: this.status,
            createdAt: this.createdAt,
            counterId: this.counterId
        };
    }
}

export default Ticket;