import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import ReporteFallo
from django.db.models import Q
import traceback

try:
    active_reports = ReporteFallo.objects.filter(~Q(estado='RESUELTO')).select_related('mobiliario', 'equipo_computo').order_by('-fecha_reporte')[:5]
    
    failures_summary = []
    for r in active_reports:
        if r.equipo_computo:
            eq = r.equipo_computo
            item_name = eq.serie or eq.marca or 'PC-Inventario'
            lab = eq.laboratorio.nombre if hasattr(eq, 'laboratorio') and eq.laboratorio else 'Sin Lab'
        elif r.mobiliario:
            mob = r.mobiliario
            item_name = mob.serie or mob.marca or 'Mobiliario'
            lab = mob.laboratorio.nombre if hasattr(mob, 'laboratorio') and mob.laboratorio else 'Sin Lab'
        else:
            item_name = 'General / Desconocido'
            lab = 'Sin Lab'

        failures_summary.append({
            'id': r.id_reporte,
            'name': item_name,
            'lab': lab,
            'descripcion': r.descripcion[:60] + '...' if r.descripcion and len(r.descripcion) > 60 else (r.descripcion or 'Sin descripción'),
            'fecha': r.fecha_reporte.strftime('%d/%m/%Y'),
            'estado': r.estado
        })
    print("SUCCESS")
    print(failures_summary)
except Exception as e:
    print("ERROR CAUGHT")
    traceback.print_exc()
