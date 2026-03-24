from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import (
    Rol, Usuario, Area, Categoria, Laboratorio, Mobiliario, EquipoComputo,
    TipoMobiliario, Estacion,
    Mantenimiento, ReporteFallo, AsignacionEquipo, 
    HorarioLaboratorio, Bitacora, Asistencia, Software, ConfiguracionSistema, Reservacion,
    Notificacion
)

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    nombre_rol = serializers.CharField(source='rol.nombre_rol', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'nombre', 'apellido_paterno', 'apellido_materno', 
            'correo_institucional', 'telefono', 'rol', 'nombre_rol', 'activo', 'password', 'avatar'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': True}
        }

    def create(self, validated_data):
        if 'correo_institucional' in validated_data:
            validated_data['email'] = validated_data['correo_institucional']
        
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'correo_institucional' in validated_data:
            validated_data['email'] = validated_data['correo_institucional']

        if 'password' in validated_data and validated_data['password']:
            validated_data['password'] = make_password(validated_data['password'])
        else:
            validated_data.pop('password', None)
        return super().update(instance, validated_data)

class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class TipoMobiliarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMobiliario
        fields = '__all__'

class EstacionSerializer(serializers.ModelSerializer):
    laboratorio_nombre = serializers.CharField(source='laboratorio.nombre', read_only=True)
    equipo_detalle = serializers.SerializerMethodField()
    perifericos_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Estacion
        fields = '__all__'

    def get_equipo_detalle(self, obj):
        pc = obj.equipo.first()
        if pc:
            return {
                "id_equipo": pc.numero_inventario,
                "numero_inventario": pc.numero_inventario, 
                "marca": pc.marca, 
                "modelo": pc.modelo,
                "serie": pc.serie
            }
        return None

    def get_perifericos_detalle(self, obj):
        # Usamos prefetch_related en el viewset para que esto sea rápido
        return [
            {
                "id_mobiliario": p.numero_inventario,
                "numero_inventario": p.numero_inventario, 
                "tipo": p.tipo_mobiliario.nombre if p.tipo_mobiliario else "N/A",
                "serie": p.serie
            } for p in obj.perifericos.all()
        ]

class LaboratorioSerializer(serializers.ModelSerializer):
    area_nombre = serializers.CharField(source='area.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre', read_only=True)

    class Meta:
        model = Laboratorio
        fields = [
            'id_laboratorio', 'nombre', 'ubicacion', 'capacidad', 
            'equipos_por_fila', 'activo', 'area', 'area_nombre', 
            'responsable', 'responsable_nombre'
        ]

class MobiliarioSerializer(serializers.ModelSerializer):
    laboratorio_nombre = serializers.CharField(source='laboratorio.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre_tipo', read_only=True)
    tipo_nombre = serializers.CharField(source='tipo_mobiliario.nombre', read_only=True)
    estacion_nombre = serializers.CharField(source='estacion.nombre', read_only=True)

    class Meta:
        model = Mobiliario
        fields = '__all__'

class EquipoComputoSerializer(serializers.ModelSerializer):
    laboratorio_nombre = serializers.CharField(source='laboratorio.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre_tipo', read_only=True)
    estacion_nombre = serializers.CharField(source='estacion.nombre', read_only=True)

    class Meta:
        model = EquipoComputo
        fields = '__all__'

class HorarioLaboratorioSerializer(serializers.ModelSerializer):
    laboratorio_nombre = serializers.CharField(source='laboratorio.nombre', read_only=True)
    docente_nombre = serializers.CharField(source='docente.nombre', read_only=True)

    class Meta:
        model = HorarioLaboratorio
        fields = '__all__'

class SoftwareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Software
        fields = '__all__'

class ConfiguracionSistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionSistema
        fields = '__all__'

