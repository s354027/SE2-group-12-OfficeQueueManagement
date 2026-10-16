/**
 * Controller for managing counter operations.
 */

export const getCounter = (officeQueueManagement) => (req, res) => {
  try {
    const { counterId } = req.params;
    const counter = officeQueueManagement.counters.get(counterId);

    if (!counter) {
      return res.status(404).json({ error: `Counter with ID ${counterId} not found.` });
    }

    const services = [...counter.serviceIds]
      .map((serviceId) => officeQueueManagement.services.get(serviceId))
      .filter(Boolean)
      .map((service) => ({
        ...service.getInfo(),
        waitingTickets: officeQueueManagement.queues.get(service.id)?.length ?? 0
      }));

    return res.status(200).json({
      id: counter.id,
      number: counter.number,
      services
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const callNextCustomer = (officeQueueManagement) => (req, res) => {
  try {
    const { counterId } = req.params;

    if (!counterId) {
      return res.status(400).json({ error: "The 'counterId' parameter is required." });
    }

    // Performs queue selection and extracts the next customer
    const ticket = officeQueueManagement.callNextCustomer(counterId);

    if (!ticket) {
      return res.status(200).json({
        message: "No customers waiting for this counter",
        ticket: null
      });
    }

    return res.status(200).json({
      message: "Next customer called successfully",
      ticket: ticket.getInfo()
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};