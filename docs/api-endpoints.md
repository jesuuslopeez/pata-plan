# PataPlan API — Endpoint Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All endpoints except `POST /api/auth/register` and `POST /api/auth/login` require a JWT token in the header:

```
Authorization: Bearer {token}
```

### Role Permissions

| Role | Read animals/events | Write events | Expenses | Settings |
|------|-------------------|-------------|----------|----------|
| ADMIN | Yes | Yes | Yes | Yes |
| COLLABORATOR | Yes | Yes | No | No |

### Error Responses

All endpoints may return:

| Code | Description |
|------|-------------|
| 400 | Bad request — invalid or missing fields |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Not found |
| 422 | Unprocessable entity — validation error |
| 500 | Internal server error |

```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Auth

### POST /api/auth/register

Register a new user.

- **Auth:** No

**Request body:**

```json
{
  "name": "Jesús López",
  "email": "jesus@example.com",
  "password": "securePassword123"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Jesús López",
  "email": "jesus@example.com",
  "role": "ADMIN",
  "createdAt": "2026-03-25T10:00:00.000Z"
}
```

**Errors:** `400` if email already exists or fields missing.

---

### POST /api/auth/login

Authenticate and receive a JWT token.

- **Auth:** No

**Request body:**

```json
{
  "email": "jesus@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jesús López",
    "email": "jesus@example.com",
    "role": "ADMIN"
  }
}
```

**Errors:** `401` if credentials are invalid.

---

### GET /api/auth/me

Get the authenticated user's data.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Jesús López",
  "email": "jesus@example.com",
  "role": "ADMIN",
  "createdAt": "2026-03-25T10:00:00.000Z",
  "updatedAt": "2026-03-25T10:00:00.000Z"
}
```

---

## Groups

### GET /api/groups

List all groups belonging to the authenticated user.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Casa",
    "userId": 1,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "_count": { "animals": 4 }
  },
  {
    "id": 2,
    "name": "Refugio",
    "userId": 1,
    "createdAt": "2026-03-25T10:00:00.000Z",
    "_count": { "animals": 3 }
  }
]
```

---

### POST /api/groups

Create a new group.

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "name": "Acogida temporal"
}
```

**Response:** `201 Created`

```json
{
  "id": 3,
  "name": "Acogida temporal",
  "userId": 1,
  "createdAt": "2026-03-25T10:00:00.000Z"
}
```

---

### PUT /api/groups/:id

Update a group.

- **Auth:** Yes (any role, must own group)

**Request body:**

```json
{
  "name": "Casa actualizado"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Casa actualizado",
  "userId": 1,
  "createdAt": "2026-03-25T10:00:00.000Z"
}
```

**Errors:** `404` if group not found or not owned by user.

---

### DELETE /api/groups/:id

Delete a group and all its animals (cascade).

- **Auth:** Yes (any role, must own group)

**Response:** `204 No Content`

**Errors:** `404` if group not found or not owned by user.

---

## Animals

### GET /api/animals

List animals. Supports filtering.

- **Auth:** Yes (any role)

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| groupId | number | Filter by group |
| species | string | Filter by species: `DOG`, `CAT`, `OTHER` |
| search | string | Search by name, breed, or microchip |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Rocky",
    "species": "DOG",
    "breed": "Labrador",
    "sex": "MALE",
    "dateOfBirth": "2020-03-15T00:00:00.000Z",
    "microchip": "941000012345678",
    "photoUrl": null,
    "notes": null,
    "groupId": 1,
    "group": { "id": 1, "name": "Casa" },
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  }
]
```

---

### GET /api/animals/:id

Get full animal detail.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Rocky",
  "species": "DOG",
  "breed": "Labrador",
  "sex": "MALE",
  "dateOfBirth": "2020-03-15T00:00:00.000Z",
  "microchip": "941000012345678",
  "photoUrl": null,
  "notes": null,
  "groupId": 1,
  "group": { "id": 1, "name": "Casa" },
  "weightRecords": [
    { "id": 1, "valueKg": "29.5", "recordedAt": "2026-03-25T10:00:00.000Z", "isAnomaly": false }
  ],
  "createdAt": "2026-03-25T10:00:00.000Z",
  "updatedAt": "2026-03-25T10:00:00.000Z"
}
```

