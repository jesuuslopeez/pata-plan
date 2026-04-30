const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');
const { generateToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

const register = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'ADMIN',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken({ userId: user.id, role: user.role });

  return { user, token };
};

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken({ userId: user.id, role: user.role });

  const { passwordHash: _, ...userData } = user;
  return { user: userData, token };
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...USER_SELECT, updatedAt: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

const updateMe = async (userId, { name, email }) => {
  const trimmedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
  if (existing && existing.id !== userId) {
    throw new ApiError(409, 'Email already in use');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      email: trimmedEmail,
    },
    select: { ...USER_SELECT, updatedAt: true },
  });

  return user;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};

module.exports = { register, login, getMe, updateMe, changePassword };
