import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { refreshToken, login } from '../../BACKEND/src/controllers/authController.js';
import { generateRefreshToken } from '../../BACKEND/src/middleware/auth.js';
import { getRoleRedirect } from '../../FRONTEND/src/utils/roleRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mockReqRes(body = {}, headers = {}) {
  const req = {
    body,
    headers,
    ip: '127.0.0.1',
    get: (h) => headers[h.toLowerCase()] || headers[h] || '',
  };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return responseData;
    },
  };
  return { req, res };
}

describe('PERMANENT SESSION PERSISTENCE & AUTO-LOGIN SUITE', () => {
  const authContextPath = path.resolve(__dirname, '../../FRONTEND/src/context/AuthContext.jsx');
  const apiPath = path.resolve(__dirname, '../../FRONTEND/src/services/api.js');
  const loginPath = path.resolve(__dirname, '../../FRONTEND/src/pages/auth/Login.jsx');
  const routesPath = path.resolve(__dirname, '../../FRONTEND/src/routes/index.jsx');

  let authContextContent = '';
  let apiContent = '';
  let loginContent = '';
  let routesContent = '';

  beforeAll(() => {
    authContextContent = fs.readFileSync(authContextPath, 'utf8');
    apiContent = fs.readFileSync(apiPath, 'utf8');
    loginContent = fs.readFileSync(loginPath, 'utf8');
    routesContent = fs.readFileSync(routesPath, 'utf8');
  });

  describe('1. AuthContext Persistent Storage Architecture', () => {
    test('AuthContext initializes directly from persistent storage keys smartroute_token & smartroute_user', () => {
      expect(authContextContent).toContain("localStorage.getItem('smartroute_token')");
      expect(authContextContent).toContain("localStorage.getItem('smartroute_user')");
      expect(authContextContent).toContain('const [token, setToken] = useState(storedToken || null);');
      expect(authContextContent).toContain('const [isAuthenticated, setIsAuthenticated] = useState(!!storedToken);');
      expect(authContextContent).toContain('const [isLoading, setIsLoading] = useState(true);');
    });

    test('AuthContext exposes token, user, isAuthenticated, isLoading and backwards-compatible loading', () => {
      expect(authContextContent).toMatch(/token\s*,/);
      expect(authContextContent).toMatch(/user\s*,/);
      expect(authContextContent).toMatch(/isAuthenticated/);
      expect(authContextContent).toMatch(/isLoading/);
      expect(authContextContent).toMatch(/loading:\s*isLoading/);
    });

    test('AuthContext session persistence writes to smartroute_token, smartroute_user, and smartroute_refresh_token', () => {
      expect(authContextContent).toContain("localStorage.setItem('smartroute_token'");
      expect(authContextContent).toContain("localStorage.setItem('smartroute_user'");
      expect(authContextContent).toContain("localStorage.setItem('smartroute_refresh_token'");
    });

    test('AuthContext preserves legacy sr_* keys for complete backward compatibility', () => {
      expect(authContextContent).toContain("localStorage.setItem('sr_access_token'");
      expect(authContextContent).toContain("localStorage.setItem('sr_user'");
    });

    test('AuthContext background profile validation never clears persistent storage on network error', () => {
      // Must not wipe credentials on catch
      const catchBlock = authContextContent.match(/\.catch\(\(err\)\s*=>\s*\{([\s\S]*?)\}\)/);
      expect(catchBlock).not.toBeNull();
      expect(catchBlock[1]).not.toContain("localStorage.removeItem('smartroute_token')");
      expect(catchBlock[1]).not.toContain("localStorage.removeItem('smartroute_user')");
      expect(catchBlock[1]).not.toContain("setUser(null)");
    });

    test('AuthContext logout explicitly purges all persistent keys only upon manual user sign out', () => {
      const logoutFunc = authContextContent.match(/const logout = async[\s\S]*?\{([\s\S]*?)\};/);
      expect(logoutFunc).not.toBeNull();
      const body = logoutFunc[1];
      expect(body).toContain("localStorage.removeItem('smartroute_token')");
      expect(body).toContain("localStorage.removeItem('smartroute_user')");
      expect(body).toContain("localStorage.removeItem('smartroute_refresh_token')");
      expect(body).toContain("localStorage.removeItem('sr_access_token')");
      expect(body).toContain("localStorage.removeItem('sr_user')");
      expect(body).toContain('setIsAuthenticated(false)');
    });
  });

  describe('2. Centralized API Client Layer (api.js)', () => {
    test('api.js injects smartroute_token or sr_access_token in Authorization header', () => {
      expect(apiContent).toContain("localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token')");
      expect(apiContent).toContain('Authorization: `Bearer ${token}`');
    });

    test('api.js silently refreshes token using smartroute_refresh_token without wiping session', () => {
      expect(apiContent).toContain("localStorage.getItem('smartroute_refresh_token') || localStorage.getItem('sr_refresh_token')");
      expect(apiContent).toContain("localStorage.setItem('smartroute_token', newAccessToken)");
      expect(apiContent).not.toMatch(/localStorage\.removeItem\('smartroute_token'\)/);
    });
  });

  describe('3. Auto-Login and Protected Routing Flow', () => {
    test('Login.jsx immediately auto-redirects authenticated users without re-prompting for credentials', () => {
      expect(loginContent).toMatch(/if\s*\(\s*isAuthenticated\s*&&\s*user\s*\)\s*\{/);
      expect(loginContent).toContain('navigate(getDestination(user.role || \'passenger\'), { replace: true });');
    });

    test('ProtectedRoute immediately allows access for authenticated users with zero loading screen freeze', () => {
      expect(routesContent).toContain('if (checking && !isAuthenticated && !user)');
      expect(routesContent).toContain('allowedRoles.includes(user?.role)');
    });

    test('Travel Operator auto-login destination resolves directly to /operator/dashboard', () => {
      expect(getRoleRedirect('travel_owner')).toBe('/operator/dashboard');
      expect(getRoleRedirect('manager')).toBe('/operator/dashboard');
    });

    test('Super Admin auto-login destination resolves directly to /admin/dashboard', () => {
      expect(getRoleRedirect('super_admin')).toBe('/admin/dashboard');
    });

    test('Commercial Driver auto-login destination resolves directly to /driver/dashboard', () => {
      expect(getRoleRedirect('driver')).toBe('/driver/dashboard');
    });

    test('Passenger auto-login destination resolves directly to /search', () => {
      expect(getRoleRedirect('passenger')).toBe('/search');
    });
  });

  describe('4. Backend Token Refresh & Long Session Durability', () => {
    test('Backend /auth/refresh-token reissues new access token for active session maintenance', async () => {
      // First log in as travel owner to get valid refresh token
      const { req: loginReq, res: loginRes } = mockReqRes({
        identifier: 'owner@smartroute.in',
        password: 'SmartRoute@2024',
      });
      await login(loginReq, loginRes);
      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.refreshToken).toBeDefined();

      const ownerRefreshToken = loginRes.body.refreshToken;

      // Now call refreshToken endpoint
      const { req: refReq, res: refRes } = mockReqRes({
        refreshToken: ownerRefreshToken,
      });
      await refreshToken(refReq, refRes);

      expect(refRes.statusCode).toBe(200);
      expect(refRes.body.success).toBe(true);
      expect(refRes.body.accessToken).toBeDefined();
      expect(refRes.body.user).toBeDefined();
      expect(refRes.body.user.role).toBe('travel_owner');
    });

    test('Backend /auth/refresh-token rejects missing or invalid refresh token with 400/401', async () => {
      const { req: emptyReq, res: emptyRes } = mockReqRes({});
      await refreshToken(emptyReq, emptyRes);
      expect(emptyRes.statusCode).toBe(400);

      const { req: invalidReq, res: invalidRes } = mockReqRes({
        refreshToken: 'invalid.jwt.token.string',
      });
      await refreshToken(invalidReq, invalidRes);
      expect(invalidRes.statusCode).toBe(401);
    });
  });
});
