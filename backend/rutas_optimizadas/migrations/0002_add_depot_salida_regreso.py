# Generated migration for depot_salida and depot_regreso fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ubicaciones', '0001_initial'),
        ('rutas_optimizadas', '0001_initial'),
    ]

    operations = [
        # Agregar depot_salida
        migrations.AddField(
            model_name='solicitudruta',
            name='depot_salida',
            field=models.ForeignKey(
                blank=True,
                help_text='Ubicación de inicio/salida de las rutas (ej: terminal, almacén)',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='solicitudes_depot_salida',
                to='ubicaciones.ubicacion'
            ),
        ),
        # Agregar depot_regreso
        migrations.AddField(
            model_name='solicitudruta',
            name='depot_regreso',
            field=models.ForeignKey(
                blank=True,
                help_text='Ubicación de fin/regreso de las rutas (puede ser diferente al de salida)',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='solicitudes_depot_regreso',
                to='ubicaciones.ubicacion'
            ),
        ),
        # Renombrar related_name del campo depot legacy
        migrations.AlterField(
            model_name='solicitudruta',
            name='depot',
            field=models.ForeignKey(
                blank=True,
                help_text='[DEPRECADO] Use depot_salida y depot_regreso',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='solicitudes_depot_legacy',
                to='ubicaciones.ubicacion'
            ),
        ),
        # Migración de datos: copiar depot -> depot_salida y depot_regreso
        migrations.RunSQL(
            """
            UPDATE solicitudes_ruta 
            SET depot_salida_id = depot_id, depot_regreso_id = depot_id 
            WHERE depot_id IS NOT NULL;
            """,
            reverse_sql="""
            UPDATE solicitudes_ruta 
            SET depot_id = depot_salida_id 
            WHERE depot_salida_id IS NOT NULL;
            """
        ),
    ]
