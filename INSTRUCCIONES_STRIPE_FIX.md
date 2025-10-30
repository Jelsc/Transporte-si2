# 🔧 SOLUCIÓN RÁPIDA: Error 400 Bad Request en Pagos con Stripe

## 🎯 Problema

El error `POST http://20.81.153.66:8000/api/pagos/pagos/crear_pago/ 400 (Bad Request)` ocurre porque **Stripe NO está configurado en el servidor de Azure**. Las claves de API están vacías en el archivo `.env`.

## ✅ Cambios Realizados en el Código

### Backend (`backend/pagos/views.py`)
- ✅ Validación de credenciales de Stripe antes de crear Payment Intents
- ✅ Manejo específico de errores con mensajes claros
- ✅ Logging detallado para debugging
- ✅ Try-catch para errores de autenticación y Stripe

### Frontend (`frontend/src/components/CheckoutModal.tsx`)
- ✅ Mensaje de error más claro cuando Stripe no está configurado

## 🚀 SOLUCIÓN EN 3 PASOS (En el servidor de Azure)

### **PASO 1: Conectarse y editar el .env**

```bash
# Conectarse al servidor
ssh usuario@20.81.153.66

# Navegar al proyecto (ajusta la ruta según tu instalación)
cd /ruta/al/proyecto/backend

# Editar el archivo .env
nano .env
```

### **PASO 2: Agregar las credenciales de Stripe**

Busca y actualiza estas líneas (o agrégalas si no existen):

```bash
# Configuración de Stripe
STRIPE_SECRET_KEY="sk_test_tu_clave_secreta_aqui"
STRIPE_PUBLISHABLE_KEY="pk_test_tu_clave_publica_aqui"
```

**⚠️ IMPORTANTE:**
- Reemplaza `tu_clave_secreta_aqui` y `tu_clave_publica_aqui` con tus claves reales de Stripe
- Para pruebas usa claves de TEST: `sk_test_...` y `pk_test_...`
- Para producción usa claves LIVE: `sk_live_...` y `pk_live_...`
- **NO QUITES las comillas**

**Guardar:**
- `Ctrl + O` → Enter → `Ctrl + X`

### **PASO 3: Reiniciar el servicio**

```bash
# Si usas Docker Compose
docker-compose restart backend

# O si el backend corre directamente
sudo systemctl restart tu-servicio-django
# o
pkill gunicorn && gunicorn core.wsgi:application --bind 0.0.0.0:8000
```

### 7. Verificar que las variables se cargaron correctamente

```bash
# Desde el contenedor Docker
docker exec -it nombre_contenedor_backend python manage.py shell

# O directamente en el servidor
python manage.py shell
```

Luego en el shell de Django:

```python
from django.conf import settings
print(f"STRIPE_SECRET_KEY configurado: {bool(settings.STRIPE_SECRET_KEY)}")
print(f"Primeros 7 caracteres: {settings.STRIPE_SECRET_KEY[:7] if settings.STRIPE_SECRET_KEY else 'No configurado'}")
exit()
```

Deberías ver:
```
STRIPE_SECRET_KEY configurado: True
Primeros 7 caracteres: sk_test
```

### 8. Probar el pago desde el frontend

Ahora intenta realizar un pago nuevamente. Deberías ver en los logs del backend:

```
🔄 Creando pago para reserva XXXXX - $XX.XX
✅ Payment Intent creado: pi_XXXXXXXXXXXXXXXXX
```

## 🔍 Troubleshooting

### Si sigue sin funcionar:

1. **Verifica los logs del backend:**
```bash
docker logs nombre_contenedor_backend --tail 100 -f
```

2. **Busca mensajes de error específicos:**
   - `❌ ERROR: STRIPE_SECRET_KEY no está configurada` → El .env no se cargó o está vacío
   - `❌ ERROR de autenticación Stripe` → La clave es inválida
   - `✅ Payment Intent creado` → Todo funciona correctamente

3. **Verifica que el archivo .env existe y tiene permisos:**
```bash
ls -la .env
cat .env | grep STRIPE
```

4. **Si usas Docker, verifica que el .env se montó correctamente:**
```bash
docker exec nombre_contenedor_backend env | grep STRIPE
```

## 📌 Notas Importantes

- **Las credenciales de Stripe son sensibles**: No las compartas ni las subas a Git
- **Usa claves de TEST para desarrollo**: Las claves de test empiezan con `sk_test_` y `pk_test_`
- **El frontend también necesita la clave pública**: Asegúrate de configurar `STRIPE_PUBLISHABLE_KEY` en el .env del frontend si es necesario

## ✅ Verificación Final

Después de aplicar los cambios, deberías ver en la consola del navegador:

```
💰 Procesando pago para reserva: 2
📤 Método de pago: stripe
💳 Procesando con Stripe...
✅ Pago creado para Stripe: { pago_id: X, client_secret: "pi_XXXX_secret_XXXX", ... }
```

Y en el backend:

```
🔄 Creando pago para reserva XXXXX - $XX.XX
✅ Payment Intent creado: pi_XXXXXXXXXXXXXXXXX
```

## 🆘 Soporte Adicional

Si después de seguir estos pasos el problema persiste:

1. Verifica que tienes una cuenta de Stripe activa
2. Asegúrate de que las claves API están activas en el dashboard de Stripe
3. Revisa los logs completos del backend para errores adicionales
4. Verifica que el paquete `stripe` está instalado: `pip list | grep stripe`
