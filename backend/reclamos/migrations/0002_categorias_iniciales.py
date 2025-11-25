# reclamos/migrations/0002_categorias_iniciales.py
from django.db import migrations

def crear_categorias_iniciales(apps, schema_editor):
    ReclamosCategoria = apps.get_model('reclamos', 'ReclamosCategoria')
    
    categorias = [
        "Retraso en el servicio",
        "Paquete dañado", 
        "Paquete extraviado",
        "Problemas de facturación",
        "Mala atención al cliente",
        "Error en la entrega",
        "Problemas con el conductor",
        "Falta de información",
        "Problemas con el seguimiento",
        "Otros"
    ]
    
    for nombre in categorias:
        ReclamosCategoria.objects.get_or_create(nombre=nombre)

def eliminar_categorias(apps, schema_editor):
    ReclamosCategoria = apps.get_model('reclamos', 'ReclamosCategoria')
    ReclamosCategoria.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('reclamos', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(crear_categorias_iniciales, eliminar_categorias),
    ]