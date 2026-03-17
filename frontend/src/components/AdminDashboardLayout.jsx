import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, Monitor, Box, AlertCircle,
    LogOut, Settings, Bell, Menu, X, ChevronRight, User,
    Calendar, FileText
} from 'lucide-react';
import OnlineIndicator from './OnlineIndicator';
import NotificationDropdown from './NotificationDropdown';

const AdminDashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { name: 'Gestión Usuarios', icon: Users, path: '/admin/usuarios' },
        { name: 'Laboratorios', icon: Monitor, path: '/admin/laboratorios' },
        { name: 'Equipos', icon: Box, path: '/admin/equipos' },
        { name: 'Horarios', icon: Calendar, path: '/admin/horarios' },
        { name: 'Bitácoras', icon: FileText, path: '/admin/bitacoras' },
        { name: 'Reportes Estadísticos', icon: AlertCircle, path: '/admin/reportes' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col relative z-20`}>
                <div className="p-8 flex items-center justify-between mb-4">
                    {sidebarOpen ? (
                        <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">SIGLAC <span className="text-slate-400 font-light">Admin</span></h1>
                    ) : (
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">S</div>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${sidebarOpen ? 'mr-4' : 'mx-auto'} ${isActive ? 'text-white' : 'group-hover:text-indigo-600'}`} />
                                {sidebarOpen && (
                                    <span className="font-bold text-sm">{item.name}</span>
                                )}
                                {isActive && sidebarOpen && (
                                    <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto">
                    <div className={`p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center ${!sidebarOpen && 'justify-center p-2'}`}>
                        <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm overflow-hidden flex-shrink-0">
                            <User className="w-5 h-5" />
                        </div>
                        {sidebarOpen && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate" title={user?.nombre_completo}>
                                    {user?.nombre_completo || user?.username}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.rol}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center mt-4 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-bold text-sm ${!sidebarOpen && 'justify-center'}`}
                    >
                        <LogOut className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                        {sidebarOpen && "Cerrar Sesión"}
                    </button>
                </div>

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-indigo-600 shadow-sm z-30 transition-transform active:scale-90"
                >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-10 justify-between sticky top-0 z-10">
                    <div className="flex items-center space-x-2">
                        <span className="text-slate-300 font-medium">Panel</span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-800 font-bold capitalize">
                            {menuItems.find(i => i.path === location.pathname)?.name || 'Control'}
                        </span>
                    </div>

                    <div className="flex items-center space-x-6">
                        <OnlineIndicator />
                        <NotificationDropdown userRole="ADMIN" />
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-10 scrollbar-hide">
                    {children}
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0, 0, 0.2, 1); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default AdminDashboardLayout;
