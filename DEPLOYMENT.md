# Vetly - Deployment Guide (Hetzner VPS + Docker + Coolify)

## Overview

This guide covers deploying the Vetly application to a Hetzner VPS using Docker containers managed by Coolify.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Hetzner VPS (Ubuntu 22.04)             │
│                                                      │
│  ┌───────────────────────────────────────────────┐ │
│  │              Coolify (Self-hosted PaaS)       │ │
│  │                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐          │ │
│  │  │   Nginx      │  │  Let's       │          │ │
│  │  │ Reverse Proxy│  │  Encrypt     │          │ │
│  │  └──────┬───────┘  └──────────────┘          │ │
│  │         │                                      │ │
│  │  ┌──────┴───────────────────────────────┐    │ │
│  │  │                                       │    │ │
│  │  │  ┌────────────┐    ┌────────────┐    │    │ │
│  │  │  │  Next.js   │    │  FastAPI   │    │    │ │
│  │  │  │  Frontend  │    │  Backend   │    │    │ │
│  │  │  │  (Docker)  │    │  (Docker)  │    │    │ │
│  │  │  └────────────┘    └─────┬──────┘    │    │ │
│  │  │                           │           │    │ │
│  │  │  ┌────────────┐    ┌─────┴──────┐    │    │ │
│  │  │  │ PostgreSQL │    │   Redis    │    │    │ │
│  │  │  │  (Docker)  │    │  (Docker)  │    │    │ │
│  │  │  └────────────┘    └────────────┘    │    │ │
│  │  │                                       │    │ │
│  │  └───────────────────────────────────────┘    │ │
│  └───────────────────────────────────────────────┘ │
│                                                      │
│  ┌───────────────────────────────────────────────┐ │
│  │         Hetzner Storage Box (Backups)         │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Hetzner Account**: Create account at https://hetzner.com
- **Domain Name**: Registered domain (e.g., vetly.gr)
- **SSH Key**: Generated SSH key pair
- **GitHub Account**: For repository and CI/CD

---

## Part 1: Server Setup

### 1.1 Provision Hetzner VPS

1. **Log in to Hetzner Cloud Console**
   - Go to https://console.hetzner.cloud

2. **Create a new project**
   - Name: `vetly-production`

3. **Create a server**
   - **Location**: Falkenstein or Nuremberg (Germany, closest to Greece)
   - **Image**: Ubuntu 22.04 LTS
   - **Type**:
     - Development/Testing: **CX21** (2 vCPU, 4GB RAM) - €5.83/month
     - Production: **CX31** (2 vCPU, 8GB RAM) - €11.05/month
     - Recommended: **CX41** (4 vCPU, 16GB RAM) - €21.50/month
   - **Volume**: Optional 10GB+ volume for backups
   - **Networking**:
     - Enable IPv4 and IPv6
     - Create/assign to private network (optional)
   - **SSH Keys**: Add your public SSH key
   - **Name**: `vetly-production`

4. **Note the server IP address** (e.g., `116.203.xxx.xxx`)

### 1.2 Configure DNS

1. **Point your domain to the server**
   ```
   A     @              116.203.xxx.xxx
   A     www            116.203.xxx.xxx
   A     api            116.203.xxx.xxx
   AAAA  @              <IPv6 address>
   ```

2. **Wait for DNS propagation** (can take up to 24 hours, usually 5-15 minutes)

### 1.3 Initial Server Configuration

1. **SSH into the server**
   ```bash
   ssh root@116.203.xxx.xxx
   ```

2. **Update system packages**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Set timezone**
   ```bash
   timedatectl set-timezone Europe/Athens
   ```

4. **Create a non-root user (optional but recommended)**
   ```bash
   adduser vetly
   usermod -aG sudo vetly
   mkdir -p /home/vetly/.ssh
   cp /root/.ssh/authorized_keys /home/vetly/.ssh/
   chown -R vetly:vetly /home/vetly/.ssh
   chmod 700 /home/vetly/.ssh
   chmod 600 /home/vetly/.ssh/authorized_keys
   ```

