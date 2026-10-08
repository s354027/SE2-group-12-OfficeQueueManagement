// this is the central unit that manages the office
class OfficeQueueManagement {
    services;
    queues;
    counters;
    tickets;
    users;

    constructor() {
        this.services = new Map();
        this.queues = new Map();
        this.counters = new Map();
        this.tickets = new Map();
        this.users = new Map();
    }
}

export default OfficeQueueManagement;