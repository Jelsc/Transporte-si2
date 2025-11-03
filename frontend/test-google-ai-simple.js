// Test simple de Google AI - Una sola petición
const API_KEY = 'AIzaSyBlRWbLF0dKtS2T0WXT5NYOtoZ7V0vWi10';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

async function testSimple() {
  console.log('🧪 Test Simple de Google AI Gemini\n');

  const testCommand = 'Generar reporte PDF de vehículos del mes';
  console.log('📝 Comando de prueba:', testCommand);
  console.log('');

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
    console.log('📡 Enviando petición a Google AI...');
    const response = await fetch(API_URL, {
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

    console.log('📥 Respuesta recibida (Status:', response.status, ')\n');

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      console.log('✅ ¡Éxito! Respuesta de Google AI:');
      console.log('─'.repeat(50));
      console.log(text);
      console.log('─'.repeat(50));
      console.log('');
      
      // Intentar extraer JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      
      try {
        const parsed = JSON.parse(jsonText);
        console.log('✅ JSON parseado exitosamente:');
        console.log('─'.repeat(50));
        console.log(JSON.stringify(parsed, null, 2));
        console.log('─'.repeat(50));
        console.log('');
        
        console.log('📊 Datos Extraídos:');
        console.log('  🔹 Tipo:', parsed.tipo);
        console.log('  🔹 Categoría:', parsed.categoria);
        console.log('  🔹 Título:', parsed.titulo || '(no especificado)');
        console.log('  🔹 Fecha Inicio:', parsed.fechaInicio || '(no especificado)');
        console.log('  🔹 Fecha Fin:', parsed.fechaFin || '(no especificado)');
        console.log('  🔹 Confidence:', parsed.confidence);
        console.log('');
        console.log('🎉 ¡SISTEMA FUNCIONANDO CORRECTAMENTE!');
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', parseError.message);
        console.log('Texto recibido:', text);
      }
    } else {
      const error = await response.json();
      console.error('❌ Error en API:', response.status);
      console.error('Detalles:', JSON.stringify(error, null, 2));
      
      if (response.status === 429) {
        console.log('');
        console.log('⚠️  NOTA: Error 429 - Cuota excedida');
        console.log('    Esto es normal en el plan gratuito de Google AI.');
        console.log('    El sistema usará el fallback local automáticamente.');
        console.log('    Espera 1 minuto y vuelve a intentar.');
      } else if (response.status === 403) {
        console.log('');
        console.log('⚠️  NOTA: Error 403 - API Key inválida o restringida');
        console.log('    Verifica la API Key en Google Cloud Console.');
        console.log('    El sistema usará el fallback local automáticamente.');
      }
    }
  } catch (error) {
    console.error('❌ Error de red:', error.message);
  }
}

testSimple();
