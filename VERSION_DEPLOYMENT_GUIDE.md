# 🚀 Flujo de Despliegue con Tags de Versión

## 📋 Nuevo Flujo de Trabajo

### 🔄 **Desarrollo y Testing**
- **Push a `main` o `develop`** → Ejecuta `development.yml`
- **Pull Requests** → Ejecuta `development.yml`
- **Funciones**: Lint, Test, Build (sin despliegue)

### 🚀 **Despliegue a Producción**
- **Crear tag de versión** → Ejecuta `ci-cd.yml`
- **Funciones**: Build, Push, Deploy completo

## 🏷️ Cómo Crear y Usar Tags de Versión

### 1. **Crear un Tag Local**
```bash
# Formato: v1.0.0, v1.0.1, v2.0.0, etc.
git tag v1.0.0

# Con mensaje descriptivo
git tag -a v1.0.0 -m "Release version 1.0.0 - Initial production release"
```

### 2. **Subir el Tag al Repositorio**
```bash
# Subir tag específico
git push origin v1.0.0

# Subir todos los tags
git push origin --tags
```

### 3. **Automáticamente se Ejecuta el Pipeline**
- ✅ Detecta cambios
- ✅ Ejecuta tests
- ✅ Construye imágenes Docker con el tag de versión
- ✅ Sube imágenes al registry
- ✅ Despliega en Kubernetes
- ✅ Verifica que todo funcione

## 🎯 Ejemplos de Uso

### **Desarrollo Normal**
```bash
# Trabajar en feature
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Crear PR → Solo ejecuta tests
# Merge a main → Solo ejecuta tests
```

### **Release a Producción**
```bash
# Asegurar que main esté listo
git checkout main
git pull origin main

# Crear tag de versión
git tag -a v1.0.0 -m "Release 1.0.0 - Production ready"

# Subir tag → Ejecuta despliegue completo
git push origin v1.0.0
```

## 📊 Versionado Semántico

### **Formato: vMAJOR.MINOR.PATCH**

- **v1.0.0** → Primera versión estable
- **v1.0.1** → Bugfix (parche)
- **v1.1.0** → Nueva funcionalidad menor
- **v2.0.0** → Cambios que rompen compatibilidad

### **Ejemplos de Tags**
```bash
# Primera versión
git tag v1.0.0

# Parche/bugfix
git tag v1.0.1

# Nueva funcionalidad
git tag v1.1.0

# Versión mayor
git tag v2.0.0

# Pre-release
git tag v1.0.0-rc1
git tag v1.0.0-beta1
```

## 🔍 Monitoreo

### **Ver Tags Existentes**
```bash
# Ver todos los tags
git tag

# Ver tags con mensajes
git tag -l -n

# Ver tags remotos
git ls-remote --tags origin
```

### **Ver Despliegues**
- **GitHub Actions** → Workflows → CI/CD Pipeline
- **Kubernetes** → `kubectl get deployments`
- **Monitoreo** → Workflow de monitoring cada 5 minutos

## 🛠️ Comandos Útiles

### **Eliminar Tags (si es necesario)**
```bash
# Eliminar tag local
git tag -d v1.0.0

# Eliminar tag remoto
git push origin --delete v1.0.0
```

### **Verificar Estado**
```bash
# Ver último tag
git describe --tags --abbrev=0

# Ver commits desde último tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

## 🎯 Ventajas del Nuevo Flujo

### ✅ **Beneficios**
- **Control total**: Solo despliega cuando decides
- **Versionado claro**: Cada despliegue tiene una versión
- **Historial**: Fácil rollback a versiones específicas
- **Eficiencia**: No despliega en cada commit
- **Seguridad**: Evita despliegues accidentales

### 📈 **Proceso Típico**
1. **Desarrollar** → Push a feature branch
2. **PR** → Tests automáticos
3. **Merge** → Tests en main
4. **Listo para producción** → Crear tag
5. **Despliegue** → Automático con el tag

## 🔧 Configuración Actual

### **development.yml** (Automático)
- **Trigger**: Push a main/develop, PRs
- **Función**: Tests y validación
- **No despliega**: Solo verifica calidad

### **ci-cd.yml** (Con tags)
- **Trigger**: Solo tags `v*`
- **Función**: Despliegue completo
- **Versión**: Usa el tag como versión de imagen

### **monitoring.yml** (Continuo)
- **Trigger**: Cada 5 minutos
- **Función**: Monitoreo de salud

## 🚀 Primer Despliegue

Para tu primer despliegue:

```bash
# 1. Asegurar que todo esté listo
git checkout main
git pull origin main

# 2. Crear primer tag
git tag -a v1.0.0 -m "🎉 First production release"

# 3. Subir tag y activar despliegue
git push origin v1.0.0
```

¡Entonces el pipeline se ejecutará automáticamente y desplegará tu aplicación! 🎉
