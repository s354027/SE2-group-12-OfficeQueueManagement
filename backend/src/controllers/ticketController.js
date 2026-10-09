/**
 * Controller for managing the issuance of tickets.
 */

export const issueTicket = (officeQueueManagement) => (req, res) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.status(400).json({ error: "The 'serviceId' field is required." });
    }

    // Generate and queue the new ticket
    const ticket = officeQueueManagement.selectService(serviceId);

    return res.status(201).json(ticket.getInfo());
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};