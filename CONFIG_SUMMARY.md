# MFE Deployment Configuration Summary

## 🏗️ Architecture Overview

This micro-frontend (MFE) deployment uses a host-console architecture deployed on Google Kubernetes Engine (GKE) with the following components:

- **MFE Host**: Main application shell
- **MFE Console**: Remote microfrontend loaded by the host
- **Kubernetes**: Container orchestration
- **Google Cloud Load Balancer**: External traffic routing
- **GitHub Actions**: CI/CD automation
- **Docker & Nginx**: Application containerization and serving

## 🔧 Key Configuration Changes

### 1. Docker Build Args Resolution
**Issue**: Environment variables not being passed to build process
**Solution**: Added ARG and ENV directives to Dockerfiles
```dockerfile
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
```

### 2. Nginx Path Routing Fix
**Issue**: 404 errors on console routes due to incorrect path resolution
**Solution**: Changed from `root` to `alias` for console location
```nginx
# Before (incorrect)
location /console/ {
    root /usr/share/nginx/html/console/;
}

# After (correct)
location /console/ {
    alias /usr/share/nginx/html/console/;
}
```

### 3. Health Check Endpoint
**Issue**: GCP Load Balancer health checks failing
**Solution**: Added root health check endpoint for console
```nginx
location = / {
    return 200 'OK';
    add_header Content-Type text/plain;
}
```

### 4. Asset Serving Fix
**Issue**: Static assets (CSS, JS) returning 404
**Solution**: Added proper asset location with root directive
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    root /usr/share/nginx/html;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 5. Ingress Path Handling
**Issue**: Console not accessible via both `/console` and `/console/`
**Solution**: Added both exact and prefix path matches
```yaml
paths:
- path: /console
  pathType: Exact
- path: /console/
  pathType: Prefix
```

## 📁 Current File Structure

```
mfe-workspace/
├── .github/workflows/
│   ├── ci-cd.yml              # Main CI/CD pipeline
│   ├── monitoring.yml         # Health monitoring
│   ├── deploy-staging.yml     # Manual deployment
│   └── rollback.yml           # Rollback workflow
├── k8s/
│   ├── ingress.yaml           # Load balancer configuration
│   ├── mfe-host-deployment.yaml    # Enhanced with health checks
│   ├── mfe-host-service.yaml
│   ├── mfe-console-deployment.yaml # Enhanced with health checks
│   └── mfe-console-service.yaml
├── mfe-host/
│   ├── dockerfile             # Multi-stage build with args
│   ├── nginx.conf             # Optimized for host serving
│   └── .env files (prod/dev)  # Environment configurations
├── mfe-console/
│   ├── dockerfile             # Multi-stage build with args
│   ├── nginx.conf             # Optimized for console serving
│   └── .env files (prod/dev)  # Environment configurations
├── scripts/
│   ├── health-check.js        # Kubernetes health monitoring
│   └── test-endpoints.js      # Endpoint testing utility
├── deploy.sh                  # Enhanced deployment script
├── DEPLOYMENT_GUIDE.md        # Comprehensive documentation
└── package.json               # Enhanced with deployment scripts
```

## 🚀 Deployment Workflows

### 1. Automated CI/CD (ci-cd.yml)
- **Triggers**: Push to main/develop, tags, pull requests
- **Features**:
  - Path-based change detection
  - Automated testing (lint, test, build)
  - Docker image building and pushing
  - Kubernetes deployment
  - Health verification
  - Rollback on failure

### 2. Manual Deployment (deploy-staging.yml)
- **Trigger**: Manual workflow dispatch
- **Features**:
  - Environment selection
  - Force restart option
  - Comprehensive verification

### 3. Rollback (rollback.yml)
- **Trigger**: Manual workflow dispatch
- **Features**:
  - Selective rollback (host, console, or both)
  - Revision selection
  - Automated verification

### 4. Monitoring (monitoring.yml)
- **Trigger**: Every 5 minutes + manual
- **Features**:
  - Cluster health monitoring
  - Endpoint testing
  - Performance monitoring
  - Alerting

## 🔧 Environment Variables

### Production Environment
```bash
# MFE Host
VITE_CONSOLE_REMOTE_URL=http://34.54.233.86/console/assets/remoteEntry.js

# MFE Console
VITE_BASE_URL=/console/
```

### Development Environment
```bash
# MFE Host
VITE_CONSOLE_REMOTE_URL=http://localhost:4001/assets/remoteEntry.js

# MFE Console
VITE_BASE_URL=/
```

## 🔍 Health Checks & Monitoring

### Kubernetes Health Checks
Both deployments include:
- **Liveness Probe**: Restart unhealthy containers
- **Readiness Probe**: Route traffic only to ready containers
- **Resource Limits**: Prevent resource exhaustion

