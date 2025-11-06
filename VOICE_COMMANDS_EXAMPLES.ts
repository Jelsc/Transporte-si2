// 🎤 EJEMPLOS DE USO - COMANDOS DE VOZ PARA REPORTES

// ============================================
// EJEMPLOS BÁSICOS
// ============================================

// 1. Reporte Simple
"Generar reporte PDF de vehículos"
// ✅ Resultado: tipo=pdf, categoria=vehiculos

// 2. Con Formato Específico
"Crear reporte de conductores en Excel"
// ✅ Resultado: tipo=excel, categoria=conductores

// 3. Con Gráfico
"Reporte de encomiendas en formato imagen"
// ✅ Resultado: tipo=imagen, categoria=encomiendas

// ============================================
// EJEMPLOS CON FECHAS RELATIVAS
// ============================================

// 4. Mes Actual
"Generar reporte de viajes del mes en PDF"
// ✅ Resultado: tipo=pdf, categoria=viajes, 
//              fechaInicio=2025-11-01, fechaFin=2025-11-02

// 5. Semana Actual
"Reporte semanal de conductores en Excel"
// ✅ Resultado: tipo=excel, categoria=conductores,
//              fechaInicio=semana_inicio, fechaFin=hoy

// 6. Hoy
"Reporte de encomiendas de hoy"
// ✅ Resultado: categoria=encomiendas,
//              fechaInicio=hoy, fechaFin=hoy

// ============================================
// EJEMPLOS CON TÍTULO
// ============================================

// 7. Con Título Personalizado
"Generar reporte PDF de vehículos con título Flota Octubre"
// ✅ Resultado: tipo=pdf, categoria=vehiculos,
//              titulo="Flota Octubre"

// 8. Título Descriptivo
"Reporte mensual de conductores llamado Asistencia Octubre en Excel"
// ✅ Resultado: tipo=excel, categoria=conductores,
//              titulo="Asistencia Octubre"

// ============================================
// EJEMPLOS COMPLEJOS
// ============================================

// 9. Reporte Completo
"Generar reporte PDF de viajes del último mes con título Viajes Octubre"
// ✅ Resultado: tipo=pdf, categoria=viajes,
//              titulo="Viajes Octubre",
//              fechaInicio=2025-10-01, fechaFin=2025-10-31

// 10. Reporte Financiero
"Reporte financiero de pagos del mes en Excel"
// ✅ Resultado: tipo=excel, categoria=financiero,
//              fechaInicio=mes_inicio, fechaFin=hoy

// 11. Dashboard General
"Crear dashboard general en formato imagen"
// ✅ Resultado: tipo=imagen, categoria=general

// ============================================
// VARIACIONES DE LENGUAJE NATURAL
// ============================================

// El sistema entiende estas variaciones:

// Formatos:
"PDF" = "en PDF" = "formato PDF" = "tipo PDF"
"Excel" = "en Excel" = "hoja de cálculo" = "XLS"
"Imagen" = "en imagen" = "gráfico" = "PNG" = "visual"

// Categorías:
"vehículos" = "vehiculos" = "flota" = "autos" = "buses"
"conductores" = "choferes" = "drivers" = "personal de conducción"
"viajes" = "rutas" = "trayectos" = "recorridos"
"encomiendas" = "paquetes" = "envíos" = "pedidos"
"financiero" = "pagos" = "finanzas" = "dinero" = "ingresos"

// Fechas:
"del mes" = "mensual" = "de este mes" = "mes actual"
"de la semana" = "semanal" = "esta semana"
"de hoy" = "diario" = "del día" = "de hoy día"
"del último mes" = "mes pasado" = "mes anterior"

// ============================================
// TIPS PARA MEJORES RESULTADOS
// ============================================

// ✅ HACER:
// - Hablar claramente y con pausas
// - Usar términos específicos (PDF, Excel, vehículos)
// - Mencionar la categoría explícitamente
// - Usar "generar" o "crear" al inicio

// ❌ EVITAR:
// - Hablar muy rápido
// - Usar jerga muy coloquial
// - Comandos muy largos (>20 palabras)
// - Ruido de fondo excesivo

// ============================================
// EJEMPLOS DE COMANDOS INCORRECTOS Y SU CORRECCIÓN
// ============================================

// ❌ "Dame un reporte"
// ✅ "Generar reporte PDF de vehículos"

// ❌ "Necesito ver los autos"
// ✅ "Generar reporte de vehículos en PDF"

// ❌ "Quiero saber cómo están los choferes"
// ✅ "Reporte de conductores en Excel"

// ❌ "Reporte de esas cosas que se envían"
// ✅ "Reporte de encomiendas en PDF"

// ============================================
// COMANDOS EN CONTEXTO (DURANTE LA CONVERSACIÓN)
// ============================================

// Cuando el modal ya está abierto en una categoría específica:

// Modal de Vehículos:
"PDF del último mes"
"Excel con título Flota Activa"
"En formato imagen"

// Modal de Conductores:
"Reporte mensual en Excel"
"PDF de esta semana"

// ============================================
// COMANDOS AVANZADOS (PRÓXIMAMENTE)
// ============================================

// Estos comandos serán soportados en futuras versiones:

// "Reporte de vehículos en mantenimiento del último mes"
// "Gráfico comparativo de viajes vs encomiendas"
// "Reporte financiero de octubre a noviembre"
// "Dashboard de conductores con más de 5 años de experiencia"

export {};
