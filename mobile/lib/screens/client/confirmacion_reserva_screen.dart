// lib/screens/client/confirmacion_reserva_screen.dart
import 'package:flutter/material.dart';
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import '../../models/reserva_model.dart';
import '../../models/viaje_model.dart';
import '../../services/reserva_service.dart';
import '../../services/pdf_service.dart';

class ConfirmacionReservaScreen extends StatelessWidget {
  final Reserva reserva;
  final Viaje viaje;

  const ConfirmacionReservaScreen({
    Key? key,
    required this.reserva,
    required this.viaje,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // ✅ DEBUG: Verificar datos de la reserva
    _debugReserva();

    return Scaffold(
      backgroundColor: Colors.green[50],
      body: SafeArea(
        child: Column(
          children: [
            // Header de éxito
            _buildHeader(),

            // Contenido principal
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Tarjeta de confirmación
                    _buildTarjetaConfirmacion(),
                    SizedBox(height: 24),

                    // Detalles del viaje
                    _buildDetallesViaje(),
                    SizedBox(height: 24),

                    // Información importante
                    _buildInformacionImportante(),
                    SizedBox(height: 24),

                    // Acciones
                    _buildAcciones(context),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ✅ NUEVO: Debug para verificar datos
  void _debugReserva() {
    print('🔍 [ConfirmacionReservaScreen] Datos de la reserva:');
    print('  - Código: ${reserva.codigoReserva}');
    print('  - Estado: ${reserva.estado}');
    print('  - Total: ${reserva.total}');
    print('  - Items: ${reserva.items.length}');

    for (var i = 0; i < reserva.items.length; i++) {
      final item = reserva.items[i];
      print(
        '    ${i + 1}. Asiento ID: ${item.asientoId}, Número: ${item.numeroAsiento}',
      );
    }
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.green, Colors.green[700]!],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          Icon(Icons.check_circle, size: 80, color: Colors.white),
          SizedBox(height: 16),
          Text(
            '¡Reserva Confirmada!',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 8),
          Text(
            'Tu viaje está listo. ¡Buen viaje!',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.9),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTarjetaConfirmacion() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            // Código de reserva
            Text(
              'CÓDIGO DE RESERVA',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey[600],
                letterSpacing: 1.5,
              ),
            ),
            SizedBox(height: 8),
            Text(
              reserva.codigoReserva,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.green[800],
                letterSpacing: 2,
              ),
            ),
            SizedBox(height: 16),
            Divider(),
            SizedBox(height: 16),

            // Información de estado
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Estado:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                Chip(
                  label: Text(
                    reserva.estado.replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  backgroundColor: Colors.green,
                ),
              ],
            ),
            SizedBox(height: 8),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Fecha de reserva:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                Text(_formatearFechaHora(reserva.fechaReserva)),
              ],
            ),
            SizedBox(height: 8),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total pagado:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                Text(
                  'Bs. ${reserva.total.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.green[800],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetallesViaje() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Detalles del Viaje',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            SizedBox(height: 16),

            // Ruta
            Row(
              children: [
                Icon(Icons.directions_bus, color: Colors.blue, size: 20),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '${viaje.origen} → ${viaje.destino}',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),

            // Fecha y hora
            Row(
              children: [
                Icon(Icons.calendar_today, color: Colors.blue, size: 20),
                SizedBox(width: 12),
                Text(_formatearFecha(viaje.fecha)),
                SizedBox(width: 20),
                Icon(Icons.access_time, color: Colors.blue, size: 20),
                SizedBox(width: 8),
                Text(viaje.hora),
              ],
            ),
            SizedBox(height: 12),

            // Asientos
            Row(
              children: [
                Icon(Icons.event_seat, color: Colors.blue, size: 20),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Asientos reservados:',
                        style: TextStyle(fontWeight: FontWeight.w500),
                      ),
                      SizedBox(height: 4),
                      Wrap(
                        spacing: 8,
                        children: reserva.items.map((item) {
                          return Chip(
                            // ✅ CORREGIDO: Usar numeroAsiento en lugar de asientoId
                            label: Text('Asiento ${item.numeroAsiento}'),
                            backgroundColor: Colors.blue[100],
                            labelStyle: TextStyle(fontSize: 12),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),

            // Precio por asiento
            Row(
              children: [
                Icon(Icons.attach_money, color: Colors.blue, size: 20),
                SizedBox(width: 12),
                Text(
                  'Precio por asiento: Bs. ${viaje.precio.toStringAsFixed(2)}',
                ),
              ],
            ),

            // ✅ NUEVO: Información adicional de asientos
            SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.confirmation_number, color: Colors.blue, size: 20),
                SizedBox(width: 12),
                Text(
                  'Cantidad de asientos: ${reserva.items.length}',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInformacionImportante() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info, color: Colors.blue[700], size: 20),
              SizedBox(width: 8),
              Text(
                'Información Importante',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue[800],
                ),
              ),
            ],
          ),
          SizedBox(height: 12),
          _buildItemInfo(
            Icons.qr_code,
            'Presenta tu código de reserva al abordar el bus',
          ),
          SizedBox(height: 8),
          _buildItemInfo(
            Icons.access_time,
            'Llega al menos 30 minutos antes de la salida',
          ),
          SizedBox(height: 8),
          _buildItemInfo(
            Icons.credit_card,
            'Guarda este comprobante, es tu ticket de viaje',
          ),
          SizedBox(height: 8),
          _buildItemInfo(
            Icons.event_seat,
            'Asientos confirmados: ${reserva.items.map((item) => item.numeroAsiento).join(', ')}',
          ),
          SizedBox(height: 8),
          _buildItemInfo(Icons.phone, 'Para consultas: +591 XXX-XXXXX'),
        ],
      ),
    );
  }

  Widget _buildItemInfo(IconData icon, String texto) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: Colors.blue[700]),
        SizedBox(width: 8),
        Expanded(
          child: Text(
            texto,
            style: TextStyle(fontSize: 12, color: Colors.blue[800]),
          ),
        ),
      ],
    );
  }

  Widget _buildAcciones(BuildContext context) {
    return Column(
      children: [
        // Botón principal - Volver al inicio
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              // Navegar al inicio y limpiar el stack
              Navigator.pushNamedAndRemoveUntil(
                context,
                '/home', // Ajusta según tu ruta de inicio
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Volver al Inicio',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        SizedBox(height: 12),

        // Botones secundarios
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  _compartirReserva(context);
                },
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.share, size: 18),
                    SizedBox(width: 8),
                    Text('Compartir'),
                  ],
                ),
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  _verMisReservas(context);
                },
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.list_alt, size: 18),
                    SizedBox(width: 8),
                    Text('Mis Reservas'),
                  ],
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 12),

        // Previsualizar PDF
        OutlinedButton(
          onPressed: () {
            _previsualizarPdf(context);
          },
          style: OutlinedButton.styleFrom(
            padding: EdgeInsets.symmetric(vertical: 12, horizontal: 24),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.preview, size: 18),
              SizedBox(width: 8),
              Text('Previsualizar PDF'),
            ],
          ),
        ),
        SizedBox(height: 8),

        // Descargar y compartir PDF
        ElevatedButton(
          onPressed: () {
            _descargarComprobante(context);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blue,
            foregroundColor: Colors.white,
            padding: EdgeInsets.symmetric(vertical: 12, horizontal: 24),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.download, size: 18),
              SizedBox(width: 8),
              Text('Descargar y Compartir PDF'),
            ],
          ),
        ),
      ],
    );
  }

  void _compartirReserva(BuildContext context) {
    final asientosTexto = reserva.items
        .map((item) => item.numeroAsiento)
        .join(', ');

    final mensaje =
        '''
¡Hola! Te comparto mi reserva de viaje:

🚌 ${viaje.origen} → ${viaje.destino}
📅 ${_formatearFecha(viaje.fecha)} ⏰ ${viaje.hora}
🎫 Código: ${reserva.codigoReserva}
💺 Asientos: $asientosTexto
💰 Total: Bs. ${reserva.total.toStringAsFixed(2)}

¡Nos vemos en el viaje! ✨
    ''';

    // Compartir usando share_plus
    Share.share(
      mensaje,
      subject: 'Reserva de Viaje - ${reserva.codigoReserva}',
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Información de reserva lista para compartir'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _verMisReservas(BuildContext context) {
    // Navegar a la pantalla de mis reservas
    Navigator.pushNamed(context, '/mis-reservas'); // Ajusta la ruta
  }

  void _descargarComprobante(BuildContext context) async {
    try {
      // Mostrar indicador de carga
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 16),
              Text('Generando comprobante PDF...'),
            ],
          ),
        ),
      );

      // Generar PDF
      final pdfFile = await PdfService.generateReservaPdf(
        reserva: reserva,
        viaje: viaje,
      );

      // Cerrar el diálogo de carga
      Navigator.of(context).pop();

      // Compartir el PDF
      await Share.shareXFiles(
        [XFile(pdfFile.path)],
        subject: 'Comprobante de Reserva - ${reserva.codigoReserva}',
        text:
            'Te comparto el comprobante de mi reserva de viaje. Código: ${reserva.codigoReserva}',
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Comprobante PDF generado y listo para compartir'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      // Cerrar el diálogo de carga en caso de error
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error al generar comprobante: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _previsualizarPdf(BuildContext context) async {
    try {
      // Mostrar indicador de carga
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 16),
              Text('Generando vista previa...'),
            ],
          ),
        ),
      );

      // Generar PDF
      final pdfFile = await PdfService.generateReservaPdf(
        reserva: reserva,
        viaje: viaje,
      );

      // Cerrar el diálogo de carga
      Navigator.of(context).pop();

      // Previsualizar el PDF
      await Printing.layoutPdf(onLayout: (format) => pdfFile.readAsBytes());
    } catch (e) {
      // Cerrar el diálogo de carga en caso de error
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error al previsualizar PDF: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String _formatearFecha(DateTime fecha) {
    final meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    return '${fecha.day} ${meses[fecha.month - 1]} ${fecha.year}';
  }

  String _formatearFechaHora(DateTime fecha) {
    return '${_formatearFecha(fecha)} ${fecha.hour.toString().padLeft(2, '0')}:${fecha.minute.toString().padLeft(2, '0')}';
  }
}
