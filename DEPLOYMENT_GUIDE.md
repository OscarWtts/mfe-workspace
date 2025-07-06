# MFE Deployment Guide & Troubleshooting

## Overview
This document provides a comprehensive guide for the micro-frontend (MFE) deployment automation on Google Kubernetes Engine (GKE) using GitHub Actions, Docker, and Nginx.

## Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Google Cloud Load Balancer               │
│                         (External IP: 34.54.233.86)            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                         Ingress Controller                      │
│                         (mfe-ingress)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                  ┌───────┴────────┐
                  │                │
         ┌────────▼────────┐ ┌────▼─────────────┐
         │   MFE Host      │ │   MFE Console    │
         │   Service       │ │   Service        │
         │   (Port 80)     │ │   (Port 80)      │
         └────────┬────────┘ └────┬─────────────┘
                  │                │
         ┌────────▼────────┐ ┌────▼─────────────┐
         │   MFE Host      │ │   MFE Console    │
         │   Deployment    │ │   Deployment     │
         │   (2 replicas)  │ │   (2 replicas)   │
         └─────────────────┘ └──────────────────┘
```

## Configuration Summary

### 1. Docker Configuration

#### MFE Host Dockerfile
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_CONSOLE_REMOTE_URL
ENV VITE_CONSOLE_REMOTE_URL=$VITE_CONSOLE_REMOTE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### MFE Console Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
RUN npm run build

FROM nginx:alpine
# Important: Copy to /console subdirectory for path-based routing
COPY --from=builder /app/dist /usr/share/nginx/html/console
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Nginx Configuration

#### MFE Host (nginx.conf)
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;
        
        # Root location for host app
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
        
        # Static assets with caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            root /usr/share/nginx/html;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

#### MFE Console (nginx.conf)
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;
        
        # Health check endpoint for GCP Load Balancer
        location = / {
            return 200 'OK';
            add_header Content-Type text/plain;
        }
        
        # Console app - IMPORTANT: Use alias, not root!
        location /console/ {
            alias /usr/share/nginx/html/console/;
            try_files $uri $uri/ /console/index.html;
        }
        
        # Static assets for console
        location ~* ^/console/.*\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            alias /usr/share/nginx/html/console/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 3. Kubernetes Configuration

#### Deployment Manifests
Both deployments now include:
- **Health Checks**: Liveness and readiness probes
- **Resource Limits**: CPU and memory requests/limits
- **Rolling Updates**: Zero-downtime deployments
- **Proper Labels**: For monitoring and management
- **Image Pull Policy**: Always use latest images

#### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mfe-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "mfe-static-ip"
spec:
  rules:
  - http:
      paths:
      # Console routes (order matters!)
      - path: /console
        pathType: Exact
        backend:
          service:
            name: mfe-console-service
            port:
              number: 80
      - path: /console/
        pathType: Prefix
        backend:
          service:
            name: mfe-console-service
            port:
              number: 80
      # Host route (catch-all)
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mfe-host-service
            port:
              number: 80
```

### 4. GitHub Actions Workflows

#### Main CI/CD Pipeline (ci-cd.yml)
- **Trigger**: Push to main/develop, tags, PRs
- **Features**:
  - Path-based change detection
  - Automated testing (lint, test, build)
  - Multi-stage builds for optimization
  - Automated deployment to GKE
  - Health checks and verification
  - Rollback on failure

#### Monitoring (monitoring.yml)
- **Trigger**: Every 5 minutes + manual
- **Features**:
  - Cluster health monitoring
  - Endpoint testing
  - Resource usage monitoring
  - Failed pod detection
  - Automated alerting

#### Manual Deployment (deploy-staging.yml)
- **Trigger**: Manual workflow dispatch
- **Features**:
  - Environment selection
  - Force restart option
  - Comprehensive verification
  - Endpoint testing

#### Rollback (rollback.yml)
- **Trigger**: Manual workflow dispatch
- **Features**:
  - Selective rollback (host, console, or both)
  - Revision selection
  - Automated verification

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Build Args Not Passed
**Problem**: Environment variables not available in build
**Solution**: Ensure build args are passed in Dockerfile and GitHub Actions
```yaml
docker build \
  --build-arg VITE_CONSOLE_REMOTE_URL=http://34.54.233.86/console/assets/remoteEntry.js \
  -t image:tag ./app
```

