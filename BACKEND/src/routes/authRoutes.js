import { Router } from 'express';
import {
  register,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  verifyEmail,
  resendEmailVerification,
  driverLogin,
  ownerLogin,
  managerLogin,
  adminLogin,
  sendOtp,
  verifyOtp,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  validateOtpRequest,
  validateOtpVerify,
} from '../middleware/validators.js';

const router = Router();

// Public auth endpoints
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/login/verify-otp', verifyLoginOtp);
router.post('/login/resend-otp', resendLoginOtp);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendEmailVerification);
router.get('/invitation/validate', (req, res) => {
  const { token, email, mobile } = req.query;
  const { validateManagerInvitation } = require ? null : {};
  import('../services/invitationService.js').then(({ validateManagerInvitation }) => {
    const result = validateManagerInvitation(token, { email, mobile });
    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error, code: result.code });
    }
    return res.json({
      success: true,
      data: {
        valid: true,
        role: result.invitation.role,
        travelId: result.invitation.travelId,
        email: result.invitation.email,
        mobile: result.invitation.mobile,
        expiresAt: result.invitation.expiresAt,
      },
    });
  });
});

// Role-enforced operator logins
router.post('/driver-login', validateLogin, driverLogin);
router.post('/owner-login', validateLogin, ownerLogin);
router.post('/manager-login', validateLogin, managerLogin);
router.post('/admin-login', validateLogin, adminLogin);

// General OTP endpoints
router.post('/otp/send', validateOtpRequest, sendOtp);
router.post('/otp/verify', validateOtpVerify, verifyOtp);

// Token management
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);

// Profile
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