5. **Configure firewall (UFW)**
   ```bash
   ufw allow 22/tcp      # SSH
   ufw allow 80/tcp      # HTTP
   ufw allow 443/tcp     # HTTPS
   ufw allow 8000/tcp    # Coolify dashboard
   ufw enable
   ufw status
   ```

6. **Install fail2ban for SSH protection**
   ```bash
   apt install fail2ban -y
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

### 1.4 Install Docker

1. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **Install Docker Compose**
   ```bash
   apt install docker-compose-plugin -y
   ```

3. **Verify installation**
   ```bash
   docker --version
   docker compose version
   ```

4. **Add user to docker group** (if using non-root user)
   ```bash
   usermod -aG docker vetly
   ```

---

## Part 2: Coolify Installation

### 2.1 Install Coolify

1. **Run Coolify installation script**
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

2. **Wait for installation** (takes 5-10 minutes)

3. **Access Coolify dashboard**
   - Open browser: `http://116.203.xxx.xxx:8000`
   - Or: `http://your-domain.com:8000`

4. **Complete setup wizard**
   - Create admin account
   - Set admin email and password
   - Configure basic settings

### 2.2 Configure Coolify

1. **Set up email notifications** (optional)
   - Settings → Notifications
   - Add email/Discord/Slack webhook

2. **Configure SSL**
   - Settings → SSL
   - Enable automatic Let's Encrypt
   - Add your email for certificate notifications

---

## Part 3: Database & Services Setup

### 3.1 Create PostgreSQL Database

1. **In Coolify dashboard**
   - Go to **Databases**
   - Click **+ Add Database**
   - Select **PostgreSQL**

2. **Configure database**
   - **Name**: `vetly-postgres`
   - **PostgreSQL Version**: 15 or 16
   - **Database Name**: `vetly`
   - **Username**: `vetly`
   - **Password**: Generate strong password (save it!)
   - **Port**: 5432 (internal)
   - **Persistent Storage**: Enabled (important!)
   - **Volume Path**: `/var/lib/postgresql/data`

3. **Deploy database**
   - Click **Deploy**
   - Wait for database to start
   - Note connection string: `postgresql://vetly:PASSWORD@vetly-postgres:5432/vetly`

### 3.2 Create Redis Instance

1. **In Coolify dashboard**
   - Go to **Databases**
   - Click **+ Add Database**
   - Select **Redis**

2. **Configure Redis**
   - **Name**: `vetly-redis`
   - **Redis Version**: 7
   - **Port**: 6379 (internal)
   - **Persistent Storage**: Enabled
   - **Password**: Generate password

3. **Deploy Redis**
   - Note connection string: `redis://:PASSWORD@vetly-redis:6379`

---

## Part 4: Application Deployment

### 4.1 Prepare Docker Configuration

#### Backend Dockerfile (`vetly-back/Dockerfile`)

```dockerfile
# Multi-stage build for FastAPI
FROM python:3.11-slim as builder

# Install uv
RUN pip install uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Install dependencies with uv
RUN uv pip install --system --no-cache -r pyproject.toml

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 vetly && chown -R vetly:vetly /app
USER vetly

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### Frontend Dockerfile (`vetly-front/Dockerfile`)

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

#### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: vetly
      POSTGRES_USER: vetly
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vetly"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./vetly-back
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://vetly:${DB_PASSWORD}@postgres:5432/vetly
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./vetly-back:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./vetly-front
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on:
      - backend
    volumes:
      - ./vetly-front:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
  redis_data:
```

### 4.2 Deploy Backend to Coolify

1. **In Coolify dashboard**
   - Go to **Applications**
   - Click **+ Add Application**
   - Select **Git Repository**

2. **Connect GitHub repository**
   - Authorize Coolify to access your GitHub
   - Select repository: `your-username/Vetly`
   - Branch: `main`

3. **Configure application**
   - **Name**: `vetly-backend`
   - **Build Pack**: Docker
   - **Dockerfile Location**: `vetly-back/Dockerfile`
   - **Port**: 8000
   - **Domain**: `api.vetly.gr` (or your domain)

