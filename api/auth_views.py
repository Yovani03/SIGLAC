from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['nombre_rol'] = user.rol.nombre_rol if user.rol else 'Estudiante'
        token['nombre_completo'] = f"{user.nombre} {user.apellido_paterno} {user.apellido_materno or ''}".strip()
        token['email'] = user.correo_institucional
        token['avatar'] = user.avatar
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
