# PairQR — Instant, Encrypted Sharing

> 🔒 Share text and files peer-to-peer with end-to-end encryption and QR code pairing.

**PairQR** is a privacy-first platform that spins up ephemeral sessions to exchange text and files with ease. Pair via **QR code**, connect peers over **WebRTC**, and keep data **encrypted client-side**.

---

## ✨ Features

* **End-to-end encryption** — data is encrypted in the browser; the server can’t read it
* **QR code pairing** — create a session with a simple scan
* **Real-time** — secure P2P messaging and file transfer with WebRTC
* **Ephemeral sessions** — no persistence 
* **Admin dashboard** — basic management & metrics
* **Cross-platform** — works on modern browsers

---

## 🧱 Monorepo Architecture

```
PairQR/
├─ client/              # React + Vite (TypeScript)
│  └─ ...
├─ server/              # Node/Express (TypeScript)
│  ├─ src/*.ts
│  ├─ docker-compose.yml    # prod stack: caddy, api, redis, postgres, coturn
│  ├─ Caddyfile             # reverse proxy + TLS
│  └─ ...
├─ shared/              # Shared types & schemas (TS/Zod)
└─ scripts/             # Scripts (e.g., start.sh)
```

**Client**: React 18, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, QR (jsqr)
**Server**: Node.js + Express, Drizzle ORM + PostgreSQL, WebSocket (ws), JWT (admin), Helmet, CORS, rate-limit
**P2P**: WebRTC; **STUN/TURN** via **coturn** for NAT traversal
**Prod**: Docker Compose (Caddy TLS proxy, API, Redis, Postgres, coturn), GitHub Actions (CI/CD), DNS (Cloudflare/Vercel/Registrar)

---

## 🚀 Local Development

> Requirements: **Node.js 18+**, **npm** (or pnpm/yarn), and **PostgreSQL** if you use DB features.

```bash
# Install deps at the repo root (or per package)
npm install

# Frontend
cd client
npm run dev

# Backend
cd ../server
# configure server/.env (see below)
npm run dev
```

---

## 🔧 Configuration

Create **`server/.env`** (minimal example):

```env
# Runtime
NODE_ENV=production
PORT=3000

# Secrets (use strong values)
ADMIN_PASSWORD=change_me
HMAC_SECRET=change_me
JWT_SECRET=change_me
TURN_STATIC_SECRET=change_me

# CORS (comma-separated; ideally no spaces)
CORS_ORIGIN=https://pairqr.vercel.app,https://pairqr.app

# Internal services
REDIS_URL=redis://redis:6379
REDIS_TTL_SECONDS=300
DATABASE_URL=postgres://postgres:postgres@postgres:5432/pairqr
TURN_REALM=pairqr
TURN_URIS=turn:coturn:3478?transport=udp,turn:coturn:3478?transport=tcp
```

> **Heads-up**: if any secret contains **`$`**, escape it as **`$$`** in `.env` (Docker Compose treats `$VAR` as interpolation).

---

## 🐳 Production (Docker Compose)

The prod stack (in `server/docker-compose.yml`) runs:

* **caddy** — reverse proxy + Let’s Encrypt TLS (ports **80/443**) → proxies to `pairqr:3000`
* **pairqr** — your Node/Express API (**3000** internal only)
* **redis** — cache / sessions
* **postgres** — database
* **coturn** — STUN/TURN (**3478** UDP/TCP)

**Caddyfile** (example):

```caddyfile
# HTTPS
api.pairqr.app {
  encode gzip
  reverse_proxy pairqr:3000
}

# HTTP: /health => 200, everything else redirects to HTTPS (optional)
http://api.pairqr.app {
  route /health {
    respond "ok" 200
  }
  redir https://api.pairqr.app{uri}
}
```

---


## 🤖 CI/CD (Recommended)

Typical GitHub Actions pipeline:

1. **Build** the server Docker image (multi-stage, `npm ci`) and push to **GHCR**.
2. **SSH** into the server, write `server/.env` from GitHub Secrets, set `SERVER_IMAGE`.
3. `docker compose pull && up -d`, then perform an **HTTPS healthcheck** (expect **200**).

**GitHub Secrets** (Settings → Secrets and variables → Actions):

* SSH/Droplet: `DO_HOST`, `DO_SSH_USER`, `DO_SSH_KEY` (optionally `DO_SSH_PORT`, `DO_SSH_PASSPHRASE`), `PROJECT_DIR`
* App: `ADMIN_PASSWORD`, `HMAC_SECRET`, `JWT_SECRET`, `CORS_ORIGIN`, `TURN_STATIC_SECRET`
* Optional: `DATABASE_URL`, `REDIS_URL`, `TURN_REALM`, `TURN_URIS`, `RATE_LIMIT_*`, `SESSION_TTL_MINUTES`, etc.

> In the script that writes `.env`, **escape `$`** as `$$` to avoid interpolation warnings and corrupted values.

---

## 🔒 Security

* **E2EE**: encrypted client-side; server relays but can’t read content
* **Ephemeral**: messages are not persisted by default
* **CORS**: strict allowlist (production frontends only)
* **Rate limiting**: basic API abuse protection
* **Headers**: Helmet on the app + security headers on Caddy
* **Validation**: Zod on critical inputs

---

## 🩺 Health & Logs

* **Health**: `GET /health` → **200** (via `https://api.pairqr.app/health`)
* **Logs**:

  * backend: `docker logs -f pairqr-app`

---

## 🛠 Troubleshooting (Quick FAQ)

* **Healthcheck returns 308**: you are probing HTTP while Caddy redirects to HTTPS. Probe **HTTPS** instead (`curl -L https://api…/health`), or keep the HTTP block that serves `/health` as 200.
* **`The "U" variable is not set`**: a `$` in `.env` wasn’t escaped → replace `$` with `$$`.
* **Node build OOM**: use `npm ci`, keep `package-lock.json`, multi-stage Docker, and/or build the image in CI (not on the VPS).
* **TURN behind Cloudflare**: don’t proxy UDP; keep **DNS only** for the TURN/API subdomain if you rely on UDP and ACME HTTP-01.

---

## 🤝 Contributing

1. Fork
2. Branch: `feat/my-feature`
3. Dev: `npm run dev` (client/server)
4. Checks: `npm run check`, tests if present
5. Open a PR with a clear description and docs updates if needed

---

## 📄 License

See **LICENSE**.

---

## 🔗 Links

* **Demo**: [https://pairqr.app](https://pairqr.vercel.app)
* **Repo**: [https://github.com/TitanSage02/PairQR](https://github.com/TitanSage02/PairQR)
* **Issues**: [https://github.com/TitanSage02/PairQR/issues](https://github.com/TitanSage02/PairQR/issues)

---

*Built with ❤️ for simple, private, and secure communication.*