4. **Set environment variables**
   ```
   DATABASE_URL=postgresql://vetly:PASSWORD@vetly-postgres:5432/vetly
   REDIS_URL=redis://:PASSWORD@vetly-redis:6379
   JWT_SECRET=<generate-strong-secret>
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION=3600
   GEMINI_API_KEY=<your-gemini-key>
   ENVIRONMENT=production
   ALLOWED_ORIGINS=https://vetly.gr,https://www.vetly.gr
   ```

5. **Configure health check**
   - **Path**: `/health`
   - **Port**: 8000
   - **Interval**: 30s

6. **Deploy**
   - Click **Deploy**
   - Monitor build logs
   - Wait for successful deployment

### 4.3 Deploy Frontend to Coolify

1. **Add new application**
   - Same repository
   - **Name**: `vetly-frontend`
   - **Dockerfile Location**: `vetly-front/Dockerfile`
   - **Port**: 3000
   - **Domain**: `vetly.gr` or `www.vetly.gr`

2. **Set environment variables**
   ```
   NEXT_PUBLIC_API_URL=https://api.vetly.gr
   NODE_ENV=production
   ```

3. **Deploy**
   - Click **Deploy**
   - Monitor build logs

### 4.4 Configure SSL Certificates

1. **For each application in Coolify**
   - Go to application settings
   - **SSL/TLS** tab
   - Enable **Let's Encrypt**
   - Add domain
   - Click **Generate Certificate**
   - Wait for certificate generation (1-2 minutes)

2. **Verify HTTPS**
   - Visit `https://vetly.gr`
   - Visit `https://api.vetly.gr`
   - Check for valid SSL certificate

---

## Part 5: Database Migrations & Seeding

### 5.1 Run Initial Migration

1. **Access backend container**
   ```bash
   # Find backend container ID
   docker ps | grep vetly-backend

   # Access container
   docker exec -it <container-id> bash
   ```

2. **Run migrations**
   ```bash
   # Inside container
   alembic upgrade head
   ```

3. **Seed initial data** (optional)
   ```bash
   python scripts/seed_data.py
   ```

---

## Part 6: Backups

### 6.1 Configure Automated Database Backups

#### Create backup script

Create `/home/vetly/backup-db.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/vetly/backups"
DB_CONTAINER="vetly-postgres"
DB_NAME="vetly"
DB_USER="vetly"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vetly_${TIMESTAMP}.sql.gz"

# Create backup
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Delete backups older than retention period
find $BACKUP_DIR -name "vetly_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Optional: Upload to Hetzner Storage Box
# scp $BACKUP_FILE username@username.your-storagebox.de:/backups/

echo "Backup completed: $BACKUP_FILE"
```

Make it executable:
```bash
chmod +x /home/vetly/backup-db.sh
```

#### Set up cron job

```bash
crontab -e
```

Add daily backup at 2 AM:
```
0 2 * * * /home/vetly/backup-db.sh >> /var/log/vetly-backup.log 2>&1
```

### 6.2 Hetzner Storage Box (Optional)

1. **Order Storage Box**
   - Go to Hetzner Cloud Console
   - Order Storage Box (100GB recommended)
   - Note SSH credentials

2. **Configure SSH access**
   ```bash
   ssh-copy-id -p 23 username@username.your-storagebox.de
   ```

3. **Update backup script to upload**
   - Uncomment scp line in backup script
   - Test backup upload

---

## Part 7: Monitoring & Maintenance

### 7.1 Set up Monitoring

1. **Coolify built-in monitoring**
   - Check CPU, memory, disk usage in Coolify dashboard
   - Set up alerts for high resource usage

2. **Sentry for error tracking**
   - Create Sentry project at sentry.io
   - Add Sentry DSN to environment variables:
     ```
     SENTRY_DSN=https://xxx@sentry.io/xxx
     ```
   - Restart applications

3. **Uptime monitoring**
   - Use UptimeRobot (free tier)
   - Monitor:
     - `https://vetly.gr`
     - `https://api.vetly.gr/health`
   - Set up email/SMS alerts

### 7.2 Log Management

1. **View application logs in Coolify**
   - Go to application → Logs tab
   - Real-time log streaming

2. **Docker logs**
   ```bash
   docker logs -f <container-name>
   docker logs --tail 100 <container-name>
   ```

