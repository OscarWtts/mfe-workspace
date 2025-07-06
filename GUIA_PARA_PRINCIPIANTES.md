# 🚀 GUÍA PARA PRINCIPIANTES: Entendiendo el Proyecto MFE

## 📖 ¿Qué es este proyecto?

Este proyecto es una **arquitectura de micro-frontends (MFE)** que consiste en:
- **Host App**: La aplicación principal (como una página de inicio)
- **Console App**: Una aplicación separada (como un panel de administración)
- **Ambas apps**: Se despliegan juntas pero funcionan independientemente

---

## 🏗️ ESTRUCTURA DEL PROYECTO (Lo Básico)

```
mfe-workspace/
├── mfe-host/          # 🏠 Aplicación principal
├── mfe-console/       # 🖥️ Aplicación de consola
├── k8s/              # 🐳 Configuración de Kubernetes
├── .github/workflows/ # 🔄 Automatización (GitHub Actions)
├── scripts/          # 🛠️ Scripts de ayuda
└── docs/             # 📚 Documentación
```

---

## 📁 EXPLICACIÓN DE CADA CARPETA

### 🏠 `mfe-host/` - Tu Aplicación Principal
**¿Qué es?** Es como la página principal de tu sitio web.
**¿Qué contiene?**
- `src/` - El código de tu aplicación React
- `package.json` - Lista de dependencias (librerías que usa)
- `dockerfile` - Instrucciones para crear un contenedor Docker
- `nginx.conf` - Configuración del servidor web

### 🖥️ `mfe-console/` - Tu Aplicación de Consola
**¿Qué es?** Es como un panel de administración separado.
**¿Qué contiene?** Lo mismo que mfe-host, pero para la consola.

### 🐳 `k8s/` - Configuración de Kubernetes
**¿Qué es?** Son las "recetas" que le dicen a Kubernetes cómo desplegar tus aplicaciones.
**Archivos importantes:**
- `mfe-host-deployment.yaml` - Dice cómo crear contenedores de la app principal
- `mfe-console-deployment.yaml` - Dice cómo crear contenedores de la consola
- `mfe-host-service.yaml` - Permite que otras apps se conecten a la app principal
- `mfe-console-service.yaml` - Permite que otras apps se conecten a la consola
- `ingress.yaml` - Es como el "recepcionista" que dirige el tráfico web

---

## 🔄 WORKFLOWS - El Cerebro de la Automatización

### 📄 `.github/workflows/ci-cd.yml` - EL WORKFLOW PRINCIPAL

**¿Cuándo se ejecuta?** 
- SOLO cuando creas un "tag" que empiece con "v" (ejemplo: v1.0.0, v2.1.0)
- NO se ejecuta en cada push normal

**¿Qué hace paso a paso?**

1. **DETECCIÓN DE CAMBIOS** 📊
   ```yaml
   # Revisa qué archivos cambiaron
   # Si cambió mfe-host/ → necesita rebuild
   # Si cambió mfe-console/ → necesita rebuild
   # Si cambió k8s/ → necesita redeploy
   ```

2. **TESTING** 🧪
   ```yaml
   # Para cada app que cambió:
   # - Instala dependencias (npm ci)
   # - Ejecuta linting (revisa errores de código)
   # - Ejecuta tests (pruebas automáticas)
   # - Hace build (compila la aplicación)
   ```

3. **BUILD Y PUSH** 🏗️
   ```yaml
   # Solo si hay un tag:
   # - Construye imagen Docker
   # - La sube al registro de contenedores
   # - Usa el tag como versión (v1.0.0)
   ```

4. **DEPLOYMENT** 🚀
   ```yaml
   # Solo si hay un tag:
   # - Se conecta a Kubernetes
   # - Aplica configuraciones (kubectl apply -f k8s/)
   # - Actualiza las imágenes a la nueva versión
   # - Espera que todo esté funcionando
   # - Hace pruebas de salud
   ```

### 📄 `.github/workflows/development.yml` - PARA DESARROLLO

**¿Cuándo se ejecuta?**
- En cada push a `main` o `develop` (solo si hay cambios en código relevante)
- En cada Pull Request

**¿Qué hace?**
- Solo testing y build
- NO hace deployment
- Es para asegurar que el código funciona
- Se ejecuta solo si hay cambios en mfe-host/, mfe-console/, o dependencias

---

## 🎯 FLUJOS DE TRABAJO - ¿Qué pasa cuando...?

### 🔄 ESCENARIO 1: Haces un commit normal
```
1. Haces cambios en tu código
2. Haces commit y push a main
3. 🔄 Se ejecuta "development.yml"
4. ✅ Hace testing y build
5. ❌ NO hace deployment
6. 📧 Te notifica si hay errores
```

### 🏷️ ESCENARIO 2: Quieres hacer un release (deployment)
```
1. Tu código está listo y probado
2. 🏷️ Creas un tag: v1.0.0
3. 🔄 Se ejecuta "ci-cd.yml"
4. ✅ Hace testing completo
5. 🏗️ Construye imágenes Docker
6. 📦 Sube imágenes al registro
7. 🚀 Hace deployment a Kubernetes
8. 🌐 Tu app está live en internet
```

### 🆘 ESCENARIO 3: Algo sale mal
```
1. 🔄 Puedes usar "rollback.yml" (manual)
2. 🏥 "monitoring.yml" se puede ejecutar manualmente cuando lo necesites
3. 🛠️ Scripts de diagnóstico disponibles
```

---

## 📋 ARCHIVOS IMPORTANTES - ¿Para qué sirve cada uno?

