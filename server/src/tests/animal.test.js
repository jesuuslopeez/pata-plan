const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../utils/prisma');
const prisma = require('../utils/prisma');

const app = require('../app');

// --- Test data ---

const ADMIN_USER = {
  id: 1,
  name: 'Admin',
  email: 'admin@pataplan.com',
  role: 'ADMIN',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const OTHER_USER = {
  id: 2,
  name: 'Other',
  email: 'other@pataplan.com',
  role: 'ADMIN',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const COLLAB_USER = {
  id: 3,
  name: 'Collaborator',
  email: 'collab@pataplan.com',
  role: 'COLLABORATOR',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const adminToken = jwt.sign({ userId: 1, role: 'ADMIN' }, process.env.JWT_SECRET);
const otherToken = jwt.sign({ userId: 2, role: 'ADMIN' }, process.env.JWT_SECRET);
const collabToken = jwt.sign({ userId: 3, role: 'COLLABORATOR' }, process.env.JWT_SECRET);

const CASA_GROUP = { id: 1 };
const REFUGIO_GROUP = { id: 2 };
const OTHER_GROUP = { id: 3 };

const ROCKY = {
  id: 1,
  name: 'Rocky',
  species: 'DOG',
  breed: 'Labrador',
  sex: 'MALE',
  dateOfBirth: new Date('2020-03-15'),
  microchip: '941000012345678',
  photoUrl: null,
  notes: null,
  groupId: 1,
  group: { id: 1, name: 'Casa' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const LUNA = {
  id: 2,
  name: 'Luna',
  species: 'CAT',
  breed: null,
  sex: 'FEMALE',
  dateOfBirth: null,
  microchip: null,
  photoUrl: null,
  notes: null,
  groupId: 2,
  group: { id: 2, name: 'Refugio' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const SIMBA = {
  id: 3,
  name: 'Simba',
  species: 'CAT',
  breed: null,
  sex: 'MALE',
  dateOfBirth: null,
  microchip: null,
  photoUrl: null,
  notes: null,
  groupId: 1,
  group: { id: 1, name: 'Casa' },
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

// Helper: set up auth mock for a given user
const mockAuth = (user) => {
  prisma.user.findUnique.mockResolvedValue(user);
};

// Helper: set up group ownership
const mockGroups = (userId, groups) => {
  prisma.group.findMany.mockImplementation(({ where }) => {
    if (where.userId === userId) {
      return Promise.resolve(groups);
    }
    return Promise.resolve([]);
  });
};

// --- Tests ---

describe('POST /api/animals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an animal successfully', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP, REFUGIO_GROUP]);
    prisma.animal.create.mockResolvedValue(ROCKY);

    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Rocky', species: 'DOG', sex: 'MALE', groupId: 1, breed: 'Labrador' });

    expect(res.status).toBe(201);
    expect(res.body.animal).toBeDefined();
    expect(res.body.animal.name).toBe('Rocky');
    expect(res.body.animal.species).toBe('DOG');
    expect(res.body.animal.group.name).toBe('Casa');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/animals')
      .send({ name: 'Rocky', species: 'DOG', sex: 'MALE', groupId: 1 });

    expect(res.status).toBe(401);
  });

  it('should return 400 if name is missing', async () => {
    mockAuth(ADMIN_USER);

    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ species: 'DOG', sex: 'MALE', groupId: 1 });

    expect(res.status).toBe(400);
  });

  it('should return 400 if species is invalid', async () => {
    mockAuth(ADMIN_USER);

    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Parrot', species: 'BIRD', sex: 'MALE', groupId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/species/i);
  });

  it('should return 400 if sex is invalid', async () => {
    mockAuth(ADMIN_USER);

    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Rocky', species: 'DOG', sex: 'OTHER', groupId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sex/i);
  });

  it('should return 400 if groupId belongs to another user', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP, REFUGIO_GROUP]);

    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Rocky', species: 'DOG', sex: 'MALE', groupId: 3 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid group/i);
  });

  it('should return 400 if groupId does not exist', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP]);

    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Rocky', species: 'DOG', sex: 'MALE', groupId: 999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid group/i);
  });

  it('should create an animal with only required fields', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP]);
    const minimalAnimal = {
      id: 10,
      name: 'Michi',
      species: 'CAT',
      sex: 'UNKNOWN',
      breed: null,
      dateOfBirth: null,
      microchip: null,
      photoUrl: null,
      notes: null,
      groupId: 1,
      group: { id: 1, name: 'Casa' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.animal.create.mockResolvedValue(minimalAnimal);

    const res = await request(app)
      .post('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Michi', species: 'CAT', sex: 'UNKNOWN', groupId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.animal.name).toBe('Michi');
    expect(res.body.animal.breed).toBeNull();
  });
});