3. **Configure log rotation**
   ```bash
   # /etc/docker/daemon.json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```

   Restart Docker:
   ```bash
   systemctl restart docker
   ```

---

## Part 8: CI/CD with GitHub Actions

### 8.1 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Coolify

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Trigger Coolify deployment
        run: |
          curl -X POST ${{ secrets.COOLIFY_WEBHOOK_URL }}
```

### 8.2 Configure Coolify Webhook

1. **In Coolify dashboard**
   - Go to application settings
   - Find **Webhooks** section
   - Copy webhook URL

2. **Add to GitHub secrets**
   - Go to GitHub repository → Settings → Secrets
   - Add `COOLIFY_WEBHOOK_URL`

---

## Part 9: Security Hardening

### 9.1 Server Security

1. **Disable root login**
   ```bash
   # /etc/ssh/sshd_config
   PermitRootLogin no
   PasswordAuthentication no
   ```

   Restart SSH:
   ```bash
   systemctl restart sshd
   ```

2. **Configure automatic security updates**
   ```bash
   apt install unattended-upgrades -y
   dpkg-reconfigure --priority=low unattended-upgrades
   ```

3. **Install and configure AppArmor**
   ```bash
   apt install apparmor apparmor-utils -y
   systemctl enable apparmor
   ```

### 9.2 Application Security

1. **Rate limiting**
   - Implement in FastAPI middleware
   - Use slowapi or similar

2. **CORS configuration**
   - Only allow specific origins in production
   - No wildcard `*` in production

3. **Environment variables**
   - Never commit `.env` files
   - Use Coolify's environment variable management
   - Rotate secrets regularly

---

## Part 10: Troubleshooting

### Common Issues

#### Application won't start
```bash
# Check logs
docker logs <container-name>

# Check if port is already in use
netstat -tuln | grep <port>

# Restart container
docker restart <container-name>
```

#### Database connection errors
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs vetly-postgres

# Test connection
docker exec vetly-postgres psql -U vetly -d vetly
```

#### SSL certificate issues
```bash
# Force certificate renewal
# In Coolify dashboard, delete and regenerate certificate

# Check certificate expiry
echo | openssl s_client -connect vetly.gr:443 2>/dev/null | openssl x509 -noout -dates
```

#### Out of disk space
```bash
# Check disk usage
df -h

# Clean Docker system
docker system prune -a --volumes

# Check Docker disk usage
docker system df
```

---

## Cost Breakdown

### Monthly Costs

| Service | Plan | Cost |
|---------|------|------|
| Hetzner VPS | CX31 (8GB RAM) | €11.05 |
| Hetzner Storage Box | 100GB (optional) | €3.81 |
| Domain | .gr domain | ~€10-20/year |
| **Total** | | **~€15-20/month** |

### Scaling Costs

- **CX41** (16GB RAM): €21.50/month
- **CX51** (32GB RAM): €42.90/month
- **Storage Box 1TB**: €11.90/month

---

## Maintenance Schedule

### Daily
- [ ] Monitor application logs
- [ ] Check error rates in Sentry
- [ ] Verify backups completed

### Weekly
- [ ] Review resource usage (CPU, RAM, disk)
- [ ] Check SSL certificate status
- [ ] Review security logs

### Monthly
- [ ] Update Docker images
- [ ] Review and rotate secrets
- [ ] Test backup restoration
- [ ] Security audit

### Quarterly
- [ ] Server OS updates
- [ ] Review and optimize database
- [ ] Capacity planning

---

## Support Resources

- **Coolify Docs**: https://coolify.io/docs
- **Hetzner Docs**: https://docs.hetzner.com
- **Docker Docs**: https://docs.docker.com
- **Coolify Community**: https://discord.gg/coolify

---

## Conclusion

You now have a fully functional, production-ready deployment of Vetly on Hetzner VPS using Docker and Coolify. The setup includes:

✅ Automated deployments via GitHub
✅ SSL certificates with auto-renewal
✅ Database backups
✅ Monitoring and logging
✅ Security hardening

**Next Steps**:
1. Set up monitoring alerts
2. Configure custom domain email
3. Implement CDN (Cloudflare) for static assets
4. Set up staging environment

Good luck with your deployment! 🚀
