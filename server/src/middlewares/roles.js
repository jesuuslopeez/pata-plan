const { ApiError } = require('../utils/ApiError');

const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Autenticación requerida'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Permisos insuficientes'));
    }

    next();
  };
};

module.exports = { authorize };