#### 2. 404 Errors on Console Routes
**Problem**: Nginx serving wrong files for /console/ paths
**Solution**: Use `alias` instead of `root` in nginx.conf
```nginx
# Wrong
location /console/ {
    root /usr/share/nginx/html/console/;
}

# Correct
location /console/ {
    alias /usr/share/nginx/html/console/;
}
```

#### 3. Health Check Failures
**Problem**: GCP Load Balancer health checks failing
**Solution**: Add root health check endpoint
```nginx
location = / {
    return 200 'OK';
    add_header Content-Type text/plain;
}
```

#### 4. Static Asset 404s
**Problem**: CSS/JS files not loading
**Solution**: Add proper asset location with root directive
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    root /usr/share/nginx/html;
    expires 1y;
}
```

#### 5. Deployment Stuck in Pending
**Problem**: Pods not starting
**Diagnosis**:
```bash
kubectl describe pods -l app=mfe-host
kubectl logs -l app=mfe-host
```
**Common Causes**:
- Resource constraints
- Image pull failures
- Configuration errors

#### 6. Ingress Not Getting External IP
**Problem**: Ingress shows no external IP
**Solution**: Check ingress class and annotations
```yaml
annotations:
  kubernetes.io/ingress.class: "gce"
  kubernetes.io/ingress.global-static-ip-name: "mfe-static-ip"
```

### Debugging Commands

#### Check Deployment Status
```bash
kubectl get deployments -o wide
kubectl rollout status deployment/mfe-host
kubectl rollout status deployment/mfe-console
```

#### Check Pod Health
```bash
kubectl get pods -o wide
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

#### Check Services and Ingress
```bash
kubectl get services
kubectl get ingress
kubectl describe ingress mfe-ingress
```

#### Test Endpoints
```bash
# Get external IP
EXTERNAL_IP=$(kubectl get ingress mfe-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test endpoints
curl -I http://$EXTERNAL_IP/
curl -I http://$EXTERNAL_IP/console/
```

#### Check Resource Usage
```bash
kubectl top nodes
kubectl top pods
```

### Performance Optimization

#### 1. Resource Tuning
Adjust resource requests/limits based on actual usage:
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

#### 2. Replica Scaling
Scale replicas based on traffic:
```bash
kubectl scale deployment mfe-host --replicas=3
kubectl scale deployment mfe-console --replicas=3
```

#### 3. Nginx Optimization
Add compression and caching:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Security Considerations

#### 1. Image Security
- Use official base images
- Scan images for vulnerabilities
- Use multi-stage builds to reduce attack surface

#### 2. Network Security
- Configure network policies
- Use TLS certificates
- Implement proper CORS policies

#### 3. Access Control
- Use RBAC for Kubernetes access
- Implement proper service account permissions
- Use secrets for sensitive data

### Monitoring and Alerting

#### 1. Health Checks
Both deployments include:
- Liveness probes (restart unhealthy pods)
- Readiness probes (route traffic only to ready pods)

#### 2. Metrics Collection
- Enable metrics server
- Set up monitoring dashboard
- Configure alerting rules

#### 3. Logging
- Centralize log collection
- Set up log analysis
- Configure log retention

## Best Practices

### 1. Development Workflow
1. Make changes in feature branches
2. Test locally using `deploy.sh --verify-only`
3. Create pull request for review
4. Automated CI/CD runs on merge to main

### 2. Deployment Strategy
- Use rolling updates for zero-downtime
- Test in staging before production
- Keep rollback procedures ready
- Monitor deployment health

### 3. Configuration Management
- Use environment-specific configurations
- Store secrets securely
- Version control all configurations
- Document all changes

### 4. Troubleshooting Process
1. Check GitHub Actions logs
2. Verify Kubernetes resource status
3. Test endpoints manually
4. Check application logs
5. Verify network connectivity

## Quick Start

### 1. Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd mfe-workspace

# Make deploy script executable
chmod +x deploy.sh

# Deploy everything
./deploy.sh
```

### 2. Verify Deployment
```bash
# Check status
./deploy.sh --verify-only

# Get external IP
kubectl get ingress mfe-ingress

# Test endpoints
curl -I http://<external-ip>/
curl -I http://<external-ip>/console/
```

### 3. Monitor Health
- GitHub Actions monitoring runs every 5 minutes
- Check workflow results in GitHub
- Set up additional monitoring as needed

## Support

For issues or questions:
1. Check this troubleshooting guide
2. Review GitHub Actions logs
3. Check Kubernetes events and logs
4. Verify network connectivity
5. Test locally using deploy.sh

Remember: Always test changes in a non-production environment first!
