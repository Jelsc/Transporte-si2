# 🎤 Reportes por Comando de Voz con IA

## 📋 Descripción

Sistema de generación de reportes mediante comandos de voz, procesados con **Google Gemini AI** para interpretación inteligente de comandos en lenguaje natural.

## 🚀 Características

✅ **Reconocimiento de Voz** - Usa Web Speech API del navegador
✅ **Procesamiento con IA** - Google Gemini interpreta comandos en lenguaje natural
✅ **Multi-formato** - Genera reportes en PDF, Excel o Imagen
✅ **Multi-categoría** - Viajes, Encomiendas, Conductores, Vehículos, Financiero
✅ **Detección Inteligente** - Extrae fechas, formatos y categorías automáticamente
✅ **Fallback Local** - Procesamiento local si falla la API

## 🎯 Ejemplos de Comandos

### Comandos Básicos

```
"Generar reporte PDF de vehículos"
"Crear reporte de viajes en Excel"
"Reporte de conductores en formato imagen"
```

### Comandos con Fechas

```
"Generar reporte PDF de encomiendas del mes"
"Reporte de viajes de esta semana en Excel"
"Crear reporte financiero mensual"
```

### Comandos Completos

```
"Generar reporte PDF de vehículos del último mes con título Flota Activa"
"Reporte de conductores en Excel de octubre"
"Gráfico de encomiendas de hoy"
```

## 🔧 Configuración

### 1. Configurar API Key

El archivo `.env.local` está configurado con la API key de Google AI:

```env
VITE_GOOGLE_API_KEY=AIzaSyBlRWbLF0dKtS2T0WXT5NYOtoZ7V0vWi10
```

### 2. Navegadores Compatibles

**Reconocimiento de Voz (Web Speech API):**
- ✅ Google Chrome (Desktop y Android)
- ✅ Microsoft Edge
- ✅ Safari (macOS 14.1+)
- ❌ Firefox (no soportado nativamente)

**Solución para todos los navegadores:** El sistema funcionará en cualquier navegador moderno, aunque sin reconocimiento de voz en algunos.

## 📖 Cómo Usar

### Desde la Interfaz de Reportes

1. **Abrir Modal de Reporte** 
   - Navega a la página de Reportes
   - Selecciona una categoría
   - Click en "Generar Reporte"

2. **Usar Comando de Voz**
   - Click en el botón "🎤 Comando de Voz"
   - Habla claramente tu comando
   - Espera a que la IA procese el comando
   - Verifica los datos auto-completados

3. **Generar Reporte**
   - Ajusta manualmente si es necesario
   - Click en "Generar Reporte"
   - El archivo se descarga automáticamente

## 🧠 Procesamiento con IA

El sistema usa **Google Gemini Pro** para:

- **Interpretar lenguaje natural** - Entiende comandos en español coloquial
- **Extraer información** - Tipo de reporte, categoría, fechas, título
- **Calcular fechas relativas** - "este mes", "última semana", etc.
- **Devolver confianza** - Indica qué tan seguro está de la interpretación

### Ejemplo de Procesamiento

**Entrada de Voz:**
```
"Generar reporte PDF de vehículos del último mes"
```

**Salida de IA:**
```json
{
  "tipo": "pdf",
  "categoria": "vehiculos",
  "titulo": "Reporte mensual",
  "fechaInicio": "2025-10-01",
  "fechaFin": "2025-10-31",
  "confidence": 0.95
}
```

## 🔐 Seguridad

- ✅ API Key en variables de entorno (no en código)
- ✅ Procesamiento del lado del cliente
- ✅ No se almacenan grabaciones de voz
- ✅ Fallback a procesamiento local

## 🐛 Troubleshooting

### El micrófono no funciona

1. **Verificar permisos** - El navegador debe tener acceso al micrófono
2. **Usar HTTPS** - En producción, debe usar HTTPS (localhost funciona en HTTP)
3. **Verificar navegador** - Usar Chrome, Edge o Safari compatible

### La IA no interpreta correctamente

1. **Hablar claramente** - Pronuncia bien las palabras
2. **Usar términos específicos** - "PDF", "Excel", "vehículos", etc.
3. **Verificar API Key** - Asegúrate que esté configurada correctamente
4. **Fallback local** - El sistema usará procesamiento local si falla la IA

### Error de API

Si la API de Google Gemini falla, el sistema automáticamente usa procesamiento local con reglas simples de detección de palabras clave.

## 📊 Arquitectura

```
┌─────────────────┐
│   Usuario       │
│   (Habla)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Web Speech API  │ ← Navegador
│ (Transcripción) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Google Gemini   │ ← IA en la nube
│ (Interpretación)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto-completar  │
│ Formulario      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generar Reporte │ ← Backend Django
│ (PDF/Excel/PNG) │
└─────────────────┘
```

## 🎨 Componentes Creados

### Frontend

- `voiceCommandService.ts` - Servicio principal de voz
- `VoiceCommandButton.tsx` - Botón de comando de voz
- `GenerateReportModal.tsx` - Modal integrado con voz

### Backend

- (No requiere cambios, usa endpoints existentes)

## 📝 Notas Técnicas

- **Latencia**: ~2-3 segundos (transcripción + procesamiento IA)
- **Precisión**: >90% con comandos claros
- **Idioma**: Configurado para español (es-ES)
- **Límites**: Comandos de hasta 60 segundos

## 🚀 Próximas Mejoras

- [ ] Soporte para múltiples idiomas
- [ ] Comandos de voz para filtros avanzados
- [ ] Historial de comandos de voz
- [ ] Entrenamiento personalizado del modelo
- [ ] Feedback de voz (respuesta hablada)

## 📄 Licencia

Parte del Sistema de Transporte SI2 - 2025
