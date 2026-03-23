import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, AlertCircle, ChevronRight, CheckCircle,
    Timer, Laptop, FileText, PlusCircle, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const DocenteDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reservaciones, setReservaciones] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch today's reservations
                const today = new Date().toISOString().split('T')[0];
                const resResponse = await api.get(`/reservaciones/me/?fecha=${today}`);
                setReservaciones(resResponse.data);

                // Fetch recent reports
                const repResponse = await api.get('/reportes-fallos/me/');
                setReportes(repResponse.data);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const quickActions = [
        { name: 'Reportar Falla', icon: AlertCircle, color: 'bg-rose-50 text-rose-600', path: '/docente/reportes' },
        { name: 'Nueva Bitácora', icon: FileText, color: 'bg-indigo-50 text-indigo-600', path: '/docente/bitacoras' },
        { name: 'Ver Equipos', icon: Laptop, color: 'bg-amber-50 text-amber-600', path: '/docente/equipos' },
    ];

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-10 animate-fadeIn">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                        ¡Hola, <span className="text-indigo-600">{user?.nombre?.split(' ')[0] || user?.username}!</span> 👋
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">
                        Aquí tienes el resumen de tu actividad en el laboratorio para hoy.
                    </p>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm self-start">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-slate-600">
                        {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estado hoy</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{reportes.filter(r => r.estado !== 'RESUELTO').length}</p>
                    <p className="text-sm font-bold text-slate-500">Fallos pendientes</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Agenda</span>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{reservaciones.length}</p>
                    <p className="text-sm font-bold text-slate-500">Sesiones programadas</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <h3 className="text-lg font-bold">Gestión de Laboratorio</h3>
                            <p className="text-indigo-100 text-sm opacity-80 mt-1 max-w-xs">
                                Registra bitácoras, reporta incidentes y mantén el control de tus equipos asignados.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/docente/bitacoras')}
                            className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm self-start mt-4 flex items-center group-hover:px-8 transition-all"
                        >
                            Ir a Bitácoras <PlusCircle className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-all"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Recent Reports */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center">
                            <AlertCircle className="w-6 h-6 mr-3 text-indigo-500" />
                            Reportes Recientes
                        </h2>
                        <button
                            onClick={() => navigate('/docente/reportes')}
                            className="text-indigo-600 text-sm font-bold hover:underline"
                        >
                            Ver todos
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4">
                            {reportes.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {reportes.slice(0, 5).map((reporte) => (
                                        <div
                                            key={reporte.id_reporte}
                                            onClick={() => navigate('/docente/reportes')}
                                            className="flex items-center p-5 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group"
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mr-4 transition-colors ${reporte.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-600' :
                                                reporte.estado === 'RESUELTO' ? 'bg-emerald-100 text-emerald-600' :
                                                    'bg-indigo-100 text-indigo-600'
                                                }`}>
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{reporte.detalle_problema}</p>
                                                <div className="flex items-center mt-1 space-x-3">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${reporte.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-600' :
                                                        reporte.estado === 'RESUELTO' ? 'bg-emerald-50 text-emerald-600' :
                                                            'bg-indigo-50 text-indigo-600'
                                                        }`}>
                                                        {reporte.estado}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        {new Date(reporte.fecha_reporte).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold">No tienes reportes activos en este momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-10">
                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-800">Acciones Rápidas</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {quickActions.map((action) => (
                                <button
                                    key={action.name}
                                    onClick={() => navigate(action.path)}
                                    className="flex items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all text-left group"
                                >
                                    <div className={`p-2 rounded-xl mr-4 ${action.color}`}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{action.name}</span>
                                    <PlusCircle className="w-4 h-4 ml-auto text-slate-200 group-hover:text-indigo-400 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Today's Classes / Reservations - Oculto temporalmente
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-slate-800 flex items-center justify-between">
                            Programación para Hoy
                            <span className="bg-indigo-600 text-[10px] text-white px-2 py-0.5 rounded-full font-black uppercase">HOY</span>
                        </h3>
                        {reservaciones.length > 0 ? (
                            <div className="space-y-3">
                                {reservaciones.map((res) => (
                                    <div key={res.id_reservacion} className="p-5 bg-white border border-slate-100 rounded-3xl space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Timer className="w-4 h-4 text-indigo-500" />
                                                <span className="text-xs font-black text-slate-700">{res.hora_inicio} - {res.hora_fin}</span>
                                            </div>
                                            <div className="px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                Confirmado
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-800">{res.laboratorio_nombre || 'Laboratorio'}</p>
                                            <p className="text-[11px] text-slate-500 font-medium">Asignatura: {res.asignatura || 'Sesión de clase'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 bg-slate-100/50 border border-dashed border-slate-200 rounded-[2.5rem] text-center">
                                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                                    No tienes clases o reservaciones registradas para el día de hoy.
                                </p>
                                <button className="mt-4 text-xs font-black text-indigo-600 hover:underline">Solicitar Reserva</button>
                            </div>
                        )}
                    </div>
                    */}
                </div>
            </div>
        </div>
    );
};

export default DocenteDashboard;

