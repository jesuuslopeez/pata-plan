const { Router } = require('express');
const { register } = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate');

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSchema = {
  name: { required: true, type: 'string', min: 2, max: 100 },
  email: { required: true, type: 'string', max: 255, pattern: EMAIL_REGEX },
  password: { required: true, type: 'string', min: 8 },
};

router.post('/register', validate(registerSchema), register);

module.exports = router;
