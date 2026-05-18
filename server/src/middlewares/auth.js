const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');
const { ApiError } = require('../utils/ApiError');

const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Autenticación requerida');
    }

    const token = header.split(' ')[1];
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'Usuario no encontrado');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(401, 'Sesión inválida o expirada'));
  }
};

module.exports = { authenticate };
