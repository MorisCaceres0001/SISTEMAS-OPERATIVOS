const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy only API and websocket routes to backend to allow client-side routing
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      ws: true,
      logLevel: 'warn'
    })
  );

  // If you have websocket endpoint under a different path, add it here.
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'ws://localhost:8080',
      ws: true,
      logLevel: 'warn'
    })
  );
};