**Errors:** `404` if animal not found.

---

### POST /api/animals

Create a new animal. Supports photo upload via multipart form.

- **Auth:** Yes (any role)

**Request body (JSON or multipart/form-data):**

```json
{
  "name": "Michi",
  "species": "CAT",
  "breed": "Persian",
  "sex": "FEMALE",
  "dateOfBirth": "2023-05-10",
  "microchip": "941000098765432",
  "notes": "Very calm",
  "groupId": 1
}
```

**Response:** `201 Created`

```json
{
  "id": 8,
  "name": "Michi",
  "species": "CAT",
  "breed": "Persian",
  "sex": "FEMALE",
  "dateOfBirth": "2023-05-10T00:00:00.000Z",
  "microchip": "941000098765432",
  "photoUrl": null,
  "notes": "Very calm",
  "groupId": 1,
  "createdAt": "2026-03-25T10:00:00.000Z",
  "updatedAt": "2026-03-25T10:00:00.000Z"
}
```

**Errors:** `422` if required fields missing or invalid species/sex.

---

### PUT /api/animals/:id

Update an animal.

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "name": "Rocky Jr.",
  "notes": "Updated notes"
}
```

**Response:** `200 OK`

Returns the updated animal object.

**Errors:** `404` if not found.

---

### DELETE /api/animals/:id

Delete an animal and all related records (cascade: weights, events, visits, documents, expenses, assignments).

- **Auth:** Yes (any role)

**Response:** `204 No Content`

**Errors:** `404` if not found.

---

## Weight Records

### GET /api/animals/:id/weights

Get weight history for an animal, ordered by date.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
[
  { "id": 4, "animalId": 1, "valueKg": "29.5", "recordedAt": "2026-03-25T10:00:00.000Z", "isAnomaly": false },
  { "id": 3, "animalId": 1, "valueKg": "29.2", "recordedAt": "2026-01-24T10:00:00.000Z", "isAnomaly": false },
  { "id": 2, "animalId": 1, "valueKg": "29.0", "recordedAt": "2025-11-25T10:00:00.000Z", "isAnomaly": false },
  { "id": 1, "animalId": 1, "valueKg": "28.5", "recordedAt": "2025-09-26T10:00:00.000Z", "isAnomaly": false }
]
```

---

### POST /api/animals/:id/weights

Add a weight record. The backend calculates whether the value is an anomaly based on statistical deviation from historical data (mean + standard deviation).

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "valueKg": 25.0,
  "recordedAt": "2026-03-25"
}
```

**Response:** `201 Created`

```json
{
  "id": 5,
  "animalId": 1,
  "valueKg": "25.0",
  "recordedAt": "2026-03-25T00:00:00.000Z",
  "isAnomaly": true
}
```

**Errors:** `422` if `valueKg` is missing or not a positive number.

---

## Health Events

### GET /api/animals/:id/events

List health events for an animal.

- **Auth:** Yes (any role)

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter: `PENDING`, `COMPLETED`, `OVERDUE`, `SKIPPED` |
| type | string | Filter by event category: `VACCINE`, `DEWORMING_INTERNAL`, etc. |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "animalId": 1,
    "eventTypeId": 2,
    "eventType": { "id": 2, "name": "Rabies vaccine", "category": "VACCINE", "severityScore": 9 },
    "scheduledDate": "2025-12-25T10:00:00.000Z",
    "completedDate": "2025-12-25T10:00:00.000Z",
    "product": "Nobivac Rabies",
    "vetName": "Dr. Garcia",
    "notes": null,
    "frequencyDays": 365,
    "nextDueDate": "2026-12-25T10:00:00.000Z",
    "status": "COMPLETED",
    "protocolAssignmentId": null,
    "createdAt": "2025-12-25T10:00:00.000Z"
  }
]
```

---

### POST /api/animals/:id/events

