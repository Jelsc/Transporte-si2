from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_customuser_ci_customuser_conductor_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customuser',
            name='codigo_empleado',
        ),
        migrations.RemoveField(
            model_name='customuser',
            name='departamento',
        ),
    ]