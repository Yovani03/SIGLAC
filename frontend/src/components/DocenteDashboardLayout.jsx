import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Calendar, Monitor, AlertCircle,
    LogOut, Settings, Bell, Menu, X, ChevronRight, User, Key,
    Laptop, Clock, ClipboardList, Users, BarChart3
} from 'lucide-react';
import OnlineIndicator from './OnlineIndicator';
import NotificationDropdown from './NotificationDropdown';

const DocenteDashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Inicio', icon: LayoutDashboard, path: '/docente' },
        { name: 'Equipos', icon: Laptop, path: '/docente/equipos' },
        { name: 'Horarios', icon: Clock, path: '/docente/horarios' },
        { name: 'Bitácoras', icon: ClipboardList, path: '/docente/bitacoras' },
        { name: 'Reportes de Fallos', icon: AlertCircle, path: '/docente/reportes' },
        { name: 'Estadísticas', icon: BarChart3, path: '/docente/estadisticas' },
        { name: 'Mi Perfil', icon: User, path: '/docente/perfil' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 relative">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Desktop & Mobile) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col
                ${sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}
                md:relative md:translate-x-0
            `}>
                <div className="p-8 flex items-center justify-between mb-4">
                    {sidebarOpen ? (
                        <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">SIGLAC <span className="text-slate-400 font-light">Docente</span></h1>
                    ) : (
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black mx-auto">S</div>
                    )}
                    {/* Botón para cerrar en móvil */}
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 text-slate-400 md:hidden hover:bg-slate-50 rounded-xl"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
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
                    <Link
                        to="/docente/perfil"
                        className={`p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100 transition-all group ${!sidebarOpen && 'justify-center p-2'}`}
                    >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm overflow-hidden flex-shrink-0 transition-colors
                            ${user?.avatar === 'avatar2' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                              user?.avatar === 'avatar3' ? 'bg-rose-100 text-rose-600 border-rose-200' :
                              user?.avatar === 'avatar4' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                              user?.avatar === 'avatar5' ? 'bg-sky-100 text-sky-600 border-sky-200' :
                              user?.avatar === 'avatar6' ? 'bg-violet-100 text-violet-600 border-violet-200' :
                              user?.avatar === 'avatar7' ? 'bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200' :
                              user?.avatar === 'avatar8' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                              'bg-indigo-100 text-indigo-600 border-indigo-200'}
                        `}>
                            <User className="w-5 h-5" />
                        </div>
                        {sidebarOpen && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors" title={user?.username}>
                                    {user?.nombre || user?.username}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">DOCENTE</p>
                            </div>
                        )}
                        {sidebarOpen && <ChevronRight className="w-4 h-4 ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center mt-4 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-bold text-sm ${!sidebarOpen && 'justify-center'}`}
                    >
                        <LogOut className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                        {sidebarOpen && "Cerrar Sesión"}
                    </button>
                </div>

                {/* Toggle Desktop */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="hidden md:block absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-indigo-600 shadow-sm z-30 transition-transform active:scale-90"
                >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 md:px-10 justify-between sticky top-0 z-30">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl md:hidden"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center space-x-2">
                            <span className="hidden sm:inline text-slate-300 font-medium">Docente</span>
                            <ChevronRight className="hidden sm:inline w-4 h-4 text-slate-300" />
                            <span className="text-slate-800 font-bold capitalize text-sm md:text-base">
                                {menuItems.find(i => i.path === location.pathname)?.name || 'Panel'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-6">
                        <div className="scale-75 md:scale-100">
                            <OnlineIndicator />
                        </div>
                        <NotificationDropdown userRole="DOCENTE" />
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-10 scrollbar-hide">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default DocenteDashboardLayout;
