import helmet from 'helmet';
import { env } from '../lib/env.js';

// Security headers on every response. The Content Security Policy lists what the app loads:
// its own scripts, MUI's inline styles (Emotion adds <style> tags at runtime), Google Fonts
// (index.html), images from data: and blob: URLs (the school logo is stored as a data URL), and
// blob: workers (reading large .xlsx files).
// Anything else, such as a script injected by an attacker, is refused by the browser.
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      // The Excel reader (fflate) unzips large parts of a file in a worker made from a blob: URL
      workerSrc: ["'self'", 'blob:'],
      // react-to-print prints from a same-origin frame
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      // No other site may show EduTracker in a frame (stops clickjacking)
      frameAncestors: ["'none'"],
      ...(env.nodeEnv === 'production' && { upgradeInsecureRequests: [] }),
    },
  },
  // Only HTTPS for a year once a browser has seen the site over HTTPS. Browsers ignore it on
  // plain http, so local development is unaffected.
  strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: false },
  // Reset links carry a token in the URL; never send the URL to another site
  referrerPolicy: { policy: 'no-referrer' },
  frameguard: { action: 'deny' },
});
