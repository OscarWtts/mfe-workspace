# 📊 DIAGRAMA VISUAL DEL WORKFLOW

## 🔄 FLUJO COMPLETO - Desde Código hasta Producción

```
👩‍💻 DESARROLLADOR                    🤖 GITHUB ACTIONS                  ☁️ GOOGLE CLOUD
     │                                    │                                │
     │                                    │                                │
┌────▼─────┐                       ┌─────▼─────┐                   ┌─────▼─────┐
│  Código  │                       │ Workflows │                   │    GKE    │
│   Local  │                       │   CI/CD   │                   │ Kubernetes│
└────┬─────┘                       └─────┬─────┘                   └─────┬─────┘
     │                                    │                                │
     │                                    │                                │
     ▼                                    ▼                                ▼
```

## 🎯 DETALLE DE CADA PASO

### 1️⃣ PASO 1: DESARROLLO LOCAL
```
📝 Escribes código en:
   ├── mfe-host/src/     (App principal)
   └── mfe-console/src/  (App consola)

🧪 Pruebas localmente:
   ├── npm run dev:host
   └── npm run dev:console

✅ Cuando está listo:
   ├── git add .
   ├── git commit -m "mensaje"
   └── git push origin main
```

### 2️⃣ PASO 2: PUSH NORMAL (Sin Tag)
```
📤 Push a main/develop
   │
   ▼
🔄 GitHub Actions ejecuta:
   │
   ├── development.yml
   │   ├── ✅ npm ci (instala dependencias)
   │   ├── ✅ npm run lint (revisa código)
   │   ├── ✅ npm test (ejecuta tests)
   │   └── ✅ npm run build (compila)
   │
   ├── ✅ ÉXITO: Código válido
   └── ❌ ERROR: Hay problemas en el código
```

### 3️⃣ PASO 3: RELEASE (Con Tag)
```
🏷️ Creas tag: v1.0.0
   │
   ▼
🔄 GitHub Actions ejecuta:
   │
   ├── ci-cd.yml (El workflow principal)
   │   │
   │   ├── 🔍 CHANGES (detecta cambios)
   │   │   ├── ¿Cambió mfe-host? → Sí/No
   │   │   ├── ¿Cambió mfe-console? → Sí/No
   │   │   └── ¿Cambió k8s? → Sí/No
   │   │
   │   ├── 🧪 TEST (solo si hay cambios)
   │   │   ├── Instala dependencias
   │   │   ├── Ejecuta linting
   │   │   ├── Ejecuta tests
   │   │   └── Hace build
   │   │
   │   ├── 🏗️ BUILD & PUSH (solo con tag)
   │   │   ├── Construye imagen Docker
   │   │   ├── Tagea con versión (v1.0.0)
   │   │   └── Sube a Google Container Registry
   │   │
   │   └── 🚀 DEPLOY (solo con tag)
   │       ├── Se conecta a Kubernetes
   │       ├── Aplica configuraciones (k8s/)
   │       ├── Actualiza imágenes
   │       ├── Espera que esté listo
   │       └── Hace health checks
   │
   ├── ✅ ÉXITO: App actualizada en internet
   └── ❌ ERROR: Revisar logs
```

## 🗂️ FLUJO DE ARCHIVOS

### 📁 CUANDO HACES CAMBIOS EN CÓDIGO
```
mfe-host/src/App.tsx  ──┐
                        ├─► git push ─► development.yml ─► ✅ Tests
mfe-console/src/App.tsx ──┘
```

### 📁 CUANDO HACES CAMBIOS EN KUBERNETES
```
k8s/ingress.yaml        ──┐
k8s/deployments.yaml    ──┼─► git push + tag ─► ci-cd.yml ─► 🚀 Deploy
k8s/services.yaml       ──┘
```

### 📁 CUANDO HACES CAMBIOS EN WORKFLOWS
```
.github/workflows/ci-cd.yml ──► git push ─► ⚙️ Workflow actualizado
```

## 🎮 COMANDOS Y SUS EFECTOS

### 🔧 COMANDOS LOCALES
```
npm run dev:host       ──► 🌐 http://localhost:5173 (desarrollo)
npm run dev:console    ──► 🌐 http://localhost:5174 (desarrollo)
npm run build:all      ──► 📦 Archivos compilados en dist/
npm run health-check   ──► 🏥 Revisa producción
npm run test-endpoints ──► 🧪 Prueba URLs de producción
```

### 🏷️ COMANDOS DE RELEASE
```
git tag v1.0.0         ──► 🏷️ Crea tag localmente
git push origin v1.0.0 ──► 🚀 Dispara deployment automático
```

### 🐳 COMANDOS DE KUBERNETES
```
kubectl get pods       ──► 📊 Lista contenedores
kubectl get services   ──► 🌐 Lista servicios
kubectl get ingress    ──► 🌍 Lista accesos externos
kubectl logs -f pod/xxx ──► 📋 Ver logs en tiempo real
```

## 🚨 ESTADOS Y NOTIFICACIONES

### ✅ ESTADO NORMAL
```
🟢 GitHub Actions: Todos los workflows pasan
🟢 Kubernetes: Todos los pods Running
🟢 Aplicaciones: Responden HTTP 200
🟢 Load Balancer: Distribuye tráfico
```

### ⚠️ ESTADO DE ADVERTENCIA
```
🟡 Tests fallan: Código tiene errores
🟡 Build falla: Dependencias rotas
🟡 Deploy lento: Kubernetes tardando
🟡 Pods restarting: Aplicación crasheando
```

### 🔴 ESTADO DE ERROR
```
🔴 Workflow falla: Revisar logs en GitHub
🔴 Pods crasheando: Revisar logs con kubectl
🔴 Aplicación no responde: Revisar health checks
🔴 Load Balancer down: Revisar configuración
```

## 📱 URLS IMPORTANTES

### 🌐 PRODUCCIÓN
```
Host App:    http://34.54.233.86/
Console App: http://34.54.233.86/console/
```

### 🔧 DESARROLLO
```
Host App:    http://localhost:5173
Console App: http://localhost:5174
```

### 📊 MONITOREO
```
GitHub Actions: https://github.com/tu-usuario/mfe-workspace/actions
Google Cloud:   https://console.cloud.google.com/kubernetes/
```

---

## 🤔 PREGUNTAS FRECUENTES

### ❓ "¿Cuándo debo crear un tag?"
**R:** Cuando tu código esté terminado y quieras que se actualice en internet.

### ❓ "¿Qué pasa si no creo tag?"
**R:** Solo se ejecutan tests. No se hace deployment.

### ❓ "¿Puedo hacer deployment manual?"
**R:** Sí, usa `deploy-staging.yml` desde GitHub Actions.

### ❓ "¿Cómo revierto si algo sale mal?"
**R:** Ejecuta `rollback.yml` desde GitHub Actions.

### ❓ "¿Cómo sé si todo funciona?"
**R:** Ejecuta `npm run health-check` desde tu terminal.

---

*Este diagrama te ayuda a visualizar exactamente qué pasa en cada paso del proceso. ¡Imprímelo y tenlo a mano!*
