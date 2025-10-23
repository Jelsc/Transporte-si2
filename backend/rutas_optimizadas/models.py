from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from vehiculos.models import Vehiculo
from ubicaciones.models import Ubicacion


class SolicitudRuta(models.Model):
    """
    Solicitud de optimización de ruta.
    El usuario ingresa los puntos a visitar y el sistema calcula la ruta óptima.
    """
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('procesando', 'Procesando'),
        ('completado', 'Completado'),
        ('fallido', 'Fallido'),
        ('cancelado', 'Cancelado')
    ]
    
    # Metadatos de la solicitud
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha y hora de creación de la solicitud"
    )
    fecha_viaje = models.DateField(
        help_text="Fecha planificada para el viaje"
    )
    hora_inicio = models.TimeField(
        help_text="Hora de inicio del viaje desde el depot"
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='pendiente',
        help_text="Estado actual de la solicitud"
    )
    
    # Vehículos disponibles para esta optimización
    vehiculos_disponibles = models.ManyToManyField(
        Vehiculo,
        related_name='solicitudes_ruta',
        help_text="Vehículos que pueden ser asignados a esta ruta"
    )
    
    # Relación con viaje original (para reutilización)
    viaje_origen = models.ForeignKey(
        'viajes.Viaje',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_ruta',
        help_text="Viaje comercial original que generó esta solicitud"
    )
    
    # Ubicación de inicio/fin (depot)
    depot = models.ForeignKey(
        Ubicacion,
        on_delete=models.PROTECT,
        related_name='solicitudes_depot',
        null=True,
        blank=True,
        help_text="Ubicación de inicio y fin de las rutas (ej: terminal, almacén)"
    )
    
    # Resultados de la optimización
    mensaje_resultado = models.TextField(
        blank=True,
        null=True,
        help_text="Mensaje de resultado o error de la optimización"
    )
    
    # Timestamps
    fecha_procesamiento = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora en que se procesó la solicitud"
    )
    
    class Meta:
        db_table = 'solicitudes_ruta'
        verbose_name = 'Solicitud de Ruta'
        verbose_name_plural = 'Solicitudes de Ruta'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['fecha_viaje']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        return f"Solicitud {self.id} - {self.fecha_viaje} ({self.estado})"
    
    @property
    def tiene_rutas(self):
        """Indica si la solicitud tiene rutas optimizadas generadas"""
        return self.rutas_optimizadas.exists()
    
    @property
    def numero_entregas(self):
        """Número de entregas/recogidas en esta solicitud"""
        return self.entregas.count()


class Entrega(models.Model):
    """
    Entrega o recogida que debe ser incluida en la ruta optimizada.
    Representa un punto de pickup o delivery en el problema VRP.
    """
    TIPOS = [
        ('pickup', 'Recogida'),
        ('delivery', 'Entrega'),
        ('both', 'Recogida y Entrega')
    ]
    
    solicitud = models.ForeignKey(
        SolicitudRuta,
        on_delete=models.CASCADE,
        related_name='entregas',
        help_text="Solicitud de ruta a la que pertenece esta entrega"
    )
    
    ubicacion = models.ForeignKey(
        Ubicacion,
        on_delete=models.PROTECT,
        related_name='entregas',
        help_text="Ubicación donde se realiza la entrega/recogida"
    )
    
    tipo = models.CharField(
        max_length=10,
        choices=TIPOS,
        default='delivery',
        help_text="Tipo de operación: recogida, entrega o ambas"
    )
    
    # Ventanas de tiempo
    ventana_tiempo_inicio = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora más temprana para atender esta ubicación"
    )
    ventana_tiempo_fin = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora más tardía para atender esta ubicación"
    )
    
    # Demanda (peso, volumen, cantidad)
    demanda_peso = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Peso de la carga en kg"
    )
    demanda_volumen = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Volumen de la carga en m³"
    )
    
    # Tiempo de servicio (se puede sobreescribir el de la ubicación)
    tiempo_servicio_min = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Tiempo de servicio en minutos (si es diferente al de la ubicación)"
    )
    
    # Prioridad
    prioridad = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Prioridad de la entrega (1=normal, mayor=más urgente)"
    )
    
    # Información adicional
    observaciones = models.TextField(
        blank=True,
        null=True,
        help_text="Observaciones adicionales sobre la entrega"
    )
    
    class Meta:
        db_table = 'entregas'
        verbose_name = 'Entrega'
        verbose_name_plural = 'Entregas'
        ordering = ['solicitud', 'prioridad']
        indexes = [
            models.Index(fields=['solicitud', 'tipo']),
        ]
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.ubicacion.nombre}"
    
    def get_tiempo_servicio(self):
        """Obtiene el tiempo de servicio: personalizado o el de la ubicación"""
        return self.tiempo_servicio_min or self.ubicacion.service_min
    
    def clean(self):
        """Validaciones personalizadas"""
        super().clean()
        
        # Validar ventanas de tiempo
        if self.ventana_tiempo_inicio and self.ventana_tiempo_fin:
            if self.ventana_tiempo_inicio >= self.ventana_tiempo_fin:
                raise ValidationError({
                    'ventana_tiempo_fin': 'La hora de fin debe ser posterior a la hora de inicio'
                })


