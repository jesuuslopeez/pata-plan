const { Router } = require('express');
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  me,
  updateMe,
  changePassword,
} = require('../controllers/auth.controller');
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

const updateMeSchema = {
  name: { required: true, type: 'string', min: 2, max: 100 },
  email: { required: true, type: 'string', max: 255, pattern: EMAIL_REGEX },
};

const changePasswordSchema = {
  currentPassword: { required: true, type: 'string' },
  newPassword: { required: true, type: 'string', min: 8 },
};

const resendSchema = {
  email: { required: true, type: 'string', pattern: EMAIL_REGEX },
};

const forgotSchema = {
  email: { required: true, type: 'string', pattern: EMAIL_REGEX },
};

const resetSchema = {
  token: { required: true, type: 'string' },
  password: { required: true, type: 'string', min: 8 },
};

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', validate(resendSchema), resendVerification);
router.post('/forgot-password', validate(forgotSchema), forgotPassword);
router.post('/reset-password', validate(resetSchema), resetPassword);
router.get('/me', authenticate, me);
router.put('/me', authenticate, validate(updateMeSchema), updateMe);
router.put('/password', authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
