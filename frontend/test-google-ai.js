// Test de Google AI (Gemini) API
// Ejecutar con: node test-google-ai.js

const API_KEY = 'AIzaSyBlRWbLF0dKtS2T0WXT5NYOtoZ7V0vWi10';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

async function testGoogleAI() {
  console.log('🧪 Probando Google AI (Gemini)...\n');

  // Test 1: Conexión básica
  console.log('📡 Test 1: Verificar conexión...');
  try {
    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Di 'Hola' en español"
          }]
        }]
      })
    });

    if (response1.ok) {
      const data1 = await response1.json();
      const text1 = data1.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
      console.log('✅ Conexión exitosa!');
      console.log('📝 Respuesta:', text1);
      console.log('');
    } else {
      const error = await response1.json();
      console.error('❌ Error en conexión:', error);
      return;
    }
  } catch (error) {
    console.error('❌ Error de red:', error.message);
    return;
  }

  // Test 2: Interpretación de comando de voz
  console.log('🎤 Test 2: Interpretar comando de voz...');
  const testCommand = 'Generar reporte PDF de vehículos del mes';
  console.log('Comando:', testCommand);
  
  const prompt = `Eres un asistente para interpretar comandos de voz para generar reportes.

El usuario dijo: "${testCommand}"

Extrae la siguiente información del comando:
1. Tipo de reporte: pdf, excel, o imagen
2. Categoría: viajes, encomiendas, conductores, vehiculos, financiero, o general
3. Título del reporte (si lo menciona)
4. Fecha inicio (si la menciona, formato YYYY-MM-DD)
5. Fecha fin (si la menciona, formato YYYY-MM-DD)

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido en este formato exacto (sin markdown, sin comentarios):
{
  "tipo": "pdf",
  "categoria": "viajes",
  "titulo": "Reporte mensual",
  "fechaInicio": "2025-10-01",
  "fechaFin": "2025-10-31",
  "confidence": 0.95
}

Si no se menciona algo, usa null. La confidence debe ser entre 0 y 1.`;

  try {
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        }
      })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      const text2 = data2.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      console.log('✅ Interpretación exitosa!');
      console.log('📝 Respuesta completa de Google AI:');
      console.log(text2);
      console.log('');
      
      // Intentar extraer JSON
      const jsonMatch = text2.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text2;
      
      try {
        const parsed = JSON.parse(jsonText);
        console.log('✅ JSON parseado exitosamente:');
        console.log(JSON.stringify(parsed, null, 2));
        console.log('');
        
        // Validar estructura
        console.log('🔍 Validación:');
        console.log('  - Tipo:', parsed.tipo || '❌ No detectado');
        console.log('  - Categoría:', parsed.categoria || '❌ No detectado');
        console.log('  - Título:', parsed.titulo || 'No especificado');
        console.log('  - Fecha Inicio:', parsed.fechaInicio || 'No especificado');
        console.log('  - Fecha Fin:', parsed.fechaFin || 'No especificado');
        console.log('  - Confidence:', parsed.confidence || 'No especificado');
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', parseError.message);
        console.log('Texto recibido:', text2);
      }
    } else {
      const error = await response2.json();
      console.error('❌ Error en API:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar test
testGoogleAI().then(() => {
  console.log('\n✅ Tests completados');
}).catch(error => {
  console.error('\n❌ Error en tests:', error);
});
