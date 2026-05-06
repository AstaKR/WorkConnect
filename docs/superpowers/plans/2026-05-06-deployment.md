# Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden and deploy WorkConnect to a production VPS using Docker Compose, GitHub Actions CI/CD, Let's Encrypt SSL, and proper secret management — producing a secure, auto-deploying SaaS.

**Architecture:** Single VPS running Docker Compose with six services (db, redis, backend, celery, celery-beat, frontend/nginx). GitHub Actions runs tests on every PR and auto-deploys to the server on push to `main` via SSH. Nginx terminates SSL (Let's Encrypt) and proxies `/api/` to Gunicorn.

**Tech Stack:** Docker Compose, Gunicorn, Nginx, Certbot/Let's Encrypt, GitHub Actions (`appleboy/ssh-action`), python-decouple (already in requirements), PostgreSQL 15, Redis 7, Django 6, React 19 (Vite build)

---

## File Map

| Action | File |
|---|---|
| Create | `backend/.gitignore` — exclude `.env`, `.env.prod`, `*.pyc`, `__pycache__`, `venv/` |
| Create | `backend/.env.prod.example` — committed template with no real values |
| Modify | `backend/er_backend/settings.py` — add HTTPS security settings block |
| Modify | `backend/er_backend/urls.py` — add `/api/health/` endpoint |
| Modify | `backend/Dockerfile` — non-root `appuser`, add `curl` for health check |
| Create | `docker-compose.prod.yml` — production compose (Celery, health checks, no exposed DB/Redis) |
| Modify | `frontend/nginx.conf` — HTTPS server blocks, security headers, gzip, static/media routes |
| Create | `.github/workflows/deploy.yml` — test + deploy CI/CD pipeline |
| Create | `docs/deployment/SERVER_SETUP.md` — one-time server setup runbook |

---

### Task 1: Secret Management — `.gitignore` + `.env.prod.example`

**Files:**
- Create: `backend/.gitignore`
- Create: `backend/.env.prod.example`

**Why first:** All subsequent tasks depend on the environment variable names being defined. The `.gitignore` protects secrets from being committed; the example file documents what the server needs.

- [ ] **Step 1: Check what's already gitignored at root**

```bash
cat .gitignore | grep -E "\.env|secret"
```

Expected: see `.env` entries (or not). We are adding a dedicated `backend/.gitignore`.

- [ ] **Step 2: Create `backend/.gitignore`**

Create `backend/.gitignore` with this exact content:

```gitignore
# Secrets — never commit
.env
.env.prod
.env.local

# Python bytecode
__pycache__/
*.py[cod]
*.pyo

# Virtual environments
venv/
.venv/
env/

# Django collected static
staticfiles/

# Coverage
.coverage
htmlcov/

# Pytest cache
.pytest_cache/

# Editor
.idea/
.vscode/
*.swp
```

- [ ] **Step 3: Create `backend/.env.prod.example`**

Create `backend/.env.prod.example` with this exact content:

```ini
# ── Django Core ─────────────────────────────────────────────────
# Generate: python -c "import secrets; print(secrets.token_urlsafe(50))"
SECRET_KEY=<generate-a-new-secret-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# ── Database ─────────────────────────────────────────────────────
DB_NAME=erplan_db
DB_USER=postgres
DB_PASSWORD=<strong-random-password>
DB_HOST=db
DB_PORT=5432

# ── Redis ────────────────────────────────────────────────────────
REDIS_URL=redis://redis:6379/0

# ── AI Provider Keys ─────────────────────────────────────────────
GROQ_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# ── Email (optional — for notification emails) ───────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@your-domain.com
```

- [ ] **Step 4: Verify `backend/.gitignore` works**

```bash
git check-ignore -v backend/.env.prod
```

Expected output: `backend/.gitignore:2:.env.prod    backend/.env.prod`

If no output, git is ignoring the `backend/.gitignore`. In that case run:
```bash
git check-ignore -v backend/.env
```
And check that the root `.gitignore` covers it. Either way is fine — what matters is `.env.prod` is excluded.

- [ ] **Step 5: Commit**

```bash
git add backend/.gitignore backend/.env.prod.example
git commit -m "chore: add backend .gitignore and .env.prod.example template"
```

---

### Task 2: Settings Production Security + Health Endpoint

**Files:**
- Modify: `backend/er_backend/settings.py` — add HTTPS security settings
- Modify: `backend/er_backend/urls.py` — add health endpoint

**Note:** `settings.py` already uses `python-decouple`'s `config()` for `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, and database. We only need to add the HTTPS/security header block.

- [ ] **Step 1: Read the bottom of `settings.py` to find a safe insertion point**

```bash
tail -60 backend/er_backend/settings.py
```

Look for the end of the file — we will append the security block after the existing config.

- [ ] **Step 2: Add HTTPS security settings to `settings.py`**

Append this block at the **end** of `backend/er_backend/settings.py` (after all existing settings):

```python
# ── Production HTTPS Security ────────────────────────────────────────────────
# These settings are safe to keep in development (they're gated on DEBUG=False)
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0       # 1-year HSTS header
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG                           # HTTP → HTTPS
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
X_FRAME_OPTIONS = 'DENY'                                  # already present in middleware, explicit here
SECURE_CONTENT_TYPE_NOSNIFF = True
```

- [ ] **Step 3: Add health endpoint to `backend/er_backend/urls.py`**

Open `backend/er_backend/urls.py`. Add this import at the top (after `from django.conf.urls.static import static`):

```python
from django.http import JsonResponse
```

Then add the health route to `urlpatterns` (before the `+ static(...)` at the end):

```python
    path('api/health/', lambda r: JsonResponse({'status': 'ok'})),
```

The final `urlpatterns` should look like:

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/ai/', include('ai_features.urls')),
    path('api/share/', include('sharing.urls')),
    path('api/settings/', include('settings_app.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/health/', lambda r: JsonResponse({'status': 'ok'})),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

- [ ] **Step 4: Smoke test the health endpoint locally**

```bash
cd backend
python manage.py runserver 8001 &
sleep 2
curl -s http://localhost:8001/api/health/
kill %1
```

Expected output: `{"status": "ok"}`

- [ ] **Step 5: Commit**

```bash
git add backend/er_backend/settings.py backend/er_backend/urls.py
git commit -m "feat: add HTTPS security settings and /api/health/ endpoint"
```

---

### Task 3: Harden `backend/Dockerfile`

**Files:**
- Modify: `backend/Dockerfile`

**Why:** Current Dockerfile runs as root. Production requires a non-root user. Also needs `curl` installed for the `docker-compose.prod.yml` health check (`curl -f http://localhost:8000/api/health/`).

- [ ] **Step 1: Replace `backend/Dockerfile` with the hardened version**

Overwrite `backend/Dockerfile` with:

```dockerfile
FROM python:3.11-slim

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Install system dependencies (curl needed for health check)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project (owned by appuser)
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "er_backend.wsgi:application"]
```

- [ ] **Step 2: Build the image to verify it compiles**

```bash
docker build -t workconnect-backend-test ./backend
```

Expected: build completes without errors, ends with `Successfully built <sha>` or `exporting to image`.

- [ ] **Step 3: Verify non-root user in running container**

```bash
docker run --rm workconnect-backend-test whoami
```

Expected output: `appuser`

- [ ] **Step 4: Clean up test image**

```bash
docker rmi workconnect-backend-test
```

- [ ] **Step 5: Commit**

```bash
git add backend/Dockerfile
git commit -m "chore: harden Dockerfile — non-root appuser, add curl for health check"
```

---

### Task 4: Create `docker-compose.prod.yml`

**Files:**
- Create: `docker-compose.prod.yml` (root of project)

**Note on `django-celery-beat`:** It is NOT currently in `requirements.txt`. The celery-beat service therefore uses the built-in file-based scheduler (`--scheduler django_celery_beat.schedulers:DatabaseScheduler` would fail). We use the simpler `celery beat` scheduler instead. If `django-celery-beat` is added to requirements later, update the celery-beat command.

- [ ] **Step 1: Create `docker-compose.prod.yml` at the project root**

Create the file with this exact content:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    env_file: ./backend/.env.prod
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # No ports exposed — internal Docker network only
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    # No ports exposed — internal Docker network only
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: ./backend/.env.prod
    command: >
      bash -c "python manage.py migrate --noinput &&
               python manage.py collectstatic --noinput &&
               gunicorn --bind 0.0.0.0:8000
                        --workers 3
                        --timeout 120
                        er_backend.wsgi:application"
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health/"]
      interval: 30s
      timeout: 10s
      retries: 3

  celery:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: ./backend/.env.prod
    command: celery -A er_backend worker --loglevel=info --concurrency=2
    volumes:
      - media_volume:/app/media
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  celery-beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file: ./backend/.env.prod
    # Using built-in scheduler. To use DatabaseScheduler, add django-celery-beat
    # to requirements.txt and change command to:
    # celery -A er_backend beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    command: celery -A er_backend beat --loglevel=info
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - static_volume:/app/staticfiles:ro
      - media_volume:/app/media:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

- [ ] **Step 2: Validate the compose file syntax**

```bash
docker compose -f docker-compose.prod.yml config --quiet
```

Expected: no output (silent success). If there's output, it prints the merged config — that's fine too. Errors look like `ERROR:` lines.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add docker-compose.prod.yml — production compose with Celery, health checks, secured ports"
```

---

### Task 5: Update `frontend/nginx.conf` for HTTPS

**Files:**
- Modify: `frontend/nginx.conf`

**Why:** Current nginx.conf listens on port 80 only and has no security headers, no gzip, no HTTPS. Production needs HTTP→HTTPS redirect, TLS config, security headers, gzip, and routes for Django static/media files.

**Note:** The `ssl_certificate` path uses `your-domain.com` as a placeholder — the server setup runbook (Task 7) shows how to replace it with a real domain. The `server_name` directives must match the actual domain before going live.

- [ ] **Step 1: Replace `frontend/nginx.conf`**

Overwrite `frontend/nginx.conf` with:

```nginx
# ── HTTP → HTTPS redirect ──────────────────────────────────────────────────
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

# ── HTTPS server ───────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL — Let's Encrypt certs (Certbot writes here)
    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Content-Type-Options   nosniff;
    add_header X-Frame-Options          DENY;
    add_header X-XSS-Protection         "1; mode=block";
    add_header Referrer-Policy          "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    root  /usr/share/nginx/html;
    index index.html;

    # SPA routing — all unknown paths fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy → Gunicorn
    location /api/ {
        proxy_pass             http://backend:8000/;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout  60s;
        proxy_read_timeout     120s;
        proxy_buffer_size      16k;
        proxy_buffers          4 32k;
    }

    # Django collected static files
    location /staticfiles/ {
        alias   /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Django media files (user uploads)
    location /media/ {
        alias   /app/media/;
        expires 7d;
    }
}
```

- [ ] **Step 2: Verify the nginx config syntax inside a container**

```bash
docker run --rm -v "$(pwd)/frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

The SSL cert paths won't exist locally — that is expected and OK. `nginx -t` validates syntax only, not cert existence.

- [ ] **Step 3: Commit**

```bash
git add frontend/nginx.conf
git commit -m "feat: update nginx.conf — HTTPS, security headers, gzip, static/media routes"
```

---

### Task 6: GitHub Actions CI/CD Pipeline

**Files:**
- Create: `.github/workflows/deploy.yml`

**What it does:**
- `test` job: runs on every push and every PR to `main` — spins up PostgreSQL + Redis service containers, installs backend deps, runs Django tests, installs frontend deps, runs frontend tests
- `deploy` job: runs only on push to `main` (not PRs), only if tests pass — SSH into the server, git pull, docker compose build, docker compose up -d, migrate, prune old images

- [ ] **Step 1: Create `.github/workflows/` directory structure**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

Create the file with this exact content:

```yaml
name: Test & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ── Job 1: Run all tests ──────────────────────────────────────────────────
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: backend/requirements.txt

      - name: Install backend dependencies
        working-directory: backend
        run: pip install -r requirements.txt

      - name: Run Django tests
        working-directory: backend
        env:
          SECRET_KEY: test-secret-key-for-ci-only-not-used-in-production
          DEBUG: 'True'
          DB_NAME: test_db
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_HOST: localhost
          DB_PORT: '5432'
          REDIS_URL: redis://localhost:6379/0
        run: python manage.py test --verbosity=2

      - name: Set up Node 18
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        working-directory: frontend
        run: npm ci

      - name: Run frontend tests
        working-directory: frontend
        run: npm test -- --run

  # ── Job 2: Deploy (push to main only, after tests pass) ───────────────────
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            set -e
            cd /home/deploy/workconnect
            git pull origin main
            docker compose -f docker-compose.prod.yml build --no-cache
            docker compose -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
            docker image prune -f
            echo "Deploy complete: $(date)"
```

- [ ] **Step 3: Validate the YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "YAML valid"
```

Expected output: `YAML valid`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions test + deploy pipeline"
```

---

### Task 7: Server Setup Runbook

**Files:**
- Create: `docs/deployment/SERVER_SETUP.md`

This is documentation only — no code to test. It is a copy-paste reference for doing the one-time server setup on a fresh Ubuntu 22.04 VPS.

- [ ] **Step 1: Create `docs/deployment/` directory**

```bash
mkdir -p docs/deployment
```

- [ ] **Step 2: Create `docs/deployment/SERVER_SETUP.md`**

Create the file with this exact content:

````markdown
# WorkConnect — Server Setup Runbook

One-time setup for a fresh **Ubuntu 22.04** VPS. After this is done, all future deploys happen automatically via GitHub Actions on every push to `main`.

---

## Prerequisites

- A VPS with Ubuntu 22.04 (any provider: DigitalOcean, Hetzner, Linode, Vultr, etc.)
- Root SSH access to the server
- A domain name pointed to the server's IP (DNS A record: `your-domain.com → SERVER_IP`)

---

## Step 1 — Create deploy user

```bash
# As root on the server
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy
```

---

## Step 2 — Install Docker (official method, not snap)

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

Verify: `docker --version` should print `Docker version 24+`

---

## Step 3 — Configure firewall (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP (redirects to HTTPS)
ufw allow 443/tcp     # HTTPS
ufw enable
```

Verify: `ufw status` should show ports 22, 80, 443 allowed.

---

## Step 4 — Set up SSH key for GitHub Actions

```bash
# As deploy user
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Copy the private key and paste it into GitHub:

```bash
cat ~/.ssh/deploy_key
```

**In GitHub repo → Settings → Secrets and variables → Actions → New repository secret:**

| Secret name | Value |
|---|---|
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/deploy_key` (the private key, starts with `-----BEGIN`) |
| `SERVER_IP` | Your VPS IP address |
| `SERVER_USER` | `deploy` |

---

## Step 5 — Clone repo and create `.env.prod`

```bash
# As deploy user
cd /home/deploy
git clone https://github.com/YOUR_USERNAME/workconnect.git workconnect
cd workconnect
cp backend/.env.prod.example backend/.env.prod
nano backend/.env.prod   # fill in real values (see below)
```

**Values to fill in `backend/.env.prod`:**

```ini
SECRET_KEY=<run: python3 -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

DB_NAME=erplan_db
DB_USER=postgres
DB_PASSWORD=<strong-random-password — generate with: openssl rand -base64 32>

DB_HOST=db
DB_PORT=5432

REDIS_URL=redis://redis:6379/0

GROQ_API_KEY=<your Groq API key from console.groq.com>
GEMINI_API_KEY=<your Gemini API key>
OPENAI_API_KEY=<your OpenAI API key>
ANTHROPIC_API_KEY=<your Anthropic API key>
```

> **Note on exposed secrets:** The existing repo has a hardcoded `SECRET_KEY` in `docker-compose.yml` and a `GROQ_API_KEY` in `.env`. Both must be rotated:
> - Generate new SECRET_KEY: `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`
> - Regenerate GROQ_API_KEY at console.groq.com → API Keys

---

## Step 6 — Install Certbot and issue SSL certificate

```bash
apt install certbot -y

# Point DNS A record to SERVER_IP BEFORE running this:
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Enable auto-renewal (runs twice daily, renews when <30 days remain)
systemctl enable certbot.timer
systemctl start certbot.timer
```

After Certbot runs successfully:
- Update `frontend/nginx.conf` — replace all `your-domain.com` with your real domain
- Rebuild and push (GitHub Actions will deploy automatically)

---

## Step 7 — Update nginx.conf with real domain

On your **development machine** (not the server):

```bash
# Replace placeholder domain in nginx.conf
sed -i 's/your-domain.com/acme.example.com/g' frontend/nginx.conf
git add frontend/nginx.conf
git commit -m "chore: set production domain in nginx.conf"
git push origin main
```

GitHub Actions will automatically build and deploy.

---

## Step 8 — First deploy

```bash
# As deploy user on the server
cd /home/deploy/workconnect
docker compose -f docker-compose.prod.yml up -d --build
```

Watch logs: `docker compose -f docker-compose.prod.yml logs -f`

---

## Verify everything is working

```bash
# All containers running
docker compose -f docker-compose.prod.yml ps

# Health check endpoint
curl https://your-domain.com/api/health/
# Expected: {"status": "ok"}

# SSL check
curl -I https://your-domain.com
# Expected: HTTP/2 200, Strict-Transport-Security header present
```

---

## Troubleshooting

| Problem | Command |
|---|---|
| Container won't start | `docker compose -f docker-compose.prod.yml logs <service>` |
| Migration failed | `docker compose -f docker-compose.prod.yml exec backend python manage.py migrate` |
| Nginx config error | `docker compose -f docker-compose.prod.yml exec frontend nginx -t` |
| SSL cert expired | `certbot renew --force-renewal` |
| Out of disk space | `docker system prune -a` (removes all unused images/volumes) |

---

## Ongoing Operations

- **Logs:** `docker compose -f docker-compose.prod.yml logs -f [service]`
- **Shell into backend:** `docker compose -f docker-compose.prod.yml exec backend bash`
- **Django shell:** `docker compose -f docker-compose.prod.yml exec backend python manage.py shell`
- **Restart single service:** `docker compose -f docker-compose.prod.yml restart backend`
- **Full redeploy:** Push to `main` — GitHub Actions handles everything
````

- [ ] **Step 3: Commit**

```bash
git add -f docs/deployment/SERVER_SETUP.md
git commit -m "docs: add production server setup runbook"
```

Note: `git add -f` may be needed if `docs/` is in `.gitignore`.

---

## Summary of Acceptance Criteria

After all tasks are complete, verify:

- [ ] `backend/.env.prod.example` is committed and documents all required env vars
- [ ] `backend/.gitignore` excludes `.env` and `.env.prod`
- [ ] `GET /api/health/` returns `{"status": "ok"}` locally (`python manage.py runserver`)
- [ ] `docker build ./backend` succeeds and `whoami` inside container returns `appuser`
- [ ] `docker compose -f docker-compose.prod.yml config --quiet` succeeds with no errors
- [ ] `nginx -t` passes on the updated `frontend/nginx.conf`
- [ ] `.github/workflows/deploy.yml` YAML parses cleanly
- [ ] `docs/deployment/SERVER_SETUP.md` exists with copy-paste commands
- [ ] No secrets are committed to git (`SECRET_KEY`, API keys, DB passwords)
- [ ] `docker-compose.prod.yml` has no ports exposed for `db` or `redis` services
