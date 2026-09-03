const crypto = require('crypto');

const COOKIE = 'linxens_portal_session';
const MAX_AGE = 8 * 60 * 60;

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}
function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

exports.handler = async (event) => {
  const password = process.env.LINXENS_PORTAL_PASSWORD;
  const secret = process.env.LINXENS_PORTAL_SESSION_SECRET;
  if (!password || !secret) {
    return { statusCode: 503, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ok:false, error:'Secure access is not configured.'}) };
  }
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}
  if (!safeEqual(body.password || '', password)) {
    return { statusCode: 401, headers: {'Content-Type':'application/json'}, body: JSON.stringify({ok:false, error:'Incorrect password. Please try again.'}) };
  }
  const payload = b64url(JSON.stringify({exp: Math.floor(Date.now()/1000) + MAX_AGE}));
  const token = `${payload}.${sign(payload, secret)}`;
  return {
    statusCode: 200,
    headers: {
      'Content-Type':'application/json',
      'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`
    },
    body: JSON.stringify({ok:true})
  };
};