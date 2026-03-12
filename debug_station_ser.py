
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Estacion, Laboratorio, Area, Usuario
from api.serializers import EstacionSerializer
import traceback

def diagnostic_serializer():
    try:
        area, _ = Area.objects.get_or_create(nombre="TEST_AREA")
        admin = Usuario.objects.filter(is_superuser=True).first()
        
        lab = Laboratorio.objects.create(
            nombre="LAB_TEST_SER",
            ubicacion="TEST",
            capacidad=10,
            area=area,
            responsable=admin
        )
        
        print(f"Testing serializer with lab: {lab.id_laboratorio}")
        data = {
            "nombre": "A1",
            "laboratorio": lab.id_laboratorio,
            "fila": 1,
            "columna": 1
        }
        
        serializer = EstacionSerializer(data=data)
        if serializer.is_valid():
            print("Serializer is valid")
            obj = serializer.save()
            print(f"Object saved: {obj.id_estacion}")
            obj.delete()
        else:
            print(f"Serializer errors: {serializer.errors}")
            
        lab.delete()
        print("Success")
        
    except Exception as e:
        print("EXCEPTION DETECTED:")
        print(traceback.format_exc())

if __name__ == "__main__":
    diagnostic_serializer()
