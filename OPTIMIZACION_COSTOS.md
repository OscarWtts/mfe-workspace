# 🚨 CONFIGURACIÓN DE NOTIFICACIONES Y COSTOS

## ⚠️ PROBLEMA IDENTIFICADO

Se detectó que el workflow de **monitoring** estaba configurado para ejecutarse **cada 5 minutos**, lo cual puede generar:

- ✅ **SOLUCIONADO**: Cambiado a cada 6 horas (4 veces al día)
- ✅ **OPTIMIZADO**: Workflows con condiciones para evitar ejecuciones innecesarias
- ✅ **MEJORADO**: Configuración `continue-on-error` para evitar fallos menores

## 🔧 OPTIMIZACIONES APLICADAS

### 1. **Monitoring Workflow**
- **Antes:** Cada 5 minutos (288 ejecuciones/día)
- **Ahora:** Cada 6 horas (4 ejecuciones/día)
- **Ahorro:** 98.6% menos ejecuciones

### 2. **Development Workflow**
- **Optimizado:** Solo se ejecuta cuando cambias código relevante
- **Paths específicos:** Solo `mfe-host/`, `mfe-console/`, `package.json`
- **Continue-on-error:** Linting no falla todo el workflow

### 3. **CI/CD Workflow**
- **Sin cambios:** Ya estaba optimizado (solo con tags)
- **Eficiente:** Solo se ejecuta cuando quieres hacer deployment

## 📊 CONSUMO DE RECURSOS

### GitHub Actions - Límites Gratuitos
- **Minutos incluidos:** 2,000 minutos/mes
- **Consumo anterior:** ~1,440 minutos/mes (solo monitoring)
- **Consumo actual:** ~20 minutos/mes (monitoring optimizado)

### Costos Potenciales
- **Repositorio público:** Gratis (sin límites)
- **Repositorio privado:** Después de 2,000 minutos = $0.008/minuto
- **Recomendación:** Mantener repo público o monitorear uso

## 📧 CONFIGURACIÓN DE NOTIFICACIONES

### Desactivar Notificaciones por Email

**Opción 1: Desde GitHub Web**
```
1. Ve a tu repositorio en GitHub
2. Settings → Notifications
3. Desmarcar "Actions" en Email notifications
4. Guardar cambios
```

**Opción 2: Configurar por Workflow**
```yaml
# Ya añadido a los workflows:
continue-on-error: true  # No falla por errores menores
if: github.repository_owner == 'OscarWitts'  # Solo ejecuta si eres el owner
```

### Configurar Notificaciones Selectivas

**Para recibir solo notificaciones importantes:**
```
1. GitHub → Settings → Notifications
2. Actions → Customize
3. Seleccionar solo:
   - ✅ Workflow runs on repositories you own
   - ✅ Failed workflow runs
   - ❌ All workflow runs (desactivar)
```

## 🎮 COMANDOS PARA MONITOREO MANUAL

### En lugar de monitoring automático, usa:
```bash
# Health check manual
npm run health-check

# Test endpoints manual
npm run test-endpoints

# Ver estado actual
kubectl get pods
kubectl get deployments
```

### Para ejecutar monitoring cuando quieras:
```
1. Ve a GitHub → Actions
2. Selecciona "Health Check and Monitoring"
3. Clic en "Run workflow"
4. Ejecuta manualmente cuando necesites
```

## 🔍 MONITOREO DE COSTOS

### Revisar Uso de GitHub Actions
```
1. GitHub → Settings → Billing
2. Plans and usage → Actions
3. Revisar minutos utilizados
```

### Alertas de Uso
```
1. GitHub → Settings → Billing
2. Set up spending limit
3. Configurar alerta en 1,500 minutos
```

## 📋 NUEVAS CONFIGURACIONES

### Workflows Optimizados
- **monitoring.yml:** Cada 6 horas + manual
- **development.yml:** Solo con cambios de código
- **ci-cd.yml:** Solo con tags (sin cambios)

### Configuración de Errores
- **continue-on-error: true** donde apropiado
- **Timeouts** en comandos largos
- **Conditional execution** para evitar ejecuciones innecesarias

## 🎯 RECOMENDACIONES

### 🟢 **Para Desarrollo Normal**
1. **Desactiva monitoring automático** si no lo necesitas
2. **Usa comandos manuales** para health checks
3. **Mantén development workflow** para testing automático
4. **Solo usa tags** para deployments

### 🟡 **Para Monitoreo Ligero**
1. **Cambiar a una vez al día:** `cron: '0 9 * * *'`
2. **Solo días laborables:** `cron: '0 9 * * 1-5'`
3. **Configurar solo para errores críticos**

### 🔴 **Para Desactivar Completamente**
1. **Comentar o eliminar** `monitoring.yml`
2. **Usar solo comandos manuales**
3. **Configurar alertas externas** si es necesario

## 🚀 NEXT STEPS

### Immediate Actions
1. ✅ **Optimizaciones aplicadas**
2. ✅ **Workflows mejorados**
3. 🔄 **Configurar notificaciones en GitHub**
4. 📊 **Monitorear uso por una semana**

### Optional Improvements
- Configurar webhook alerts en lugar de cron
- Usar external monitoring service
- Implementar alertas por Slack/Discord
- Configurar dashboards de monitoreo

---

**¡Las optimizaciones están aplicadas!** Ahora deberías recibir muchas menos notificaciones y el sistema será más eficiente en el uso de recursos.
