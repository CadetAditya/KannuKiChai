import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
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

// Serve PWA manifest, service worker, icons, and gallery photos
const distPath = path.join(__dirname, '..', 'dist');
const clientPath = path.join(__dirname, '..', 'client');
const galleryPath = path.join(clientPath, 'public', 'gallery');
const uploadsPath = path.join(__dirname, '..', 'data', 'uploads');

app.use('/manifest.webmanifest', express.static(path.join(clientPath, 'manifest.webmanifest')));
app.use('/sw.js', express.static(path.join(clientPath, 'sw.js')));
app.use('/favicon.svg', express.static(path.join(clientPath, 'favicon.svg')));
app.use('/gallery', express.static(galleryPath));
app.use('/uploads', express.static(uploadsPath));

// Serve built frontend assets
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Fallback to serving raw client for dev
  app.use(express.static(clientPath));
}

const PORT = process.env.PORT || 4000;

export { app, server, PORT };

const isMain = process.argv[1] && process.argv[1].endsWith('server.js');
if (isMain && process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`☕ Kannu ki Chai server running on http://localhost:${PORT}`);
  });
}