Create a health event. If `frequencyDays` is provided, `nextDueDate` is auto-calculated from `scheduledDate`.

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "eventTypeId": 3,
  "scheduledDate": "2026-04-01",
  "product": "Milbemax",
  "vetName": "Dr. Garcia",
  "notes": "Quarterly deworming",
  "frequencyDays": 90
}
```

**Response:** `201 Created`

```json
{
  "id": 4,
  "animalId": 1,
  "eventTypeId": 3,
  "scheduledDate": "2026-04-01T00:00:00.000Z",
  "completedDate": null,
  "product": "Milbemax",
  "vetName": "Dr. Garcia",
  "notes": "Quarterly deworming",
  "frequencyDays": 90,
  "nextDueDate": "2026-06-30T00:00:00.000Z",
  "status": "PENDING",
  "protocolAssignmentId": null,
  "createdAt": "2026-03-25T10:00:00.000Z"
}
```

---

### PUT /api/events/:id

Update a health event.

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "product": "Drontal",
  "notes": "Changed product"
}
```

**Response:** `200 OK`

Returns the updated event object.

**Errors:** `404` if not found.

---

### PATCH /api/events/:id/complete

Mark a health event as completed. Sets `completedDate` to now and `status` to `COMPLETED`. If the event has `frequencyDays`, a new `PENDING` event is automatically created for the next due date.

- **Auth:** Yes (any role)

**Request body (optional):**

```json
{
  "completedDate": "2026-03-25",
  "product": "Nobivac Rabies",
  "vetName": "Dr. Garcia",
  "notes": "Administered without issues"
}
```

**Response:** `200 OK`

```json
{
  "completed": {
    "id": 2,
    "status": "COMPLETED",
    "completedDate": "2026-03-25T00:00:00.000Z"
  },
  "next": {
    "id": 5,
    "animalId": 1,
    "eventTypeId": 3,
    "scheduledDate": "2026-06-23T00:00:00.000Z",
    "status": "PENDING",
    "frequencyDays": 90,
    "nextDueDate": "2026-09-21T00:00:00.000Z"
  }
}
```

**Errors:** `404` if not found. `400` if already completed.

---

### DELETE /api/events/:id

Delete a health event.

- **Auth:** Yes (any role)

**Response:** `204 No Content`

**Errors:** `404` if not found.

---

## Protocols

### GET /api/protocols

List all protocols created by the authenticated user.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "New shelter cat",
    "description": "Standard protocol for newly arrived shelter cats",
    "userId": 1,
    "_count": { "steps": 4, "assignments": 0 },
    "createdAt": "2026-03-25T10:00:00.000Z",
    "updatedAt": "2026-03-25T10:00:00.000Z"
  }
]
```

---

### GET /api/protocols/:id

Get protocol detail with all steps.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "New shelter cat",
  "description": "Standard protocol for newly arrived shelter cats",
  "userId": 1,
  "steps": [
    {
      "id": 1,
      "protocolId": 1,
      "eventTypeId": 3,
      "eventType": { "id": 3, "name": "Internal deworming", "category": "DEWORMING_INTERNAL" },
      "dayOffset": 0,
      "product": "Milbemax",
      "notes": "First deworming on arrival",
      "sortOrder": 1
    },
    {
      "id": 2,
      "protocolId": 1,
      "eventTypeId": 1,
      "eventType": { "id": 1, "name": "Trivalent vaccine", "category": "VACCINE" },
      "dayOffset": 15,
      "product": "Purevax RCPCh",
      "notes": "First trivalent dose",
      "sortOrder": 2
    },
    {
      "id": 3,
      "protocolId": 1,
      "eventTypeId": 1,
      "eventType": { "id": 1, "name": "Trivalent vaccine", "category": "VACCINE" },
      "dayOffset": 45,
      "product": "Purevax RCPCh",
      "notes": "Second trivalent dose",
      "sortOrder": 3
    },
    {
      "id": 4,
      "protocolId": 1,
      "eventTypeId": 5,
      "eventType": { "id": 5, "name": "General checkup", "category": "CHECKUP" },
      "dayOffset": 60,
      "notes": "Post-protocol general checkup",
      "sortOrder": 4
    }
  ],
  "createdAt": "2026-03-25T10:00:00.000Z",
  "updatedAt": "2026-03-25T10:00:00.000Z"
}
```

**Errors:** `404` if not found.

