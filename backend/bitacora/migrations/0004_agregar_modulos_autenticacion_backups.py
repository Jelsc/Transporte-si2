# Generated manually
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('bitacora', '0003_agregar_modulos_reportes_facturacion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bitacora',
            name='modulo',
            field=models.CharField(
                choices=[
                    ('USUARIOS', 'Usuarios'),
                    ('ADMINISTRACION', 'Administracion'),
                    ('TRANSPORTE', 'Transporte'),
                    ('RESERVAS', 'Reservas'),
                    ('PAGOS', 'Pagos'),
                    ('REPORTES', 'Reportes'),
                    ('FACTURACION', 'Facturación'),
                    ('AUTENTICACION', 'Autenticación'),
                    ('BACKUPS', 'Backups'),
                    ('GENERAL', 'General'),
                ],
                default='GENERAL',
                max_length=50
            ),
        ),
    ]

