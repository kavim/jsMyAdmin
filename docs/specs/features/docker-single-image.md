# Docker Single-Image Deployment

> Make JSMYADMIN runnable as a single Docker image (like phpMyAdmin).

## Rationale

phpMyAdmin succeeds because you run one command and connect to any remote MySQL. JSMYADMIN should match that DX for MySQL, MariaDB, and PostgreSQL.

## Requirements

### R1: Single `docker run` works

```bash
docker run -p 3000:3000 -e JWT_SECRET=... jsmyadmin
```

- No docker-compose required
- All-in-one image: Express API + React SPA (served statically)
- No external services (database, cache, queue)

### R2: Data persistence via volumes

| Mount point | Purpose |
|-------------|---------|
| `/data` | query-history.json, upload-progress.json |
| `/uploads` | imported `.sql` / `.sql.gz` files |

- Both paths configurable via `DATA_DIR` and `UPLOAD_DIR` env vars
- Dockerfile creates both at build time with node user ownership

### R3: Security in production

- **Image fails fast** if `JWT_SECRET` is unset (exit 1, not fallback)
- Non-root user (`nodejs:nodejs`, UID 1001)
- No `latest` tag on publish — use semver (`1.2.3`)
- HEALTHCHECK endpoint at `/api/health`

### R4: Graceful shutdown

- `dumb-init` for proper SIGTERM forwarding (already done)
- ConnectionManager releases open DB connections on shutdown

### R5: Build automation (CI publish)

- GitHub Actions: build + push to Docker Hub / GHCR on tag push
- Image tag: `ghcr.io/anomalyco/jsmyadmin:<version>`
- Multi-arch: `linux/amd64`, `linux/arm64`

## Implementation steps

1. **Dockerfile**: add `/data` dir, HEALTHCHECK, JWT_SECRET gating in entrypoint
2. **Server**: make `DATA_DIR` an env var, used by both `upload.routes.ts` and `query.routes.ts`; add `GET /api/health` route
3. **docker-compose.yml**: add `data:` volume, update to reflect new env vars
4. **CI**: GitHub Actions workflow `.github/workflows/docker-publish.yml`
5. **Docs**: update README with Docker usage examples
6. **Migration**: ADR entry, update STATE.md, update PATTERNS.md

## Non-goals

- Docker Compose is for local dev only; not required for production use
- Not publishing to Docker Hub yet — just GHCR
- No Docker Secrets or Swarm/K8s manifests yet
