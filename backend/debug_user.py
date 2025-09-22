#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transporte.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Verificar usuario admin
admin = User.objects.get(username='admin')
print(f'Usuario: {admin.username}')
print(f'is_superuser: {admin.is_superuser}')
print(f'is_staff: {admin.is_staff}')
print(f'Rol: {admin.rol}')
print(f'Puede acceder admin: {admin.puede_acceder_admin}')
print(f'Tiene permiso gestionar_usuarios: {admin.tiene_permiso("gestionar_usuarios")}')

# Verificar si hay otros usuarios
print('\nTodos los usuarios:')
for user in User.objects.all():
    print(f'  {user.username} - is_superuser: {user.is_superuser} - rol: {user.rol}')
