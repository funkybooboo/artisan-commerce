# Docker Deployment Guide

This guide covers deploying Artisan Commerce using Docker containers.

---

## Quick Start

### Prerequisites

- Docker 24+ installed
- Docker Compose 2+ installed
- `.env` file configured (copy from `.env.example`)

### Start All Services

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:8787

---

## Architecture

### Services

**web** (Next.js Frontend)
- Port: 3000
- Image: Built from Dockerfile (target: web)
- Dependencies: workers
- Health check: /api/health endpoint

**workers** (Cloudflare Workers API)
- Port: 8787
- Image: Built from Dockerfile (target: workers)
- Dependencies: none
- Health check: /health endpoint

**db** (SQLite Database)
- Local development only
- Production uses Cloudflare D1
- Volume: db-data (persistent)

### Network

All services run on the `artisan-commerce` bridge network for inter-service communication.

---

## Production Deployment

### Option 1: Docker Compose (Self-Hosted)

**Best for**: VPS, dedicated servers, on-premise deployment

```bash
# Build production images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f web
docker-compose logs -f workers
```

**Scaling**:
```bash
# Scale web service to 3 instances
docker-compose up -d --scale web=3

# Use nginx or traefik for load balancing
```

### Option 2: Cloudflare (Recommended)

**Best for**: Production, global edge deployment, minimal cost

Artisan Commerce is designed for Cloudflare:
- Next.js → Cloudflare Pages
- Workers → Cloudflare Workers
- Database → Cloudflare D1
- Storage → Cloudflare R2

See [Cloudflare Deployment Guide](./developer/deployment.md) for details.

### Option 3: Kubernetes

**Best for**: Large-scale deployments, enterprise

```bash
# Generate Kubernetes manifests from docker-compose
kompose convert -f docker-compose.yml

# Apply to cluster
kubectl apply -f web-deployment.yaml
kubectl apply -f workers-deployment.yaml
kubectl apply -f web-service.yaml
kubectl apply -f workers-service.yaml
```

See [Kubernetes Deployment Guide](./KUBERNETES-DEPLOYMENT.md) for full setup.

---

## Configuration

### Environment Variables

All configuration via `.env` file:

```bash
# Application
NODE_ENV=production
APP_BASE_URL=https://yourdomain.com

# Adapters (use mock for local dev)
EMAIL_PROVIDER=mock
SHIPPING_PROVIDER=mock
PAYMENT_PROVIDER=mock
STORAGE_PROVIDER=local

# Secrets (required for production)
JWT_SECRET=your-secret-here
STRIPE_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
```

See `.env.example` for all options.

### Volume Mounts

**Development** (mount source code for hot reload):
```yaml
services:
  web:
    volumes:
      - ./apps/web:/app/apps/web
      - ./packages:/app/packages
```

**Production** (no mounts, use built image):
```yaml
services:
  web:
    # No volumes - use built image
```

---

## Building Images

### Build All Images

```bash
docker-compose build
```

### Build Specific Service

```bash
docker-compose build web
docker-compose build workers
```

### Build with No Cache

```bash
docker-compose build --no-cache
```

### Multi-Platform Builds (ARM + x86)

```bash
# Set up buildx
docker buildx create --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target web \
  -t artisan-commerce-web:latest \
  --push \
  .
```

---

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect artisan-commerce-web | jq '.[0].State.Health'
```

**Health Check Endpoints**:
- Web: `GET http://localhost:3000/api/health`
- Workers: `GET http://localhost:8787/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "version": "0.1.0"
}
```

---

## Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f workers

# Last 100 lines
docker-compose logs --tail=100 web

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 web
```

### Log Drivers

**JSON File** (default):
```yaml
services:
  web:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

**Syslog**:
```yaml
services:
  web:
    logging:
      driver: syslog
      options:
        syslog-address: "tcp://192.168.0.42:514"
```

**Fluentd**:
```yaml
services:
  web:
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: artisan-commerce.web
```

---

## Monitoring

### Prometheus Metrics

Add Prometheus exporter:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - artisan-commerce

volumes:
  prometheus-data:
```

### Grafana Dashboards

```yaml
services:
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - artisan-commerce

volumes:
  grafana-data:
```

---

## Backup & Restore

### Backup Database

```bash
# Backup SQLite database
docker-compose exec db sqlite3 /data/artisan-commerce.db .dump > backup.sql

# Or copy database file
docker cp artisan-commerce-db:/data/artisan-commerce.db ./backup.db
```

### Restore Database

```bash
# Restore from SQL dump
docker-compose exec -T db sqlite3 /data/artisan-commerce.db < backup.sql

# Or copy database file
docker cp ./backup.db artisan-commerce-db:/data/artisan-commerce.db
```

### Backup Volumes

```bash
# Backup all volumes
docker run --rm \
  -v artisan-commerce_db-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz /data

# Restore volumes
docker run --rm \
  -v artisan-commerce_db-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/db-backup.tar.gz -C /
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs web

# Check container status
docker-compose ps

# Inspect container
docker inspect artisan-commerce-web

# Check resource usage
docker stats
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Host:Container
```

### Database Connection Issues

```bash
# Check database container
docker-compose logs db

# Connect to database
docker-compose exec db sqlite3 /data/artisan-commerce.db

# Run migrations
docker-compose exec workers pnpm run db:migrate
```

### Out of Disk Space

```bash
# Clean up unused images
docker image prune -a

# Clean up unused volumes
docker volume prune

# Clean up everything
docker system prune -a --volumes
```

### Slow Build Times

```bash
# Use BuildKit (faster)
DOCKER_BUILDKIT=1 docker-compose build

# Use build cache
docker-compose build --cache-from artisan-commerce-web:latest

# Parallel builds
docker-compose build --parallel
```

---

## Security

### Run as Non-Root User

```dockerfile
# Add to Dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
```

### Scan for Vulnerabilities

```bash
# Scan image
docker scan artisan-commerce-web:latest

# Use Trivy
trivy image artisan-commerce-web:latest
```

### Secrets Management

**Docker Secrets** (Swarm mode):
```yaml
services:
  web:
    secrets:
      - jwt_secret
      - stripe_key

secrets:
  jwt_secret:
    external: true
  stripe_key:
    external: true
```

**Environment Files**:
```bash
# Never commit .env to git
echo ".env" >> .gitignore

# Use different env files per environment
docker-compose --env-file .env.production up
```

---

## Performance Optimization

### Multi-Stage Builds

Already implemented in Dockerfile:
1. Base: Install dependencies
2. Builder: Build application
3. Production: Minimal runtime image

**Result**: ~200MB final image (vs ~1GB without multi-stage)

### Layer Caching

```dockerfile
# Copy package files first (changes less often)
COPY package.json pnpm-lock.yaml ./

# Install dependencies (cached if package files unchanged)
RUN pnpm install

# Copy source code last (changes most often)
COPY . .
```

### Resource Limits

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          target: web
          push: true
          tags: yourusername/artisan-commerce-web:latest
          cache-from: type=registry,ref=yourusername/artisan-commerce-web:buildcache
          cache-to: type=registry,ref=yourusername/artisan-commerce-web:buildcache,mode=max
```

### GitLab CI

```yaml
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

---

## Alternative Deployment Options

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml artisan-commerce

# Scale services
docker service scale artisan-commerce_web=3

# View services
docker service ls
```

### Portainer

```bash
# Deploy Portainer
docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Access at http://localhost:9000
```

### Watchtower (Auto-Updates)

```yaml
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300  # Check every 5 minutes
```

---

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)