### External Monitoring
- **Health Check Script**: `npm run health:check`
- **Endpoint Testing**: `npm run health:endpoints`
- **GitHub Actions Monitoring**: Runs every 5 minutes

## 📊 Resource Configuration

### MFE Host Deployment
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
replicas: 2
```

### MFE Console Deployment
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
replicas: 2
```

## 🌐 Network Configuration

### External Access
- **Load Balancer IP**: 34.54.233.86
- **Host Application**: http://34.54.233.86/
- **Console Application**: http://34.54.233.86/console/

### Internal Services
- **mfe-host-service**: ClusterIP, Port 80
- **mfe-console-service**: ClusterIP, Port 80

## 🛠️ Development & Testing

### Local Development
```bash
# Start development servers
npm run dev:all

# Build applications
npm run build:all

# Test applications
npm run test:all

# Lint code
npm run lint:all
```

### Docker Testing
```bash
# Build and run with docker-compose
npm run docker:build

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

### Kubernetes Testing
```bash
# Deploy to cluster
npm run deploy

# Check status
npm run k8s:status

# View logs
npm run k8s:logs:host
npm run k8s:logs:console

# Test health
npm run health:check
npm run health:endpoints
```

## 🔒 Security Considerations

### Container Security
- Multi-stage builds to reduce attack surface
- Non-root user in containers
- Minimal base images (Alpine)
- Security scanning in CI/CD

### Network Security
- TLS termination at load balancer
- Network policies for pod-to-pod communication
- Service mesh for advanced security (future)

### Access Control
- RBAC for Kubernetes access
- Service accounts with minimal permissions
- Secrets management for sensitive data

## 📈 Performance Optimizations

### Build Optimizations
- Multi-stage Docker builds
- Static asset compression
- Bundle splitting and lazy loading
- CDN integration (future)

### Runtime Optimizations
- Nginx caching headers
- Gzip compression
- HTTP/2 support
- Resource limits and requests

### Monitoring & Scaling
- Horizontal Pod Autoscaler (HPA) ready
- Vertical Pod Autoscaler (VPA) ready
- Metrics collection for scaling decisions

## 🐛 Common Issues & Solutions

### Build Issues
1. **Environment variables not available**
   - Ensure build args are passed in GitHub Actions
   - Check Dockerfile ARG/ENV declarations

2. **Dependencies not installing**
   - Verify package.json files
   - Check npm/yarn versions

### Deployment Issues
1. **Pods not starting**
   - Check resource limits
   - Verify image availability
   - Check for configuration errors

2. **Health checks failing**
   - Ensure health endpoints are accessible
   - Check probe configurations
   - Verify startup times

### Networking Issues
1. **404 errors on routes**
   - Check Nginx configuration
   - Verify ingress path configurations
   - Test with curl commands

2. **Static assets not loading**
   - Check Nginx asset serving configuration
   - Verify build output locations
   - Check CORS settings

## 🔄 Rollback Procedures

### Automatic Rollback
- GitHub Actions automatically rolls back on deployment failure
- Kubernetes handles rolling updates with zero downtime

### Manual Rollback
```bash
# Using GitHub Actions
# Navigate to Actions -> Rollback Deployment -> Run workflow

# Using kubectl
kubectl rollout undo deployment/mfe-host
kubectl rollout undo deployment/mfe-console

# Using npm scripts
npm run deploy:rollback
```

## 📋 Maintenance Tasks

### Regular Maintenance
- Update base images monthly
- Review and update resource limits
- Monitor performance metrics
- Update dependencies

### Security Updates
- Apply security patches promptly
- Update Kubernetes version
- Review and update RBAC policies
- Rotate secrets and certificates

### Performance Monitoring
- Review application metrics
- Monitor resource usage
- Analyze user experience metrics
- Optimize based on usage patterns

## 🎯 Future Enhancements

### Planned Improvements
1. **Advanced Monitoring**: Prometheus + Grafana
2. **Service Mesh**: Istio for advanced networking
3. **CDN Integration**: CloudFlare or Google CDN
4. **Advanced Security**: Pod security policies
5. **Multi-Environment**: Staging and production separation

### Scalability Enhancements
1. **Auto-scaling**: HPA and VPA implementation
2. **Multi-region**: Cross-region deployment
3. **Caching**: Redis for application caching
4. **Load Testing**: Regular performance testing

---

## 📞 Support Information

For deployment issues or questions:
1. Check the DEPLOYMENT_GUIDE.md
2. Review GitHub Actions logs
3. Run health check scripts
4. Check Kubernetes events and logs
5. Review this configuration summary

**Remember**: Always test changes in a non-production environment first!

---

*Last updated: $(date)*
*Configuration version: 1.0*