class RutaOptimizada(models.Model):
    """
    Ruta calculada por el solver VRP.
    Representa una solución optimizada para un vehículo específico.
    """
    solicitud = models.ForeignKey(
        SolicitudRuta,
        on_delete=models.CASCADE,
        related_name='rutas_optimizadas',
        help_text="Solicitud de ruta que generó esta solución"
    )
    
    vehiculo = models.ForeignKey(
        Vehiculo,
        on_delete=models.PROTECT,
        related_name='rutas_optimizadas',
        help_text="Vehículo asignado a esta ruta"
    )
    
    # Orden de la ruta (si hay múltiples vehículos)
    numero_ruta = models.PositiveIntegerField(
        default=1,
        help_text="Número de ruta (1, 2, 3... si hay múltiples vehículos)"
    )
    
    # Métricas de la ruta
    distancia_total_km = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Distancia total de la ruta en kilómetros"
    )
    
    tiempo_total_min = models.PositiveIntegerField(
        default=0,
        help_text="Tiempo total de la ruta en minutos (incluyendo servicio)"
    )
    
    carga_total_kg = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Carga total transportada en kg"
    )
    
    # Costo estimado
    costo_estimado = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Costo estimado de la ruta"
    )
    
    # Hora de inicio y fin
    hora_inicio = models.TimeField(
        help_text="Hora de inicio de la ruta desde el depot"
    )
    hora_fin_estimada = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora estimada de regreso al depot"
    )
    
    # Estado de ejecución
    completada = models.BooleanField(
        default=False,
        help_text="Indica si la ruta ha sido completada"
    )
    
    # Timestamps
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rutas_optimizadas'
        verbose_name = 'Ruta Optimizada'
        verbose_name_plural = 'Rutas Optimizadas'
        ordering = ['solicitud', 'numero_ruta']
        indexes = [
            models.Index(fields=['solicitud', 'vehiculo']),
            models.Index(fields=['completada']),
        ]
        unique_together = [['solicitud', 'numero_ruta']]
    
    def __str__(self):
        return f"Ruta {self.numero_ruta} - {self.vehiculo.nombre} ({self.distancia_total_km}km)"
    
    @property
    def numero_paradas(self):
        """Número de paradas en esta ruta"""
        return self.paradas.count()
    
    @property
    def utilizacion_capacidad(self):
        """Porcentaje de utilización de la capacidad del vehículo"""
        if self.vehiculo.capacidad_carga > 0:
            return (float(self.carga_total_kg) / float(self.vehiculo.capacidad_carga)) * 100
        return 0


class Parada(models.Model):
    """
    Parada individual en una ruta optimizada.
    Representa cada ubicación visitada en el orden calculado.
    """
    ruta = models.ForeignKey(
        RutaOptimizada,
        on_delete=models.CASCADE,
        related_name='paradas',
        help_text="Ruta a la que pertenece esta parada"
    )
    
    entrega = models.ForeignKey(
        Entrega,
        on_delete=models.PROTECT,
        related_name='paradas_asignadas',
        null=True,
        blank=True,
        help_text="Entrega asociada a esta parada (null si es depot)"
    )
    
    ubicacion = models.ForeignKey(
        Ubicacion,
        on_delete=models.PROTECT,
        related_name='paradas',
        help_text="Ubicación de esta parada"
    )
    
    # Orden en la ruta
    orden = models.PositiveIntegerField(
        help_text="Orden de visita en la ruta (0=depot inicio, N+1=depot fin)"
    )
    
    # Tiempos
    tiempo_llegada_estimado = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora estimada de llegada a esta parada"
    )
    tiempo_salida_estimado = models.TimeField(
        null=True,
        blank=True,
        help_text="Hora estimada de salida de esta parada"
    )
    tiempo_servicio_min = models.PositiveIntegerField(
        default=0,
        help_text="Tiempo de servicio en esta parada en minutos"
    )
    
    # Distancia desde la parada anterior
    distancia_desde_anterior_km = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Distancia desde la parada anterior en km"
    )
    
    # Estado
    es_depot = models.BooleanField(
        default=False,
        help_text="Indica si esta parada es el depot (inicio/fin)"
    )
    completada = models.BooleanField(
        default=False,
        help_text="Indica si esta parada ha sido visitada"
    )
    
    # Timestamps reales (cuando se ejecuta la ruta)
    hora_llegada_real = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Hora real de llegada (cuando se ejecuta la ruta)"
    )
    hora_salida_real = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Hora real de salida (cuando se ejecuta la ruta)"
    )
    
    # Observaciones
    observaciones = models.TextField(
        blank=True,
        null=True,
        help_text="Observaciones sobre esta parada"
    )
    
    class Meta:
        db_table = 'paradas'
        verbose_name = 'Parada'
        verbose_name_plural = 'Paradas'
        ordering = ['ruta', 'orden']
        indexes = [
            models.Index(fields=['ruta', 'orden']),
            models.Index(fields=['ubicacion']),
        ]
        unique_together = [['ruta', 'orden']]
    
    def __str__(self):
        return f"Parada {self.orden} - {self.ubicacion.nombre}"
    
    def clean(self):
        """Validaciones personalizadas"""
        super().clean()
        
        # Validar que depot no tenga entrega asociada
        if self.es_depot and self.entrega:
            raise ValidationError({
                'entrega': 'Las paradas de depot no deben tener entrega asociada'
            })
        
        # Validar que no-depot tenga entrega asociada
        if not self.es_depot and not self.entrega:
            raise ValidationError({
                'entrega': 'Las paradas normales deben tener una entrega asociada'
            })
