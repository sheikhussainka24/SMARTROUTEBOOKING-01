/**
 * Cookie Parser and Secure Cookie Helpers
 * Supports HttpOnly, Secure, SameSite cookie transport alongside Bearer tokens.
 */

export function parseCookies(req, res, next) {
  req.cookies = req.cookies || {};
  if (req.headers && req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(';');
    for (const cookie of rawCookies) {
      const parts = cookie.split('=');
      const name = parts[0]?.trim();
      const value = parts.slice(1).join('=').trim();
      if (name) {
        try {
          req.cookies[name] = decodeURIComponent(value);
        } catch {
          req.cookies[name] = value;
        }
      }
    }
  }
  next();
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
  };

  if (accessToken && typeof res.cookie === 'function') {
    res.cookie('smartroute_token', accessToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  if (refreshToken && typeof res.cookie === 'function') {
    res.cookie('smartroute_refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
}

export function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
  };
  if (typeof res.clearCookie === 'function') {
    res.clearCookie('smartroute_token', cookieOptions);
    res.clearCookie('smartroute_refresh_token', cookieOptions);
  }
}

export default parseCookies;

