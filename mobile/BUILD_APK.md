# 📱 Construir APK - Transporte SI2 Mobile

## 🚀 Pasos para Generar APK

### 1. Verificar Flutter

```bash
flutter doctor
```

### 2. Instalar dependencias

```bash
cd mobile
flutter pub get
```

### 3. Configurar Backend URL

Edita `lib/utils/ip_detection.dart` línea 6:

```dart
// Para producción Azure:
static const String BACKEND_HOST = "http://57.154.17.34:8000";

// Para desarrollo con emulador Android:
// static const String BACKEND_HOST = "http://10.0.2.2:8000";

// Para desarrollo con dispositivo físico (cambia por tu IP local):
// static const String BACKEND_HOST = "http://192.168.1.100:8000";
```

### 4. Construir APK

**Opción A: APK Debug (para testing rápido)**

```bash
flutter build apk --debug
```

**Ubicación:** `build\app\outputs\flutter-apk\app-debug.apk`

**Opción B: APK Release (para distribución)**

```bash
flutter build apk --release
```

**Ubicación:** `build\app\outputs\flutter-apk\app-release.apk`

**Opción C: APK por ABI (más pequeñas, recomendado para producción)**

```bash
flutter build apk --split-per-abi --release
```

**Ubicaciones:**

- `app-armeabi-v7a-release.apk` (32-bit ARM)
- `app-arm64-v8a-release.apk` (64-bit ARM - mayoría de teléfonos modernos)
- `app-x86_64-release.apk` (emuladores x64)

## 📦 Instalar APK en Dispositivo

### Método 1: Cable USB

```bash
flutter install
```

### Método 2: Transferir archivo

1. Copia el APK a tu teléfono (WhatsApp, Drive, cable USB)
2. Abre el APK en el teléfono
3. Habilita "Instalar desde fuentes desconocidas" si es necesario
4. Instala

## 🔧 Configuraciones

### Stripe

La clave de Stripe está en `lib/utils/stripe_config.dart`:

```dart
Stripe.publishableKey = 'pk_test_51SFOxOB9S1VdGc0Rs6sEecz84SqlUSMGZ7CzOTNf1WLUPMrZfcEdPe3y0zDsfBPsxM0pR1cV4azJCjLspvfzLboL00KY7wBet1';
```

### Firebase

Archivo de configuración: `android/app/google-services.json`

- Ya está configurado para el proyecto
- No subir al repositorio (está en .gitignore)

## 🐛 Solución de Problemas

### Error: "SDK location not found"

```bash
# Windows: Crear mobile\android\local.properties
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\sdk
```

### Error: "Gradle build failed"

```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter build apk --release
```

### Error: "Unable to load asset"

- Verifica que `pubspec.yaml` tenga todas las dependencias
- Ejecuta `flutter pub get`

### APK muy grande

Usa split-per-abi para generar APKs más pequeñas:

```bash
flutter build apk --split-per-abi --release
```

## 📊 Tamaños Típicos

- Debug APK: ~80-100 MB
- Release APK: ~40-50 MB
- Release APK (split arm64): ~20-25 MB

## 🚀 Comandos Rápidos

```bash
# Limpiar y reconstruir
flutter clean && flutter pub get && flutter build apk --release

# Ver dispositivos conectados
flutter devices

# Instalar en dispositivo conectado
flutter install

# Ver logs en tiempo real
flutter logs
```

## 📱 Testing en Dispositivo Real

1. **Habilitar modo desarrollador** en Android:

   - Configuración → Acerca del teléfono
   - Tocar 7 veces en "Número de compilación"

2. **Habilitar depuración USB**:

   - Configuración → Opciones de desarrollador
   - Activar "Depuración USB"

3. **Conectar y verificar**:
   ```bash
   flutter devices
   flutter run --release
   ```

## 🌐 URLs Importantes

- **Backend Producción**: http://57.154.17.34:8000
- **Backend Local (emulador)**: http://10.0.2.2:8000
- **Stripe Dashboard**: https://dashboard.stripe.com

## 📝 Notas

- **Stripe**: Usando claves de TEST (pk*test*...)
- **Para producción**: Cambiar a claves LIVE (pk*live*...) en `stripe_config.dart`
- **Firebase**: Notificaciones push configuradas
- **Backend**: Detección automática de IP en `ip_detection.dart`

¡Listo! 🎉 Tu APK está lista para instalar y probar.
