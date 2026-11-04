import { validatePasswordStrength, hashPassword, comparePassword } from '../../BACKEND/src/auth/passwordPolicy.js';
import { generateAccessToken, verifyAccessToken } from '../../BACKEND/src/auth/tokenService.js';
import { generateOTP, hashOTP, verifyOTP } from '../../BACKEND/src/auth/otpService.js';

describe('Production Authentication & Security Tests', () => {
  test('Password strength policy requires uppercase, lowercase, number, and special character', () => {
    expect(validatePasswordStrength('weak').valid).toBe(false);
    expect(validatePasswordStrength('NoSpecial123').valid).toBe(false);
    expect(validatePasswordStrength('Valid@Pass123').valid).toBe(true);
  });

  test('Bcrypt password hashing and verification', async () => {
    const rawPass = 'SecretBus@2025';
    const hash = await hashPassword(rawPass);
    expect(hash).not.toBe(rawPass);
    const matches = await comparePassword(rawPass, hash);
    expect(matches).toBe(true);
  });

  test('Cryptographic 6-digit OTP generation and verification', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(Number(otp)).not.toBeNaN();

    const hashed = hashOTP(otp);
    const expiresFuture = new Date(Date.now() + 5 * 60 * 1000);
    const result = verifyOTP(otp, hashed, expiresFuture);
    expect(result.valid).toBe(true);

    const expiredPast = new Date(Date.now() - 1000);
    const expiredResult = verifyOTP(otp, hashed, expiredPast);
    expect(expiredResult.valid).toBe(false);
    expect(expiredResult.reason).toBe('EXPIRED');
  });

  test('JWT access token generation and payload verification', () => {
    const mockUser = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'driver@test.in',
      mobile: '+919876543210',
      role: 'driver',
    };
    const token = generateAccessToken(mockUser);
    expect(typeof token).toBe('string');
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.role).toBe('driver');
  });

  test('All user roles generate valid tokens with appropriate role claims', () => {
    const roles = ['passenger', 'driver', 'travel_owner', 'manager', 'staff', 'super_admin'];
    for (const role of roles) {
      const user = { id: `id-${role}`, email: `${role}@smartroute.in`, role };
      const token = generateAccessToken(user);
      const decoded = verifyAccessToken(token);
      expect(decoded.role).toBe(role);
    }
  });
});
