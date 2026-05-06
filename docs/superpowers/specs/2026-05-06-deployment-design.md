# WorkConnect Production Deployment — Design Spec

## Summary of decisions

| Decision | Choice |
|---|---|
| Deployment model | Single VPS, Docker Compose (provider-agnostic) |
| CI/CD | GitHub Actions — test → build → SSH deploy on push to `main` |
| SSL | Let's Encrypt (Certbot) — free, auto-renewing |
| Domain | Placeholder — wire in when chosen |
| Secret management | GitHub Actions secrets → `.env.prod` on server (never committed) |
| Celery workers | Added to `docker-compose.prod.yml` (currently missing) |

---

## 1. Security Hardening

### 1.1 Files changed

**`backend/.gitignore`** — add `.env` and `.env.prod` so secrets are never committed.

**`backend/.env.prod.example`** — committed template with no real values:

```ini
SECRET_KEY=<generate-with-python -c "import secrets; print(secrets.token_urlsafe(50))">
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

DB_NAME=erplan_db
DB_USER=postgres
DB_PASSWORD=<strong-random-password>
DB_HOST=db
DB_PORT=5432

REDIS_URL=redis://redis:6379/0

# AI Provider Keys
GROQ_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Email (optional — for notification emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@your-domain.com
```

**`backend/er_backend/settings.py`** — production security settings read from environment:

```python
import os

SECRET_KEY = os.environ['SECRET_KEY']          # required, no default
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# HTTPS security (active when DEBUG=False)
SECURE_HSTS_SECONDS = 31536000          # 1 year HSTS
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = not DEBUG          # redirect HTTP → HTTPS
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
```

### 1.2 Rotate exposed secrets

The following values in the current repo are compromised and must be replaced:
- `SECRET_KEY` — generate new: `python -c "import secrets; print(secrets.token_urlsafe(50))"`
- `GROQ_API_KEY` (`gsk_0fzaQ3...`) — regenerate at console.groq.com

---

## 2. Docker Production Config

### 2.1 `docker-compose.prod.yml` (new file, root of project)

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
    # No ports exposed — internal network only
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    # No ports exposed — internal network only
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
    # Note: requires django-celery-beat in requirements.txt and in INSTALLED_APPS.
    # If not present, use the simpler scheduler: celery -A er_backend beat --loglevel=info
    command: celery -A er_backend beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
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

### 2.2 `frontend/nginx.conf` (replace existing)

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL — Let's Encrypt certs (Certbot writes here)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_buffer_size 16k;
        proxy_buffers 4 32k;
    }

    # Static files (Django collectstatic)
    location /staticfiles/ {
        alias /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /app/media/;
        expires 7d;
    }
}
```

### 2.3 `backend/Dockerfile` (hardened)

```dockerfile
FROM python:3.11-slim

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY --chown=appuser:appuser . .

# Switch to non-root
USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "er_backend.wsgi:application"]
```

---

## 3. GitHub Actions CI/CD Pipeline

### 3.1 `.github/workflows/deploy.yml`

```yaml
name: Test & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ── Job 1: Run tests ──────────────────────────────────────
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

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install backend dependencies
        working-directory: backend
        run: pip install -r requirements.txt

      - name: Run Django tests
        working-directory: backend
        env:
          SECRET_KEY: test-secret-key-for-ci-only
          DEBUG: 'True'
          DB_NAME: test_db
          DB_USER: postgres
          DB_PASSWORD: postgres
          DB_HOST: localhost
          DB_PORT: 5432
          REDIS_URL: redis://localhost:6379/0
        run: python manage.py test --verbosity=2

      - name: Set up Node
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
        run: npm test

  # ── Job 2: Deploy (main branch only, after tests pass) ────
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/deploy/workconnect
            git pull origin main
            docker compose -f docker-compose.prod.yml build --no-cache
            docker compose -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
            docker image prune -f
            echo "Deploy complete: $(date)"
