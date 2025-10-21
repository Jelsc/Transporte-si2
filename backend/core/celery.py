"""
Configuración de Celery para el proyecto Django
"""

import os
from celery import Celery

# Configurar Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Configurar Celery usando variables de entorno
app.config_from_object('django.conf:settings', namespace='CELERY')

# Descubrir tareas automáticamente
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
