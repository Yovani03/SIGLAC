from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .auth_views import CustomTokenObtainPairView
from .views import (
    RolViewSet, UsuarioViewSet, AreaViewSet, CategoriaViewSet,
    LaboratorioViewSet, MobiliarioViewSet, EquipoComputoViewSet, 
    TipoMobiliarioViewSet, EstacionViewSet,
    HorarioLaboratorioViewSet,
    SoftwareViewSet, ConfiguracionSistemaViewSet, ReporteFalloViewSet,
    BitacoraViewSet, AsignacionEquipoViewSet, ReservacionViewSet, AsistenciaViewSet, 
    MantenimientoViewSet, dashboard_stats, reportes_estadisticos, prueba_conexion
)

router = DefaultRouter()
router.register(r'roles', RolViewSet, basename='rol')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'areas', AreaViewSet, basename='area')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'tipos-mobiliario', TipoMobiliarioViewSet, basename='tipo-mobiliario')
router.register(r'laboratorios', LaboratorioViewSet, basename='laboratorio')
router.register(r'estaciones', EstacionViewSet, basename='estacion')
router.register(r'mobiliario', MobiliarioViewSet, basename='mobiliario')
router.register(r'equipos-computo', EquipoComputoViewSet, basename='equipo-computo')
router.register(r'horarios-laboratorio', HorarioLaboratorioViewSet, basename='horario-laboratorio')
router.register(r'software', SoftwareViewSet, basename='software')
router.register(r'configuracion', ConfiguracionSistemaViewSet, basename='configuracion')
router.register(r'reportes-fallos', ReporteFalloViewSet, basename='reporte-fallo')
router.register(r'bitacoras', BitacoraViewSet, basename='bitacora')
router.register(r'asignaciones', AsignacionEquipoViewSet, basename='asignacion')
router.register(r'reservaciones', ReservacionViewSet, basename='reservacion')
router.register(r'asistencias', AsistenciaViewSet, basename='asistencia')
router.register(r'mantenimientos', MantenimientoViewSet, basename='mantenimiento')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    path('reportes/stats/', reportes_estadisticos, name='reportes_stats'),
    path('prueba/', prueba_conexion, name='prueba_conexion'),
]
