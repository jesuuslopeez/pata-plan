const { ApiError } = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    const body = { error: err.message, code: err.code };
    if (err.details && typeof err.details === 'object') {
      Object.assign(body, err.details);
    }
    return res.status(err.statusCode).json(body);
  }

  console.error(err);

  return res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
  });
};

module.exports = { errorHandler };
