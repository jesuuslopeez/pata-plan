const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');
const { generateToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const SALT_ROUNDS = 10;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerified: true,
  createdAt: true,
};

const generateVerifyToken = () => crypto.randomBytes(32).toString('hex');

const buildVerifyUrl = (token) => {
  const base = process.env.VERIFY_URL_BASE || 'http://localhost:5173/verify-email';
  return `${base}?token=${encodeURIComponent(token)}`;
};

const buildResetUrl = (token) => {
  const base = process.env.RESET_URL_BASE || 'http://localhost:5173/reset-password';
  return `${base}?token=${encodeURIComponent(token)}`;
};

const issueVerification = async (user) => {
  const token = generateVerifyToken();
  const expires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: token, emailVerifyExpires: expires },
  });
  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl: buildVerifyUrl(token),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mailer] Failed to send verification email:', err.message);
  }
};

const register = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'El correo ya está registrado');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'ADMIN',
    },
    select: USER_SELECT,
  });

  await issueVerification(user);

  return { user, requiresVerification: true };
};

const login = async ({ email, password, rememberMe }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  if (!user.emailVerified) {
    throw new ApiError(403, 'Debes verificar tu correo antes de iniciar sesión', {
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
    });
  }

  const expiresIn = rememberMe ? '30d' : '1d';
  const token = generateToken({ userId: user.id, role: user.role }, { expiresIn });

  const { passwordHash: _, emailVerifyToken: __, emailVerifyExpires: ___, ...userData } = user;
  return { user: userData, token };
};

const verifyEmail = async (token) => {
  if (!token || typeof token !== 'string') {
    throw new ApiError(400, 'Token no válido');
  }
  const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });
  if (!user) {
    throw new ApiError(400, 'Token no válido o ya utilizado');
  }
  if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
    throw new ApiError(400, 'El enlace de verificación ha caducado. Solicita uno nuevo.');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
    select: USER_SELECT,
  });

  const jwt = generateToken({ userId: updated.id, role: updated.role });
  return { user: updated, token: jwt };
};

const requestPasswordReset = async (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') {
    throw new ApiError(400, 'Correo no válido');
  }
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }
  const token = generateVerifyToken();
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpires: expires },
  });
  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: buildResetUrl(token),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mailer] Failed to send password reset email:', err.message);
  }
};

const resetPassword = async (token, newPassword) => {
  if (!token || typeof token !== 'string') {
    throw new ApiError(400, 'Token no válido');
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new ApiError(400, 'La contraseña debe tener al menos 8 caracteres');
  }
  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });
  if (!user) {
    throw new ApiError(400, 'Token no válido o ya utilizado');
  }
  if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
    throw new ApiError(400, 'El enlace ha caducado. Solicita uno nuevo.');
  }
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
};

const resendVerification = async (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') {
    throw new ApiError(400, 'Correo no válido');
  }
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }
  if (user.emailVerified) {
    return;
  }
  await issueVerification(user);
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...USER_SELECT, updatedAt: true },
  });

  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  return user;
};

const updateMe = async (userId, { name, email }) => {
  const trimmedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
  if (existing && existing.id !== userId) {
    throw new ApiError(409, 'El correo ya está en uso');
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
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'La contraseña actual es incorrecta');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  getMe,
  updateMe,
  changePassword,
};
