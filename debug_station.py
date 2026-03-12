
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Estacion, Laboratorio, Area, Usuario
import traceback

def diagnostic():
    try:
        # Create a dummy area and lab to test
        area, _ = Area.objects.get_or_create(nombre="TEST_AREA")
        admin = Usuario.objects.filter(is_superuser=True).first()
        
        print("Creating lab...")
        lab = Laboratorio.objects.create(
            nombre="LAB_TEST_DIAGNOSTIC",
            ubicacion="TEST",
            capacidad=10,
            area=area,
            responsable=admin
        )
        print(f"Lab created: {lab.id_laboratorio}")
        
        print("Attempting to create station...")
        # This is what the frontend does
        est = Estacion.objects.create(
            nombre="A1",
            laboratorio=lab,
            fila=1,
            columna=1
        )
        print(f"Station created: {est.id_estacion}")
        
        # Cleanup
        est.delete()
        lab.delete()
        print("Success without exceptions in core model.")
        
    except Exception as e:
        print("ERROR DETECTED:")
        print(traceback.format_exc())

if __name__ == "__main__":
    diagnostic()
