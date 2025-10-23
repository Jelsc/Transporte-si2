# Generated manually for ubicaciones app

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Ubicacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(choices=[('TERMINAL', 'Terminal'), ('AGENCIA', 'Agencia'), ('PRIVADO', 'Privado')], default='TERMINAL', help_text='Tipo de ubicación', max_length=20)),
                ('nombre', models.CharField(help_text='Nombre de la ubicación (3-120 caracteres)', max_length=120)),
                ('direccion_texto', models.CharField(blank=True, help_text='Dirección en texto libre', max_length=255, null=True)),
                ('descripcion', models.TextField(blank=True, help_text='Descripción adicional de la ubicación', null=True)),
                ('lat', models.DecimalField(decimal_places=6, help_text='Latitud (-90 a 90)', max_digits=9, validators=[django.core.validators.MinValueValidator(-90), django.core.validators.MaxValueValidator(90)])),
                ('lng', models.DecimalField(decimal_places=6, help_text='Longitud (-180 a 180)', max_digits=9, validators=[django.core.validators.MinValueValidator(-180), django.core.validators.MaxValueValidator(180)])),
                ('service_min', models.PositiveIntegerField(default=5, help_text='Tiempo mínimo de servicio en minutos (≥0)')),
                ('source', models.CharField(choices=[('MANUAL', 'Manual'), ('GEOCODED_NOMINATIM', 'Geocodificado con Nominatim')], default='MANUAL', help_text='Fuente de las coordenadas', max_length=20)),
                ('place_id', models.CharField(blank=True, help_text='ID del lugar en el servicio de geocodificación', max_length=255, null=True)),
                ('osm_id', models.CharField(blank=True, help_text='ID de OpenStreetMap', max_length=255, null=True)),
                ('geohash', models.CharField(blank=True, db_index=True, help_text='Geohash para indexación espacial', max_length=12, null=True)),
                ('activo', models.BooleanField(default=True, help_text='Indica si la ubicación está activa')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Ubicación',
                'verbose_name_plural': 'Ubicaciones',
                'db_table': 'ubicaciones',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='ubicacion',
            index=models.Index(fields=['tipo'], name='ubicaciones_tipo_idx'),
        ),
        migrations.AddIndex(
            model_name='ubicacion',
            index=models.Index(fields=['activo'], name='ubicaciones_activo_idx'),
        ),
        migrations.AddIndex(
            model_name='ubicacion',
            index=models.Index(fields=['geohash'], name='ubicaciones_geohash_idx'),
        ),
        migrations.AddIndex(
            model_name='ubicacion',
            index=models.Index(fields=['lat', 'lng'], name='ubicaciones_coords_idx'),
        ),
    ]