```

### 3.2 Required GitHub Actions secrets

Set these once in **GitHub → repo → Settings → Secrets and variables → Actions**:

| Secret name | Description |
|---|---|
| `SSH_PRIVATE_KEY` | Private key matching the deploy user's `~/.ssh/authorized_keys` on the server |
| `SERVER_IP` | VPS IP address |
| `SERVER_USER` | `deploy` |

> Production secrets (SECRET_KEY, DB_PASSWORD, API keys) live in `.env.prod` on the server — they are **not** stored in GitHub secrets, only referenced by the server itself.

---

## 4. Server Setup Runbook

This is a one-time setup on a fresh Ubuntu 22.04 server. Documented at `docs/deployment/SERVER_SETUP.md`.

### 4.1 Create deploy user

```bash
# As root
adduser deploy
usermod -aG sudo deploy
# Allow deploy user to run docker without sudo
usermod -aG docker deploy
```

### 4.2 Install Docker

```bash
# Official Docker install (not snap)
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

### 4.3 Firewall (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP (redirects to HTTPS)
ufw allow 443/tcp     # HTTPS
ufw enable
```

### 4.4 SSH key for GitHub Actions

```bash
# As deploy user
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
# Copy private key → paste into GitHub secret SSH_PRIVATE_KEY
cat ~/.ssh/deploy_key
```

### 4.5 Clone repo and create .env.prod

```bash
cd /home/deploy
git clone https://github.com/YOUR_USERNAME/workconnect.git workconnect
cd workconnect
cp backend/.env.prod.example backend/.env.prod
nano backend/.env.prod   # fill in real values
```

### 4.6 Install Certbot & issue SSL certificate

```bash
# Install Certbot
apt install certbot -y

# Point your domain DNS A record to SERVER_IP first, then:
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Auto-renewal (runs twice daily, renews when <30 days left)
systemctl enable certbot.timer
```

### 4.7 First deploy

```bash
cd /home/deploy/workconnect
docker compose -f docker-compose.prod.yml up -d --build
```

After this, all future deploys happen automatically via GitHub Actions on push to `main`.

---

## 5. File Map

| Action | File |
|---|---|
| Modify | `backend/.gitignore` — add `.env`, `.env.prod` |
| Create | `backend/.env.prod.example` — committed secrets template |
| Modify | `backend/er_backend/settings.py` — production security settings |
| Modify | `backend/Dockerfile` — non-root user, curl for health check |
| Create | `docker-compose.prod.yml` — production compose (no dev volumes, adds Celery, health checks) |
| Modify | `frontend/nginx.conf` — HTTPS, security headers, gzip, media/static routes |
| Create | `.github/workflows/deploy.yml` — CI/CD pipeline |
| Create | `docs/deployment/SERVER_SETUP.md` — one-time server setup runbook |

---

## 6. Health Check Endpoint

The `docker-compose.prod.yml` health check calls `GET /api/health/`. This endpoint must exist in Django and return `200 OK`. Add to `backend/er_backend/urls.py`:

```python
from django.http import JsonResponse
urlpatterns = [
    # ... existing patterns ...
    path('api/health/', lambda r: JsonResponse({'status': 'ok'})),
]
```

---

## 7. Acceptance Criteria

- `git push origin main` triggers GitHub Actions test + deploy workflow
- Tests must pass before deploy runs (deploy blocked on test failure)
- Server runs on HTTPS only — HTTP redirects to HTTPS
- SSL certificate auto-renews via Certbot timer
- `SECRET_KEY`, `DB_PASSWORD`, API keys never appear in git history
- PostgreSQL and Redis ports not exposed to the internet (Docker internal network only)
- Celery worker processes background tasks (AI summaries, email digests)
- Non-root user runs all Docker containers
- Firewall blocks all ports except 22, 80, 443
- `.env.prod.example` documents all required environment variables
- `docs/deployment/SERVER_SETUP.md` runbook exists with copy-paste commands
- Rolling restart — Gunicorn keeps serving during `docker compose up -d`