### 🤖 AUTOMATIZACIÓN
| Archivo | ¿Para qué sirve? | ¿Cuándo se usa? |
|---------|------------------|-----------------|
| `ci-cd.yml` | Deployment automático | Solo con tags |
| `development.yml` | Testing en desarrollo | Solo cambios relevantes |
| `monitoring.yml` | Revisar salud | Manual (cuando lo necesites) |
| `deploy-staging.yml` | Deployment manual | Cuando quieras |
| `rollback.yml` | Volver versión anterior | En emergencias |

### 🛠️ SCRIPTS DE AYUDA
| Archivo | ¿Para qué sirve? | ¿Cómo usar? |
|---------|------------------|-------------|
| `health-check.js` | Revisar si todo funciona | `npm run health-check` |
| `test-endpoints.js` | Probar URLs | `npm run test-endpoints` |
| `deploy.sh` | Deployment manual | `./deploy.sh` |

### 📚 DOCUMENTACIÓN
| Archivo | ¿Qué explica? |
|---------|---------------|
| `DEPLOYMENT_GUIDE.md` | Cómo hacer deployments |
| `CONFIG_SUMMARY.md` | Configuración completa |
| `VERSION_DEPLOYMENT_GUIDE.md` | Cómo crear versiones |
| `DEPLOYMENT_SUCCESS.md` | Resumen del último deployment |

---

## 🎮 COMANDOS BÁSICOS - Tu Caja de Herramientas

### 🏠 DESARROLLO LOCAL
```bash
# Ejecutar la app principal
npm run dev:host

# Ejecutar la consola
npm run dev:console

# Ejecutar ambas
npm run dev:all
```

### 🧪 TESTING
```bash
# Revisar salud del deployment
npm run health-check

# Probar si las URLs funcionan
npm run test-endpoints

# Monitoreo manual completo
npm run monitor

# Ejecutar tests de código
npm test
```

### 🔧 OPERACIONES
```bash
# Ver estado de Kubernetes
kubectl get pods
kubectl get services
kubectl get deployments

# Ver logs de aplicaciones
kubectl logs -f deployment/mfe-host
kubectl logs -f deployment/mfe-console
```

---

## 🚦 FLUJO TÍPICO DE TRABAJO

### 📝 DESARROLLO DIARIO
```
1. Haces cambios en mfe-host/ o mfe-console/
2. Haces commit y push
3. GitHub Actions ejecuta tests automáticamente
4. Si pasan los tests, tu código está listo
5. Continúas desarrollando...
```

### 🚀 CUANDO QUIERES HACER RELEASE
```
1. Tu código está terminado y probado
2. Vas a GitHub Desktop o terminal
3. Creas un tag: v1.2.0 (por ejemplo)
4. GitHub Actions automáticamente:
   - Construye todo
   - Hace deployment
   - Prueba que funcione
5. Tu app está actualizada en internet
6. Recibes notificación de éxito o error
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS COMÚN

### ❓ "No sé si mi código está funcionando"
```bash
npm run health-check
```

### ❓ "No sé si las URLs están funcionando"
```bash
npm run test-endpoints
```

### ❓ "Algo salió mal en el deployment"
```bash
kubectl get pods
kubectl logs -f deployment/mfe-host
kubectl logs -f deployment/mfe-console
```

### ❓ "Quiero volver a la versión anterior"
- Ve a GitHub Actions
- Ejecuta manualmente "rollback.yml"

### ❓ "Estoy recibiendo muchos emails de GitHub"
- Los workflows están optimizados para reducir notificaciones
- Ve a GitHub Settings → Notifications para ajustar
- Usa comandos manuales: `npm run health-check`

### ❓ "¿Me va a costar dinero usar GitHub Actions?"
- GitHub da 2,000 minutos gratis por mes
- Los workflows están optimizados para usar pocos minutos
- Solo se ejecutan cuando es realmente necesario

---

## 🎯 RESUMEN SÚPER SIMPLE

1. **Desarrollas** en mfe-host/ o mfe-console/
2. **Haces push** - Solo se ejecutan tests
3. **Creas tag** - Se hace deployment automático
4. **Tu app** está en internet
5. **Monitoreo** manual disponible cuando lo necesites

**¡Eso es todo!** El sistema hace todo el trabajo pesado automáticamente. Tú solo te preocupas por escribir código y crear tags cuando quieras hacer release.

---

## 💰 COSTOS Y OPTIMIZACIONES - ¡Importante!

### 🚨 **LO QUE DEBES SABER SOBRE COSTOS**

**GitHub Actions tiene límites gratuitos:**
- 2,000 minutos por mes (gratis)
- Si los superas, se cobra extra

**¿Cómo evitar costos innecesarios?**

1. **Los workflows están optimizados** para ejecutarse solo cuando es necesario
2. **development.yml** solo se ejecuta si hay cambios en código relevante
3. **monitoring.yml** está desactivado automáticamente (se ejecuta solo manual)
4. **ci-cd.yml** solo se ejecuta con tags (releases)

### 📧 **NOTIFICACIONES POR EMAIL**

**¿Recibes muchos emails?**
- Los workflows están configurados para reducir notificaciones
- Solo recibes emails en casos importantes (fallos críticos)
- Puedes desactivar completamente las notificaciones en GitHub Settings

### 🛠️ **COMANDOS PARA MONITOREO MANUAL**

En lugar de monitoreo automático, usa estos comandos cuando necesites:

```bash
# Revisar salud general (recomendado)
npm run health-check

# Probar endpoints específicos
npm run test-endpoints

# Monitoreo manual completo
npm run monitor
```

---

*Esta guía está hecha para que cualquier persona pueda entender el proyecto, sin importar su nivel de experiencia. ¡Guárdala y consúltala cuando necesites recordar algo!*
