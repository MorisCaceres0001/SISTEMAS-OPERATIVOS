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

  // WebSocket endpoint for service logs. Use a distinct path to avoid
  // colliding with webpack-dev-server's HMR socket which also uses `/ws`.
  app.use(
    '/logs-ws',
    createProxyMiddleware({
      target: 'ws://localhost:8080',
      ws: true,
      logLevel: 'warn'
    })
  );
};
