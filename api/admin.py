from django.contrib import admin
from .models import (
    Rol, Usuario, Area, Categoria, Laboratorio, Mobiliario, 
    Mantenimiento, ReporteFallo, AsignacionEquipo, 
    HorarioLaboratorio, Bitacora, Asistencia
)

admin.site.register(Rol)
admin.site.register(Usuario)
admin.site.register(Area)
admin.site.register(Categoria)
admin.site.register(Laboratorio)
admin.site.register(Mobiliario)
admin.site.register(Mantenimiento)
admin.site.register(ReporteFallo)
admin.site.register(AsignacionEquipo)
admin.site.register(HorarioLaboratorio)
admin.site.register(Bitacora)
admin.site.register(Asistencia)
