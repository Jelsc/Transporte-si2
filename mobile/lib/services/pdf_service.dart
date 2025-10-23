import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/reserva_model.dart';
import '../models/viaje_model.dart';

class PdfService {
  static Future<File> generateReservaPdf({
    required Reserva reserva,
    required Viaje viaje,
  }) async {
    final pdf = pw.Document();

    // Crear el contenido del PDF
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return _buildPdfContent(reserva: reserva, viaje: viaje);
        },
      ),
    );

    // Guardar el PDF
    final output = await getTemporaryDirectory();
    final file = File("${output.path}/reserva_${reserva.codigoReserva}.pdf");

    await file.writeAsBytes(await pdf.save());
    return file;
  }

  static pw.Widget _buildPdfContent({
    required Reserva reserva,
    required Viaje viaje,
  }) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        // Header
        pw.Center(
          child: pw.Column(
            children: [
              pw.Text(
                'COMPROBANTE DE RESERVA',
                style: pw.TextStyle(
                  fontSize: 24,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.blue800,
                ),
              ),
              pw.SizedBox(height: 10),
              pw.Text(
                'Tu Empresa de Transporte',
                style: pw.TextStyle(fontSize: 16, color: PdfColors.grey600),
              ),
            ],
          ),
        ),

        pw.SizedBox(height: 30),

        // Código de reserva
        pw.Container(
          width: double.infinity,
          padding: pw.EdgeInsets.all(20),
          decoration: pw.BoxDecoration(
            border: pw.Border.all(color: PdfColors.green, width: 2),
            borderRadius: pw.BorderRadius.circular(10),
          ),
          child: pw.Column(
            children: [
              pw.Text(
                'CÓDIGO DE RESERVA',
                style: pw.TextStyle(
                  fontSize: 12,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.grey600,
                ),
              ),
              pw.SizedBox(height: 5),
              pw.Text(
                reserva.codigoReserva,
                style: pw.TextStyle(
                  fontSize: 32,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.green,
                ),
              ),
            ],
          ),
        ),

        pw.SizedBox(height: 20),

        // Información de la reserva
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  _buildInfoRow(
                    'Estado:',
                    reserva.estado.replaceAll('_', ' ').toUpperCase(),
                  ),
                  _buildInfoRow(
                    'Fecha de reserva:',
                    _formatPdfDate(reserva.fechaReserva),
                  ),
                  _buildInfoRow(
                    'Total pagado:',
                    'Bs. ${reserva.total.toStringAsFixed(2)}',
                  ),
                ],
              ),
            ),
          ],
        ),

        pw.SizedBox(height: 20),

        // Detalles del viaje
        pw.Container(
          width: double.infinity,
          padding: pw.EdgeInsets.all(15),
          decoration: pw.BoxDecoration(
            border: pw.Border.all(color: PdfColors.blue200),
            borderRadius: pw.BorderRadius.circular(8),
          ),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                'DETALLES DEL VIAJE',
                style: pw.TextStyle(
                  fontSize: 16,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.blue800,
                ),
              ),
              pw.SizedBox(height: 10),
              _buildInfoRow('Ruta:', '${viaje.origen} → ${viaje.destino}'),
              _buildInfoRow('Fecha:', _formatPdfDate(viaje.fecha)),
              _buildInfoRow('Hora:', viaje.hora),
              _buildInfoRow(
                'Precio por asiento:',
                'Bs. ${viaje.precio.toStringAsFixed(2)}',
              ),
            ],
          ),
        ),

        pw.SizedBox(height: 20),

        // Asientos reservados
        pw.Container(
          width: double.infinity,
          padding: pw.EdgeInsets.all(15),
          decoration: pw.BoxDecoration(
            border: pw.Border.all(color: PdfColors.green200),
            borderRadius: pw.BorderRadius.circular(8),
          ),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                'ASIENTOS RESERVADOS',
                style: pw.TextStyle(
                  fontSize: 16,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.green800,
                ),
              ),
              pw.SizedBox(height: 10),
              pw.Text(
                'Cantidad: ${reserva.items.length} asiento(s)',
                style: pw.TextStyle(fontSize: 14),
              ),
              pw.SizedBox(height: 5),
              pw.Wrap(
                children: reserva.items.map((item) {
                  return pw.Container(
                    margin: pw.EdgeInsets.only(right: 5, bottom: 5),
                    padding: pw.EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: pw.BoxDecoration(
                      color: PdfColors.green100,
                      borderRadius: pw.BorderRadius.circular(4),
                    ),
                    child: pw.Text(
                      'Asiento ${item.numeroAsiento}',
                      style: pw.TextStyle(
                        fontSize: 12,
                        color: PdfColors.green800,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),

        pw.SizedBox(height: 25),

        // Información importante
        pw.Container(
          width: double.infinity,
          padding: pw.EdgeInsets.all(15),
          decoration: pw.BoxDecoration(
            color: PdfColors.blue50,
            borderRadius: pw.BorderRadius.circular(8),
          ),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                'INFORMACIÓN IMPORTANTE',
                style: pw.TextStyle(
                  fontSize: 14,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.blue800,
                ),
              ),
              pw.SizedBox(height: 8),
              _buildBulletPoint('Presenta este comprobante al abordar el bus'),
              _buildBulletPoint('Llega al menos 30 minutos antes de la salida'),
              _buildBulletPoint(
                'Asientos confirmados: ${reserva.items.map((item) => item.numeroAsiento).join(', ')}',
              ),
              _buildBulletPoint('Para consultas: +591 XXX-XXXXX'),
            ],
          ),
        ),

        pw.SizedBox(height: 20),

        // Footer
        pw.Center(
          child: pw.Text(
            '¡Gracias por viajar con nosotros!',
            style: pw.TextStyle(
              fontSize: 14,
              fontStyle: pw.FontStyle.italic,
              color: PdfColors.grey600,
            ),
          ),
        ),
      ],
    );
  }

  static pw.Widget _buildInfoRow(String label, String value) {
    return pw.Padding(
      padding: pw.EdgeInsets.only(bottom: 8),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            label,
            style: pw.TextStyle(
              fontSize: 12,
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.grey700,
            ),
          ),
          pw.SizedBox(width: 10),
          pw.Expanded(child: pw.Text(value, style: pw.TextStyle(fontSize: 12))),
        ],
      ),
    );
  }

  static pw.Widget _buildBulletPoint(String text) {
    return pw.Padding(
      padding: pw.EdgeInsets.only(bottom: 4),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text('• ', style: pw.TextStyle(fontSize: 12)),
          pw.Expanded(child: pw.Text(text, style: pw.TextStyle(fontSize: 10))),
        ],
      ),
    );
  }

  static String _formatPdfDate(DateTime date) {
    final months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return '${date.day} de ${months[date.month - 1]} de ${date.year}';
  }
}