---

### POST /api/protocols

Create a new protocol.

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "name": "Annual dog checkup",
  "description": "Yearly vaccination and deworming plan for dogs"
}
```

**Response:** `201 Created`

```json
{
  "id": 2,
  "name": "Annual dog checkup",
  "description": "Yearly vaccination and deworming plan for dogs",
  "userId": 1,
  "createdAt": "2026-03-25T10:00:00.000Z",
  "updatedAt": "2026-03-25T10:00:00.000Z"
}
```

---

### PUT /api/protocols/:id

Update a protocol.

- **Auth:** Yes (any role, must own protocol)

**Request body:**

```json
{
  "name": "Updated protocol name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

Returns the updated protocol object.

**Errors:** `404` if not found or not owned by user.

---

### DELETE /api/protocols/:id

Delete a protocol and all its steps (cascade).

- **Auth:** Yes (any role, must own protocol)

**Response:** `204 No Content`

**Errors:** `404` if not found or not owned by user.

---

## Protocol Steps

### POST /api/protocols/:id/steps

Add a step to a protocol.

- **Auth:** Yes (any role, must own protocol)

**Request body:**

```json
{
  "eventTypeId": 2,
  "dayOffset": 365,
  "product": "Nobivac Rabies",
  "notes": "Annual rabies booster",
  "sortOrder": 5
}
```

**Response:** `201 Created`

```json
{
  "id": 5,
  "protocolId": 1,
  "eventTypeId": 2,
  "dayOffset": 365,
  "product": "Nobivac Rabies",
  "notes": "Annual rabies booster",
  "sortOrder": 5
}
```

**Errors:** `404` if protocol not found. `422` if eventTypeId invalid.

---

### PUT /api/protocols/:protocolId/steps/:stepId

Update a protocol step.

- **Auth:** Yes (any role, must own protocol)

**Request body:**

```json
{
  "dayOffset": 30,
  "notes": "Adjusted timing"
}
```

**Response:** `200 OK`

Returns the updated step object.

**Errors:** `404` if protocol or step not found.

---

### DELETE /api/protocols/:protocolId/steps/:stepId

Delete a protocol step.

- **Auth:** Yes (any role, must own protocol)

**Response:** `204 No Content`

**Errors:** `404` if protocol or step not found.

---

## Protocol Assignments

### POST /api/animals/:id/assign-protocol

Assign a protocol to an animal. Automatically generates all health events based on the protocol steps and start date. If a step is delayed, dependent dates are recalculated in cascade.

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "protocolId": 1,
  "startDate": "2026-04-01"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "animalId": 5,
  "protocolId": 1,
  "startDate": "2026-04-01T00:00:00.000Z",
  "status": "ACTIVE",
  "createdAt": "2026-03-25T10:00:00.000Z",
  "healthEvents": [
    {
      "id": 10,
      "eventTypeId": 3,
      "scheduledDate": "2026-04-01T00:00:00.000Z",
      "status": "PENDING",
      "product": "Milbemax",
      "notes": "First deworming on arrival"
    },
    {
      "id": 11,
      "eventTypeId": 1,
      "scheduledDate": "2026-04-16T00:00:00.000Z",
      "status": "PENDING",
      "product": "Purevax RCPCh",
      "notes": "First trivalent dose"
    },
    {
      "id": 12,
      "eventTypeId": 1,
      "scheduledDate": "2026-05-16T00:00:00.000Z",
      "status": "PENDING",
      "product": "Purevax RCPCh",
      "notes": "Second trivalent dose"
    },
    {
      "id": 13,
      "eventTypeId": 5,
      "scheduledDate": "2026-05-31T00:00:00.000Z",
      "status": "PENDING",
      "notes": "Post-protocol general checkup"
    }
  ]
}
```

**Errors:** `404` if animal or protocol not found. `422` if protocol has no steps.

---

### GET /api/animals/:id/assignments

List protocol assignments for an animal.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "animalId": 5,
    "protocolId": 1,
    "protocol": { "id": 1, "name": "New shelter cat" },
    "startDate": "2026-04-01T00:00:00.000Z",
    "status": "ACTIVE",
    "createdAt": "2026-03-25T10:00:00.000Z",
    "_count": { "healthEvents": 4 }
  }
]
```

