# Generated manually
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('encomiendas', '0003_remove_encomienda_encomiendas_codigo__03c4bb_idx_and_more'),
        ('viajes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='encomienda',
            name='viaje',
            field=models.ForeignKey(
                blank=True,
                help_text='Viaje asignado a esta encomienda (debe tener el mismo destino)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='encomiendas',
                to='viajes.viaje'
            ),
        ),
    ]

