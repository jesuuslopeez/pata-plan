const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const SALT_ROUNDS = 10;
const TEMP_PASSWORD_LENGTH = 12;

const COLLABORATOR_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
};

const generateTempPassword = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(TEMP_PASSWORD_LENGTH);
  let out = '';
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
};

const getAll = async () => {
  const collaborators = await prisma.user.findMany({
    where: { role: 'COLLABORATOR' },
    orderBy: { createdAt: 'asc' },
    select: COLLABORATOR_SELECT,
  });
  return collaborators;
};

const invite = async ({ email }) => {
  const trimmedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });

  if (existing) {
    if (existing.role === 'COLLABORATOR') {
      throw new ApiError(409, 'This user is already a collaborator');
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'COLLABORATOR' },
      select: COLLABORATOR_SELECT,
    });
    return { collaborator: updated, tempPassword: null, created: false };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: trimmedEmail.split('@')[0],
      email: trimmedEmail,
      passwordHash,
      role: 'COLLABORATOR',
    },
    select: COLLABORATOR_SELECT,
  });
  return { collaborator: user, tempPassword, created: true };
};

const remove = async (collaboratorId) => {
  const user = await prisma.user.findUnique({ where: { id: collaboratorId } });
  if (!user) {
    throw new ApiError(404, 'Collaborator not found');
  }
  if (user.role !== 'COLLABORATOR') {
    throw new ApiError(400, 'User is not a collaborator');
  }
  await prisma.user.delete({ where: { id: collaboratorId } });
};

module.exports = { getAll, invite, remove };
