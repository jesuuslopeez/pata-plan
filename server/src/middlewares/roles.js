// TODO: Implement role-based access control middleware

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Placeholder: will check req.user.role against allowedRoles
    next();
  };
};

module.exports = { authorize };
