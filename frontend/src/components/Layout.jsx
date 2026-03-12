import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Monitor, Calendar, FileText, AlertCircle, LogOut } from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = user?.rol === 'admin' || user?.rol === 'administrador';

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'administrador', 'encargado', 'docente', 'estudiante', 'tecnico'] },
        { name: 'Usuarios', icon: Users, path: '/admin/usuarios', roles: ['admin', 'administrador'] },
        { name: 'Áreas', icon: Monitor, path: '/admin/areas', roles: ['admin', 'administrador'] },
        { name: 'Categorías', icon: Monitor, path: '/admin/categorias', roles: ['admin', 'administrador'] },
        { name: 'Laboratorios', icon: Monitor, path: '/laboratorios', roles: ['admin', 'administrador', 'encargado'] },
        { name: 'Equipos', icon: Monitor, path: '/equipos', roles: ['admin', 'administrador', 'encargado', 'docente'] },
        { name: 'Horarios', icon: Calendar, path: '/horarios', roles: ['admin', 'administrador', 'encargado', 'docente'] },
        { name: 'Bitácoras', icon: FileText, path: '/bitacoras', roles: ['encargado'] },
        { name: 'Incidentes', icon: AlertCircle, path: '/incidentes', roles: ['encargado'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.rol));

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-slate-800">
                    SIGLAC
                </div>
                <nav className="flex-1 mt-6">
                    {filteredMenu.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div className="p-6 border-t border-slate-800">
                    <div className="mb-4">
                        <p className="text-sm font-medium truncate" title={user?.nombre_completo}>
                            {user?.nombre_completo || user?.username}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">{user?.rol}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-red-400 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow-sm flex items-center px-8 justify-between">
                    <h1 className="text-xl font-semibold text-gray-800">Panel de Control</h1>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
