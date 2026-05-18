const { ApiError } = require('../utils/ApiError');

const validate = (schema) => {
  return (req, _res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
        continue;
      }

      const trimmed = typeof value === 'string' ? value.trim() : value;

      if (rules.min && typeof trimmed === 'string' && trimmed.length < rules.min) {
        errors.push(`${field} must be at least ${rules.min} characters`);
      }

      if (rules.max && typeof trimmed === 'string' && trimmed.length > rules.max) {
        errors.push(`${field} must be at most ${rules.max} characters`);
      }

      if (rules.pattern && !rules.pattern.test(trimmed)) {
        errors.push(`${field} has an invalid format`);
      }
    }

    if (errors.length > 0) {
      throw new ApiError(400, errors.join(', '));
    }

    next();
  };
};

module.exports = { validate };
