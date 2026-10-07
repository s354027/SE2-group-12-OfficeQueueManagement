class Service {
    id;
    tagName;
    estimatedServiceTimeMinutes;

    constructor(id, tagName, estimatedServiceTimeMinutes) {
        if (estimatedServiceTimeMinutes <= 0) {
            throw new Error("Service time must be greater than zero");
        }
        this.id = id;
        this.tagName = tagName;
        this.estimatedServiceTimeMinutes; 
    }

    setAverageServiceTime(minutes) {
        if (minutes <= 0) {
            throw new Error("Service time must be greater than zero");
        }

        this.averageServiceTimeMinutes = minutes;
    }

    toString() {
        return `Service ${this.tagName} | Average service time: ${this.estimatedServiceTimeMinutes} min`;
    }

    getInfo() {
        return {
            id: this.id,
            tagName: this.tagName,
            estimatedServiceTimeMinutes: this.estimatedServiceTimeMinutes
        }
    }
}

export default Service;