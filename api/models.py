from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'roles'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.nombre_rol

class Usuario(AbstractUser):
    # Removiendo campos por defecto de Django
    first_name = None
    last_name = None

    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)
    correo_institucional = models.EmailField(max_length=150, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    rol = models.ForeignKey(Rol, on_delete=models.RESTRICT, db_column='id_rol', null=True)
    activo = models.BooleanField(default=True)
    avatar = models.CharField(max_length=255, blank=True, null=True, default='avatar1')
    fecha_registro = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'nombre', 'apellido_paterno']

    class Meta:
        db_table = 'usuarios'

    def __str__(self):
        return f"{self.nombre} {self.apellido_paterno} - {self.correo_institucional}"

class Area(models.Model):
    id_area = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'areas'

    def __str__(self):
        return self.nombre

class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_tipo = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'categorias'

    def __str__(self):
        return self.nombre_tipo

class Laboratorio(models.Model):
    id_laboratorio = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    ubicacion = models.CharField(max_length=150, blank=True, null=True)
    capacidad = models.IntegerField(blank=True, null=True)
    equipos_por_fila = models.IntegerField(default=4, blank=True, null=True)
    activo = models.BooleanField(default=True)
    area = models.ForeignKey(Area, on_delete=models.CASCADE, db_column='id_area')
    responsable = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_responsable', related_name='laboratorios_a_cargo')

    class Meta:
        db_table = 'laboratorios'

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Si es un laboratorio nuevo y tiene capacidad, creamos las estaciones automáticamente
        if is_new and self.capacidad:
            from .models import Estacion
            
            eq_per_row = self.equipos_por_fila or 4
            rows_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']
            
            estaciones_to_create = []
            for i in range(self.capacidad):
                row_idx = i // eq_per_row
                pos_in_row = i % eq_per_row
                col_idx = pos_in_row + 1
                row_letter = rows_letters[row_idx] if row_idx < len(rows_letters) else 'Z'
                
                estaciones_to_create.append(Estacion(
                    nombre=f"{row_letter}{col_idx}",
                    laboratorio=self,
                    fila=row_idx + 1,
                    columna=col_idx
                ))
            
            # bulk_create es extremadamente rápido (1 sola petición a la base de datos)
            Estacion.objects.bulk_create(estaciones_to_create)

class TipoMobiliario(models.Model):
    id_tipo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tipos_mobiliario'

    def __str__(self):
        return self.nombre

class Estacion(models.Model):
    id_estacion = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.CASCADE, db_column='id_laboratorio', related_name='estaciones')
    fila = models.IntegerField(default=1)
    columna = models.IntegerField(default=1)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'estaciones'
        unique_together = ('nombre', 'laboratorio')

    def __str__(self):
        return f"{self.nombre} - {self.laboratorio.nombre}"

