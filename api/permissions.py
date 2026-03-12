from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Permiso para usuarios con rol de Administrador.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        if not request.user.rol:
            return False
            
        rol_nombre = request.user.rol.nombre_rol.lower()
        return rol_nombre in ['admin', 'administrador']

class IsDocenteUserRole(permissions.BasePermission):
    """
    Permiso para usuarios con rol de Docente.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        if not request.user.rol:
            return False
            
        rol_nombre = request.user.rol.nombre_rol.lower()
        return rol_nombre in ['docente', 'profesor']

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permiso para que solo el propietario de un objeto pueda editarlo.
    """
    def has_object_permission(self, request, view, obj):
        # Permite lectura para cualquier solicitud
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permiso de escritura solo al dueño
        # Nota: Ajustar según el nombre del campo de usuario en cada modelo
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        if hasattr(obj, 'usuario_reporta'):
            return obj.usuario_reporta == request.user
        return False

class IsTecnicoUserRole(permissions.BasePermission):
    """
    Permiso para usuarios con rol de Técnico.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        if not request.user.rol:
            return False
            
        rol_nombre = request.user.rol.nombre_rol.lower()
        return rol_nombre in ['tecnico', 'técnico']

class IsDocenteOrAdminUser(permissions.BasePermission):
    """
    Permiso para usuarios con rol de Docente o Administrador.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.rol:
            return False
        rol_nombre = request.user.rol.nombre_rol.lower()
        return rol_nombre in ['docente', 'profesor', 'admin', 'administrador']
class IsOwnerOrAdminOrTecnico(permissions.BasePermission):
    """
    Permiso para el dueño, administrador o técnico.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if not request.user.rol:
            return False
        rol_nombre = request.user.rol.nombre_rol.lower()
        if rol_nombre in ['admin', 'administrador', 'tecnico', 'técnico']:
            return True
        if hasattr(obj, 'usuario_reporta'):
            return obj.usuario_reporta == request.user
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        return False
