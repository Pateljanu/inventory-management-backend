import { authService } from '../services/auth.service.js';
import { ok } from '../utils/apiResponse.js';

const context = (req) => ({ userAgent: req.headers['user-agent'], ip: req.ip });

export async function login(req, res) {
  const { email, password } = req.validated.body;
  return ok(res, await authService.login(email, password, context(req)));
}

export async function refresh(req, res) {
  return ok(res, await authService.refresh(req.validated.body.refreshToken, context(req)));
}

export async function logout(req, res) {
  await authService.logout(req.validated.body.refreshToken);
  return ok(res, { loggedOut: true });
}

export async function me(req, res) {
  return ok(res, await authService.me(req.user._id));
}
