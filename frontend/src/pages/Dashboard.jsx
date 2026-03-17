import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Users, Monitor, AlertCircle, CheckCircle,
    TrendingUp, Shield, Activity, Clock, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        laboratorios: '0',
        equipos: '0',
        incidentes: '0',
        usuarios: '0'
    });
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/dashboard/stats/');
                setStats(res.data.stats);
                setActivity(res.data.activity);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statsConfig = [
        { name: 'Laboratorios', value: stats.laboratorios, detail: 'Disponibles', icon: Monitor, color: 'text-indigo-600', bg: 'bg-indigo-50', path: '/admin/laboratorios' },
        { name: 'Equipos', value: stats.equipos, detail: 'En Inventario', icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50', path: '/admin/equipos' },
        { name: 'Incidentes', value: stats.incidentes, detail: 'Pendientes', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', path: '/admin/reportes' },
        { name: 'Usuarios', value: stats.usuarios, detail: 'Cuentas Activas', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', path: '/admin/usuarios' },
    ];

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.round(diffMs / 60000);
        if (diffMin < 1) return 'Ahora mismo';
        if (diffMin < 60) return `hace ${diffMin} min`;
        const diffHrs = Math.round(diffMin / 60);
        if (diffHrs < 24) return `hace ${diffHrs} ${diffHrs === 1 ? 'hora' : 'horas'}`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-10 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                        ¡Hola, {user?.nombre || user?.username}! 👋
                    </h2>
                    <p className="text-slate-500 font-medium tracking-tight">Aquí tienes un resumen del estado actual del sistema SIGLAC.</p>
                </motion.div>
                <div className="flex items-center space-x-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
                    <Shield className="w-5 h-5 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Sesión Segura: {user?.rol || 'Administrador'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsConfig.map((stat, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={stat.name}
                        onClick={() => navigate(stat.path)}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 cursor-pointer transition-all duration-300 group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 shadow-inner`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.name}</p>
                            <p className="text-4xl font-black text-slate-800 tracking-tighter mb-1">
                                {loading ? '...' : stat.value}
                            </p>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-500">{stat.detail}</p>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                        {/* Subtle background decoration */}
                        <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${stat.bg} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-3 bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 group"
                >
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="bg-white/10 w-fit px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">Reportes y Estadísticas</div>
                            <h3 className="text-4xl font-black mb-6 leading-tight tracking-tighter">Rendimiento de los <br /> Laboratorios</h3>
                            <p className="text-indigo-100 text-base max-w-md mb-10 font-medium leading-relaxed">
                                Supervisa el estado y rendimiento de los equipos. Revisa los reportes de incidentes, resoluciones y funcionamiento general del sistema técnico.
                            </p>
                        </div>
                        <div className="flex space-x-5">
                            <button
                                onClick={() => navigate('/admin/reportes')}
                                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/10 hover:shadow-white/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Ver Estadísticas
                            </button>
                        </div>
                    </div>
                    {/* Abstract Decoration */}
                    <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-110 duration-1000"></div>
                    <div className="absolute top-10 right-10 opacity-20 transform rotate-12 transition-transform group-hover:rotate-0 group-hover:scale-110 duration-1000">
                        <Monitor className="w-80 h-80" />
                    </div>
                </motion.div>

                {/* 
                Historial Reciente (Temporalmente inactivo)
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
                            <Clock className="w-6 h-6 mr-3 text-indigo-500" /> Historial Reciente
                        </h3>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>

                    <div className="space-y-8 flex-1">
                        {activity.length > 0 ? (
                            activity.map((log, i) => (
                                <div key={i} className="flex items-start group/log cursor-pointer p-2 -m-2 rounded-2xl hover:bg-slate-50/80 transition-all">
                                    <div className={`w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 mr-5 flex-shrink-0 group-hover/log:scale-150 group-hover/log:shadow-lg group-hover/log:shadow-indigo-200 transition-all`}></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-slate-700 font-bold leading-tight mb-1 group-hover/log:text-indigo-600 transition-colors truncate">{log.act}</p>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{log.user}</span>
                                            <span className="text-slate-300 text-[10px]">•</span>
                                            <span className="text-[10px] font-medium text-slate-400">{formatTime(log.time)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-slate-400 space-y-3">
                                <Activity className="w-10 h-10" />
                                <p className="text-xs font-black uppercase tracking-widest">Sin actividad reciente</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/admin/bitacoras')}
                        className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-center text-[11px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-[0.25em] transition-all group/all"
                    >
                        <span>Ver Bitácora Completa</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/all:translate-x-1 transition-transform" />
                    </button>
                </motion.div> 
                */}
            </div>
        </div>
    );
};

export default Dashboard;
