#!/usr/bin/env python
"""
Script para poblar datos iniciales en la base de datos
"""

import subprocess
import sys


def run_command(command, description):
    """Ejecutar un comando y mostrar el resultado"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(
            command, shell=True, check=True, capture_output=True, text=True
        )
        print(f"✅ {description} completado")
        if result.stdout:
            print(f"📋 Salida: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error en {description}: {e}")
        if e.stderr:
            print(f"📋 Error: {e.stderr}")
        return False


def main():
    """Función principal"""
    print("🌱 Poblando datos iniciales...")

    # Ejecutar el script de población de datos
    command = "docker compose exec backend python manage.py shell -c \"exec(open('populate_initial_data.py').read())\""

    if run_command(command, "Poblando datos iniciales"):
        print("🎉 Datos iniciales poblados exitosamente!")
        print("\n📋 Ahora puedes:")
        print("1. Acceder al admin: http://localhost:8000/admin/")
        print("2. Usuario: admin")
        print("3. Contraseña: admin123")
        print("4. Probar las APIs del frontend")
    else:
        print("❌ Error al poblar datos iniciales")
        sys.exit(1)


if __name__ == "__main__":
    main()
