const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock Prisma before importing app
jest.mock('../utils/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $disconnect: jest.fn(),
}));

jest.mock('../utils/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

const prisma = require('../utils/prisma');

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

const app = require('../app');

const VALID_USER = {
  name: 'Test User',
  email: 'test@pataplan.com',
  password: 'password123',
};

const HASHED_PASSWORD = bcrypt.hashSync('password123', 10);

const DB_USER = {
  id: 1,
  name: 'Test User',
  email: 'test@pataplan.com',
  passwordHash: HASHED_PASSWORD,
  role: 'ADMIN',
  emailVerified: true,
  createdAt: new Date('2026-03-25T10:00:00.000Z'),
  updatedAt: new Date('2026-03-25T10:00:00.000Z'),
};

const SAFE_USER = {
  id: 1,
  name: 'Test User',
  email: 'test@pataplan.com',
  role: 'ADMIN',
  createdAt: new Date('2026-03-25T10:00:00.000Z'),
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(SAFE_USER);
    prisma.user.update.mockResolvedValue(SAFE_USER);

    const res = await request(app).post('/api/auth/register').send(VALID_USER);

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(1);
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.user.email).toBe('test@pataplan.com');
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.requiresVerification).toBe(true);
  });

  it('should return 409 if email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(DB_USER);

    const res = await request(app).post('/api/auth/register').send(VALID_USER);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('El correo ya está registrado');
  });

  it('should return 400 if name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@pataplan.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@pataplan.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('should return 400 if email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('should return 400 if password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@pataplan.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('should return 400 if body is empty', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(DB_USER);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@pataplan.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(1);
    expect(res.body.user.email).toBe('test@pataplan.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.token).toBeDefined();

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(1);
    expect(decoded.role).toBe('ADMIN');
  });

  it('should return 401 if email does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@pataplan.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('should return 401 if password is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue(DB_USER);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@pataplan.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@pataplan.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getToken = (payload = { userId: 1, role: 'ADMIN' }) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  };

  it('should return user data with valid token', async () => {
    prisma.user.findUnique.mockResolvedValue(SAFE_USER);
    const token = getToken();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(1);
    expect(res.body.user.email).toBe('test@pataplan.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('should return 401 without Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('should return 401 with expired token', async () => {
    const expiredToken = jwt.sign({ userId: 1, role: 'ADMIN' }, process.env.JWT_SECRET, {
      expiresIn: '0s',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});
