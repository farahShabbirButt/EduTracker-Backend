import path from 'node:path';
import express, { Router } from 'express';
import { APP_BASE } from '../common/base/baseRoutes.js';

// In production the backend also serves the built frontend (WEB_DIST), so the app and the
// API share one address. The login cookie is then first-party, which Safari and strict
// privacy settings require; two onrender.com addresses would count as two different sites.
export const serveWeb = (dir: string): Router => {
  const router = Router();
  const indexFile = path.join(dir, 'index.html');

  router.use(
    express.static(dir, {
      index: false,
      setHeaders: (res, file) => {
        // Vite puts a content hash in every file name under assets/, so they never change
        const hashed = path.relative(dir, file).startsWith('assets' + path.sep);
        res.setHeader('Cache-Control', hashed ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    }),
  );

  // Any other page (e.g. /students after a refresh) is the app, which reads the path itself.
  // API paths and /health are left to their routes, so a wrong API path still gets JSON. A
  // missing file (e.g. last version's script, asked for by a tab opened before an update) gets
  // a 404, not the page, so it fails as a missing file instead of as broken JavaScript.
  router.use((req, res, next) => {
    const isPage =
      (req.method === 'GET' || req.method === 'HEAD') &&
      !path.extname(req.path) &&
      !req.path.startsWith(APP_BASE + '/') &&
      req.path !== APP_BASE &&
      req.path !== '/health';
    if (!isPage) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });

  return router;
};