---

## Vet Visits

### GET /api/animals/:id/visits

List vet visits for an animal, ordered by date (newest first).

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "animalId": 1,
    "visitDate": "2025-12-25T10:00:00.000Z",
    "reason": "Annual checkup and rabies vaccination",
    "diagnosis": "Healthy, no issues found",
    "treatment": "Rabies vaccine administered",
    "vetName": "Dr. Garcia",
    "observations": "Weight stable, good dental health",
    "cost": "65.00",
    "createdAt": "2025-12-25T10:00:00.000Z",
    "_count": { "documents": 0, "expenses": 0 }
  }
]
```

---

### POST /api/animals/:id/visits

Create a vet visit.

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "visitDate": "2026-03-25",
  "reason": "Limping on front left leg",
  "diagnosis": "Mild sprain",
  "treatment": "Anti-inflammatory prescribed for 5 days",
  "vetName": "Dr. Martinez",
  "observations": "Rest recommended for 1 week",
  "cost": 45.00
}
```

**Response:** `201 Created`

Returns the created visit object.

---

### PUT /api/visits/:id

Update a vet visit.

- **Auth:** Yes (any role)

**Request body:**

```json
{
  "diagnosis": "Updated diagnosis",
  "treatment": "Updated treatment plan"
}
```

**Response:** `200 OK`

Returns the updated visit object.

**Errors:** `404` if not found.

---

### DELETE /api/visits/:id

Delete a vet visit and its associated documents/expenses (cascade).

- **Auth:** Yes (any role)

**Response:** `204 No Content`

**Errors:** `404` if not found.

---

## Documents

### GET /api/animals/:id/documents

List all documents for an animal.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "animalId": 1,
    "vetVisitId": 1,
    "filename": "blood-test-rocky.pdf",
    "fileUrl": "/uploads/documents/1-blood-test-rocky.pdf",
    "fileType": "application/pdf",
    "description": "Annual blood test results",
    "uploadedAt": "2026-03-25T10:00:00.000Z"
  }
]
```

---

### POST /api/animals/:id/documents

Upload a document. Uses `multipart/form-data`.

- **Auth:** Yes (any role)

**Request body (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | The file to upload (max 10MB) |
| description | string | No | Description of the document |
| vetVisitId | number | No | Associate with a vet visit |

**Response:** `201 Created`

```json
{
  "id": 2,
  "animalId": 1,
  "vetVisitId": null,
  "filename": "vaccination-card.jpg",
  "fileUrl": "/uploads/documents/2-vaccination-card.jpg",
  "fileType": "image/jpeg",
  "description": "Updated vaccination card",
  "uploadedAt": "2026-03-25T10:00:00.000Z"
}
```

**Errors:** `422` if no file provided. `400` if file exceeds size limit.

---

### DELETE /api/documents/:id

Delete a document (removes file from storage).

- **Auth:** Yes (any role)

**Response:** `204 No Content`

**Errors:** `404` if not found.

---

## Expenses

### GET /api/expenses

List expenses. Supports filtering.

- **Auth:** Yes (ADMIN only)

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| animalId | number | Filter by animal |
| category | string | Filter: `VACCINE`, `DEWORMING`, `SURGERY`, `MEDICATION`, `FOOD`, `OTHER` |
| dateFrom | string | Start date (ISO 8601) |
| dateTo | string | End date (ISO 8601) |

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "animalId": 1,
    "animal": { "id": 1, "name": "Rocky" },
    "vetVisitId": 1,
    "amount": "65.00",
    "category": "VACCINE",
    "description": "Annual rabies vaccination",
    "expenseDate": "2025-12-25T00:00:00.000Z",
    "createdAt": "2025-12-25T10:00:00.000Z"
  }
]
```

**Errors:** `403` if role is COLLABORATOR.

---

### GET /api/expenses/stats

Get expense statistics.

- **Auth:** Yes (ADMIN only)

**Response:** `200 OK`

