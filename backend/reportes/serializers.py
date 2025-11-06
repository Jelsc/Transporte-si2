from rest_framework import serializers
from .models import ReporteGenerado


class ReporteGeneradoSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    archivo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ReporteGenerado
        fields = [
            'id', 'titulo', 'tipo', 'tipo_display', 'categoria', 'categoria_display',
            'archivo', 'archivo_url', 'parametros', 'usuario', 'usuario_nombre',
            'fecha_generacion', 'tamaño_archivo', 'tiempo_generacion'
        ]
        read_only_fields = ['id', 'fecha_generacion', 'tamaño_archivo', 'tiempo_generacion']
    
    def get_archivo_url(self, obj):
        if obj.archivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo.url)
        return None


class GenerarReporteRequestSerializer(serializers.Serializer):
    """Serializer para la solicitud de generación de reportes"""
    tipo = serializers.ChoiceField(choices=['pdf', 'excel', 'imagen'])
    categoria = serializers.ChoiceField(
        choices=['viajes', 'encomiendas', 'conductores', 'vehiculos', 'financiero', 'general']
    )
    titulo = serializers.CharField(max_length=255, required=False)
    fecha_inicio = serializers.DateField(required=False)
    fecha_fin = serializers.DateField(required=False)
    filtros = serializers.JSONField(required=False, default=dict)
    
    def validate(self, data):
        # Validar que fecha_inicio sea menor que fecha_fin
        if data.get('fecha_inicio') and data.get('fecha_fin'):
            if data['fecha_inicio'] > data['fecha_fin']:
                raise serializers.ValidationError({
                    'fecha_inicio': 'La fecha de inicio debe ser anterior a la fecha fin'
                })
        return data
