// TODO: Implement JWT authentication middleware
// const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // Placeholder: will verify JWT token from Authorization header
  next();
};

module.exports = { authenticate };
