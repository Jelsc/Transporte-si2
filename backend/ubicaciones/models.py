from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import geohash2


class TipoUbicacion(models.TextChoices):
    """Tipos de ubicaciones disponibles"""
    TERMINAL = 'TERMINAL', 'Terminal'
    AGENCIA = 'AGENCIA', 'Agencia'
    PRIVADO = 'PRIVADO', 'Privado'


class SourceUbicacion(models.TextChoices):
    """Fuente de la ubicación"""
    MANUAL = 'MANUAL', 'Manual'
    GEOCODED_NOMINATIM = 'GEOCODED_NOMINATIM', 'Geocodificado con Nominatim'


class Ubicacion(models.Model):
    """
    Modelo para gestionar ubicaciones del sistema.
    Catálogo único para viajes comerciales y encomiendas VRP/PDPTW.
    """
    
    # Campos básicos
    tipo = models.CharField(
        max_length=20,
        choices=TipoUbicacion.choices,
        default=TipoUbicacion.TERMINAL,
        help_text="Tipo de ubicación"
    )
    
    nombre = models.CharField(
        max_length=120,
        help_text="Nombre de la ubicación (3-120 caracteres)"
    )
    
    direccion_texto = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Dirección en texto libre"
    )
    
    descripcion = models.TextField(
        blank=True,
        null=True,
        help_text="Descripción adicional de la ubicación"
    )
    
    # Coordenadas geográficas
    lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
        help_text="Latitud (-90 a 90)"
    )
    
    lng = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
        help_text="Longitud (-180 a 180)"
    )
    
    # Tiempo de servicio
    service_min = models.PositiveIntegerField(
        default=5,
        help_text="Tiempo mínimo de servicio en minutos (≥0)"
    )
    
    # Metadatos de geocodificación
    source = models.CharField(
        max_length=20,
        choices=SourceUbicacion.choices,
        default=SourceUbicacion.MANUAL,
        help_text="Fuente de las coordenadas"
    )
    
    place_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="ID del lugar en el servicio de geocodificación"
    )
    
    osm_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="ID de OpenStreetMap"
    )
    
    geohash = models.CharField(
        max_length=12,
        blank=True,
        null=True,
        db_index=True,
        help_text="Geohash para indexación espacial"
    )
    
    # Estado
    activo = models.BooleanField(
        default=True,
        help_text="Indica si la ubicación está activa"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ubicaciones'
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['tipo']),
            models.Index(fields=['activo']),
            models.Index(fields=['geohash']),
            models.Index(fields=['lat', 'lng']),
        ]
    
    def __str__(self):
        return f"{self.nombre} ({self.tipo})"
    
    def clean(self):
        """Validaciones personalizadas del modelo"""
        super().clean()
        
        # Validar longitud del nombre
        if self.nombre and len(self.nombre.strip()) < 3:
            raise ValidationError({
                'nombre': 'El nombre debe tener al menos 3 caracteres'
            })
        
        # Validar que las coordenadas estén presentes
        if self.lat is None or self.lng is None:
            raise ValidationError({
                'lat': 'Las coordenadas lat/lng son obligatorias',
                'lng': 'Las coordenadas lat/lng son obligatorias'
            })
    
    def save(self, *args, **kwargs):
        """Sobrescribir save para generar geohash automáticamente"""
        # Generar geohash si no existe y tenemos coordenadas
        if not self.geohash and self.lat and self.lng:
            self.geohash = geohash2.encode(
                float(self.lat), 
                float(self.lng), 
                precision=7  # ~153m de precisión
            )
        
        # Validar antes de guardar
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def coordenadas(self):
        """Retorna las coordenadas como tupla (lat, lng)"""
        return (float(self.lat), float(self.lng))
    
    @property
    def geohash_cercano(self, precision=5):
        """
        Retorna un geohash de menor precisión para encontrar ubicaciones cercanas.
        Útil para deduplicación suave.
        """
        if self.lat and self.lng:
            return geohash2.encode(
                float(self.lat), 
                float(self.lng), 
                precision=precision
            )
        return None
    
    def get_ubicaciones_cercanas(self, precision=5, max_distancia_km=1.0):
        """
        Encuentra ubicaciones cercanas basándose en geohash.
        Útil para detectar duplicados potenciales.
        """
        if not self.geohash:
            return Ubicacion.objects.none()
        
        # Geohash de menor precisión para búsqueda
        geohash_busqueda = self.geohash[:precision]
        
        # Buscar ubicaciones con geohash similar
        ubicaciones_cercanas = Ubicacion.objects.filter(
            geohash__startswith=geohash_busqueda,
            activo=True
        ).exclude(id=self.id)
        
        # TODO: Implementar filtrado por distancia real si es necesario
        # Por ahora solo filtramos por geohash
        
        return ubicaciones_cercanas
