import os
import json
import logging
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import DispositivoFCM, Notificacion, TipoNotificacion, PreferenciaNotificacion
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions


# Configurar logging
logger = logging.getLogger(__name__)

User = get_user_model()

# Intentar importar Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FIREBASE_AVAILABLE = True
except ImportError:
    logger.warning("Firebase Admin SDK no está disponible. Instalar con: pip install firebase-admin")
    FIREBASE_AVAILABLE = False


class NotificationService:
    """Servicio principal para el manejo de notificaciones push"""
    
    _firebase_app = None
    
    @classmethod
    def _init_firebase(cls):
        """Inicializar Firebase Admin SDK"""
        if not FIREBASE_AVAILABLE:
            raise Exception("Firebase Admin SDK no está instalado")
        
        if cls._firebase_app is None:
            try:
                # Buscar archivo de credenciales
                cred_path = getattr(settings, 'FIREBASE_SERVICE_ACCOUNT_PATH', None)
                
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    cls._firebase_app = firebase_admin.initialize_app(cred, name='notificaciones')
                    logger.info(f"Firebase inicializado con credenciales desde: {cred_path}")
                else:
                    # Intentar con variables de entorno
                    service_account_info = {
                        "type": "service_account",
                        "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                        "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                        "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                        "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                        "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                    
                    if all(service_account_info.values()):
                        cred = credentials.Certificate(service_account_info)
                        cls._firebase_app = firebase_admin.initialize_app(cred, name='notificaciones')
                        logger.info("Firebase inicializado con variables de entorno")
                    else:
                        raise Exception("Credenciales de Firebase no encontradas")
                        
            except Exception as e:
                logger.error(f"Error al inicializar Firebase: {str(e)}")
                raise
        
        return cls._firebase_app
    
    @classmethod
    def _send_firebase_message(cls, message_data: Dict[str, Any]) -> str:
        """Enviar mensaje directo con Firebase Admin SDK"""
        try:
            cls._init_firebase()
            
            # Crear el mensaje de Firebase
            message = messaging.Message(
                notification=messaging.Notification(
                    title=message_data.get('notification', {}).get('title', ''),
                    body=message_data.get('notification', {}).get('body', '')
                ),
                data=message_data.get('data', {}),
                token=message_data.get('token')
            )
            
            # Enviar el mensaje
            response = messaging.send(message, app=cls._firebase_app)
            logger.info(f"Mensaje Firebase enviado exitosamente: {response}")
            return response
            
        except Exception as e:
            logger.error(f"Error enviando mensaje Firebase: {str(e)}")
            raise
    
    @classmethod
    def registrar_dispositivo(cls, usuario: User, token_fcm: str, tipo_dispositivo: str, nombre_dispositivo: str = None) -> DispositivoFCM:
        """Registrar un dispositivo FCM para un usuario"""
        try:
            # Desactivar otros tokens del mismo tipo para este usuario (opcional)
            DispositivoFCM.objects.filter(
                usuario=usuario,
                tipo_dispositivo=tipo_dispositivo,
                activo=True
            ).update(activo=False)
            
            # Crear o actualizar el dispositivo
            dispositivo, creado = DispositivoFCM.objects.get_or_create(
                usuario=usuario,
                token_fcm=token_fcm,
                defaults={
                    'tipo_dispositivo': tipo_dispositivo,
                    'nombre_dispositivo': nombre_dispositivo,
                    'activo': True
                }
            )
            
            if not creado:
                dispositivo.activo = True
                dispositivo.nombre_dispositivo = nombre_dispositivo
                dispositivo.tipo_dispositivo = tipo_dispositivo
                dispositivo.save()
            
            logger.info(f"Dispositivo registrado: {usuario.username} - {tipo_dispositivo}")
            return dispositivo
            
        except Exception as e:
            logger.error(f"Error al registrar dispositivo: {str(e)}")
            raise
    
    @classmethod
    def enviar_notificacion(
        cls,
        usuario_id: int,
        titulo: str,
        mensaje: str,
        tipo_codigo: str,
        data_extra: Dict[str, Any] = None,
        prioridad: str = 'normal',
        programada_para: timezone.datetime = None
    ) -> List[Notificacion]:
        """Enviar notificación a un usuario específico"""
        try:
            usuario = User.objects.get(id=usuario_id)
            
            # Verificar preferencias del usuario
            preferencias, _ = PreferenciaNotificacion.objects.get_or_create(usuario=usuario)
            
            if not preferencias.acepta_tipo_notificacion(tipo_codigo):
                logger.info(f"Usuario {usuario.username} no acepta notificaciones tipo {tipo_codigo}")
                return []
            
            if preferencias.esta_en_horario_no_molestar():
                logger.info(f"Usuario {usuario.username} está en horario no molestar")
                # Programar para después del horario no molestar (implementar lógica según necesidades)
            
            # Obtener tipo de notificación
            tipo_notif, _ = TipoNotificacion.objects.get_or_create(
                codigo=tipo_codigo,
                defaults={'nombre': tipo_codigo.replace('_', ' ').title(), 'activo': True}
            )
            
            # Obtener dispositivos activos del usuario
            dispositivos = DispositivoFCM.objects.filter(
                usuario=usuario,
                activo=True
            )
            
            notificaciones_creadas = []
            
            for dispositivo in dispositivos:
                # Verificar preferencias por tipo de dispositivo
                if dispositivo.tipo_dispositivo in ['android', 'ios'] and not preferencias.push_mobile:
                    continue
                if dispositivo.tipo_dispositivo == 'web' and not preferencias.push_web:
                    continue
                
                # Crear registro de notificación
                notificacion = Notificacion.objects.create(
                    titulo=titulo,
                    mensaje=mensaje,
                    tipo=tipo_notif,
                    prioridad=prioridad,
                    usuario=usuario,
                    dispositivo=dispositivo,
                    data_extra=data_extra or {},
                    programada_para=programada_para
                )
                
                # Enviar inmediatamente si no está programada
                if not programada_para:
                    cls._enviar_fcm_individual(notificacion)
                
                notificaciones_creadas.append(notificacion)
            
            logger.info(f"Notificación enviada a {len(notificaciones_creadas)} dispositivos de {usuario.username}")
            return notificaciones_creadas
            
        except User.DoesNotExist:
            logger.error(f"Usuario con ID {usuario_id} no encontrado")
            return []
        except Exception as e:
            logger.error(f"Error al enviar notificación: {str(e)}")
            return []
    
    @classmethod
    def enviar_notificacion_masiva(
        cls,
        usuarios_ids: List[int],
        titulo: str,
        mensaje: str,
        tipo_codigo: str = 'sistema',
        data_extra: Dict[str, Any] = None,
        prioridad: str = 'normal'
    ) -> int:
        """Enviar notificación a múltiples usuarios"""
        notificaciones_enviadas = 0
        
        for usuario_id in usuarios_ids:
            notificaciones = cls.enviar_notificacion(
                usuario_id=usuario_id,
                titulo=titulo,
                mensaje=mensaje,
                tipo_codigo=tipo_codigo,
                data_extra=data_extra,
                prioridad=prioridad
            )
            notificaciones_enviadas += len(notificaciones)
        
        logger.info(f"Notificación masiva enviada a {notificaciones_enviadas} dispositivos")
        return notificaciones_enviadas
    
    @classmethod
    def _enviar_fcm_individual(cls, notificacion: Notificacion):
        """Enviar notificación FCM individual"""
        if not FIREBASE_AVAILABLE:
            logger.warning("Firebase no disponible, simulando envío")
            notificacion.marcar_como_enviada()
            return
        
        try:
            cls._init_firebase()
            
            # Construir mensaje FCM
            fcm_message = messaging.Message(
                notification=messaging.Notification(
                    title=notificacion.titulo,
                    body=notificacion.mensaje,
                ),
                data={
                    'tipo': notificacion.tipo.codigo,
                    'notificacion_id': str(notificacion.id),
                    'prioridad': notificacion.prioridad,
                    **{k: str(v) for k, v in notificacion.data_extra.items()}  # Convertir a string
                },
                token=notificacion.dispositivo.token_fcm,
                android=messaging.AndroidConfig(
                    notification=messaging.AndroidNotification(
                        icon='ic_notification',
                        color='#FF6B35',  # Color de tu app
                        sound='default',
                    ),
                    priority='high' if notificacion.prioridad in ['alta', 'critica'] else 'normal'
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            badge=1,
                            sound='default',
                        )
                    )
                ),
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon='https://tu-dominio.com/icon-192x192.png',  # Ícono para web
                        badge='https://tu-dominio.com/badge-72x72.png',
                    )
                )
            )
            
            # Enviar mensaje
            response = messaging.send(fcm_message, app=cls._firebase_app)
            
            # Marcar como enviada
            notificacion.marcar_como_enviada()
            notificacion.dispositivo.marcar_como_usado()
            
            logger.info(f"Notificación FCM enviada: {response}")
            
        except messaging.UnregisteredError:
            # Token inválido, desactivar dispositivo
            logger.warning(f"Token FCM inválido, desactivando dispositivo: {notificacion.dispositivo.token_fcm}")
            notificacion.dispositivo.activo = False
            notificacion.dispositivo.save()
            notificacion.marcar_como_fallida("Token FCM inválido")
            
        except Exception as e:
            logger.error(f"Error al enviar FCM: {str(e)}")
            notificacion.marcar_como_fallida(str(e))
    
    @classmethod
    def marcar_notificacion_leida(cls, notificacion_id: int, usuario: User):
        """Marcar una notificación como leída"""
        try:
            notificacion = Notificacion.objects.get(
                id=notificacion_id,
                usuario=usuario
            )
            notificacion.marcar_como_leida()
            return True
        except Notificacion.DoesNotExist:
            return False
    
    @classmethod
    def obtener_estadisticas_usuario(cls, usuario: User) -> Dict[str, Any]:
        """Obtener estadísticas de notificaciones para un usuario"""
        notificaciones = Notificacion.objects.filter(usuario=usuario)
        dispositivos = DispositivoFCM.objects.filter(usuario=usuario, activo=True)
        
        # Contar por estado
        total = notificaciones.count()
        leidas = notificaciones.filter(estado='leida').count()
        no_leidas = total - leidas
        
        # Contar por tipo
        por_tipo = {}
        for tipo in TipoNotificacion.objects.filter(activo=True):
            count = notificaciones.filter(tipo=tipo).count()
            if count > 0:
                por_tipo[tipo.nombre] = count
        
        return {
            'total_notificaciones': total,
            'no_leidas': no_leidas,
            'leidas': leidas,
            'por_tipo': por_tipo,
            'dispositivos_activos': dispositivos.count(),
        }


