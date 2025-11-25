# reclamos/serializers.py
from rest_framework import serializers
from .models import ReclamosCategoria, Reclamo, ReclamoDetalle, ReclamoAdjunto

class ReclamosCategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReclamosCategoria
        fields = ['id', 'nombre']

class ReclamoAdjuntoSerializer(serializers.ModelSerializer):
    tipo_archivo = serializers.SerializerMethodField()
    url_archivo = serializers.SerializerMethodField()

    class Meta:
        model = ReclamoAdjunto
        fields = ['id', 'nombre_archivo', 'archivo', 'tipo_archivo', 'url_archivo', 'fecha_subida']
        read_only_fields = ['fecha_subida']

    def get_tipo_archivo(self, obj):
        return obj.tipo_archivo()

    def get_url_archivo(self, obj):
        if obj.archivo:
            return obj.archivo.url
        return None

class ReclamoDetalleSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()
    fecha_formateada = serializers.SerializerMethodField()

    class Meta:
        model = ReclamoDetalle
        fields = ['id', 'autor', 'autor_nombre', 'mensaje', 'fecha', 'fecha_formateada']
        read_only_fields = ['autor', 'fecha']

    def get_autor_nombre(self, obj):
        if obj.autor:
            return obj.autor.get_full_name() or obj.autor.username
        return "Usuario eliminado"

    def get_fecha_formateada(self, obj):
        return obj.fecha.strftime("%d/%m/%Y %H:%M") if obj.fecha else None

class ReclamoSerializer(serializers.ModelSerializer):
    # Campos de solo lectura
    usuario_nombre = serializers.SerializerMethodField()
    categoria_nombre = serializers.SerializerMethodField()
    agente_nombre = serializers.SerializerMethodField()
    numero_reclamo = serializers.SerializerMethodField()
    estado_display = serializers.SerializerMethodField()
    prioridad_display = serializers.SerializerMethodField()
    
    # Relaciones anidadas
    detalles = ReclamoDetalleSerializer(many=True, read_only=True)
    adjuntos = ReclamoAdjuntoSerializer(many=True, read_only=True)

    class Meta:
        model = Reclamo
        fields = [
            'id', 'numero_reclamo', 'titulo', 'descripcion', 'numero_guia',
            'categoria', 'categoria_nombre', 'usuario', 'usuario_nombre',
            'agente', 'agente_nombre', 'estado', 'estado_display',
            'prioridad', 'prioridad_display', 'fecha_creacion', 'fecha_cierre',
            'servicio_relacionado', 'detalles', 'adjuntos'
        ]
        read_only_fields = ['usuario', 'fecha_creacion', 'fecha_cierre']

    def get_usuario_nombre(self, obj):
        if obj.usuario:
            return obj.usuario.get_full_name() or obj.usuario.username
        return "Usuario eliminado"

    def get_categoria_nombre(self, obj):
        if obj.categoria:
            return obj.categoria.nombre
        return "Sin categoría"

    def get_agente_nombre(self, obj):
        if obj.agente:
            return obj.agente.get_full_name() or obj.agente.username
        return "Sin asignar"

    def get_numero_reclamo(self, obj):
        return f"REC-{obj.id:04d}"

    def get_estado_display(self, obj):
        return obj.get_estado_display()

    def get_prioridad_display(self, obj):
        return obj.get_prioridad_display()

class ReclamoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reclamo
        fields = [
            'titulo', 'descripcion', 'categoria', 'numero_guia', 
            'servicio_relacionado', 'prioridad'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['usuario'] = request.user
        return super().create(validated_data)

class ReclamoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reclamo
        fields = [
            'estado', 'prioridad', 'agente', 'fecha_cierre'
        ]