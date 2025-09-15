from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

User = get_user_model()


class PersonalEmpresa(models.Model):
    """Modelo para personal de la empresa (operadores, administradores, supervisores)"""
    
    TIPOS_PERSONAL_CHOICES = [
        ('administrador', 'Administrador'),
        ('supervisor', 'Supervisor'),
        ('operador', 'Operador'),
    ]
    
    ESTADOS_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('suspendido', 'Suspendido'),
        ('vacaciones', 'En Vacaciones'),
    ]
    
    # Relación con el usuario (opcional)
    usuario = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='personal_profile',
        verbose_name="Usuario",
        null=True,
        blank=True
    )
    
    # Datos personales básicos (para cuando no hay usuario vinculado)
    first_name = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Nombre"
    )
    
    last_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Apellido"
    )
    
    email = models.EmailField(
        blank=True,
        verbose_name="Email"
    )
    
    telefono = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Teléfono"
    )
    
    # Información específica del personal
    tipo_personal = models.CharField(
        max_length=20,
        choices=TIPOS_PERSONAL_CHOICES,
        blank=True,
        verbose_name="Tipo de Personal"
    )
    
    codigo_empleado = models.CharField(
        max_length=20,
        unique=True,
        validators=[RegexValidator(
            regex=r'^[A-Z0-9]+$',
            message='El código de empleado debe contener solo letras mayúsculas y números'
        )],
        verbose_name="Código de Empleado"
    )
    
    departamento = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Departamento"
    )
    
    cargo = models.CharField(
        max_length=100,
        verbose_name="Cargo"
    )
    
    # Información laboral
    fecha_ingreso = models.DateField(
        verbose_name="Fecha de Ingreso"
    )
    
    salario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Salario"
    )
    
    horario_trabajo = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Horario de Trabajo"
    )
    
    # Estado del empleado
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS_CHOICES,
        default='activo',
        verbose_name="Estado"
    )
    
    # Información adicional
    supervisor = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinados',
        verbose_name="Supervisor"
    )
    
    telefono_emergencia = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Teléfono de Emergencia"
    )
    
    contacto_emergencia = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Contacto de Emergencia"
    )
    
    # Campos de control
    es_activo = models.BooleanField(
        default=True,
        verbose_name="Activo"
    )
    
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )
    
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de Actualización"
    )
    
    # Campos para seguimiento
    ultimo_acceso = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Último Acceso"
    )
    
    class Meta:
        verbose_name = "Personal de Empresa"
        verbose_name_plural = "Personal de Empresa"
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        if self.usuario:
            return f"{self.usuario.get_full_name()} - {self.codigo_empleado} ({self.tipo_personal})"
        else:
            return f"{self.get_full_name()} - {self.codigo_empleado} ({self.tipo_personal})"
    
    def get_full_name(self):
        """Retorna el nombre completo del empleado"""
        if self.usuario:
            return self.usuario.get_full_name() or self.usuario.username
        else:
            return f"{self.first_name} {self.last_name}".strip() or "Sin nombre"
    
    @property
    def nombre_completo(self):
        """Retorna el nombre completo del empleado"""
        return self.get_full_name()
    
    @property
    def anos_antiguedad(self):
        """Calcula los años de antigüedad"""
        from django.utils import timezone
        from datetime import date
        
        hoy = date.today()
        anos = hoy.year - self.fecha_ingreso.year
        
        # Ajustar si aún no ha cumplido el año
        if hoy.month < self.fecha_ingreso.month or (
            hoy.month == self.fecha_ingreso.month and hoy.day < self.fecha_ingreso.day
        ):
            anos -= 1
        
        return max(0, anos)
    
    def cambiar_estado(self, nuevo_estado):
        """Cambia el estado del empleado"""
        if nuevo_estado in [choice[0] for choice in self.ESTADOS_CHOICES]:
            self.estado = nuevo_estado
            self.save(update_fields=['estado', 'fecha_actualizacion'])
            return True
        return False
    
    def actualizar_ultimo_acceso(self):
        """Actualiza el último acceso del empleado"""
        from django.utils import timezone
        
        self.ultimo_acceso = timezone.now()
        self.save(update_fields=['ultimo_acceso', 'fecha_actualizacion'])
    
    def puede_acceder_sistema(self):
        """Verifica si el empleado puede acceder al sistema"""
        if self.usuario:
            return (
                self.es_activo and 
                self.estado in ['activo', 'vacaciones'] and
                self.usuario.is_active
            )
        else:
            return (
                self.es_activo and 
                self.estado in ['activo', 'vacaciones']
            )
    
    def get_subordinados(self):
        """Retorna los subordinados directos"""
        return self.subordinados.filter(es_activo=True)
    
    def get_jerarquia(self):
        """Retorna la jerarquía completa (supervisor y subordinados)"""
        jerarquia = {
            'supervisor': self.supervisor,
            'subordinados': self.get_subordinados(),
            'nivel': self._calcular_nivel()
        }
        return jerarquia
    
    def _calcular_nivel(self):
        """Calcula el nivel jerárquico del empleado"""
        nivel = 0
        supervisor = self.supervisor
        
        while supervisor:
            nivel += 1
            supervisor = supervisor.supervisor
            # Evitar bucles infinitos
            if nivel > 10:
                break
        
        return nivel


class Departamento(models.Model):
    """Modelo para departamentos de la empresa"""
    
    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Nombre"
    )
    
    descripcion = models.TextField(
        blank=True,
        null=True,
        verbose_name="Descripción"
    )
    
    jefe_departamento = models.ForeignKey(
        PersonalEmpresa,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='departamentos_dirigidos',
        verbose_name="Jefe de Departamento"
    )
    
    presupuesto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Presupuesto"
    )
    
    es_activo = models.BooleanField(
        default=True,
        verbose_name="Activo"
    )
    
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )
    
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Fecha de Actualización"
    )
    
    class Meta:
        verbose_name = "Departamento"
        verbose_name_plural = "Departamentos"
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre
    
    def get_empleados(self):
        """Retorna todos los empleados del departamento"""
        return PersonalEmpresa.objects.filter(
            departamento=self.nombre,
            es_activo=True
        )
    
    def get_empleados_count(self):
        """Retorna el número de empleados del departamento"""
        return self.get_empleados().count()