class NotificationFactory:
    """Factory para crear diferentes tipos de notificaciones"""
    
    @staticmethod
    def nuevo_viaje(viaje, usuarios_objetivo: List[User] = None):
        """Notificación de nuevo viaje disponible"""
        from viajes.models import Viaje  # Import local para evitar circular import
        
        if usuarios_objetivo is None:
            # Enviar a todos los clientes activos (ejemplo)
            usuarios_objetivo = User.objects.filter(
                is_active=True,
                rol__es_administrativo=False
            )
        
        for usuario in usuarios_objetivo:
            NotificationService.enviar_notificacion(
                usuario_id=usuario.id,
                titulo="¡Nuevo viaje disponible!",
                mensaje=f"Nuevo viaje de {viaje.origen} a {viaje.destino} el {viaje.fecha}",
                tipo_codigo="nuevo_viaje",
                data_extra={
                    "viaje_id": viaje.id,
                    "origen": viaje.origen,
                    "destino": viaje.destino,
                    "fecha": viaje.fecha.isoformat(),
                    "precio": str(viaje.precio)
                },
                prioridad="normal"
            )
    
    @staticmethod
    def viaje_cancelado(viaje, usuario):
        """Notificación de viaje cancelado"""
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo="Viaje cancelado",
            mensaje=f"El viaje de {viaje.origen} a {viaje.destino} ha sido cancelado",
            tipo_codigo="viaje_cancelado",
            data_extra={
                "viaje_id": viaje.id,
                "motivo": "Cancelado por el sistema"
            },
            prioridad="alta"
        )
    
    @staticmethod
    def recordatorio_viaje(viaje, usuario, horas_antes: int = 2):
        """Recordatorio de viaje próximo"""
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo="Recordatorio de viaje",
            mensaje=f"Tu viaje de {viaje.origen} a {viaje.destino} es en {horas_antes} horas",
            tipo_codigo="recordatorio",
            data_extra={
                "viaje_id": viaje.id,
                "horas_antes": horas_antes
            },
            prioridad="normal"
        )

    # ========== NUEVAS FUNCIONES DE EVENTOS AUTOMÁTICOS ==========
    
    @staticmethod
    def pago_realizado(usuario, pago_info: Dict[str, Any]):
        """Notificación automática cuando se realiza un pago"""
        monto = pago_info.get('monto', 0)
        concepto = pago_info.get('concepto', 'Pago')
        metodo_pago = pago_info.get('metodo', 'Tarjeta')
        
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo="💳 ¡Pago realizado exitosamente!",
            mensaje=f"Tu pago de ${monto} por {concepto} ha sido procesado correctamente",
            tipo_codigo="pago_confirmado",
            data_extra={
                "pago_id": pago_info.get('pago_id'),
                "monto": str(monto),
                "concepto": concepto,
                "metodo_pago": metodo_pago,
                "fecha_pago": timezone.now().isoformat()
            },
            prioridad="alta"
        )
    
    @staticmethod
    def paquete_entregado(usuario, paquete_info: Dict[str, Any]):
        """Notificación automática cuando llega un paquete"""
        nombre_destinatario = paquete_info.get('nombre_destinatario', usuario.get_full_name())
        direccion = paquete_info.get('direccion', 'Tu dirección')
        remitente = paquete_info.get('remitente', 'Remitente desconocido')
        
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo="📦 ¡Tu paquete ha llegado!",
            mensaje=f"Hola {nombre_destinatario}, tu paquete de {remitente} ha sido entregado en {direccion}",
            tipo_codigo="paquete_entregado",
            data_extra={
                "paquete_id": paquete_info.get('paquete_id'),
                "remitente": remitente,
                "destinatario": nombre_destinatario,
                "direccion": direccion,
                "fecha_entrega": timezone.now().isoformat(),
                "tracking_number": paquete_info.get('tracking', '')
            },
            prioridad="alta"
        )
    
    @staticmethod
    def viaje_confirmado(usuario, viaje_info: Dict[str, Any]):
        """Notificación cuando se confirma un viaje"""
        origen = viaje_info.get('origen', '')
        destino = viaje_info.get('destino', '')
        fecha = viaje_info.get('fecha', '')
        hora = viaje_info.get('hora', '')
        
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo="✅ ¡Viaje confirmado!",
            mensaje=f"Tu viaje de {origen} a {destino} el {fecha} a las {hora} ha sido confirmado",
            tipo_codigo="viaje_confirmado",
            data_extra={
                "viaje_id": viaje_info.get('viaje_id'),
                "origen": origen,
                "destino": destino,
                "fecha": fecha,
                "hora": hora,
                "asiento": viaje_info.get('asiento', ''),
                "precio": str(viaje_info.get('precio', 0))
            },
            prioridad="alta"
        )
    
    @staticmethod
    def promocion_disponible(usuario, promocion_info: Dict[str, Any]):
        """Notificación de nueva promoción disponible"""
        titulo_promo = promocion_info.get('titulo', 'Nueva promoción')
        descuento = promocion_info.get('descuento', 0)
        
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo=f"🎉 {titulo_promo}",
            mensaje=f"¡Aprovecha {descuento}% de descuento! Válido hasta {promocion_info.get('fecha_limite', 'por tiempo limitado')}",
            tipo_codigo="promocion",
            data_extra={
                "promocion_id": promocion_info.get('promocion_id'),
                "codigo_descuento": promocion_info.get('codigo', ''),
                "descuento_porcentaje": descuento,
                "fecha_limite": promocion_info.get('fecha_limite', ''),
                "condiciones": promocion_info.get('condiciones', '')
            },
            prioridad="normal"
        )
    
    @staticmethod
    def estado_viaje_cambio(usuario, viaje_info: Dict[str, Any]):
        """Notificación cuando cambia el estado de un viaje"""
        estado_anterior = viaje_info.get('estado_anterior', '')
        estado_nuevo = viaje_info.get('estado_nuevo', '')
        
        # Mapear estados a mensajes amigables
        estados_mensaje = {
            'pendiente': 'está pendiente de confirmación',
            'confirmado': 'ha sido confirmado',
            'en_ruta': 'está en camino',
            'completado': 'ha sido completado',
            'cancelado': 'ha sido cancelado'
        }
        
        mensaje_estado = estados_mensaje.get(estado_nuevo, f'cambió a {estado_nuevo}')
        
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo="🚌 Estado de viaje actualizado",
            mensaje=f"Tu viaje de {viaje_info.get('origen', '')} a {viaje_info.get('destino', '')} {mensaje_estado}",
            tipo_codigo="estado_viaje",
            data_extra={
                "viaje_id": viaje_info.get('viaje_id'),
                "estado_anterior": estado_anterior,
                "estado_nuevo": estado_nuevo,
                "fecha_cambio": timezone.now().isoformat()
            },
            prioridad="normal" if estado_nuevo != "cancelado" else "alta"
        )
    
    @staticmethod
    def deuda_pendiente(usuario, deuda_info: Dict[str, Any]):
        """Notificación automática de deuda pendiente"""
        monto = deuda_info.get('monto', 0)
        concepto = deuda_info.get('concepto', 'Servicio')
        dias_vencimiento = deuda_info.get('dias_vencimiento', 0)
        
        if dias_vencimiento > 0:
            titulo = "⚠️ Deuda próxima a vencer"
            urgencia = "normal"
        else:
            titulo = "🚨 ¡Deuda vencida!"
            urgencia = "alta"
        
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo=titulo,
            mensaje=f"Tienes una deuda de ${monto} por {concepto}. {'Vence en ' + str(dias_vencimiento) + ' días' if dias_vencimiento > 0 else 'Deuda vencida'}",
            tipo_codigo="deuda_pendiente",
            data_extra={
                "deuda_id": deuda_info.get('deuda_id'),
                "monto": str(monto),
                "concepto": concepto,
                "dias_vencimiento": dias_vencimiento,
                "fecha_vencimiento": deuda_info.get('fecha_vencimiento'),
                "url_pago": deuda_info.get('url_pago', '')
            },
            prioridad=urgencia
        )
    
    @staticmethod
    def confirmacion_general(usuario, confirmacion_info: Dict[str, Any]):
        """Notificación de confirmación general para cualquier acción"""
        accion = confirmacion_info.get('accion', 'Acción')
        resultado = confirmacion_info.get('resultado', 'exitoso')
        
        if resultado == 'exitoso':
            titulo = f"✅ {accion} confirmado"
            emoji = "✅"
        else:
            titulo = f"❌ {accion} falló"
            emoji = "❌"
        
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo=titulo,
            mensaje=f"{emoji} {confirmacion_info.get('mensaje', f'{accion} se ha procesado')}",
            tipo_codigo="confirmacion_accion",
            data_extra={
                "accion": accion,
                "resultado": resultado,
                "detalles": confirmacion_info.get('detalles', {}),
                "timestamp": timezone.now().isoformat()
            },
            prioridad="normal"
        )
    
    @staticmethod
    def alerta_emergencia(usuario, alerta_info: Dict[str, Any]):
        """
        Factory method para crear notificaciones de alerta de emergencia.
        
        Estas notificaciones tienen máxima prioridad y configuración especial
        para asegurar entrega inmediata con sonido de emergencia.
        """
        tipo_alerta = alerta_info.get('tipo_alerta', 'emergencia')
        ubicacion = alerta_info.get('ubicacion', '')
        descripcion = alerta_info.get('descripcion', '')
        nivel_gravedad = alerta_info.get('nivel_gravedad', 'alto')
        
        # Mapeo de tipos de alerta a emojis
        emojis_alerta = {
            'inundacion': '🌊',
            'terremoto': '🌋',
            'incendio': '🔥',
            'deslizamiento': '🏔️',
            'bloqueo_carreteras': '🚧',
            'alerta_climatica': '⛈️',
            'emergencia_medica': '🚑',
            'emergencia': '🚨'
        }
        
        # Mapeo de niveles de gravedad
        niveles_gravedad = {
            'bajo': '🟢',
            'medio': '🟡', 
            'alto': '🟠',
            'critico': '🔴'
        }
        
        emoji_tipo = emojis_alerta.get(tipo_alerta, '🚨')
        emoji_nivel = niveles_gravedad.get(nivel_gravedad, '🔴')
        
        titulo = f"{emoji_tipo} ALERTA: {tipo_alerta.replace('_', ' ').title()}"
        
        mensaje_base = f"{emoji_nivel} {descripcion}"
        if ubicacion:
            mensaje_base += f" en {ubicacion}"
        
        # Instrucciones específicas
        instrucciones = alerta_info.get('instrucciones', '')
        if instrucciones:
            mensaje_base += f"\n📋 {instrucciones}"
        
        # Contacto de emergencia
        contacto = alerta_info.get('contacto_emergencia', '911')
        if contacto:
            mensaje_base += f"\n📞 Emergencias: {contacto}"
        
        # Determinar prioridad basada en nivel de gravedad
        prioridades = {
            'bajo': 'normal',
            'medio': 'alta', 
            'alto': 'critica',
            'critico': 'critica'
        }
        
        prioridad = prioridades.get(nivel_gravedad, 'critica')
        
        NotificationService.enviar_notificacion(
            usuario_id=usuario.id,
            titulo=titulo,
            mensaje=mensaje_base,
            tipo_codigo="alerta_emergencia",
            data_extra={
                "alerta_id": alerta_info.get('alerta_id', ''),
                "tipo_alerta": tipo_alerta,
                "ubicacion": ubicacion,
                "nivel_gravedad": nivel_gravedad,
                "zona_afectada": alerta_info.get('zona_afectada', ''),
                "instrucciones": instrucciones,
                "contacto_emergencia": contacto,
                "timestamp_alerta": alerta_info.get('timestamp_alerta', ''),
                "sonido_emergencia": True,  # Activar sonido especial
                "vibrar": True,            # Activar vibración en móvil
                "pantalla_completa": nivel_gravedad in ['alto', 'critico'],  # Pantalla completa para alertas críticas
                "persistente": True        # Notification no se auto-oculta
            },
            prioridad=prioridad
        )


class RegistrarFCMTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.data.get('token')
        tipo_dispositivo = request.data.get('tipo_dispositivo', 'Android')
        usuario = request.user

        if not token:
            return Response({'error': 'Token FCM requerido'}, status=status.HTTP_400_BAD_REQUEST)

        DispositivoFCM.objects.update_or_create(
            usuario=usuario,
            defaults={'token': token, 'tipo_dispositivo': tipo_dispositivo, 'activo': True}
        )
        return Response({'success': True})

