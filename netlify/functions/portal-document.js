const crypto = require('crypto');

function cookies(header='') { return Object.fromEntries(header.split(';').map(v=>v.trim().split('=').map(decodeURIComponent)).filter(v=>v.length===2)); }
function sign(payload, secret) { return crypto.createHmac('sha256', secret).update(payload).digest('base64url'); }
function validSession(event, secret) {
  const token = cookies(event.headers.cookie || event.headers.Cookie || '').linxens_portal_session;
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload, secret);
  const a=Buffer.from(sig), b=Buffer.from(expected);
  if (a.length!==b.length || !crypto.timingSafeEqual(a,b)) return false;
  try { return JSON.parse(Buffer.from(payload,'base64url').toString()).exp > Math.floor(Date.now()/1000); } catch (_) { return false; }
}

exports.handler = async (event) => {
  const secret = process.env.LINXENS_PORTAL_SESSION_SECRET;
  if (!secret || !validSession(event, secret)) return {statusCode:401, headers:{'Content-Type':'application/json'}, body:JSON.stringify({ok:false})};
  const id = String((event.queryStringParameters||{}).id || '');
  const action = String((event.queryStringParameters||{}).action || 'view');
  const docs = {
    '02': {view:'https://online.fliphtml5.com/qrssr/bdea/'}
  };
  const url = docs[id] && docs[id][action];
  if (!url) return {statusCode:404, headers:{'Content-Type':'application/json'}, body:JSON.stringify({ok:false})};
  return {statusCode:302, headers:{Location:url,'Cache-Control':'no-store'}, body:''};
};