# reclamos/management/commands/cargar_categorias.py
from django.core.management.base import BaseCommand
from reclamos.models import ReclamosCategoria

class Command(BaseCommand):
    help = 'Carga las categorías iniciales para el sistema de reclamos'
    
    def handle(self, *args, **options):
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
            categoria, created = ReclamosCategoria.objects.get_or_create(nombre=nombre)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Categoría creada: {nombre}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Categoría ya existía: {nombre}')
                )