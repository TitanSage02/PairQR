import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors, { type CorsOptionsDelegate } from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { registerRoutes } from './routes';
import { log } from './vite';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// --- Security headers (CSP managed elsewhere: CDN/edge) ---
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// --- CORS (dev: localhost/127.* ; prod: allowlist via CORS_ORIGIN) ---
const parseAllowlist = () =>
  (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const corsDelegate: CorsOptionsDelegate<Request> = (req, callback) => {
  const origin = req.header('Origin');
  const isDev = process.env.NODE_ENV !== 'production';
  const allowlist = parseAllowlist();

  // Requests without Origin (cURL, servers...) : authorize without adding CORS headers
  if (!origin) {
    return callback(null, {
      origin: false,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
      maxAge: 600,
    });
  }

  let ok = false;
  if (isDev) {
    ok = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  } else {
    // If '*' is listed, we reflect the origin (not "*") to remain compatible with credentials
    ok = allowlist.includes('*') || allowlist.includes(origin);
  }

  callback(null, {
    origin: ok ? origin : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
    maxAge: 600,
  });
};

app.use(cors(corsDelegate));
app.options('*', cors(corsDelegate));

// --- Body parsing + compression ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(compression());

// --- Rate limit (e.g. 200 req / 15min per IP on /api) ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// --- Lightweight access log on /api ---
app.use((req, res, next) => {
  const t0 = process.hrtime.bigint();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      log(`${req.method} ${req.path} ${res.statusCode} in ${ms.toFixed(0)}ms`);
    }
  });
  next();
});

(async () => {
  // Register your API routes and get the server instance (http/fastify depending on your impl.)
  const server = await registerRoutes(app);

  // --- Simple healthcheck ---
  // NOTE: the client is deployed separately on Vercel; this server only serves the API.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'pairqr-api' });
  });

    // --- 404 JSON for /api space ---
  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  // --- Error handler (always last, and we don't throw after response) ---
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = Number(err?.status || err?.statusCode) || 500;
    const message = err?.message || 'Internal Server Error';
    if (status >= 500) console.error(err);
    if (!res.headersSent) res.status(status).json({ message });
  });

  // --- Startup ---
  const port = parseInt(process.env.PORT || '9000', 10);
  const host = '0.0.0.0';

  // Keep original signature (object) and remove reusePort
  server.listen({ port, host }, (err?: unknown) => {
    if (err) {
      console.error('Failed to start server', err);
      process.exit(1);
    }
    log(`serving on port ${port}`);
  });

  // --- Graceful shutdown ---
  const shutdown = () => {
    log('shutting down…');
    try {
      const s: any = server as any;
      if (s && typeof s.close === 'function') {
        s.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 10_000);
      } else {
        process.exit(0);
      }
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
})();