```json
{
  "total": 523.50,
  "byAnimal": [
    { "animalId": 1, "animalName": "Rocky", "total": 310.00 },
    { "animalId": 2, "animalName": "Luna", "total": 213.50 }
  ],
  "byCategory": [
    { "category": "VACCINE", "total": 195.00 },
    { "category": "MEDICATION", "total": 180.00 },
    { "category": "FOOD", "total": 148.50 }
  ],
  "monthly": [
    { "month": "2026-03", "total": 85.00 },
    { "month": "2026-02", "total": 120.50 },
    { "month": "2026-01", "total": 318.00 }
  ]
}
```

**Errors:** `403` if role is COLLABORATOR.

---

### POST /api/expenses

Create an expense.

- **Auth:** Yes (ADMIN only)

**Request body:**

```json
{
  "animalId": 1,
  "vetVisitId": 1,
  "amount": 65.00,
  "category": "VACCINE",
  "description": "Annual rabies vaccination",
  "expenseDate": "2026-03-25"
}
```

**Response:** `201 Created`

Returns the created expense object.

**Errors:** `403` if role is COLLABORATOR. `422` if required fields missing.

---

### PUT /api/expenses/:id

Update an expense.

- **Auth:** Yes (ADMIN only)

**Request body:**

```json
{
  "amount": 70.00,
  "description": "Updated description"
}
```

**Response:** `200 OK`

Returns the updated expense object.

**Errors:** `403` if role is COLLABORATOR. `404` if not found.

---

### DELETE /api/expenses/:id

Delete an expense.

- **Auth:** Yes (ADMIN only)

**Response:** `204 No Content`

**Errors:** `403` if role is COLLABORATOR. `404` if not found.

---

## Dashboard

### GET /api/dashboard

Get general overview of all animals and health status.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
{
  "totalAnimals": 7,
  "pendingEvents": 5,
  "overdueEvents": 3,
  "monthlyExpenses": 85.00
}
```

---

### GET /api/dashboard/alerts

Get priority-sorted alerts. Each alert has an urgency score based on: days overdue, event type severity, and animal status (kitten/newly sheltered scores higher).

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
[
  {
    "urgencyScore": 92,
    "event": {
      "id": 3,
      "scheduledDate": "2026-03-05T10:00:00.000Z",
      "status": "OVERDUE",
      "eventType": { "name": "Trivalent vaccine", "category": "VACCINE", "severityScore": 8 }
    },
    "animal": { "id": 3, "name": "Simba", "species": "CAT", "group": { "name": "Casa" } },
    "daysOverdue": 20
  },
  {
    "urgencyScore": 78,
    "event": {
      "id": 2,
      "scheduledDate": "2026-03-15T10:00:00.000Z",
      "status": "OVERDUE",
      "eventType": { "name": "Internal deworming", "category": "DEWORMING_INTERNAL", "severityScore": 6 }
    },
    "animal": { "id": 1, "name": "Rocky", "species": "DOG", "group": { "name": "Casa" } },
    "daysOverdue": 10
  }
]
```

---

### GET /api/dashboard/upcoming

Get health events scheduled for the next 7 days.

- **Auth:** Yes (any role)

**Response:** `200 OK`

```json
[
  {
    "id": 6,
    "scheduledDate": "2026-03-28T10:00:00.000Z",
    "status": "PENDING",
    "eventType": { "name": "External deworming", "category": "DEWORMING_EXTERNAL" },
    "animal": { "id": 2, "name": "Luna", "species": "CAT", "group": { "name": "Casa" } }
  },
  {
    "id": 7,
    "scheduledDate": "2026-03-30T10:00:00.000Z",
    "status": "PENDING",
    "eventType": { "name": "Internal deworming", "category": "DEWORMING_INTERNAL" },
    "animal": { "id": 4, "name": "Nala", "species": "CAT", "group": { "name": "Casa" } }
  }
]
```

---

## Reports

### GET /api/animals/:id/report

Generate a PDF report with the complete health history of an animal. Includes: profile, weight history, health events, vet visits, documents, and expenses.

- **Auth:** Yes (any role)

**Response:** `200 OK`

Returns a PDF file with header `Content-Type: application/pdf`.

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="rocky-health-report.pdf"
```

**Errors:** `404` if animal not found.