class Mobiliario(models.Model):
    numero_inventario = models.CharField(max_length=50, primary_key=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    serie = models.CharField(max_length=100, blank=True, null=True)
    estado_condicion = models.CharField(max_length=50, default='BUENO')
    fecha_adquisicion = models.DateField(blank=True, null=True)
    costo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ubicacion_especifica = models.CharField(max_length=100, blank=True, null=True)
    detalles_tecnicos = models.JSONField(blank=True, null=True) # JSONB in Postgres
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.SET_NULL, db_column='id_laboratorio', null=True, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.RESTRICT, db_column='id_categoria')
    tipo_mobiliario = models.ForeignKey(TipoMobiliario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_tipo')
    estacion = models.ForeignKey(Estacion, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_estacion', related_name='perifericos')
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'mobiliario'

    def __str__(self):
        return f"[{self.numero_inventario}] {self.marca} {self.modelo}"

class EquipoComputo(models.Model):
    numero_inventario = models.CharField(max_length=50, primary_key=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    serie = models.CharField(max_length=100, blank=True, null=True)
    estado_condicion = models.CharField(max_length=50, default='BUENO')
    procesador = models.CharField(max_length=100, blank=True, null=True)
    ram = models.CharField(max_length=50, blank=True, null=True)
    disco_duro = models.CharField(max_length=50, blank=True, null=True)
    fecha_adquisicion = models.DateField(blank=True, null=True)
    costo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ubicacion_especifica = models.CharField(max_length=100, blank=True, null=True)
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.SET_NULL, db_column='id_laboratorio', null=True, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.RESTRICT, db_column='id_categoria')
    estacion = models.ForeignKey(Estacion, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_estacion', related_name='equipo')
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'equipos_computo'

    def __str__(self):
        return f"[PC] {self.numero_inventario} - {self.marca}"

class Mantenimiento(models.Model):
    id_mantenimiento = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=50)
    fecha_mantenimiento = models.DateField(auto_now_add=True)
    fecha_proximo_mantenimiento = models.DateField(blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    costo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    mobiliario = models.ForeignKey(Mobiliario, on_delete=models.CASCADE, db_column='numero_inventario', null=True, blank=True)
    equipo_computo = models.ForeignKey(EquipoComputo, on_delete=models.CASCADE, db_column='numero_inventario_pc', null=True, blank=True)
    usuario_realizo = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_usuario_realizo')

    class Meta:
        db_table = 'mantenimiento'

class ReporteFallo(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('EN REVISION', 'En revisión'),
        ('RESUELTO', 'Resuelto'),
        ('EN MANTENIMIENTO', 'En mantenimiento'),
    ]
    URGENCIAS = [
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
    ]
    id_reporte = models.AutoField(primary_key=True)
    fecha_reporte = models.DateTimeField(auto_now_add=True)
    detalle_problema = models.TextField()
    estado = models.CharField(max_length=50, choices=ESTADOS, default='PENDIENTE')
    urgencia = models.CharField(max_length=10, choices=URGENCIAS, default='MEDIA')
    fecha_resolucion = models.DateTimeField(blank=True, null=True)
    comentarios_resolucion = models.TextField(blank=True, null=True)
    usuario_reporta = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_usuario_reporta')
    mobiliario = models.ForeignKey(Mobiliario, on_delete=models.CASCADE, db_column='numero_inventario', null=True, blank=True)
    equipo_computo = models.ForeignKey(EquipoComputo, on_delete=models.CASCADE, db_column='numero_inventario_pc', null=True, blank=True)

    class Meta:
        db_table = 'reportes_fallos'

class Reservacion(models.Model):
    ESTADOS = [
        ('ACTIVA', 'Activa'),
        ('CANCELADA', 'Cancelada'),
    ]
    id_reservacion = models.AutoField(primary_key=True)
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    materia_grupo = models.CharField(max_length=150)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='ACTIVA')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario', related_name='reservaciones')
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.CASCADE, db_column='id_laboratorio', related_name='reservaciones')

    class Meta:
        db_table = 'reservaciones'
        verbose_name_plural = 'Reservaciones'

    def __str__(self):
        return f"{self.fecha} {self.hora_inicio}-{self.hora_fin} | {self.materia_grupo}"

class Software(models.Model):
    id_software = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    version = models.CharField(max_length=50, blank=True, null=True)
    fabricante = models.CharField(max_length=100, blank=True, null=True)
    licencia = models.CharField(max_length=100, blank=True, null=True)
    laboratorios = models.ManyToManyField(Laboratorio, related_name='software_instalado', db_table='software_laboratorios')

    class Meta:
        db_table = 'software'

    def __str__(self):
        return f"{self.nombre} ({self.version})"

class AsignacionEquipo(models.Model):
    id_asignacion = models.AutoField(primary_key=True)
    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    fecha_devolucion_programada = models.DateField(blank=True, null=True)
    fecha_devolucion_real = models.DateTimeField(blank=True, null=True)
    cuatrimestre = models.CharField(max_length=20, blank=True, null=True)
    estado = models.CharField(max_length=50, default='ACTIVO')
    observaciones = models.TextField(blank=True, null=True)
    mobiliario = models.ForeignKey(Mobiliario, on_delete=models.RESTRICT, db_column='numero_inventario', null=True, blank=True)
    equipo_computo = models.ForeignKey(EquipoComputo, on_delete=models.RESTRICT, db_column='numero_inventario_pc', null=True, blank=True)
    alumno = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_alumno')

    class Meta:
        db_table = 'asignacion_equipos'

class HorarioLaboratorio(models.Model):
    id_horario = models.AutoField(primary_key=True)
    dia_semana = models.CharField(max_length=15)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    descripcion_actividad = models.CharField(max_length=150, blank=True, null=True)
    grado = models.CharField(max_length=20, blank=True, null=True)
    grupo = models.CharField(max_length=10, blank=True, null=True)
    carrera = models.CharField(max_length=100, blank=True, null=True)
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.CASCADE, db_column='id_laboratorio')
    docente = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_docente', related_name='horarios_clase')

    class Meta:
        db_table = 'horarios_laboratorio'

class ConfiguracionSistema(models.Model):
    id_config = models.AutoField(primary_key=True)
    clave = models.CharField(max_length=100, unique=True)
    valor = models.TextField()
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'configuracion_sistema'

    def __str__(self):
        return self.clave

class Bitacora(models.Model):
    id_bitacora = models.AutoField(primary_key=True)
    fecha = models.DateTimeField(auto_now_add=True)
    actividad_realizada = models.TextField(blank=True, null=True)
    tipo_actividad = models.CharField(max_length=50, blank=True, null=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_usuario')
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_laboratorio')

    class Meta:
        db_table = 'bitacoras'

class Asistencia(models.Model):
    id_asistencia = models.AutoField(primary_key=True)
    fecha = models.DateField(auto_now_add=True)
    hora_entrada = models.TimeField(auto_now_add=True)
    hora_salida = models.TimeField(blank=True, null=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_usuario')
    laboratorio = models.ForeignKey(Laboratorio, on_delete=models.CASCADE, db_column='id_laboratorio')
    asignacion_equipo = models.ForeignKey(AsignacionEquipo, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_asignacion_equipo')
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'asistencias'

class Notificacion(models.Model):
    TIPOS = [
        ('INFO', 'Información'),
        ('SUCCESS', 'Éxito'),
        ('WARNING', 'Advertencia'),
        ('ERROR', 'Error'),
    ]
    id_notificacion = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='notificaciones', db_column='id_usuario')
    mensaje = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPOS, default='INFO')
    leida = models.BooleanField(default=False)
    fecha = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'notificaciones'
        ordering = ['-fecha']

    def __str__(self):
        return f"Notif to {self.usuario.username}: {self.mensaje[:30]}..."
