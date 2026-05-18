class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    this.details = details;
  }
}

module.exports = { ApiError };
