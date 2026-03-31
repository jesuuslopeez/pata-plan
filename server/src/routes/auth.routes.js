const { Router } = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerSchema = {
  name: { required: true, type: 'string', min: 2, max: 100 },
  email: { required: true, type: 'string', max: 255, pattern: EMAIL_REGEX },
  password: { required: true, type: 'string', min: 8 },
};

const loginSchema = {
  email: { required: true, type: 'string', pattern: EMAIL_REGEX },
  password: { required: true, type: 'string' },
};

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, me);

module.exports = router;
