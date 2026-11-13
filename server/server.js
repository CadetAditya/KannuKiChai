import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import store from './store.js';
import { setupRealtime, getLivePayload } from './realtime.js';
import routes from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Setup WebSockets
setupRealtime(server);

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Kannu ki Chai Server',
    time: new Date().toISOString()
  });
});

// Live public status endpoint
app.get('/api/status', (req, res) => {
  res.json(getLivePayload());
});

// Mount Operator & Admin API routes
app.use('/api', routes);

const PORT = process.env.PORT || 4000;

export { app, server, PORT };

const isMain = process.argv[1] && process.argv[1].endsWith('server.js');
if (isMain && process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`☕ Kannu ki Chai server running on http://localhost:${PORT}`);
  });
}
