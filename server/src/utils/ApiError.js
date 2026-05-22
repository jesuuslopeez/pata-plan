const DEFAULT_CODE_BY_STATUS = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  500: 'INTERNAL_ERROR',
};

class ApiError extends Error {
  constructor(statusCode, message, details = null, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    this.details = details;
    this.code = code || DEFAULT_CODE_BY_STATUS[statusCode] || 'ERROR';
  }
}

module.exports = { ApiError };
