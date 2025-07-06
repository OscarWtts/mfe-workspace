# 📋 CHEAT SHEET - Comandos Esenciales

## 🚀 COMANDOS PARA EL DÍA A DÍA

### 🏠 DESARROLLO LOCAL
```bash
# Iniciar desarrollo
npm run dev:host              # App principal (puerto 5173)
npm run dev:console           # App consola (puerto 5174)
npm run dev:all               # Ambas apps

# Compilar para producción
npm run build:host            # Solo host
npm run build:console         # Solo consola
npm run build:all             # Ambas apps
```

### 🧪 TESTING Y VALIDACIÓN
```bash
# Revisar salud del deployment
npm run health-check

# Probar endpoints de producción
npm run test-endpoints

# Ejecutar tests locales
npm test

# Revisar código (linting)
npm run lint
```

---

## 🏷️ HACER UN RELEASE (DEPLOYMENT)

### 📝 PASO A PASO
```bash
# 1. Asegurate que tu código esté listo
git status
git add .
git commit -m "Preparando release v1.1.0"
git push origin main

# 2. Crear y pushear tag
git tag v1.1.0
git push origin v1.1.0

# 3. Ver el progreso
# Ve a GitHub Actions en tu navegador
# O usa: gh workflow list (si tienes GitHub CLI)
```

### 🎯 FORMATO DE TAGS
```bash
# Releases principales
git tag v1.0.0    # Primera versión
git tag v2.0.0    # Cambios grandes

# Actualizaciones menores
git tag v1.1.0    # Nuevas funcionalidades
git tag v1.2.0    # Más funcionalidades

# Fixes
git tag v1.1.1    # Corrección de bugs
git tag v1.1.2    # Más fixes
```

---

## 🐳 KUBERNETES - COMANDOS ÚTILES

### 📊 VER ESTADO
```bash
# Estado general
kubectl get all

# Deployments
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress

# Detalles específicos
kubectl describe deployment mfe-host
kubectl describe deployment mfe-console
```

### 📋 VER LOGS
```bash
# Logs en tiempo real
kubectl logs -f deployment/mfe-host
kubectl logs -f deployment/mfe-console

# Logs de todos los pods
kubectl logs -l app=mfe-host
kubectl logs -l app=mfe-console

# Logs específicos
kubectl logs pod/mfe-host-xxx-xxx
```

### 🔧 TROUBLESHOOTING
```bash
# Revisar eventos
kubectl get events --sort-by=.metadata.creationTimestamp

# Revisar estado de pods
kubectl get pods -o wide

# Ejecutar comando en pod
kubectl exec -it deployment/mfe-host -- /bin/sh

# Probar conectividad interna
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -- curl mfe-host:80
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### ❗ DEPLOYMENT FALLA
```bash
# 1. Revisar logs del workflow
# Ve a GitHub Actions → Tu workflow → Logs

# 2. Revisar estado de Kubernetes
kubectl get pods
kubectl describe deployment mfe-host
kubectl describe deployment mfe-console

# 3. Revisar logs de aplicaciones
kubectl logs -f deployment/mfe-host
kubectl logs -f deployment/mfe-console
```

### ❗ APLICACIÓN NO RESPONDE
```bash
# 1. Revisar health check
npm run health-check

# 2. Revisar endpoints
npm run test-endpoints

# 3. Revisar logs
kubectl logs -f deployment/mfe-host
kubectl logs -f deployment/mfe-console

# 4. Revisar ingress
kubectl describe ingress mfe-ingress
```

### ❗ ROLLBACK DE EMERGENCIA
```bash
# Opción 1: Desde GitHub Actions
# Ve a GitHub Actions → rollback.yml → Run workflow

# Opción 2: Desde terminal
kubectl rollout undo deployment/mfe-host
kubectl rollout undo deployment/mfe-console

# Opción 3: Volver a versión específica
kubectl rollout undo deployment/mfe-host --to-revision=2
```

---

## 🌐 URLS IMPORTANTES

### 🎯 PRODUCCIÓN
```
Host App:     http://34.54.233.86/
Console App:  http://34.54.233.86/console/
```

### 🔧 DESARROLLO
```
Host App:     http://localhost:5173
Console App:  http://localhost:5174
```

### 📊 MONITOREO
```
GitHub Actions: https://github.com/[tu-usuario]/mfe-workspace/actions
Google Cloud:   https://console.cloud.google.com/kubernetes/
```

---

## 📱 COMANDOS ESPECÍFICOS DE ESTE PROYECTO

### 🏗️ DOCKER (Si necesitas builds locales)
```bash
# Build local
docker build -t mfe-host ./mfe-host
docker build -t mfe-console ./mfe-console

# Run local
docker run -p 8080:80 mfe-host
docker run -p 8081:80 mfe-console
```

### ☁️ GOOGLE CLOUD
```bash
# Conectar a cluster
gcloud container clusters get-credentials mfe-cluster --zone us-central1 --project mfe-project-464600

# Ver imágenes
gcloud container images list --repository=us-central1-docker.pkg.dev/mfe-project-464600/mfe-registry

# Ver load balancer
gcloud compute forwarding-rules list --filter="name~mfe"
```

---

## 🎮 FLUJO DE TRABAJO TÍPICO

### 📝 DESARROLLO DIARIO
```bash
# 1. Actualizar código
git pull origin main

# 2. Hacer cambios
# Editar archivos en mfe-host/ o mfe-console/

# 3. Probar localmente
npm run dev:host

# 4. Subir cambios
git add .
git commit -m "Descripción de cambios"
git push origin main

# 5. Verificar que tests pasen
# Ve a GitHub Actions
```

### 🚀 HACER RELEASE
```bash
# 1. Código listo y testeado
git status

# 2. Crear tag
git tag v1.2.0

# 3. Pushear tag
git push origin v1.2.0

# 4. Monitorear deployment
# Ve a GitHub Actions

# 5. Verificar que funcione
npm run health-check
```

---

## 🔍 ARCHIVOS IMPORTANTES

### 📁 CONFIGURACIÓN
```
.github/workflows/ci-cd.yml        # Workflow principal
.github/workflows/development.yml  # Testing automático
k8s/ingress.yaml                   # Configuración de acceso web
k8s/mfe-host-deployment.yaml       # Configuración de host
k8s/mfe-console-deployment.yaml    # Configuración de consola
```

### 📁 SCRIPTS
```
scripts/health-check.js      # Revisar salud
scripts/test-endpoints.js    # Probar URLs
deploy.sh                    # Deployment manual
```

### 📁 DOCUMENTACIÓN
```
GUIA_PARA_PRINCIPIANTES.md   # Esta guía
DIAGRAMA_WORKFLOW.md         # Flujo visual
DEPLOYMENT_GUIDE.md          # Guía completa
```

---

## 💡 TIPS IMPORTANTES

### ✅ BUENAS PRÁCTICAS
- Siempre prueba localmente antes de hacer push
- Usa tags semánticos (v1.0.0, v1.1.0, etc.)
- Revisa los logs si algo falla
- Mantén los commits pequeños y descriptivos

### ❌ EVITAR
- No hagas tags sin probar el código
- No ignores los errores de tests
- No hagas cambios directos en producción
- No borres tags que ya están en producción

### 🚨 EN CASO DE EMERGENCIA
1. Ejecuta rollback desde GitHub Actions
2. Revisa logs: `kubectl logs -f deployment/mfe-host`
3. Contacta al equipo si es necesario
4. Documenta lo que pasó

---

*¡Guarda este cheat sheet! Te será útil para el día a día del proyecto.*