describe('GET /api/animals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAnimalsResponse = (animals) => {
    prisma.animal.findMany.mockResolvedValue(
      animals.map((a) => ({ ...a, _count: { healthEvents: 0 } }))
    );
    prisma.healthEvent.groupBy.mockResolvedValue([]);
  };

  it('should list all animals of the user', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP, REFUGIO_GROUP]);
    mockAnimalsResponse([ROCKY, LUNA, SIMBA]);

    const res = await request(app)
      .get('/api/animals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.animals).toHaveLength(3);
  });

  it('should filter by groupId', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP, REFUGIO_GROUP]);
    mockAnimalsResponse([ROCKY, SIMBA]);

    const res = await request(app)
      .get('/api/animals?groupId=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.animals).toHaveLength(2);
    expect(res.body.animals.every((a) => a.groupId === 1)).toBe(true);
  });

  it('should filter by species', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP, REFUGIO_GROUP]);
    mockAnimalsResponse([LUNA, SIMBA]);

    const res = await request(app)
      .get('/api/animals?species=CAT')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.animals).toHaveLength(2);
    expect(res.body.animals.every((a) => a.species === 'CAT')).toBe(true);
  });

  it('should search by name', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP, REFUGIO_GROUP]);
    mockAnimalsResponse([ROCKY]);

    const res = await request(app)
      .get('/api/animals?search=rock')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.animals).toHaveLength(1);
    expect(res.body.animals[0].name).toBe('Rocky');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/animals');

    expect(res.status).toBe(401);
  });

  it('should not return animals of another user', async () => {
    mockAuth(OTHER_USER);
    mockGroups(2, [OTHER_GROUP]);
    mockAnimalsResponse([]);

    const res = await request(app)
      .get('/api/animals')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.animals).toHaveLength(0);
  });
});

describe('GET /api/animals/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return animal detail with group and event counts', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP, REFUGIO_GROUP]);
    prisma.animal.findFirst.mockResolvedValue({
      ...ROCKY,
      weightRecords: [{ id: 1, valueKg: 29.5, recordedAt: new Date(), isAnomaly: false }],
    });
    prisma.healthEvent.groupBy.mockResolvedValue([
      { status: 'PENDING', _count: 2 },
      { status: 'COMPLETED', _count: 5 },
    ]);

    const res = await request(app)
      .get('/api/animals/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.animal.name).toBe('Rocky');
    expect(res.body.animal.group.name).toBe('Casa');
    expect(res.body.animal.latestWeight).toBeDefined();
    expect(res.body.animal.eventCounts.pending).toBe(2);
    expect(res.body.animal.eventCounts.completed).toBe(5);
  });

  it('should return 404 for non-existent animal', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/animals/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 404 for animal of another user', async () => {
    mockAuth(OTHER_USER);
    mockGroups(2, [OTHER_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/animals/1')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/animals/1');

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/animals/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an animal successfully', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP, REFUGIO_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(ROCKY);
    prisma.animal.update.mockResolvedValue({ ...ROCKY, name: 'Rocky Jr.' });

    const res = await request(app)
      .put('/api/animals/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Rocky Jr.' });

    expect(res.status).toBe(200);
    expect(res.body.animal.name).toBe('Rocky Jr.');
  });

  it('should return 404 for animal of another user', async () => {
    mockAuth(OTHER_USER);
    mockGroups(2, [OTHER_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/animals/1')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Stolen' });

    expect(res.status).toBe(404);
  });

  it('should return 400 when changing to groupId of another user', async () => {
    mockAuth(ADMIN_USER);
    // First call for verifyAnimalOwnership, second for groupId validation
    prisma.group.findMany.mockResolvedValue([CASA_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(ROCKY);

    const res = await request(app)
      .put('/api/animals/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ groupId: 3 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid group/i);
  });

  it('should return 404 for non-existent animal', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/animals/999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).put('/api/animals/1').send({ name: 'Hack' });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/animals/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an animal successfully', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(ROCKY);
    prisma.animal.delete.mockResolvedValue(ROCKY);

    const res = await request(app)
      .delete('/api/animals/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
    expect(prisma.animal.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('should return 404 for animal of another user', async () => {
    mockAuth(OTHER_USER);
    mockGroups(2, [OTHER_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/animals/1')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 404 for non-existent animal', async () => {
    mockAuth(ADMIN_USER);
    mockGroups(1, [CASA_GROUP]);
    prisma.animal.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/animals/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).delete('/api/animals/1');

    expect(res.status).toBe(401);
  });

  it('should return 403 for COLLABORATOR role', async () => {
    mockAuth(COLLAB_USER);

    const res = await request(app)
      .delete('/api/animals/1')
      .set('Authorization', `Bearer ${collabToken}`);

    expect(res.status).toBe(403);
  });
});
