from django.http import JsonResponse
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from .models import (
    Rol, Usuario, Area, Categoria, Laboratorio, Mobiliario, EquipoComputo,
    TipoMobiliario, Estacion,
    Mantenimiento, HorarioLaboratorio, Software, ConfiguracionSistema, ReporteFallo,
    Bitacora, AsignacionEquipo, Reservacion, Asistencia
)
from .serializers import (
    RolSerializer, UsuarioSerializer, AreaSerializer, CategoriaSerializer,
    LaboratorioSerializer, MobiliarioSerializer, EquipoComputoSerializer, 
    TipoMobiliarioSerializer, EstacionSerializer,
    HorarioLaboratorioSerializer,
    SoftwareSerializer, ConfiguracionSistemaSerializer, ReporteFalloSerializer,
    BitacoraSerializer, AsignacionEquipoSerializer, ReservacionSerializer,
    PasswordUpdateSerializer, AsistenciaSerializer, MantenimientoSerializer
)
from .permissions import IsAdminUserRole, IsDocenteUserRole, IsOwnerOrReadOnly, IsDocenteOrAdminUser, IsTecnicoUserRole, IsOwnerOrAdminOrTecnico
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from datetime import datetime as dt
import datetime as dt_module


# CRUD ViewSets for Admin
class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAdminUserRole]

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'change_password']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        queryset = Usuario.objects.all()
        rol = self.request.query_params.get('rol')
        if rol:
            queryset = queryset.filter(rol__nombre_rol__icontains=rol)
        return queryset

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        usuario = self.get_object()
        new_password = request.data.get('password')
        if not new_password:
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        usuario.password = make_password(new_password)
        usuario.save()
        return Response({'status': 'Password reset successful'})

    @action(detail=False, methods=['put'], url_path='change-password', permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        serializer = PasswordUpdateSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not check_password(serializer.data.get('old_password'), user.password):
                return Response({'old_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.data.get('new_password'))
            user.save()
            return Response({'status': 'Password updated successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteOrAdminUser]

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteOrAdminUser]

class TipoMobiliarioViewSet(viewsets.ModelViewSet):
    queryset = TipoMobiliario.objects.all()
    serializer_class = TipoMobiliarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsDocenteOrAdminUser]

class EstacionViewSet(viewsets.ModelViewSet):
    queryset = Estacion.objects.all()
    serializer_class = EstacionSerializer
    pagination_class = None
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsDocenteOrAdminUser()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_anonymous:
            return queryset.none()
            
        rol_nombre = user.rol.nombre_rol.lower() if (hasattr(user, 'rol') and user.rol) else ''
        
        # Filter by responsible teacher
        if rol_nombre in ['docente', 'profesor'] and not any(r in rol_nombre for r in ['admin', 'administrador']):
            queryset = queryset.filter(laboratorio__responsable=user)
            
        lab_id = self.request.query_params.get('laboratorio')
        if lab_id:
            queryset = queryset.filter(laboratorio=lab_id)
        
        # Optimizamos carga de datos para el mapa
        return queryset.select_related('laboratorio').prefetch_related('equipo', 'perifericos', 'perifericos__tipo_mobiliario')

class LaboratorioViewSet(viewsets.ModelViewSet):
    queryset = Laboratorio.objects.all()
    serializer_class = LaboratorioSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_anonymous:
            return queryset.none()
            
        rol_nombre = user.rol.nombre_rol.lower() if (hasattr(user, 'rol') and user.rol) else ''
        
        # Docentes ven sus laboratorios, admins todos
        if rol_nombre in ['docente', 'profesor'] and not any(r in rol_nombre for r in ['admin', 'administrador']):
            queryset = queryset.filter(responsable=user)
            
        return queryset

    @action(detail=True, methods=['get'])
    def recursos(self, request, pk=None):
        lab = self.get_object()
        software = lab.software_instalado.all()
        return Response({
            'capacidad': lab.capacidad,
            'software': SoftwareSerializer(software, many=True).data
        })

    @action(detail=False, methods=['get'])
    def estado_actual(self, request):
        now = timezone.localtime(timezone.now())
        current_time = now.time()
        
        # Mapa de días de la semana en español
        dias = {
            0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves',
            4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
        }
        current_day = dias[now.weekday()]
        
        laboratorios = Laboratorio.objects.all()
        resultado = []
        
        for lab in laboratorios:
            # 1. Buscar en horarios fijos (HorarioLaboratorio)
            horario_activo = HorarioLaboratorio.objects.filter(
                laboratorio=lab,
                dia_semana=current_day,
                hora_inicio__lte=current_time,
                hora_fin__gt=current_time
            ).first()
            
            # 2. Buscar en reservaciones (Reservacion)
            reservacion_activa = Reservacion.objects.filter(
                laboratorio=lab,
                fecha=now.date(),
                estado='ACTIVA',
                hora_inicio__lte=current_time,
                hora_fin__gt=current_time
            ).first()
            
            detalles = None
            ocupado = False
            tipo = None
            
            if horario_activo:
                ocupado = True
                detalles = horario_activo.descripcion_actividad or "Clase/Actividad Programada"
                tipo = "HORARIO_FIJO"
            elif reservacion_activa:
                ocupado = True
                detalles = reservacion_activa.materia_grupo
                tipo = "RESERVACION"
            
            resultado.append({
                'id_laboratorio': lab.id_laboratorio,
                'nombre': lab.nombre,
                'ubicacion': lab.ubicacion,
                'capacidad': lab.capacidad,
                'area_nombre': lab.area.nombre,
                'ocupado': ocupado,
                'detalles': detalles,
                'docente_nombre': horario_activo.docente.nombre if (horario_activo and horario_activo.docente) else (reservacion_activa.usuario.nombre if reservacion_activa else None),
                'tipo_ocupacion': tipo,
                'hora_fin': horario_activo.hora_fin if horario_activo else (reservacion_activa.hora_fin if reservacion_activa else None)
            })
            
        return Response(resultado)

class MobiliarioViewSet(viewsets.ModelViewSet):
    queryset = Mobiliario.objects.all()
    serializer_class = MobiliarioSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsDocenteOrAdminUser()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_anonymous:
            return queryset.none()
            
        rol_nombre = user.rol.nombre_rol.lower() if (hasattr(user, 'rol') and user.rol) else ''
        
        if rol_nombre in ['docente', 'profesor'] and not any(r in rol_nombre for r in ['admin', 'administrador']):
            # For list/retrieve, filter by labs they manage
            queryset = queryset.filter(laboratorio__responsable=user)

        lab_id = self.request.query_params.get('laboratorio')
        if lab_id:
            queryset = queryset.filter(laboratorio=lab_id)
        return queryset

class EquipoComputoViewSet(viewsets.ModelViewSet):
    queryset = EquipoComputo.objects.all()
    serializer_class = EquipoComputoSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsDocenteOrAdminUser()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_anonymous:
            return queryset.none()
            
        rol_nombre = user.rol.nombre_rol.lower() if (hasattr(user, 'rol') and user.rol) else ''
        
        if rol_nombre in ['docente', 'profesor'] and not any(r in rol_nombre for r in ['admin', 'administrador']):
            queryset = queryset.filter(laboratorio__responsable=user)

        lab_id = self.request.query_params.get('laboratorio')
        if lab_id:
            queryset = queryset.filter(laboratorio=lab_id)
        return queryset

class HorarioLaboratorioViewSet(viewsets.ModelViewSet):
    queryset = HorarioLaboratorio.objects.all()
    serializer_class = HorarioLaboratorioSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Determine role name
        rol_nombre = user.rol.nombre_rol.lower() if user.rol else ''
        
        # If it's a teacher, show only their own schedules
        if rol_nombre in ['docente', 'profesor'] and not rol_nombre in ['admin', 'administrador']:
            queryset = queryset.filter(docente=user)
        
        # Filter by lab if provided
        lab_id = self.request.query_params.get('laboratorio')
        if lab_id:
            queryset = queryset.filter(laboratorio_id=lab_id)
            
        return queryset

class MantenimientoViewSet(viewsets.ModelViewSet):
    queryset = Mantenimiento.objects.all()
    serializer_class = MantenimientoSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole | IsTecnicoUserRole]

    def perform_create(self, serializer):
        # Save the maintenance record with the current user
        mantenimiento = serializer.save(usuario_realizo=self.request.user)
        
        # Deactivate associated equipment and remove from station
        if mantenimiento.mobiliario:
            mantenimiento.mobiliario.activo = False
            mantenimiento.mobiliario.estacion = None
            mantenimiento.mobiliario.save()
        if mantenimiento.equipo_computo:
            mantenimiento.equipo_computo.activo = False
            mantenimiento.equipo_computo.estacion = None
            mantenimiento.equipo_computo.save()

class SoftwareViewSet(viewsets.ModelViewSet):
    queryset = Software.objects.all()
    serializer_class = SoftwareSerializer
    permission_classes = [IsDocenteOrAdminUser]

class ConfiguracionSistemaViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracionSistema.objects.all()
    serializer_class = ConfiguracionSistemaSerializer
    permission_classes = [IsAdminUserRole]

class ReporteFalloViewSet(viewsets.ModelViewSet):
    queryset = ReporteFallo.objects.all()
    serializer_class = ReporteFalloSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve', 'me']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdminOrTecnico()]
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsAdminUserRole()]
        return [IsAdminUserRole()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        reportes = ReporteFallo.objects.filter(usuario_reporta=request.user).order_by('-fecha_reporte')
        serializer = self.get_serializer(reportes, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(usuario_reporta=self.request.user)

    def perform_update(self, serializer):
        estado = self.request.data.get('estado')
        if estado == 'RESUELTO':
            serializer.save(fecha_resolucion=timezone.now())
        else:
            serializer.save()

class BitacoraViewSet(viewsets.ModelViewSet):
    queryset = Bitacora.objects.all()
    serializer_class = BitacoraSerializer
    
    def get_permissions(self):
        return [IsDocenteOrAdminUser()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_anonymous:
            return queryset.none()
        
        rol_nombre = user.rol.nombre_rol.lower() if user.rol else ''
        if rol_nombre in ['docente', 'profesor'] and not any(r in rol_nombre for r in ['admin', 'administrador']):
            # Filter by labs they manage OR where they are the author
            return queryset.filter(Q(laboratorio__responsable=user) | Q(usuario=user))
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class AsignacionEquipoViewSet(viewsets.ModelViewSet):
    queryset = AsignacionEquipo.objects.all()
    serializer_class = AsignacionEquipoSerializer
    permission_classes = [IsDocenteOrAdminUser]

class AsistenciaViewSet(viewsets.ModelViewSet):
    queryset = Asistencia.objects.all()
    serializer_class = AsistenciaSerializer
    
    def get_permissions(self):
        return [IsDocenteOrAdminUser()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_anonymous:
            return queryset.none()
            
        rol_nombre = user.rol.nombre_rol.lower() if user.rol else ''
        if rol_nombre in ['docente', 'profesor'] and not any(r in rol_nombre for r in ['admin', 'administrador']):
            # For teachers, show attendance for their classes
            return queryset.filter(horario__docente=user)
        return queryset

class ReservacionViewSet(viewsets.ModelViewSet):
    queryset = Reservacion.objects.all()
    serializer_class = ReservacionSerializer

    def get_permissions(self):
        if self.action in ['create', 'me']:
            return [IsDocenteOrAdminUser()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly() | IsAdminUserRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        fecha = self.request.query_params.get('fecha')
        if fecha:
            try:
                # Basic validation: should be YYYY-MM-DD
                dt.strptime(fecha, '%Y-%m-%d')
                queryset = queryset.filter(fecha=fecha)
            except (ValueError, TypeError):
                # If invalid date, just don't filter or return empty
                return queryset.none()
        return queryset

    @action(detail=False, methods=['get'])
    def me(self, request):
        queryset = self.get_queryset().filter(usuario=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

@api_view(['GET'])
@permission_classes([IsDocenteOrAdminUser])
def reportes_estadisticos(request):
    from django.db.models import Count
    from datetime import datetime as dt, timedelta
    try:
        user = request.user
        rol_nombre = user.rol.nombre_rol.lower() if user.rol else ''
        is_admin = rol_nombre in ['admin', 'administrador']

        # 1. Fallos Recientes Activos (Solo los que no están RESUELTOS)
        reports_qs = ReporteFallo.objects.exclude(estado='RESUELTO').order_by('-fecha_reporte')[:5]
        failures_summary = []
        for r in reports_qs:
            item_name = 'Equipo Desconocido'
            if r.equipo_computo:
                item_name = r.equipo_computo.serie or r.equipo_computo.numero_inventario
            elif r.mobiliario:
                item_name = r.mobiliario.serie or r.mobiliario.numero_inventario
            
            failures_summary.append({
                'name': item_name,
                'fecha': r.fecha_reporte.strftime('%d/%m/%Y'),
                'lab': (r.equipo_computo.laboratorio.nombre if r.equipo_computo and r.equipo_computo.laboratorio else (r.mobiliario.laboratorio.nombre if r.mobiliario and r.mobiliario.laboratorio else 'Ubicación General')),
                'descripcion': r.detalle_problema or 'Sin descripción proporcionada'
            })

        # 2. Distribución de Estados (Esto faltaba en la respuesta)
        distribution = list(ReporteFallo.objects.values('estado').annotate(count=Count('id_reporte')))

        # 3. Mantenimiento... (El resto de la lógica se mantiene igual)

        # 2. Maintenance Stats (Filtered by docente labs if not admin)
        if not is_admin:
            # Check for labs where user is responsible OR has schedules
            owned_labs = Laboratorio.objects.filter(responsable=user).values_list('id_laboratorio', flat=True)
            scheduled_labs = HorarioLaboratorio.objects.filter(docente=user).values_list('laboratorio_id', flat=True)
            assigned_labs = list(set(list(owned_labs) + list(scheduled_labs)))
            
            maint_qs = Mantenimiento.objects.filter(
                Q(mobiliario__laboratorio_id__in=assigned_labs) | 
                Q(equipo_computo__laboratorio_id__in=assigned_labs)
            )
        else:
            maint_qs = Mantenimiento.objects.all()

        maint_count = maint_qs.count()
        maint_preventive = maint_qs.filter(tipo='PREVENTIVO').count()
        
        recent_maint = maint_qs.select_related('mobiliario', 'equipo_computo', 'usuario_realizo').order_by('-fecha_mantenimiento')[:5]
        maint_activity = []
        for m in recent_maint:
            item_name = 'Equipo'
            if m.equipo_computo:
                item_name = m.equipo_computo.serie or m.equipo_computo.numero_inventario
            elif m.mobiliario:
                item_name = m.mobiliario.serie or m.mobiliario.numero_inventario
                
            maint_activity.append({
                'item': item_name,
                'tipo': m.tipo,
                'fecha': m.fecha_mantenimiento.strftime('%d/%m/%Y') if m.fecha_mantenimiento else 'N/A',
                'encargado': (m.usuario_realizo.nombre or m.usuario_realizo.username) if m.usuario_realizo else 'Sistema',
                'descripcion': (m.descripcion[:50] + '...' if m.descripcion and len(m.descripcion) > 50 else (m.descripcion or 'Sin descripción'))
            })

        # 3. Lab Usage (Horarios per week)
        lab_usage = Laboratorio.objects.annotate(horarios_count=Count('horariolaboratorio')).values('nombre', 'horarios_count')
        
        # 5. Global report counts
        total_reports = ReporteFallo.objects.count()
        resolved_reports = ReporteFallo.objects.filter(estado='RESUELTO').count()

        # 6. Monthly Statistics (Resolved vs Active) for the current year
        from django.db.models.functions import ExtractMonth
        current_year = dt.now().year
        monthly_data = ReporteFallo.objects.filter(fecha_reporte__year=current_year)\
            .annotate(month=ExtractMonth('fecha_reporte'))\
            .values('month')\
            .annotate(
                total=Count('id_reporte'),
                resolved=Count('id_reporte', filter=Q(estado='RESUELTO')),
                active=Count('id_reporte', filter=~Q(estado='RESUELTO'))
            ).order_by('month')

        meses_nombres = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
            7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }

        stats_mensuales = []
        # Initialize all months for the year up to the current month
        for m in range(1, dt.now().month + 1):
            stats_mensuales.append({
                'mes': meses_nombres[m],
                'numero': m,
                'total': 0,
                'resolved': 0,
                'active': 0
            })

        for d in monthly_data:
            idx = d['month'] - 1
            if idx < len(stats_mensuales):
                stats_mensuales[idx]['total'] = d['total']
                stats_mensuales[idx]['resolved'] = d['resolved']
                stats_mensuales[idx]['active'] = d['active']

        # 7. Attendance Stats (Real)
        # If docente, filter by their assigned labs. If admin, show all.
        if not is_admin:
            assigned_labs = HorarioLaboratorio.objects.filter(docente=user).values_list('laboratorio_id', flat=True).distinct()
            asistencias = Asistencia.objects.filter(laboratorio_id__in=assigned_labs).values('laboratorio__nombre').annotate(count=Count('id_asistencia'))
        else:
            asistencias = Asistencia.objects.all().values('laboratorio__nombre').annotate(count=Count('id_asistencia'))

        attendance_summary = []
        for a in asistencias:
            total_expected = 40 # Mock capacity or could get from lab.capacidad
            attendance_summary.append({
                'grupo': a['laboratorio__nombre'],
                'total': total_expected,
                'asistencias': a['count'],
                'porcentaje': f"{(a['count']/total_expected)*100:.1f}%" if total_expected > 0 else '0%'
            })

        return Response({
            'top_failures': failures_summary,
            'distribution': distribution,
            'maintenance': {
                'total': maint_count,
                'preventive': maint_preventive,
                'corrective': maint_count - maint_preventive,
                'activity': maint_activity
            },
            'lab_usage': list(lab_usage),
            'attendance': attendance_summary,
            'stats_mensuales': stats_mensuales,
            'global_stats': {
                'total': total_reports,
                'resolved': resolved_reports,
                'pending': total_reports - resolved_reports
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAdminUserRole])
def dashboard_stats(request):
    try:
        lab_count = Laboratorio.objects.count()
        hw_count = Mobiliario.objects.count()
        pc_count = EquipoComputo.objects.count()
        incident_count = ReporteFallo.objects.filter(estado='PENDIENTE').count()
        user_count = Usuario.objects.filter(is_active=True).count()
        
        # Recent activity (Bitacora)
        bitacoras = Bitacora.objects.select_related('usuario').order_by('-fecha')[:5]
        activity = []
        for b in bitacoras:
            activity.append({
                'user': b.usuario.nombre or b.usuario.username,
                'act': b.actividad_realizada,
                'time': b.fecha.isoformat(),
                'type': b.tipo_actividad
            })
            
        return Response({
            'stats': {
                'laboratorios': lab_count,
                'equipos': hw_count + pc_count,
                'incidentes': incident_count,
                'usuarios': user_count
            },
            'activity': activity
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def prueba_conexion(request):
    return JsonResponse({
        'status': 'success',
        'mensaje': 'API REST SIGLAC activa y protegida.',
    })