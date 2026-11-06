const { getDefaultConfig } = require('expo/metro-config');
const http = require('node:http');
const https = require('node:https');
const config = getDefaultConfig(__dirname);
config.server.enhanceMiddleware = middleware => (req, res, next) => {
  if (!/^\/(api\/v1|uploads)\//.test(req.url)) return middleware(req, res, next);
  const target = new URL(req.url, new URL(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1').origin);
  const upstream = (target.protocol === 'https:' ? https : http).request(target, {
    method: req.method, headers: { ...req.headers, host: target.host },
  }, response => { res.writeHead(response.statusCode, response.headers); response.pipe(res); });
  upstream.on('error', () => { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ detail: 'Ο server δεν είναι διαθέσιμος.' })); });
  req.pipe(upstream);
};
module.exports = config;
