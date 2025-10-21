from django.apps import AppConfig


class ViajesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'viajes'

    def ready(self):
        # Importar señales para que se registren
        import viajes.models  # Esto fuerza a que se carguen las señales
        print("🚀 APP VIAJES LISTA - Señales cargadas")