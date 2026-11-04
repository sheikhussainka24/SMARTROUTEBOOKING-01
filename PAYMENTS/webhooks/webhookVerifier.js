import crypto from 'crypto';

/**
 * Verify HMAC signature of incoming webhooks
 */
export function verifyWebhookSignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
    .digest('hex');
  return expected === signatureHeader;
}

export default verifyWebhookSignature;
