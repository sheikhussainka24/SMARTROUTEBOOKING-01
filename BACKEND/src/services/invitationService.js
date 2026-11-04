import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import { smartRouteTravelId, ownerId } from './dataStore.js';

// In-memory invitations registry
const invitationsMap = new Map();

// Seed baseline invitations for tests and staging
function initSeedInvitations() {
  const seeds = [
    {
      id: 'inv-mgr-sample-01',
      token: 'INV-MGR-SMARTROUTE-2026',
      travelId: smartRouteTravelId,
      invitedBy: ownerId,
      email: 'manager.invite@smartroute.in',
      mobile: '9000000044',
      role: 'manager',
      status: 'pending',
      used: false,
      usedAt: null,
      usedBy: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'inv-mgr-expired-01',
      token: 'INV-EXPIRED-SAMPLE',
      travelId: smartRouteTravelId,
      invitedBy: ownerId,
      email: 'expired.mgr@smartroute.in',
      mobile: '9000000045',
      role: 'manager',
      status: 'pending',
      used: false,
      usedAt: null,
      usedBy: null,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'inv-mgr-reused-01',
      token: 'INV-REUSED-SAMPLE',
      travelId: smartRouteTravelId,
      invitedBy: ownerId,
      email: 'reused.mgr@smartroute.in',
      mobile: '9000000046',
      role: 'manager',
      status: 'accepted',
      used: true,
      usedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      usedBy: 'usr-prior-mgr',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const s of seeds) {
    invitationsMap.set(s.token, s);
  }
}

initSeedInvitations();

/**
 * Creates an authorized manager or staff invitation
 * @param {object} params
 * @param {string} params.travelId - Operator association
 * @param {string} params.invitedBy - User ID of owner/admin
 * @param {string} [params.email] - Optional designated recipient email
 * @param {string} [params.mobile] - Optional designated recipient mobile
 * @param {string} [params.role='manager'] - Role granted upon redemption
 * @param {number} [params.expiresInDays=7]
 * @returns {object} Created invitation record
 */
export function createManagerInvitation({
  travelId,
  invitedBy,
  email,
  mobile,
  role = 'manager',
  expiresInDays = 7,
}) {
  const token = `INV-MGR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const cleanEmail = email ? String(email).trim().toLowerCase() : null;
  const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : null;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const invitation = {
    id: uuidv4(),
    token,
    travelId,
    invitedBy,
    email: cleanEmail,
    mobile: cleanMobile,
    role,
    status: 'pending',
    used: false,
    usedAt: null,
    usedBy: null,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  invitationsMap.set(token, invitation);
  return invitation;
}

/**
 * Validates an invitation token for redemption
 * @param {string} token
 * @param {object} [recipient]
 * @param {string} [recipient.email]
 * @param {string} [recipient.mobile]
 * @returns {{ valid: boolean, invitation?: object, code?: string, error?: string }}
 */
export function validateManagerInvitation(token, { email, mobile } = {}) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return {
      valid: false,
      code: 'INVITATION_REQUIRED',
      error: 'Travel Manager accounts require an authorized operator invitation token.',
    };
  }

  const cleanToken = token.trim();
  const invitation = invitationsMap.get(cleanToken);

  if (!invitation) {
    return {
      valid: false,
      code: 'INVITATION_NOT_FOUND',
      error: 'The provided invitation code was not found or is invalid.',
    };
  }

  if (invitation.used || invitation.status === 'accepted') {
    return {
      valid: false,
      code: 'INVITATION_ALREADY_USED',
      error: 'This invitation code has already been redeemed and cannot be reused.',
    };
  }

  if (invitation.status === 'revoked') {
    return {
      valid: false,
      code: 'INVITATION_REVOKED',
      error: 'This invitation has been revoked by the operator administrator.',
    };
  }

  const now = new Date();
  if (now > new Date(invitation.expiresAt)) {
    return {
      valid: false,
      code: 'INVITATION_EXPIRED',
      error: 'This invitation code has expired. Please request a new invitation from your company operator.',
    };
  }

  // If invitation was issued to a designated email, enforce match
  if (invitation.email && email) {
    const cleanEmail = String(email).trim().toLowerCase();
    if (invitation.email.toLowerCase() !== cleanEmail) {
      return {
        valid: false,
        code: 'INVITATION_RECIPIENT_MISMATCH',
        error: `This invitation was issued to ${invitation.email}. The registered email does not match.`,
      };
    }
  }

  // If invitation was issued to a designated mobile, enforce match
  if (invitation.mobile && mobile) {
    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
    if (invitation.mobile !== cleanMobile) {
      return {
        valid: false,
        code: 'INVITATION_RECIPIENT_MISMATCH',
        error: `This invitation was issued to registered mobile number ending in ${invitation.mobile.slice(-4)}.`,
      };
    }
  }

  return {
    valid: true,
    invitation,
  };
}

/**
 * Consumes and marks an invitation as redeemed
 * @param {string} token
 * @param {string} userId
 * @returns {object|null}
 */
export function consumeManagerInvitation(token, userId) {
  const cleanToken = token.trim();
  const invitation = invitationsMap.get(cleanToken);
  if (!invitation) return null;

  invitation.used = true;
  invitation.status = 'accepted';
  invitation.usedAt = new Date().toISOString();
  invitation.usedBy = userId;

  return invitation;
}

/**
 * Lists invitations for an operator travel company
 * @param {string} travelId
 * @returns {Array<object>}
 */
export function listInvitations(travelId) {
  const result = [];
  for (const inv of invitationsMap.values()) {
    if (inv.travelId === travelId) {
      result.push(inv);
    }
  }
  return result;
}

export default {
  createManagerInvitation,
  validateManagerInvitation,
  consumeManagerInvitation,
  listInvitations,
};
