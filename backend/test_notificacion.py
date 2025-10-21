#!/usr/bin/env python3
"""
Archivo de testeo para notificaciones - Transporte SI2
=====================================================

Este archivo te permite enviar notificaciones de prueba con los atributos que desees.
Simplemente modifica las variables en la sección CONFIGURACIÓN y ejecuta el script.

Uso:
    docker-compose exec backend python test_notificacion.py
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth import get_user_model
from notificaciones.utils import registrar_notificacion

User = get_user_model()


def enviar_notificacion_prueba():
    """
    Envía una notificación de prueba con los atributos especificados.
    Modifica estas variables según tus necesidades.
    """

    # ========================================
    # CONFIGURACIÓN DE LA NOTIFICACIÓN
    # ========================================

    # Usuario destino (cambia el ID según necesites)
    usuario_id = 13  # messi - que ahora tiene dispositivo FCM automático

    # Atributos de la notificación
    accion = "Deuda de viaje señor tomas"  # Acción realizada
    descripcion = (
        "Se le olvido pagar el viaje su cuota es de $300"  # Descripción detallada
    )
    modulo = "PAGOS"  # Módulo del sistema (SISTEMA, PAGOS, VIAJES, etc.)
    tipo_codigo = "deuda_pendiente"  # Código del tipo de notificación
    prioridad = "alta"  # baja, normal, alta, critica

    # Datos adicionales (opcional)
    data_extra = {
        "test_id": "12345",
        "timestamp": "2025-01-11",
        "version": "1.0",
        "personalizado": True,
    }

    # Configuración de push
    enviar_push = (
        True  # True para enviar push notification, False para solo guardar en BD
    )

    # ========================================
    # ENVÍO DE LA NOTIFICACIÓN
    # ========================================

    try:
        # Obtener el usuario
        usuario = User.objects.get(id=usuario_id)
        print(f"✅ Usuario encontrado: {usuario.username} (ID: {usuario.id})")

        # Enviar notificación
        notificacion = registrar_notificacion(
            usuario_destino=usuario,
            accion=accion,
            descripcion=descripcion,
            modulo=modulo,
            tipo_codigo=tipo_codigo,
            data_extra=data_extra,
            prioridad=prioridad,
            enviar_push=enviar_push,
        )

        print(f"✅ Notificación enviada exitosamente!")
        print(f"📝 ID de notificación: {notificacion.id}")
        print(f"📄 Título: {notificacion.titulo}")
        print(f"📄 Mensaje: {notificacion.mensaje}")
        print(f"🔔 Tipo: {notificacion.tipo.nombre}")
        print(f"🎯 Prioridad: {notificacion.prioridad}")
        print(f"👤 Usuario destino: {notificacion.usuario.username}")
        print(f"📅 Fecha: {notificacion.fecha_creacion}")
        print(f"📱 Push enviado: {'Sí' if enviar_push else 'No'}")

        return notificacion

    except User.DoesNotExist:
        print(f"❌ Error: Usuario con ID {usuario_id} no encontrado.")
        return None
    except Exception as e:
        print(f"❌ Error general: {e}")
        return None


def enviar_notificacion_bienvenida():
    """
    Envía una notificación de bienvenida usando la función específica.
    """
    try:
        usuario_id = 13  # messi - que ahora tiene dispositivo FCM automático
        usuario = User.objects.get(id=usuario_id)

        print(f"✅ Enviando notificación de bienvenida a: {usuario.username}")

        from notificaciones.utils import verificar_y_enviar_bienvenida

        notificacion = verificar_y_enviar_bienvenida(usuario)

        if notificacion:
            print(f"✅ Notificación de bienvenida enviada!")
            print(f"📝 ID: {notificacion.id}")
            print(f"📄 Título: {notificacion.titulo}")
            print(f"📄 Mensaje: {notificacion.mensaje}")
        else:
            print("ℹ️  No se envió notificación (usuario ya tiene bienvenida)")

        return notificacion

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def listar_usuarios():
    """Lista todos los usuarios disponibles para testing."""
    usuarios = User.objects.all()
    print("👥 Usuarios disponibles:")
    for usuario in usuarios:
        print(
            f"   ID: {usuario.id} - Username: {usuario.username} - Email: {usuario.email}"
        )


if __name__ == "__main__":
    print("🚀 SISTEMA DE TESTEO DE NOTIFICACIONES - TRANSPORTE SI2")
    print("=" * 60)

    # Mostrar usuarios disponibles
    listar_usuarios()
    print()

    # Enviar notificación de prueba
    print("📤 Enviando notificación de prueba...")
    notificacion = enviar_notificacion_prueba()

    if notificacion:
        print("\n🎉 ¡Notificación enviada exitosamente!")
        print(
            "💡 Modifica las variables en la función para personalizar las notificaciones."
        )
    else:
        print("\n❌ Error al enviar la notificación.")

    print("\n" + "=" * 60)
    print("📋 OPCIONES DISPONIBLES:")
    print("1. Modifica las variables en enviar_notificacion_prueba()")
    print("2. Cambia usuario_id para enviar a otro usuario")
    print("3. Modifica accion, descripcion, modulo, etc.")
    print("4. Usa enviar_notificacion_bienvenida() para notificaciones de bienvenida")
    print("5. Ejecuta: docker-compose exec backend python test_notificacion.py")
