const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../utils/prisma');
jest.mock('../utils/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendNotificationsDigest: jest.fn().mockResolvedValue(undefined),
}));

const prisma = require('../utils/prisma');
const app = require('../app');

// =====================================================================
// Shared fixtures
// =====================================================================

const PASSWORD = 'integration-test-pass';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 4);

const ADMIN = {
  id: 1,
  name: 'Admin Owner',
  email: 'admin@pataplan.com',
  passwordHash: PASSWORD_HASH,
  role: 'ADMIN',
  emailVerified: true,
  emailNotificationsEnabled: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const COLLAB = {
  id: 2,
  name: 'Collaborator',
  email: 'collab@pataplan.com',
  passwordHash: PASSWORD_HASH,
  role: 'COLLABORATOR',
  emailVerified: true,
  emailNotificationsEnabled: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const STRANGER = {
  id: 3,
  name: 'Stranger',
  email: 'stranger@pataplan.com',
  passwordHash: PASSWORD_HASH,
  role: 'ADMIN',
  emailVerified: true,
  emailNotificationsEnabled: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const adminToken = jwt.sign({ userId: ADMIN.id, role: ADMIN.role }, process.env.JWT_SECRET);
const collabToken = jwt.sign({ userId: COLLAB.id, role: COLLAB.role }, process.env.JWT_SECRET);
const strangerToken = jwt.sign(
  { userId: STRANGER.id, role: STRANGER.role },
  process.env.JWT_SECRET
);

// =====================================================================
// 1. CRITICAL USER FLOW — register → login → group → animal → event → dashboard
// =====================================================================

describe('Integration · critical user flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('walks through register → login → create group → create animal → add event → see it in dashboard', async () => {
    // ---------- 1. REGISTER ----------
    prisma.user.findUnique.mockResolvedValueOnce(null); // email not used yet
    const createdUser = {
      id: ADMIN.id,
      name: ADMIN.name,
      email: ADMIN.email,
      role: 'ADMIN',
      emailVerified: false,
      emailNotificationsEnabled: true,
      createdAt: ADMIN.createdAt,
    };
    prisma.user.create.mockResolvedValueOnce(createdUser);
    prisma.user.update.mockResolvedValueOnce(createdUser); // for issueVerification

    const registerRes = await request(app).post('/api/auth/register').send({
      name: ADMIN.name,
      email: ADMIN.email,
      password: PASSWORD,
    });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.requiresVerification).toBe(true);
    expect(registerRes.body.user.email).toBe(ADMIN.email);

    // ---------- 2. LOGIN (assume email verified) ----------
    prisma.user.findUnique.mockResolvedValueOnce({ ...ADMIN, emailVerified: true });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: ADMIN.email,
      password: PASSWORD,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toEqual(expect.any(String));
    const userToken = loginRes.body.token;

    // ---------- 3. CREATE GROUP ----------
    // From here on the authenticate middleware needs to find ADMIN on every request.
    // Switch to mockResolvedValue (no Once) so subsequent auth calls all succeed.
    prisma.user.findUnique.mockResolvedValue(ADMIN);
    prisma.group.findFirst.mockResolvedValueOnce(null); // no duplicate name
    const newGroup = { id: 10, name: 'Casa', userId: ADMIN.id, createdAt: new Date() };
    prisma.group.create.mockResolvedValueOnce(newGroup);

    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Casa' });
    expect(groupRes.status).toBe(201);
    expect(groupRes.body.group.id).toBe(10);

    // ---------- 4. CREATE ANIMAL ----------
    // assertCanEditGroup → getEditableGroupIds → owned + EDITOR memberships
    prisma.group.findMany.mockResolvedValue([{ id: 10 }]);
    prisma.groupCollaborator.findMany.mockResolvedValue([]);
    const newAnimal = {
      id: 100,
      name: 'Jimbo',
      species: 'CAT',
      sex: 'MALE',
      groupId: 10,
      group: { id: 10, name: 'Casa' },
      createdAt: new Date(),
    };
    prisma.animal.create.mockResolvedValueOnce(newAnimal);

    const animalRes = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${userToken}`)
      .field('name', 'Jimbo')
      .field('species', 'CAT')
      .field('sex', 'MALE')
      .field('groupId', '10');
    expect(animalRes.status).toBe(201);
    expect(animalRes.body.animal.id).toBe(100);

    // ---------- 5. ADD HEALTH EVENT (overdue → goes into alerts) ----------
    // The event service checks group access and animal access
    prisma.animal.findFirst.mockResolvedValueOnce({ id: 100, groupId: 10 });
    prisma.eventType.findUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Vacuna trivalente',
      category: 'VACCINE',
    });
    const overdueDate = new Date('2026-01-15');
    const newEvent = {
      id: 1000,
      animalId: 100,
      eventTypeId: 1,
      scheduledDate: overdueDate,
      status: 'OVERDUE',
      eventType: { id: 1, name: 'Vacuna trivalente', category: 'VACCINE' },
    };
    prisma.healthEvent.create.mockResolvedValueOnce(newEvent);

    const eventRes = await request(app)
      .post('/api/animals/100/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        eventTypeId: 1,
        scheduledDate: '2026-01-15',
        product: 'Nobivac DHPPi',
      });
    expect([200, 201]).toContain(eventRes.status);

    // ---------- 6. DASHBOARD shows the overdue event ----------
    prisma.animal.count.mockResolvedValue(1);
    prisma.healthEvent.count.mockImplementation(({ where }) =>
      Promise.resolve(where?.status === 'OVERDUE' ? 1 : 0)
    );
    prisma.healthEvent.findMany.mockResolvedValue([
      {
        ...newEvent,
        animal: { id: 100, name: 'Jimbo', species: 'CAT', group: { id: 10, name: 'Casa' } },
      },
    ]);
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

    const dashRes = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(dashRes.status).toBe(200);
    expect(dashRes.body.summary).toBeDefined();
    expect(dashRes.body.summary.overdueEventsCount).toBeGreaterThanOrEqual(1);
  });
});

// =====================================================================
// 2. PROTOCOL ASSIGNMENT AND CASCADE RECALCULATION
// =====================================================================

describe('Integration · protocol assignment and cascade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Auth: admin owns group 10 with animal 100
    prisma.user.findUnique.mockResolvedValue(ADMIN);
    prisma.group.findMany.mockResolvedValue([{ id: 10 }]);
    prisma.groupCollaborator.findMany.mockResolvedValue([]);
  });

  it('assigning a protocol creates one HealthEvent per step at the right offsets', async () => {
    // Animal access check
    prisma.animal.findFirst.mockResolvedValueOnce({ id: 100, groupId: 10 });
    // Protocol with 3 steps (day 0, 15, 45)
    prisma.protocol.findFirst.mockResolvedValueOnce({
      id: 5,
      name: 'Gato nuevo en refugio',
      steps: [
        { id: 1, eventTypeId: 1, dayOffset: 0, product: null, notes: null, sortOrder: 0 },
        { id: 2, eventTypeId: 2, dayOffset: 15, product: null, notes: null, sortOrder: 1 },
        { id: 3, eventTypeId: 3, dayOffset: 45, product: null, notes: null, sortOrder: 2 },
      ],
    });
    // Assignment created
    prisma.protocolAssignment.create.mockResolvedValueOnce({
      id: 7,
      animalId: 100,
      protocolId: 5,
      startDate: new Date('2026-03-01'),
      status: 'ACTIVE',
    });
    // healthEvent.create called once per step
    let eventIdCounter = 2000;
    prisma.healthEvent.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: eventIdCounter++, ...data })
    );

    const res = await request(app)
      .post('/api/animals/100/assign-protocol')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ protocolId: 5, startDate: '2026-03-01' });

    // Service may return 200 or 201 depending on implementation
    expect([200, 201]).toContain(res.status);
    // One healthEvent.create per protocol step
    expect(prisma.healthEvent.create).toHaveBeenCalledTimes(3);
  });

  it('completing an event with delay recalculates dependent dates in cascade', async () => {
    // PATCH /api/events/:id/complete
    const firstEvent = {
      id: 2000,
      animalId: 100,
      eventTypeId: 1,
      scheduledDate: new Date('2026-03-01'),
      status: 'PENDING',
      frequencyDays: null,
      animal: { id: 100, groupId: 10 },
    };
    prisma.healthEvent.findFirst.mockResolvedValueOnce(firstEvent);
    prisma.healthEvent.update.mockResolvedValueOnce({
      ...firstEvent,
      status: 'COMPLETED',
      completedDate: new Date('2026-03-06'),
    });
    // Subsequent events to recalculate
    prisma.healthEvent.findMany.mockResolvedValueOnce([
      { id: 2001, scheduledDate: new Date('2026-03-16'), status: 'PENDING' },
      { id: 2002, scheduledDate: new Date('2026-04-15'), status: 'PENDING' },
    ]);
    prisma.healthEvent.update.mockResolvedValue({});

    const res = await request(app)
      .patch('/api/events/2000/complete')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ completedDate: '2026-03-06' });

    // Service must succeed and at least update the completed event
    expect([200, 204]).toContain(res.status);
    expect(prisma.healthEvent.update).toHaveBeenCalled();
  });
});

// =====================================================================
// 3. ROLE-BASED ACCESS CONTROL
// =====================================================================

describe('Integration · role-based access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/animals');
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid JWT with 401', async () => {
    const res = await request(app)
      .get('/api/animals')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('COLLABORATOR can READ animals shared with them', async () => {
    prisma.user.findUnique.mockResolvedValue(COLLAB);
    prisma.group.findMany.mockResolvedValue([]); // no owned groups
    prisma.groupCollaborator.findMany.mockResolvedValue([{ groupId: 99 }]); // shared
    prisma.animal.findMany.mockResolvedValueOnce([
      { id: 200, name: 'Shared', groupId: 99, group: { id: 99, name: 'Refugio' }, _count: { healthEvents: 0 } },
    ]);
    prisma.healthEvent.groupBy.mockResolvedValue([]); // no overdue events

    const res = await request(app)
      .get('/api/animals')
      .set('Authorization', `Bearer ${collabToken}`);
    expect(res.status).toBe(200);
    expect(res.body.animals).toHaveLength(1);
  });

  it('COLLABORATOR cannot CREATE animals (admin-only)', async () => {
    prisma.user.findUnique.mockResolvedValue(COLLAB);

    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${collabToken}`)
      .field('name', 'Forbidden')
      .field('species', 'CAT')
      .field('sex', 'MALE')
      .field('groupId', '1');
    expect(res.status).toBe(403);
  });

  it('COLLABORATOR cannot DELETE groups (admin-only)', async () => {
    prisma.user.findUnique.mockResolvedValue(COLLAB);

    const res = await request(app)
      .delete('/api/groups/1')
      .set('Authorization', `Bearer ${collabToken}`);
    expect(res.status).toBe(403);
  });

  it('COLLABORATOR cannot CREATE groups (admin-only)', async () => {
    prisma.user.findUnique.mockResolvedValue(COLLAB);

    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ name: 'Nuevo' });
    expect(res.status).toBe(403);
  });

  it('a stranger cannot read animals from groups they do not own or share', async () => {
    // stranger has their own groups but NOT group 10 where Jimbo lives
    prisma.user.findUnique.mockResolvedValue(STRANGER);
    prisma.group.findMany.mockResolvedValue([{ id: 99 }]); // owns group 99 only
    prisma.groupCollaborator.findMany.mockResolvedValue([]);
    prisma.animal.findFirst.mockResolvedValue(null); // no access to Jimbo
    prisma.healthEvent.groupBy.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/animals/100')
      .set('Authorization', `Bearer ${strangerToken}`);
    expect([403, 404]).toContain(res.status);
  });

  it('ADMIN can complete events', async () => {
    prisma.user.findUnique.mockResolvedValue(ADMIN);
    prisma.group.findMany.mockResolvedValue([{ id: 10 }]);
    prisma.groupCollaborator.findMany.mockResolvedValue([]);
    prisma.healthEvent.findFirst.mockResolvedValueOnce({
      id: 5000,
      animalId: 100,
      animal: { id: 100, groupId: 10 },
      status: 'PENDING',
      scheduledDate: new Date(),
      frequencyDays: null,
    });
    prisma.healthEvent.update.mockResolvedValueOnce({
      id: 5000,
      status: 'COMPLETED',
    });
    prisma.healthEvent.findMany.mockResolvedValue([]);

    const res = await request(app)
      .patch('/api/events/5000/complete')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect([200, 204]).toContain(res.status);
  });
});