class MantenimientoSerializer(serializers.ModelSerializer):
    usuario_realizo_nombre = serializers.CharField(source='usuario_realizo.nombre', read_only=True)
    
    class Meta:
        model = Mantenimiento
        fields = '__all__'
        read_only_fields = ['usuario_realizo']

class ReporteFalloSerializer(serializers.ModelSerializer):
    usuario_reporta_nombre = serializers.CharField(source='usuario_reporta.nombre', read_only=True)
    mobiliario_detalle = serializers.SerializerMethodField()
    laboratorio_nombre = serializers.SerializerMethodField()
    equipo_serie = serializers.SerializerMethodField()
    equipo_marca = serializers.SerializerMethodField()
    equipo_modelo = serializers.SerializerMethodField()

    class Meta:
        model = ReporteFallo
        fields = '__all__'
        read_only_fields = ['usuario_reporta']

    def get_mobiliario_detalle(self, obj):
        if obj.mobiliario:
            return str(obj.mobiliario)
        if obj.equipo_computo:
            return str(obj.equipo_computo)
        return "N/A"

    def get_laboratorio_nombre(self, obj):
        if obj.equipo_computo and obj.equipo_computo.laboratorio:
            return obj.equipo_computo.laboratorio.nombre
        if obj.mobiliario and obj.mobiliario.laboratorio:
            return obj.mobiliario.laboratorio.nombre
        return "N/A"

    def get_equipo_serie(self, obj):
        if obj.equipo_computo:
            return obj.equipo_computo.serie
        if obj.mobiliario:
            return obj.mobiliario.serie
        return "N/A"

    def get_equipo_marca(self, obj):
        if obj.equipo_computo:
            return obj.equipo_computo.marca
        if obj.mobiliario:
            return obj.mobiliario.marca
        return "N/A"

    def get_equipo_modelo(self, obj):
        if obj.equipo_computo:
            return obj.equipo_computo.modelo
        if obj.mobiliario:
            return obj.mobiliario.modelo
        return "N/A"

class BitacoraSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    laboratorio_nombre = serializers.CharField(source='laboratorio.nombre', read_only=True)

    class Meta:
        model = Bitacora
        fields = '__all__'
        read_only_fields = ['usuario']

class AsignacionEquipoSerializer(serializers.ModelSerializer):
    alumno_nombre = serializers.SerializerMethodField()
    mobiliario_detalle = serializers.SerializerMethodField()
    equipo_detalle = serializers.SerializerMethodField()

    class Meta:
        model = AsignacionEquipo
        fields = '__all__'
    
    def get_alumno_nombre(self, obj):
        return f"{obj.alumno.nombre} {obj.alumno.apellido_paterno}"

    def get_mobiliario_detalle(self, obj):
        return str(obj.mobiliario) if obj.mobiliario else "N/A"

    def get_equipo_detalle(self, obj):
        return str(obj.equipo_computo) if obj.equipo_computo else "N/A"

class AsistenciaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    laboratorio_nombre = serializers.CharField(source='laboratorio.nombre', read_only=True)

    class Meta:
        model = Asistencia
        fields = '__all__'

class ReservacionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    laboratorio_nombre = serializers.CharField(source='laboratorio.nombre', read_only=True)

    class Meta:
        model = Reservacion
        fields = '__all__'

    def validate(self, data):
        laboratorio = data.get('laboratorio')
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        instance_id = self.instance.pk if self.instance else None
        empalmes = Reservacion.objects.filter(laboratorio=laboratorio, fecha=fecha, estado='ACTIVA').exclude(pk=instance_id)
        for e in empalmes:
            if (hora_inicio < e.hora_fin) and (hora_fin > e.hora_inicio):
                raise serializers.ValidationError(f"El laboratorio ya tiene una reservación activa en este horario ({e.hora_inicio} - {e.hora_fin}).")
        if hora_inicio >= hora_fin:
            raise serializers.ValidationError("La hora de inicio debe ser anterior a la hora de fin.")
        return data

class PasswordUpdateSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'
