## Data Model Summary

### OfficeQueueManagement
Main operational hub of the application.

It keeps references to all core entities through `Map`s:

- services
- queues
- counters
- tickets
- users
- lastTicketCode

It will be responsible for coordinating operations involving multiple models, such as ticket creation, next-ticket selection, queue reset, waiting-time calculation and statistics.

### Ticket
Represents a customer's request for a service.

Stores:
- unique ticket code
- requested service
- current status
- assigned counter
- relevant timestamps

### Service
Represents a type of service offered by the office.

Stores:
- service ID
- service tag/name
- average service time

### ServiceQueue
Represents the FIFO queue associated with one service.

Used to:
- add tickets
- remove the next ticket
- check queue length
- inspect the first ticket
- reset the queue

Each service has one queue.

### Counter
Represents a physical service counter.

Stores:
- counter ID/number
- services it can handle
- assigned officer
- currently served ticket

It does not own queues directly; it references supported services through their IDs.

### User
Represents an authenticated internal user.

Stores:
- user ID
- username
- password hash
- role

Current roles:
- ADMIN
- MANAGER
- OFFICER

### Constants
`TicketStatus` and `UserRole` define the allowed fixed values used by the models.


## Backend API
 
#### `POST /api/tickets`
**Description:** This endpoint handles the customer's request and issuance of a new ticket.   
**Request Body:** 
```json
{
  "serviceId": 1
}
```
**Response:** `201 Created`, `400  Bad Request` 
**Response Body:** `code, serviceId, status, createdAt`   
**Response Body Example:**  
```json
{
  "code": 1,
  "serviceId": 1,
  "status": "WAITING",
  "createdAt": "2026-10-08T14:50:00.000Z"
}
```


#### `POST /api/counters/:counterId/next-customer`
**Description:** The officer calls the next client to be served at their counter.  
**Request Body:** `None`    
**Response:** `200 OK`, `400  Bad Request`  
**Response Body:** `message, ticket`  
**Response Body Example - when queues are not empty:**  
```json
{
  "message": "Next customer called successfully",
  "ticket": {
    "code": 1,
    "serviceId": 1,
    "status": "SERVED",
    "counterId": 1,
    "servedAt": "2026-10-08T14:50:00.000Z"
  }
}
```

**Response Body Example - when all managed queues are empty:**
```json
{
  "message": "No customers waiting for this counter",
  "ticket": null
}
´´´